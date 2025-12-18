import { nanoid } from 'nanoid';

/**
 * Generate a unique share ID using nanoid
 * 21 characters, URL-safe, extremely low collision probability
 */
export function generateShareId(): string {
  return nanoid(21);
}

/**
 * Get the base URL for the application
 */
export function getBaseUrl(): string {
  return process.env.NEXTAUTH_URL || 'http://localhost:3100';
}

/**
 * Generate the full share URL for a given share ID
 */
export function getShareUrl(shareId: string): string {
  return `${getBaseUrl()}/share/${shareId}`;
}

/**
 * Generate the invitation accept URL
 */
export function getInvitationAcceptUrl(shareId: string, token: string): string {
  return `${getBaseUrl()}/share/${shareId}/accept?token=${encodeURIComponent(token)}`;
}

/**
 * Generate the invitation reject URL
 */
export function getInvitationRejectUrl(shareId: string, token: string): string {
  return `${getBaseUrl()}/share/${shareId}/reject?token=${encodeURIComponent(token)}`;
}

/**
 * Create a simple invitation token by encoding email and shareId
 * This uses base64 encoding for simplicity - in production, consider using
 * a more secure signing mechanism (e.g., JWT or HMAC)
 */
export function createInvitationToken(email: string, shareId: string): string {
  const data = JSON.stringify({ email, shareId, ts: Date.now() });
  return Buffer.from(data).toString('base64url');
}

/**
 * Decode an invitation token
 * Returns null if the token is invalid
 */
export function decodeInvitationToken(
  token: string,
): { email: string; shareId: string; ts: number } | null {
  try {
    const data = Buffer.from(token, 'base64url').toString('utf-8');
    const parsed = JSON.parse(data);
    if (parsed.email && parsed.shareId && parsed.ts) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
