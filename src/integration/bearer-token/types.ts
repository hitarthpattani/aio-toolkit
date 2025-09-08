/**
 * <license header>
 */

/**
 * Information about a Bearer token including validity and expiry details
 */
export interface BearerTokenInfo {
  /** The extracted token string, or null if not found */
  token: string | null;
  /** Length of the token string, 0 if no token */
  tokenLength: number;
  /** Whether the token is valid and not expired */
  isValid: boolean;
  /** Token expiry as ISO string, or null if no expiry */
  expiry: string | null;
  /** Time until expiry in milliseconds, or null if no expiry */
  timeUntilExpiry: number | null;
}
