/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

/**
 * Utility class for extracting and handling Bearer tokens from OpenWhisk action parameters
 */
class BearerToken {
  /**
   * Extracts the Bearer token from OpenWhisk action parameters.
   * Looks for the authorization header in __ow_headers and extracts the token value
   * after the "Bearer " prefix.
   *
   * @param params - OpenWhisk action input parameters containing headers
   * @returns The Bearer token string if found, undefined otherwise
   *
   * @example
   * const params = {
   *   __ow_headers: {
   *     authorization: 'Bearer abc123token'
   *   }
   * };
   * const token = BearerToken.extract(params); // returns 'abc123token'
   */
  static extract(params: { [key: string]: any }): string | undefined {
    if (params.__ow_headers?.authorization?.startsWith('Bearer ')) {
      return params.__ow_headers.authorization.substring('Bearer '.length);
    }
    return undefined;
  }
}

export default BearerToken;
