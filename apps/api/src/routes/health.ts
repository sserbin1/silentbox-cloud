// ===========================================
// Health Check Routes
// ===========================================

import { FastifyInstance } from 'fastify';
import { supabaseAdmin } from '../lib/supabase.js';

export const healthRoutes = async (app: FastifyInstance) => {
  // Basic health check
  app.get('/', async () => {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    };
  });

  // Detailed health check with dependencies
  app.get('/ready', async (request, reply) => {
    const checks: Record<string, { status: 'ok' | 'error'; latency?: number; error?: string }> = {};

    // Check Supabase connection
    const supabaseStart = Date.now();
    try {
      const { error } = await supabaseAdmin.from('tenants').select('id').limit(1);
      checks.database = {
        status: error ? 'error' : 'ok',
        latency: Date.now() - supabaseStart,
        error: error?.message,
      };
    } catch (err) {
      checks.database = {
        status: 'error',
        latency: Date.now() - supabaseStart,
        error: err instanceof Error ? err.message : 'Unknown error',
      };
    }

    // Overall status
    const allOk = Object.values(checks).every((c) => c.status === 'ok');

    return reply.status(allOk ? 200 : 503).send({
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    });
  });

  // Liveness probe (just returns 200)
  app.get('/live', async () => {
    return { status: 'ok' };
  });
};
