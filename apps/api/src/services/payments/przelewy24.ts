// ===========================================
// Przelewy24 Payment Service (Poland)
// ===========================================

import crypto from 'crypto';
import { logger } from '../../lib/logger.js';

const P24_API_URL = process.env.P24_SANDBOX === 'true'
  ? 'https://sandbox.przelewy24.pl'
  : 'https://secure.przelewy24.pl';

interface P24Config {
  merchantId: number;
  posId: number;
  crcKey: string;
  apiKey: string;
}

interface P24TransactionRequest {
  sessionId: string;
  amount: number; // in groszy (1 PLN = 100 groszy)
  currency: string;
  description: string;
  email: string;
  country: string;
  language: string;
  urlReturn: string;
  urlStatus: string;
  timeLimit?: number;
  channel?: number;
}

interface P24TransactionResponse {
  token: string;
  redirectUrl: string;
}

interface P24VerifyRequest {
  sessionId: string;
  orderId: number;
  amount: number;
  currency: string;
}

export class Przelewy24Service {
  private config: P24Config;

  constructor() {
    this.config = {
      merchantId: parseInt(process.env.P24_MERCHANT_ID || '0'),
      posId: parseInt(process.env.P24_POS_ID || '0'),
      crcKey: process.env.P24_CRC || '',
      apiKey: process.env.P24_API_KEY || '',
    };
  }

  // Generate SHA384 signature for requests
  private generateSign(data: Record<string, string | number>): string {
    const signString = Object.values(data).join('|') + '|' + this.config.crcKey;
    return crypto.createHash('sha384').update(signString).digest('hex');
  }

  // Get basic auth header
  private getAuthHeader(): string {
    const credentials = `${this.config.posId}:${this.config.apiKey}`;
    return `Basic ${Buffer.from(credentials).toString('base64')}`;
  }

  // Register a new transaction
  async registerTransaction(request: P24TransactionRequest): Promise<P24TransactionResponse | null> {
    try {
      const signData = {
        sessionId: request.sessionId,
        merchantId: this.config.merchantId,
        amount: request.amount,
        currency: request.currency,
      };

      const sign = this.generateSign(signData);

      const body = {
        merchantId: this.config.merchantId,
        posId: this.config.posId,
        sessionId: request.sessionId,
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        email: request.email,
        country: request.country,
        language: request.language,
        urlReturn: request.urlReturn,
        urlStatus: request.urlStatus,
        timeLimit: request.timeLimit || 15,
        channel: request.channel,
        sign,
      };

      const response = await fetch(`${P24_API_URL}/api/v1/transaction/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.error) {
        logger.error({ error: data, sessionId: request.sessionId }, 'P24 register transaction failed');
        return null;
      }

      const token = data.data.token;
      const redirectUrl = `${P24_API_URL}/trnRequest/${token}`;

      logger.info({ sessionId: request.sessionId, token }, 'P24 transaction registered');

      return { token, redirectUrl };
    } catch (error) {
      logger.error({ error }, 'P24 register transaction error');
      return null;
    }
  }

  // Verify transaction after payment
  async verifyTransaction(request: P24VerifyRequest): Promise<boolean> {
    try {
      const signData = {
        sessionId: request.sessionId,
        orderId: request.orderId,
        amount: request.amount,
        currency: request.currency,
      };

      const sign = this.generateSign(signData);

      const body = {
        merchantId: this.config.merchantId,
        posId: this.config.posId,
        sessionId: request.sessionId,
        amount: request.amount,
        currency: request.currency,
        orderId: request.orderId,
        sign,
      };

      const response = await fetch(`${P24_API_URL}/api/v1/transaction/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.error) {
        logger.error({ error: data, sessionId: request.sessionId }, 'P24 verify transaction failed');
        return false;
      }

      logger.info({ sessionId: request.sessionId, orderId: request.orderId }, 'P24 transaction verified');
      return true;
    } catch (error) {
      logger.error({ error }, 'P24 verify transaction error');
      return false;
    }
  }

  // Validate webhook signature
  validateWebhookSignature(body: Record<string, any>): boolean {
    const { merchantId, posId, sessionId, amount, originAmount, currency, orderId, methodId, statement, sign } = body;

    const expectedSignData = {
      merchantId,
      posId,
      sessionId,
      amount,
      originAmount,
      currency,
      orderId,
      methodId,
      statement,
    };

    const expectedSign = this.generateSign(expectedSignData);
    return sign === expectedSign;
  }

  // Refund transaction
  async refundTransaction(
    orderId: number,
    sessionId: string,
    amount: number,
    description?: string
  ): Promise<boolean> {
    try {
      const body = {
        requestId: `refund_${Date.now()}`,
        refundsUuid: crypto.randomUUID(),
        refunds: [
          {
            orderId,
            sessionId,
            amount,
            description: description || 'Refund',
          },
        ],
      };

      const response = await fetch(`${P24_API_URL}/api/v1/transaction/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthHeader(),
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.error) {
        logger.error({ error: data, orderId }, 'P24 refund failed');
        return false;
      }

      logger.info({ orderId, amount }, 'P24 refund initiated');
      return true;
    } catch (error) {
      logger.error({ error }, 'P24 refund error');
      return false;
    }
  }

  // Get transaction info
  async getTransactionInfo(sessionId: string): Promise<any | null> {
    try {
      const response = await fetch(
        `${P24_API_URL}/api/v1/transaction/by/sessionId/${sessionId}`,
        {
          headers: {
            'Authorization': this.getAuthHeader(),
          },
        }
      );

      const data = await response.json();

      if (data.error) {
        return null;
      }

      return data.data;
    } catch (error) {
      logger.error({ error }, 'P24 get transaction info error');
      return null;
    }
  }

  // Test API access
  async testAccess(): Promise<boolean> {
    try {
      const response = await fetch(`${P24_API_URL}/api/v1/testAccess`, {
        headers: {
          'Authorization': this.getAuthHeader(),
        },
      });

      const data = await response.json();
      return data.data === true;
    } catch (error) {
      return false;
    }
  }
}

export const p24Service = new Przelewy24Service();
