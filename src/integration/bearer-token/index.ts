/**
 * <license header>
 */

import type { BearerTokenInfo } from './types';

/**
 * Utility class for extracting and handling Bearer tokens from OpenWhisk action parameters
 */
class BearerToken {
  /**
   * Extracts the Bearer token from OpenWhisk action parameters and returns detailed token information.
   * Looks for the authorization header in __ow_headers and extracts the token value
   * after the "Bearer " prefix.
   *
   * @param params - OpenWhisk action input parameters containing headers
   * @returns Detailed token information object
   *
   * @example
   * const params = {
   *   __ow_headers: {
   *     authorization: 'Bearer abc123token'
   *   }
   * };
   * const tokenInfo = BearerToken.extract(params);
   * // returns: {
   * //   token: 'abc123token',
   * //   tokenLength: 11,
   * //   isValid: true,
   * //   expiry: '2024-01-01T12:00:00.000Z',
   * //   timeUntilExpiry: 3600000
   * // }
   */
  static extract(params: { [key: string]: any }): BearerTokenInfo {
    let token: string | null = null;

    if (params.__ow_headers?.authorization?.startsWith('Bearer ')) {
      token = params.__ow_headers.authorization.substring('Bearer '.length);
    }

    return BearerToken.info(token);
  }

  /**
   * Gets detailed information about a Bearer token
   * @param token - The Bearer token string (or null)
   * @returns {BearerTokenInfo} Detailed token information including validity and expiry
   *
   * @example
   * const tokenInfo = BearerToken.info('abc123token');
   * // returns: {
   * //   token: 'abc123token',
   * //   tokenLength: 11,
   * //   isValid: true,
   * //   expiry: '2024-01-01T12:00:00.000Z',
   * //   timeUntilExpiry: 3600000
   * // }
   */
  static info(token: string | null): BearerTokenInfo {
    const tokenExpiry = BearerToken._calculateExpiry(token);

    return {
      token: token,
      tokenLength: token ? token.length : 0,
      isValid: BearerToken._isTokenValid(token, tokenExpiry),
      expiry: tokenExpiry ? tokenExpiry.toISOString() : null,
      timeUntilExpiry: tokenExpiry ? Math.max(0, tokenExpiry.getTime() - Date.now()) : null,
    };
  }

  /**
   * Checks if the given token is valid and not expired
   * @private
   * @param token - The bearer token string
   * @param tokenExpiry - The token expiry date
   * @returns {boolean} True if token is valid
   */
  private static _isTokenValid(token: string | null, tokenExpiry: Date | null): boolean {
    if (!token) {
      return false;
    }

    if (tokenExpiry && Date.now() >= tokenExpiry.getTime()) {
      console.log('⏰ Token has expired');
      return false;
    }

    return true;
  }

  /**
   * Calculates token expiry from JWT token or uses default for non-JWT tokens
   * @private
   * @param token - The token string (JWT or plain token)
   * @returns Date object representing token expiry
   */
  private static _calculateExpiry(token: string | null): Date | null {
    // Handle empty tokens
    if (!token) {
      return null;
    }

    try {
      // Try to parse as JWT token
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1] || '', 'base64').toString());

        if (payload.expires_in) {
          // expires_in is in milliseconds
          return new Date(Date.now() + parseInt(payload.expires_in));
        }

        if (payload.exp) {
          // exp is Unix timestamp in seconds
          return new Date(payload.exp * 1000);
        }
      }

      // For non-JWT tokens or JWT tokens without expiry, default to 24 hours
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    } catch (error) {
      console.warn('[WARN] Could not parse token expiry, using default 24h');
      return new Date(Date.now() + 24 * 60 * 60 * 1000);
    }
  }
}

export default BearerToken;
export type { BearerTokenInfo } from './types';
