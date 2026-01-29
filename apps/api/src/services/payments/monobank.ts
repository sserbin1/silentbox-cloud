// ===========================================
// Monobank Payment Service (Ukraine)
// ===========================================

import crypto from 'crypto';
import { logger } from '../../lib/logger.js';

const MONOBANK_API_URL = 'https://api.monobank.ua/api/merchant';

interface MonobankConfig {
  token: string;
  webhookUrl: string;
}

interface MonobankInvoiceRequest {
  amount: number; // in kopiyky (1 UAH = 100 kopiyky)
  ccy?: number; // currency code (980 = UAH, 978 = EUR, 840 = USD)
  merchantPaymInfo?: {
    reference?: string;
    destination?: string;
    basketOrder?: Array<{
      name: string;
      qty: number;
      sum: number;
      icon?: string;
      unit?: string;
      code?: string;
    }>;
  };
  redirectUrl?: string;
  webHookUrl?: string;
  validity?: number; // seconds
  paymentType?: 'debit' | 'hold';
  qrId?: string;
  saveCardData?: {
    saveCard: boolean;
    walletId?: string;
  };
}

interface MonobankInvoiceResponse {
  invoiceId: string;
  pageUrl: string;
}

interface MonobankInvoiceStatus {
  invoiceId: string;
  status: 'created' | 'processing' | 'hold' | 'success' | 'failure' | 'reversed' | 'expired';
  failureReason?: string;
  amount: number;
  ccy: number;
  finalAmount?: number;
  createdDate: string;
  modifiedDate: string;
  reference?: string;
  destination?: string;
  cancelList?: Array<{
    status: string;
    amount: number;
    ccy: number;
    createdDate: string;
    modifiedDate: string;
  }>;
}

export class MonobankService {
  private config: MonobankConfig;

  constructor() {
    this.config = {
      token: process.env.MONOBANK_TOKEN || '',
      webhookUrl: process.env.MONOBANK_WEBHOOK_URL || '',
    };
  }

  // Create invoice (payment request)
  async createInvoice(request: MonobankInvoiceRequest): Promise<MonobankInvoiceResponse | null> {
    try {
      const body: Record<string, any> = {
        amount: request.amount,
      };

      if (request.ccy) body.ccy = request.ccy;
      if (request.merchantPaymInfo) body.merchantPaymInfo = request.merchantPaymInfo;
      if (request.redirectUrl) body.redirectUrl = request.redirectUrl;
      if (request.validity) body.validity = request.validity;
      if (request.paymentType) body.paymentType = request.paymentType;
      if (request.saveCardData) body.saveCardData = request.saveCardData;

      // Always set webhook URL
      body.webHookUrl = request.webHookUrl || this.config.webhookUrl;

      const response = await fetch(`${MONOBANK_API_URL}/invoice/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': this.config.token,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error({ error, status: response.status }, 'Monobank create invoice failed');
        return null;
      }

      const data = await response.json();

      logger.info({ invoiceId: data.invoiceId }, 'Monobank invoice created');

      return {
        invoiceId: data.invoiceId,
        pageUrl: data.pageUrl,
      };
    } catch (error) {
      logger.error({ error }, 'Monobank create invoice error');
      return null;
    }
  }

  // Get invoice status
  async getInvoiceStatus(invoiceId: string): Promise<MonobankInvoiceStatus | null> {
    try {
      const response = await fetch(
        `${MONOBANK_API_URL}/invoice/status?invoiceId=${invoiceId}`,
        {
          headers: {
            'X-Token': this.config.token,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        logger.error({ error, invoiceId }, 'Monobank get status failed');
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error({ error }, 'Monobank get status error');
      return null;
    }
  }

  // Cancel invoice (full refund for hold payments)
  async cancelInvoice(invoiceId: string): Promise<boolean> {
    try {
      const response = await fetch(`${MONOBANK_API_URL}/invoice/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': this.config.token,
        },
        body: JSON.stringify({ invoiceId }),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error({ error, invoiceId }, 'Monobank cancel invoice failed');
        return false;
      }

      logger.info({ invoiceId }, 'Monobank invoice cancelled');
      return true;
    } catch (error) {
      logger.error({ error }, 'Monobank cancel invoice error');
      return false;
    }
  }

  // Invalidate invoice (before payment)
  async invalidateInvoice(invoiceId: string): Promise<boolean> {
    try {
      const response = await fetch(`${MONOBANK_API_URL}/invoice/remove`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': this.config.token,
        },
        body: JSON.stringify({ invoiceId }),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error({ error, invoiceId }, 'Monobank invalidate invoice failed');
        return false;
      }

      logger.info({ invoiceId }, 'Monobank invoice invalidated');
      return true;
    } catch (error) {
      logger.error({ error }, 'Monobank invalidate invoice error');
      return false;
    }
  }

  // Finalize hold payment
  async finalizeHold(invoiceId: string, amount?: number): Promise<boolean> {
    try {
      const body: Record<string, any> = { invoiceId };
      if (amount) body.amount = amount;

      const response = await fetch(`${MONOBANK_API_URL}/invoice/finalize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': this.config.token,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error({ error, invoiceId }, 'Monobank finalize hold failed');
        return false;
      }

      logger.info({ invoiceId, amount }, 'Monobank hold finalized');
      return true;
    } catch (error) {
      logger.error({ error }, 'Monobank finalize hold error');
      return false;
    }
  }

  // Get merchant info (for testing API access)
  async getMerchantInfo(): Promise<any | null> {
    try {
      const response = await fetch(`${MONOBANK_API_URL}/details`, {
        headers: {
          'X-Token': this.config.token,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      return null;
    }
  }

  // Get list of merchant statements
  async getStatements(from: Date, to?: Date): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        from: Math.floor(from.getTime() / 1000).toString(),
      });
      if (to) {
        params.append('to', Math.floor(to.getTime() / 1000).toString());
      }

      const response = await fetch(
        `${MONOBANK_API_URL}/statement?${params}`,
        {
          headers: {
            'X-Token': this.config.token,
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return data.list || [];
    } catch (error) {
      logger.error({ error }, 'Monobank get statements error');
      return [];
    }
  }

  // Validate webhook signature
  validateWebhookSignature(body: string, signature: string): boolean {
    // Monobank uses X-Sign header with base64 encoded signature
    // Public key should be obtained from Monobank dashboard
    // For now, we'll do a basic validation
    try {
      // In production, you would verify the signature using Monobank's public key
      // const publicKey = process.env.MONOBANK_PUBLIC_KEY;
      // const verify = crypto.createVerify('SHA256');
      // verify.update(body);
      // return verify.verify(publicKey, signature, 'base64');

      // For development, just check that signature exists
      return !!signature && signature.length > 0;
    } catch (error) {
      logger.error({ error }, 'Monobank signature validation error');
      return false;
    }
  }

  // Create QR code for payment
  async createQrCode(amount: number, reference?: string): Promise<{ qrId: string; pageUrl: string } | null> {
    try {
      const body: Record<string, any> = {
        ccy: 980, // UAH
        amount,
      };

      if (reference) {
        body.merchantPaymInfo = { reference };
      }

      const response = await fetch(`${MONOBANK_API_URL}/qr/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': this.config.token,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        logger.error({ error }, 'Monobank create QR failed');
        return null;
      }

      const data = await response.json();
      return {
        qrId: data.qrId,
        pageUrl: data.pageUrl,
      };
    } catch (error) {
      logger.error({ error }, 'Monobank create QR error');
      return null;
    }
  }
}

export const monobankService = new MonobankService();
