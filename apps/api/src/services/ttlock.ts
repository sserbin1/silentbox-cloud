// ===========================================
// TTLock Smart Lock Integration Service
// ===========================================

import crypto from 'crypto';
import { logger } from '../lib/logger.js';

const TTLOCK_API_URL = 'https://euapi.ttlock.com';

interface TTLockConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

interface TTLockTokens {
  accessToken: string;
  refreshToken: string;
  uid: number;
  expiresIn: number;
}

interface LockInfo {
  lockId: number;
  lockName: string;
  lockAlias: string;
  lockMac: string;
  lockData: string;
  aesKeyStr: string;
  electricQuantity: number;
  featureValue: string;
  modelNum: string;
  firmwareRevision: string;
  timezoneRawOffset: number;
}

interface PasscodeResult {
  keyboardPwdId: number;
  keyboardPwd: string;
}

export class TTLockService {
  private config: TTLockConfig;

  constructor() {
    this.config = {
      clientId: process.env.TTLOCK_CLIENT_ID || '',
      clientSecret: process.env.TTLOCK_CLIENT_SECRET || '',
      redirectUri: process.env.TTLOCK_REDIRECT_URI || '',
    };
  }

  // Generate current timestamp in milliseconds
  private getTimestamp(): number {
    return Date.now();
  }

  // Generate MD5 hash
  private md5(str: string): string {
    return crypto.createHash('md5').update(str).digest('hex');
  }

