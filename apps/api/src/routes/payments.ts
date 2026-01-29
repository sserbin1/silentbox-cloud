// ===========================================
// Payments Routes
// ===========================================

import { FastifyInstance } from 'fastify';
import { purchaseCreditsSchema } from '@silentbox/shared';
import { supabaseAdmin } from '../lib/supabase.js';
import { authMiddleware } from '../middleware/auth.js';
import { ERROR_CODES } from '@silentbox/shared';
import crypto from 'crypto';

export const paymentsRoutes = async (app: FastifyInstance) => {
  // Get credit packages
  app.get('/packages', { preHandler: authMiddleware }, async (request, reply) => {
    const tenantId = request.tenantId!;

    const { data: packages, error } = await supabaseAdmin
      .from('credit_packages')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('credits', { ascending: true });

    if (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to fetch credit packages',
        },
      });
    }

    return reply.send({
      success: true,
      data: packages,
    });
  });

  // Initiate credit purchase
  app.post('/purchase', { preHandler: authMiddleware }, async (request, reply) => {
    const body = purchaseCreditsSchema.parse(request.body);
    const userId = request.userId!;
    const tenantId = request.tenantId!;

    // Get package details
    const { data: pkg, error: pkgError } = await supabaseAdmin
      .from('credit_packages')
      .select('*')
      .eq('id', body.packageId)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .single();

    if (pkgError || !pkg) {
      return reply.status(404).send({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Credit package not found',
        },
      });
    }

    // Get tenant payment config
    const { data: tenant } = await supabaseAdmin
      .from('tenants')
      .select('payment_providers')
      .eq('id', tenantId)
      .single();

    const paymentProvider = body.paymentMethod || tenant?.payment_providers?.[0] || 'przelewy24';

    // Generate idempotency key
    const idempotencyKey = crypto.randomUUID();

    // Create pending transaction
    const { data: transaction, error: txError } = await supabaseAdmin
      .from('transactions')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        type: 'credit_purchase',
        amount: pkg.credits,
        currency: pkg.currency,
        payment_provider: paymentProvider,
        status: 'pending',
        idempotency_key: idempotencyKey,
        metadata: {
          package_id: pkg.id,
          package_name: pkg.name,
          price: pkg.price,
        },
      })
      .select()
      .single();

    if (txError) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to create transaction',
        },
      });
    }

    // Generate payment URL based on provider
    let paymentUrl: string;
    let sessionId: string;

    switch (paymentProvider) {
      case 'przelewy24':
        const p24Result = await initiatePrzelewy24Payment(transaction, pkg);
        paymentUrl = p24Result.url;
        sessionId = p24Result.sessionId;
        break;

      case 'monobank':
        const monoResult = await initiateMonobankPayment(transaction, pkg);
        paymentUrl = monoResult.url;
        sessionId = monoResult.invoiceId;
        break;

      default:
        return reply.status(400).send({
          success: false,
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: 'Unsupported payment provider',
          },
        });
    }

    // Update transaction with provider session
    await supabaseAdmin
      .from('transactions')
      .update({
        provider_transaction_id: sessionId,
      })
      .eq('id', transaction.id);

    return reply.send({
      success: true,
      data: {
        transactionId: transaction.id,
        paymentUrl,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
      },
    });
  });

  // Get transaction history
  app.get('/transactions', { preHandler: authMiddleware }, async (request, reply) => {
    const userId = request.userId!;
    const tenantId = request.tenantId!;
    const { page = 1, limit = 20, type } = request.query as {
      page?: number;
      limit?: number;
      type?: string;
    };
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('tenant_id', tenantId);

    if (type) {
      query = query.eq('type', type);
    }

    const { data: transactions, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      return reply.status(500).send({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to fetch transactions',
        },
      });
    }

    return reply.send({
      success: true,
      data: transactions,
      meta: {
        page,
        limit,
        total: count || 0,
      },
    });
  });

  // Get single transaction
  app.get('/transactions/:id', { preHandler: authMiddleware }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const userId = request.userId!;
    const tenantId = request.tenantId!;

    const { data: transaction, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !transaction) {
      return reply.status(404).send({
        success: false,
        error: {
          code: ERROR_CODES.NOT_FOUND,
          message: 'Transaction not found',
        },
      });
    }

    return reply.send({
      success: true,
      data: transaction,
    });
  });
};

// ===========================================
// Payment Provider Helpers
// ===========================================

interface PaymentInitResult {
  url: string;
  sessionId?: string;
  invoiceId?: string;
}

async function initiatePrzelewy24Payment(
  transaction: any,
  pkg: any
): Promise<PaymentInitResult & { sessionId: string }> {
  const env = await import('../lib/env.js').then((m) => m.env);

  // P24 API integration
  const sessionId = `SB-${transaction.id}-${Date.now()}`;

  const p24Data = {
    merchantId: env.P24_MERCHANT_ID,
    posId: env.P24_POS_ID,
    sessionId,
    amount: Math.round(pkg.price * 100), // P24 expects amount in grosze
    currency: pkg.currency.toUpperCase(),
    description: `Silentbox Credits: ${pkg.name}`,
    email: '', // Will be fetched from user
    country: 'PL',
    language: 'pl',
    urlReturn: `${env.APP_URL}/payments/return?txId=${transaction.id}`,
    urlStatus: `${env.API_URL}/webhooks/przelewy24`,
  };

  // Calculate CRC signature
  const signString = `${sessionId}|${env.P24_MERCHANT_ID}|${p24Data.amount}|${p24Data.currency}|${env.P24_CRC}`;
  const sign = crypto.createHash('sha384').update(signString).digest('hex');

  const baseUrl = env.P24_SANDBOX === 'true'
    ? 'https://sandbox.przelewy24.pl'
    : 'https://secure.przelewy24.pl';

  // In production, this would make an actual API call to P24
  // For now, return sandbox URL format
  const paymentUrl = `${baseUrl}/trnRequest/${sessionId}`;

  return {
    url: paymentUrl,
    sessionId,
  };
}

async function initiateMonobankPayment(
  transaction: any,
  pkg: any
): Promise<PaymentInitResult & { invoiceId: string }> {
  const env = await import('../lib/env.js').then((m) => m.env);

  const invoiceData = {
    amount: Math.round(pkg.price * 100), // Monobank expects amount in kopecks
    ccy: getCurrencyCode(pkg.currency),
    merchantPaymInfo: {
      reference: transaction.id,
      destination: `Silentbox Credits: ${pkg.name}`,
    },
    redirectUrl: `${env.APP_URL}/payments/return?txId=${transaction.id}`,
    webHookUrl: `${env.API_URL}/webhooks/monobank`,
    validity: 3600, // 1 hour
  };

  // In production, this would make an actual API call to Monobank
  // POST https://api.monobank.ua/api/merchant/invoice/create
  // Headers: X-Token: ${env.MONOBANK_TOKEN}

  // For now, return mock response
  const invoiceId = `mono-${transaction.id}-${Date.now()}`;
  const paymentUrl = `https://pay.monobank.ua/${invoiceId}`;

  return {
    url: paymentUrl,
    invoiceId,
  };
}

function getCurrencyCode(currency: string): number {
  const codes: Record<string, number> = {
    UAH: 980,
    USD: 840,
    EUR: 978,
    PLN: 985,
  };
  return codes[currency.toUpperCase()] || 980;
}
