// ===========================================
// Webhook Routes
// ===========================================

import { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../../lib/supabase.js';
import { logger } from '../../lib/logger.js';
import crypto from 'crypto';

export const webhookRoutes = async (app: FastifyInstance) => {
  // ===========================================
  // Przelewy24 Webhook
  // ===========================================
  app.post('/przelewy24', async (request, reply) => {
    const body = request.body as P24WebhookPayload;

    // Verify signature
    const env = await import('../../lib/env.js').then((m) => m.env);
    const signString = `${body.sessionId}|${body.orderId}|${body.amount}|${body.currency}|${env.P24_CRC}`;
    const expectedSign = crypto.createHash('sha384').update(signString).digest('hex');

    if (body.sign !== expectedSign) {
      logger.warn({ sessionId: body.sessionId }, 'Invalid P24 webhook signature');
      return reply.status(400).send({ error: 'Invalid signature' });
    }

    // Find transaction by provider session ID
    const { data: transaction, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('provider_transaction_id', body.sessionId)
      .single();

    if (error || !transaction) {
      logger.error({ sessionId: body.sessionId }, 'Transaction not found for P24 webhook');
      return reply.status(404).send({ error: 'Transaction not found' });
    }

    // Check idempotency
    if (transaction.status === 'completed') {
      logger.info({ transactionId: transaction.id }, 'Transaction already completed');
      return reply.send({ status: 'ok' });
    }

    // Verify transaction with P24 API
    const verifyResult = await verifyP24Transaction(body.orderId, body.sessionId, body.amount);

    if (!verifyResult.success) {
      await supabaseAdmin
        .from('transactions')
        .update({ status: 'failed', metadata: { ...transaction.metadata, error: verifyResult.error } })
        .eq('id', transaction.id);

      return reply.status(400).send({ error: 'Verification failed' });
    }

    // Update transaction status
    await supabaseAdmin
      .from('transactions')
      .update({
        status: 'completed',
        provider_transaction_id: body.orderId.toString(),
      })
      .eq('id', transaction.id);

    // Add credits to user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('credits')
      .eq('id', transaction.user_id)
      .single();

    if (user) {
      await supabaseAdmin
        .from('users')
        .update({ credits: user.credits + transaction.amount })
        .eq('id', transaction.user_id);
    }

    logger.info({ transactionId: transaction.id, amount: transaction.amount }, 'P24 payment completed');

    return reply.send({ status: 'ok' });
  });

  // ===========================================
  // Monobank Webhook
  // ===========================================
  app.post('/monobank', async (request, reply) => {
    const body = request.body as MonobankWebhookPayload;

    // Monobank sends webhook on status change
    const invoiceId = body.invoiceId;

    // Find transaction
    const { data: transaction, error } = await supabaseAdmin
      .from('transactions')
      .select('*')
      .eq('provider_transaction_id', invoiceId)
      .single();

    if (error || !transaction) {
      logger.error({ invoiceId }, 'Transaction not found for Monobank webhook');
      return reply.status(404).send({ error: 'Transaction not found' });
    }

    // Check idempotency
    if (transaction.status === 'completed') {
      return reply.send({ status: 'ok' });
    }

    // Map Monobank status
    const statusMap: Record<string, string> = {
      created: 'pending',
      processing: 'pending',
      hold: 'pending',
      success: 'completed',
      failure: 'failed',
      reversed: 'refunded',
      expired: 'failed',
    };

    const newStatus = statusMap[body.status] || 'pending';

    await supabaseAdmin
      .from('transactions')
      .update({ status: newStatus })
      .eq('id', transaction.id);

    // Add credits if successful
    if (newStatus === 'completed') {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('credits')
        .eq('id', transaction.user_id)
        .single();

      if (user) {
        await supabaseAdmin
          .from('users')
          .update({ credits: user.credits + transaction.amount })
          .eq('id', transaction.user_id);
      }

      logger.info({ transactionId: transaction.id, amount: transaction.amount }, 'Monobank payment completed');
    }

    return reply.send({ status: 'ok' });
  });

  // ===========================================
  // TTLock Webhook (Lock Events)
  // ===========================================
  app.post('/ttlock', async (request, reply) => {
    const body = request.body as TTLockWebhookPayload;

    logger.info({ event: body.eventType, lockId: body.lockId }, 'TTLock webhook received');

    // Find device
    const { data: device } = await supabaseAdmin
      .from('devices')
      .select('*, booths(*)')
      .eq('device_id', body.lockId.toString())
      .single();

    if (!device) {
      return reply.status(404).send({ error: 'Device not found' });
    }

    // Handle different event types
    switch (body.eventType) {
      case 'lock':
      case 'unlock':
        // Log access event
        await supabaseAdmin.from('access_logs').insert({
          tenant_id: device.booths.tenant_id,
          booth_id: device.booth_id,
          device_id: device.id,
          access_type: body.eventType === 'unlock' ? 'remote' : 'lock',
          status: 'granted',
          metadata: {
            source: 'ttlock_webhook',
            recordType: body.recordType,
            username: body.username,
          },
        });
        break;

      case 'lowBattery':
        // Update device battery status
        await supabaseAdmin
          .from('devices')
          .update({
            battery_level: body.electricQuantity,
            updated_at: new Date().toISOString(),
          })
          .eq('id', device.id);

        // TODO: Send alert notification (Batch 7)
        break;

      case 'tamper':
        // Security alert
        logger.warn({ deviceId: device.id, boothId: device.booth_id }, 'Tamper alert from TTLock');
        // TODO: Send security notification (Batch 7)
        break;
    }

    return reply.send({ status: 'ok' });
  });
};

// ===========================================
// Types
// ===========================================

interface P24WebhookPayload {
  merchantId: number;
  posId: number;
  sessionId: string;
  amount: number;
  originAmount: number;
  currency: string;
  orderId: number;
  methodId: number;
  statement: string;
  sign: string;
}

interface MonobankWebhookPayload {
  invoiceId: string;
  status: string;
  amount: number;
  ccy: number;
  finalAmount?: number;
  reference?: string;
}

interface TTLockWebhookPayload {
  lockId: number;
  eventType: 'lock' | 'unlock' | 'lowBattery' | 'tamper';
  recordType?: number;
  username?: string;
  electricQuantity?: number;
  serverDate: number;
}

// ===========================================
// Helpers
// ===========================================

async function verifyP24Transaction(
  orderId: number,
  sessionId: string,
  amount: number
): Promise<{ success: boolean; error?: string }> {
  const env = await import('../../lib/env.js').then((m) => m.env);

  try {
    const baseUrl =
      env.P24_SANDBOX === 'true'
        ? 'https://sandbox.przelewy24.pl'
        : 'https://secure.przelewy24.pl';

    const signString = `${sessionId}|${orderId}|${amount}|PLN|${env.P24_CRC}`;
    const sign = crypto.createHash('sha384').update(signString).digest('hex');

    const response = await fetch(`${baseUrl}/api/v1/transaction/verify`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${env.P24_POS_ID}:${env.P24_API_KEY}`).toString('base64')}`,
      },
      body: JSON.stringify({
        merchantId: parseInt(env.P24_MERCHANT_ID || '0'),
        posId: parseInt(env.P24_POS_ID || '0'),
        sessionId,
        amount,
        currency: 'PLN',
        orderId,
        sign,
      }),
    });

    const result = await response.json();

    if (result.data?.status === 'success') {
      return { success: true };
    } else {
      return { success: false, error: result.error || 'Verification failed' };
    }
  } catch (error) {
    return { success: false, error: 'Failed to verify with P24' };
  }
}
