// ===========================================
// Unified Payment Service
// ===========================================

import { p24Service, Przelewy24Service } from './przelewy24.js';
import { monobankService, MonobankService } from './monobank.js';
import { supabase } from '../../lib/supabase.js';
import { logger } from '../../lib/logger.js';
import crypto from 'crypto';

type PaymentProvider = 'przelewy24' | 'monobank';
type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

interface CreatePaymentInput {
  tenantId: string;
  userId: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  description: string;
  email: string;
  returnUrl: string;
  metadata?: Record<string, unknown>;
}

interface PaymentResult {
  success: boolean;
  transactionId?: string;
  redirectUrl?: string;
  error?: string;
}

export class PaymentService {
  private p24: Przelewy24Service;
  private monobank: MonobankService;

  constructor() {
    this.p24 = p24Service;
    this.monobank = monobankService;
  }

  // Create a payment transaction
  async createPayment(input: CreatePaymentInput): Promise<PaymentResult> {
    // Generate unique session ID
    const sessionId = `sb_${crypto.randomUUID()}`;

    // Create transaction record
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        tenant_id: input.tenantId,
        user_id: input.userId,
        type: 'credit_purchase',
        amount: input.amount,
        currency: input.currency,
        payment_provider: input.provider,
        status: 'pending',
        idempotency_key: sessionId,
        metadata: input.metadata || {},
      })
      .select()
      .single();

    if (txError) {
      logger.error({ error: txError }, 'Failed to create transaction record');
      return { success: false, error: 'Failed to create transaction' };
    }

    // Process payment based on provider
    let result: PaymentResult;

    switch (input.provider) {
      case 'przelewy24':
        result = await this.createP24Payment(sessionId, input, transaction.id);
        break;

      case 'monobank':
        result = await this.createMonobankPayment(sessionId, input, transaction.id);
        break;

      default:
        return { success: false, error: 'Unsupported payment provider' };
    }

    // Update transaction with provider reference
    if (result.success && result.transactionId) {
      await supabase
        .from('transactions')
        .update({
          provider_transaction_id: result.transactionId,
          status: 'processing',
        })
        .eq('id', transaction.id);
    }

    return result;
  }

  // Create Przelewy24 payment
  private async createP24Payment(
    sessionId: string,
    input: CreatePaymentInput,
    transactionId: string
  ): Promise<PaymentResult> {
    const webhookUrl = `${process.env.API_URL}/webhooks/przelewy24`;

    const result = await this.p24.registerTransaction({
      sessionId,
      amount: Math.round(input.amount * 100), // Convert to groszy
      currency: 'PLN',
      description: input.description,
      email: input.email,
      country: 'PL',
      language: 'pl',
      urlReturn: input.returnUrl,
      urlStatus: webhookUrl,
      timeLimit: 15,
    });

    if (!result) {
      await this.updateTransactionStatus(transactionId, 'failed');
      return { success: false, error: 'Failed to create P24 payment' };
    }

    return {
      success: true,
      transactionId: result.token,
      redirectUrl: result.redirectUrl,
    };
  }

  // Create Monobank payment
  private async createMonobankPayment(
    sessionId: string,
    input: CreatePaymentInput,
    transactionId: string
  ): Promise<PaymentResult> {
    const webhookUrl = `${process.env.API_URL}/webhooks/monobank`;

    const result = await this.monobank.createInvoice({
      amount: Math.round(input.amount * 100), // Convert to kopiyky
      ccy: this.getCurrencyCode(input.currency),
      merchantPaymInfo: {
        reference: sessionId,
        destination: input.description,
      },
      redirectUrl: input.returnUrl,
      webHookUrl: webhookUrl,
      validity: 900, // 15 minutes
    });

    if (!result) {
      await this.updateTransactionStatus(transactionId, 'failed');
      return { success: false, error: 'Failed to create Monobank payment' };
    }

    return {
      success: true,
      transactionId: result.invoiceId,
      redirectUrl: result.pageUrl,
    };
  }

  // Handle payment webhook
  async handleWebhook(
    provider: PaymentProvider,
    data: Record<string, any>
  ): Promise<{ success: boolean; userId?: string; amount?: number }> {
    switch (provider) {
      case 'przelewy24':
        return this.handleP24Webhook(data);

      case 'monobank':
        return this.handleMonobankWebhook(data);

      default:
        return { success: false };
    }
  }

  // Handle P24 webhook
  private async handleP24Webhook(
    data: Record<string, any>
  ): Promise<{ success: boolean; userId?: string; amount?: number }> {
    const { sessionId, orderId, amount, currency } = data;

    // Validate signature
    if (!this.p24.validateWebhookSignature(data)) {
      logger.warn({ sessionId }, 'Invalid P24 webhook signature');
      return { success: false };
    }

    // Find transaction
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('idempotency_key', sessionId)
      .single();

    if (!transaction) {
      logger.warn({ sessionId }, 'Transaction not found for P24 webhook');
      return { success: false };
    }

    // Verify payment
    const verified = await this.p24.verifyTransaction({
      sessionId,
      orderId,
      amount,
      currency,
    });

    if (!verified) {
      await this.updateTransactionStatus(transaction.id, 'failed');
      return { success: false };
    }

    // Update transaction and user credits
    await this.completePayment(transaction.id, transaction.user_id, transaction.amount);

    return {
      success: true,
      userId: transaction.user_id,
      amount: transaction.amount,
    };
  }

  // Handle Monobank webhook
  private async handleMonobankWebhook(
    data: Record<string, any>
  ): Promise<{ success: boolean; userId?: string; amount?: number }> {
    const { invoiceId, status, reference, amount } = data;

    // Find transaction
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .or(`provider_transaction_id.eq.${invoiceId},idempotency_key.eq.${reference}`)
      .single();

    if (!transaction) {
      logger.warn({ invoiceId, reference }, 'Transaction not found for Monobank webhook');
      return { success: false };
    }

    // Handle status
    if (status === 'success') {
      await this.completePayment(transaction.id, transaction.user_id, transaction.amount);
      return {
        success: true,
        userId: transaction.user_id,
        amount: transaction.amount,
      };
    } else if (status === 'failure' || status === 'expired') {
      await this.updateTransactionStatus(transaction.id, 'failed');
      return { success: false };
    }

    // Processing or other status
    return { success: false };
  }

  // Complete payment - update transaction and add credits
  private async completePayment(
    transactionId: string,
    userId: string,
    amount: number
  ): Promise<void> {
    // Update transaction status
    await supabase
      .from('transactions')
      .update({ status: 'completed' })
      .eq('id', transactionId);

    // Add credits to user (1:1 ratio for simplicity)
    await supabase.rpc('add_user_credits', {
      p_user_id: userId,
      p_amount: amount,
    });

    logger.info({ transactionId, userId, amount }, 'Payment completed, credits added');
  }

  // Update transaction status
  private async updateTransactionStatus(
    transactionId: string,
    status: PaymentStatus
  ): Promise<void> {
    await supabase
      .from('transactions')
      .update({ status })
      .eq('id', transactionId);
  }

  // Get currency code for Monobank
  private getCurrencyCode(currency: string): number {
    const codes: Record<string, number> = {
      UAH: 980,
      EUR: 978,
      USD: 840,
      PLN: 985,
    };
    return codes[currency] || 980;
  }

  // Process refund
  async refund(transactionId: string, reason?: string): Promise<boolean> {
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (!transaction || transaction.status !== 'completed') {
      return false;
    }

    let refunded = false;

    if (transaction.payment_provider === 'przelewy24' && transaction.provider_transaction_id) {
      // P24 refund would require order ID, which we'd need to store
      // For now, log that refund was requested
      logger.info({ transactionId }, 'P24 refund requested');
      refunded = true;
    } else if (transaction.payment_provider === 'monobank' && transaction.provider_transaction_id) {
      refunded = await this.monobank.cancelInvoice(transaction.provider_transaction_id);
    }

    if (refunded) {
      // Update transaction status
      await supabase
        .from('transactions')
        .update({ status: 'refunded', metadata: { refund_reason: reason } })
        .eq('id', transactionId);

      // Remove credits from user
      await supabase.rpc('add_user_credits', {
        p_user_id: transaction.user_id,
        p_amount: -transaction.amount,
      });

      logger.info({ transactionId, amount: transaction.amount }, 'Refund processed');
    }

    return refunded;
  }
}

export const paymentService = new PaymentService();
export { p24Service, monobankService };