  // Build OAuth authorization URL
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      state,
    });

    return `${TTLOCK_API_URL}/oauth2/authorize?${params}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string): Promise<TTLockTokens | null> {
    try {
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: this.config.redirectUri,
      });

      const response = await fetch(`${TTLOCK_API_URL}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      const data = await response.json();

      if (data.errcode) {
        logger.error({ error: data }, 'TTLock token exchange failed');
        return null;
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        uid: data.uid,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      logger.error({ error }, 'TTLock token exchange error');
      return null;
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<TTLockTokens | null> {
    try {
      const params = new URLSearchParams({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      });

      const response = await fetch(`${TTLOCK_API_URL}/oauth2/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      const data = await response.json();

      if (data.errcode) {
        logger.error({ error: data }, 'TTLock token refresh failed');
        return null;
      }

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        uid: data.uid,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      logger.error({ error }, 'TTLock token refresh error');
      return null;
    }
  }

  // Get list of locks
  async getLocks(accessToken: string, pageNo: number = 1, pageSize: number = 20): Promise<LockInfo[]> {
    try {
      const params = new URLSearchParams({
        clientId: this.config.clientId,
        accessToken,
        pageNo: pageNo.toString(),
        pageSize: pageSize.toString(),
        date: this.getTimestamp().toString(),
      });

      const response = await fetch(`${TTLOCK_API_URL}/v3/lock/list?${params}`);
      const data = await response.json();

      if (data.errcode) {
        logger.error({ error: data }, 'TTLock get locks failed');
        return [];
      }

      return data.list || [];
    } catch (error) {
      logger.error({ error }, 'TTLock get locks error');
      return [];
    }
  }

  // Get lock details
  async getLockDetail(accessToken: string, lockId: number): Promise<LockInfo | null> {
    try {
      const params = new URLSearchParams({
        clientId: this.config.clientId,
        accessToken,
        lockId: lockId.toString(),
        date: this.getTimestamp().toString(),
      });

      const response = await fetch(`${TTLOCK_API_URL}/v3/lock/detail?${params}`);
      const data = await response.json();

      if (data.errcode) {
        logger.error({ error: data }, 'TTLock get lock detail failed');
        return null;
      }

      return data;
    } catch (error) {
      logger.error({ error }, 'TTLock get lock detail error');
      return null;
    }
  }

  // Unlock remotely (requires gateway)
  async unlockRemote(accessToken: string, lockId: number): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        clientId: this.config.clientId,
        accessToken,
        lockId: lockId.toString(),
        date: this.getTimestamp().toString(),
      });

      const response = await fetch(`${TTLOCK_API_URL}/v3/lock/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      const data = await response.json();

      if (data.errcode) {
        logger.error({ error: data, lockId }, 'TTLock remote unlock failed');
        return false;
      }

      logger.info({ lockId }, 'TTLock remote unlock success');
      return true;
    } catch (error) {
      logger.error({ error, lockId }, 'TTLock remote unlock error');
      return false;
    }
  }

  // Lock remotely (requires gateway)
  async lockRemote(accessToken: string, lockId: number): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        clientId: this.config.clientId,
        accessToken,
        lockId: lockId.toString(),
        date: this.getTimestamp().toString(),
      });

      const response = await fetch(`${TTLOCK_API_URL}/v3/lock/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      const data = await response.json();

      if (data.errcode) {
        logger.error({ error: data, lockId }, 'TTLock remote lock failed');
        return false;
      }

      logger.info({ lockId }, 'TTLock remote lock success');
      return true;
    } catch (error) {
      logger.error({ error, lockId }, 'TTLock remote lock error');
      return false;
    }
  }

  // Generate temporary passcode
  async generatePasscode(
    accessToken: string,
    lockId: number,
    startDate: Date,
    endDate: Date,
    name?: string
  ): Promise<PasscodeResult | null> {
    try {
      const params = new URLSearchParams({
        clientId: this.config.clientId,
        accessToken,
        lockId: lockId.toString(),
        keyboardPwdType: '2', // Timed passcode
        keyboardPwdName: name || `Booking-${Date.now()}`,
        startDate: startDate.getTime().toString(),
        endDate: endDate.getTime().toString(),
        date: this.getTimestamp().toString(),
      });

      const response = await fetch(`${TTLOCK_API_URL}/v3/keyboardPwd/get`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      const data = await response.json();

      if (data.errcode) {
        logger.error({ error: data, lockId }, 'TTLock generate passcode failed');
        return null;
      }

      logger.info({ lockId, passcodeId: data.keyboardPwdId }, 'TTLock passcode generated');
      return {
        keyboardPwdId: data.keyboardPwdId,
        keyboardPwd: data.keyboardPwd,
      };
    } catch (error) {
      logger.error({ error, lockId }, 'TTLock generate passcode error');
      return null;
    }
  }

  // Delete passcode
  async deletePasscode(accessToken: string, lockId: number, passcodeId: number): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        clientId: this.config.clientId,
        accessToken,
        lockId: lockId.toString(),
        keyboardPwdId: passcodeId.toString(),
        deleteType: '2', // Delete from lock and server
        date: this.getTimestamp().toString(),
      });

      const response = await fetch(`${TTLOCK_API_URL}/v3/keyboardPwd/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      const data = await response.json();

      if (data.errcode) {
        logger.error({ error: data, lockId, passcodeId }, 'TTLock delete passcode failed');
        return false;
      }

      logger.info({ lockId, passcodeId }, 'TTLock passcode deleted');
      return true;
    } catch (error) {
      logger.error({ error, lockId, passcodeId }, 'TTLock delete passcode error');
      return false;
    }
  }

  // Get lock battery level
  async getBatteryLevel(accessToken: string, lockId: number): Promise<number | null> {
    try {
      const params = new URLSearchParams({
        clientId: this.config.clientId,
        accessToken,
        lockId: lockId.toString(),
        date: this.getTimestamp().toString(),
      });

      const response = await fetch(`${TTLOCK_API_URL}/v3/lock/queryElectricQuantity?${params}`);
      const data = await response.json();

      if (data.errcode) {
        logger.error({ error: data, lockId }, 'TTLock get battery failed');
        return null;
      }

      return data.electricQuantity;
    } catch (error) {
      logger.error({ error, lockId }, 'TTLock get battery error');
      return null;
    }
  }

  // Get unlock records
  async getUnlockRecords(
    accessToken: string,
    lockId: number,
    startDate?: Date,
    endDate?: Date,
    pageNo: number = 1,
    pageSize: number = 20
  ): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        clientId: this.config.clientId,
        accessToken,
        lockId: lockId.toString(),
        pageNo: pageNo.toString(),
        pageSize: pageSize.toString(),
        date: this.getTimestamp().toString(),
      });

      if (startDate) params.append('startDate', startDate.getTime().toString());
      if (endDate) params.append('endDate', endDate.getTime().toString());

      const response = await fetch(`${TTLOCK_API_URL}/v3/lockRecord/list?${params}`);
      const data = await response.json();

      if (data.errcode) {
        logger.error({ error: data, lockId }, 'TTLock get records failed');
        return [];
      }

      return data.list || [];
    } catch (error) {
      logger.error({ error, lockId }, 'TTLock get records error');
      return [];
    }
  }

  // Check if lock has gateway (for remote operations)
  async hasGateway(accessToken: string, lockId: number): Promise<boolean> {
    try {
      const lockDetail = await this.getLockDetail(accessToken, lockId);
      if (!lockDetail) return false;

      // Check featureValue for gateway support
      // Bit 2 of featureValue indicates gateway support
      const featureValue = parseInt(lockDetail.featureValue, 16);
      return (featureValue & 0x04) !== 0;
    } catch (error) {
      return false;
    }
  }

  // Generate eKey for Bluetooth unlock (mobile app will use this)
  async generateEKey(
    accessToken: string,
    lockId: number,
    receiverUsername: string,
    startDate: Date,
    endDate: Date,
    name?: string
  ): Promise<{ keyId: number } | null> {
    try {
      const params = new URLSearchParams({
        clientId: this.config.clientId,
        accessToken,
        lockId: lockId.toString(),
        receiverUsername,
        keyName: name || `Booking-${Date.now()}`,
        startDate: startDate.getTime().toString(),
        endDate: endDate.getTime().toString(),
        date: this.getTimestamp().toString(),
      });

      const response = await fetch(`${TTLOCK_API_URL}/v3/key/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      const data = await response.json();

      if (data.errcode) {
        logger.error({ error: data, lockId }, 'TTLock generate eKey failed');
        return null;
      }

      logger.info({ lockId, keyId: data.keyId }, 'TTLock eKey generated');
      return { keyId: data.keyId };
    } catch (error) {
      logger.error({ error, lockId }, 'TTLock generate eKey error');
      return null;
    }
  }

  // Delete eKey
  async deleteEKey(accessToken: string, keyId: number): Promise<boolean> {
    try {
      const params = new URLSearchParams({
        clientId: this.config.clientId,
        accessToken,
        keyId: keyId.toString(),
        date: this.getTimestamp().toString(),
      });

      const response = await fetch(`${TTLOCK_API_URL}/v3/key/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      });

      const data = await response.json();

      if (data.errcode) {
        logger.error({ error: data, keyId }, 'TTLock delete eKey failed');
        return false;
      }

      logger.info({ keyId }, 'TTLock eKey deleted');
      return true;
    } catch (error) {
      logger.error({ error, keyId }, 'TTLock delete eKey error');
      return false;
    }
  }
}

export const ttlockService = new TTLockService();
