import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AppService {
  constructor(private readonly dataSource: DataSource) {}

  getHello(): string {
    return 'Hello World!';
  }

  async checkHealth() {
    // 1. Database Check
    let dbStatus: { status: 'online' | 'offline'; latencyMs?: number; error?: string; provider?: string };
    const dbStart = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      dbStatus = {
        status: 'online',
        latencyMs: Date.now() - dbStart,
        provider: 'PostgreSQL',
      };
    } catch (err: any) {
      dbStatus = {
        status: 'offline',
        error: err.message,
        provider: 'PostgreSQL',
      };
    }

    // 2. Redis / Upstash Check
    let redisStatus: { status: 'online' | 'offline' | 'degraded' | 'not_configured'; latencyMs?: number; error?: string; host?: string };
    if (process.env.REDIS_HOST) {
      const redisStart = Date.now();
      try {
        const Redis = require('ioredis');
        const client = new Redis({
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT) || 6379,
          username: process.env.REDIS_USERNAME || 'default',
          password: process.env.REDIS_PASSWORD,
          tls: process.env.REDIS_TLS === 'true' ? {} : undefined,
          connectTimeout: 2000,
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          lazyConnect: true,
        });

        client.on('error', () => {}); // Prevent unhandled error event logging

        await client.connect();
        const pong = await client.ping();
        try { await client.quit(); } catch (_) { client.disconnect(); }

        redisStatus = {
          status: pong === 'PONG' ? 'online' : 'degraded',
          latencyMs: Date.now() - redisStart,
          host: process.env.REDIS_HOST,
        };
      } catch (err: any) {
        redisStatus = {
          status: 'offline',
          error: err.message,
          host: process.env.REDIS_HOST,
        };
      }
    } else {
      redisStatus = { status: 'not_configured' };
    }

    // 3. LiveKit Server Check
    let livekitStatus: { status: 'online' | 'offline' | 'not_configured'; latencyMs?: number; error?: string; url?: string };
    if (process.env.LIVEKIT_URL) {
      const lkStart = Date.now();
      try {
        const httpUrl = process.env.LIVEKIT_URL
          .replace(/^wss:\/\//i, 'https://')
          .replace(/^ws:\/\//i, 'http://');
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        await fetch(httpUrl, { signal: controller.signal });
        clearTimeout(timeout);

        livekitStatus = {
          status: 'online',
          latencyMs: Date.now() - lkStart,
          url: process.env.LIVEKIT_URL,
        };
      } catch (err: any) {
        livekitStatus = {
          status: 'offline',
          error: err.message,
          url: process.env.LIVEKIT_URL,
        };
      }
    } else {
      livekitStatus = { status: 'not_configured' };
    }

    // 4. Storage (Google Cloud Storage) Check
    let storageStatus: { status: 'online' | 'degraded' | 'not_configured'; provider?: string; bucket?: string; keyFileFound?: boolean };
    if (process.env.GCP_BUCKET_NAME) {
      const keyFile = process.env.GCP_KEY_FILE || './gcp-key.json';
      const keyPath = path.isAbsolute(keyFile)
        ? keyFile
        : path.resolve(process.cwd(), keyFile);
      const keyExists = fs.existsSync(keyPath);

      storageStatus = {
        status: keyExists ? 'online' : 'degraded',
        provider: 'Google Cloud Storage',
        bucket: process.env.GCP_BUCKET_NAME,
        keyFileFound: keyExists,
      };
    } else {
      storageStatus = { status: 'not_configured' };
    }

    const isHealthy = dbStatus.status === 'online';

    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      services: {
        database: dbStatus,
        redis: redisStatus,
        livekit: livekitStatus,
        storage: storageStatus,
      },
      system: {
        memoryRssMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
        nodeVersion: process.version,
      },
    };
  }
}
