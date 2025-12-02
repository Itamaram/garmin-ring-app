import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';
import { configManager } from './config';

export interface SignedRequest {
  action: string;
  timestamp: number;
  signature: string;
}

/**
 * Verify HMAC-SHA256 signature for requests from Garmin watch
 *
 * Expected request format:
 * {
 *   "action": "unlock",
 *   "timestamp": 1234567890,
 *   "signature": "hex_encoded_hmac"
 * }
 *
 * Signature is HMAC-SHA256 of: action + timestamp + sharedSecret
 */
export function verifySignature(req: Request, res: Response, next: NextFunction): void {
  const sharedSecret = configManager.getSharedSecret();

  if (!sharedSecret) {
    res.status(500).json({
      success: false,
      error: 'Server not configured. Missing shared secret.'
    });
    return;
  }

  const { action, timestamp, signature } = req.body as SignedRequest;

  // Validate required fields
  if (!action || !timestamp || !signature) {
    res.status(400).json({
      success: false,
      error: 'Missing required fields: action, timestamp, signature'
    });
    return;
  }

  // Validate timestamp (prevent replay attacks)
  const now = Math.floor(Date.now() / 1000);
  const requestTime = Math.floor(timestamp);
  const timeDiff = Math.abs(now - requestTime);

  // Allow 5 minutes of clock drift
  if (timeDiff > 300) {
    res.status(401).json({
      success: false,
      error: 'Request timestamp is too old or too far in the future'
    });
    return;
  }

  // Compute expected signature
  const message = `${action}${timestamp}`;
  const expectedSignature = crypto
    .createHmac('sha256', sharedSecret)
    .update(message)
    .digest('hex');

  // Constant-time comparison to prevent timing attacks
  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (signatureBuffer.length !== expectedBuffer.length) {
    res.status(401).json({
      success: false,
      error: 'Invalid signature'
    });
    return;
  }

  const signaturesMatch = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);

  if (!signaturesMatch) {
    res.status(401).json({
      success: false,
      error: 'Invalid signature'
    });
    return;
  }

  // Signature is valid, proceed
  next();
}

/**
 * Generate a test signature (for debugging/testing)
 */
export function generateTestSignature(action: string, timestamp: number): string {
  const sharedSecret = configManager.getSharedSecret();
  if (!sharedSecret) {
    throw new Error('No shared secret configured');
  }

  const message = `${action}${timestamp}`;
  return crypto
    .createHmac('sha256', sharedSecret)
    .update(message)
    .digest('hex');
}
