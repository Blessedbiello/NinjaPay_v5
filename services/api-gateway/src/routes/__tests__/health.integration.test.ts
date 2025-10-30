import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import healthRoutes from '../health';

describe('Health Endpoint Integration Tests', () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use('/health', healthRoutes);
  });

  describe('GET /health', () => {
    it('should return 200 OK with health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('status', 'healthy');
      expect(response.body.data).toHaveProperty('timestamp');
      expect(typeof response.body.data.timestamp).toBe('string');
    });

    it('should have correct response structure', async () => {
      const response = await request(app).get('/health');

      expect(response.body).toMatchObject({
        success: true,
        data: {
          status: expect.any(String),
          service: expect.any(String),
          version: expect.any(String),
          timestamp: expect.any(String),
        },
      });
    });

    it('should return valid ISO timestamp', async () => {
      const beforeRequest = new Date().toISOString();
      const response = await request(app).get('/health');
      const afterRequest = new Date().toISOString();

      expect(response.body.data.timestamp).toBeTruthy();
      // Verify it's a valid ISO date string
      expect(() => new Date(response.body.data.timestamp)).not.toThrow();

      const timestamp = new Date(response.body.data.timestamp);
      expect(timestamp.getTime()).toBeGreaterThanOrEqual(new Date(beforeRequest).getTime() - 1000);
      expect(timestamp.getTime()).toBeLessThanOrEqual(new Date(afterRequest).getTime() + 1000);
    });
  });
});
