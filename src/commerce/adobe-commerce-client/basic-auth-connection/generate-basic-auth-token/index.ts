/**
 * <license header>
 */

import { State, Core } from '@adobe/aio-sdk';

import RestClient from '../../../../integration/rest-client';
import { TokenResult } from './types';

class GenerateBasicAuthToken {
  private baseUrl: string;
  private username: string;
  private password: string;
  private key: string;
  private logger: any;
  private state: any;

  /**
   * @param baseUrl
   * @param username
   * @param password
   * @param logger
   */
  constructor(baseUrl: string, username: string, password: string, logger: any = null) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.password = password;
    this.key = 'adobe_commerce_basic_auth_token';

    if (logger === null) {
      logger = Core.Logger('adobe-commerce-client', {
        level: 'debug',
      });
    }
    this.logger = logger;
  }

  /**
   * @return string | null
   */
  async execute(): Promise<string | null> {
    const currentValue = await this.getValue();
    if (currentValue !== null) {
      return currentValue;
    }

    let result: TokenResult = {
      token: null,
      expire_in: 3600,
    };

    const response = await this.getCommerceToken();
    if (response !== null) {
      result = response;
    }

    this.logger.debug(`Token: ${JSON.stringify(result)}`);

    if (result.token !== null) {
      await this.setValue(result);
    }

    return result.token;
  }

  /**
   * @return TokenResult | null
   */
  async getCommerceToken(): Promise<TokenResult | null> {
    const endpoint = this.createEndpoint('rest/V1/integration/admin/token');

    this.logger.debug(`Endpoint: ${endpoint}`);

    try {
      const restClient = new RestClient();
      const response = await restClient.post(
        endpoint,
        {
          'Content-Type': 'application/json',
        },
        {
          username: this.username,
          password: this.password,
        }
      );

      this.logger.debug(`Raw response type: ${typeof response}`);
      this.logger.debug(`Raw response: ${JSON.stringify(response)}`);

      if (response !== null && response !== undefined) {
        // Adobe Commerce returns the token as a JSON string (e.g., "abc123")
        // If it's already a string, use it directly
        // If it's an object with token property, extract it
        let tokenValue: string;

        if (typeof response === 'string') {
          tokenValue = response;
        } else if (typeof response === 'object' && response.token) {
          tokenValue = response.token;
        } else {
          // Try to convert to string as a fallback
          try {
            tokenValue = response.toString();
            this.logger.debug(`Converted response to string: ${tokenValue?.substring(0, 10)}...`);
          } catch {
            this.logger.error(`Unexpected response format: ${JSON.stringify(response)}`);
            return null;
          }
        }

        this.logger.debug(`Extracted token: ${tokenValue?.substring(0, 10)}...`);

        return {
          token: tokenValue,
          expire_in: 3600, // Adobe Commerce tokens typically expire in 1 hour
        };
      }

      this.logger.error('Received null or undefined response from Commerce API');
      return null;
    } catch (error: any) {
      this.logger.error(`Failed to get Commerce token: ${error.message}`);
      this.logger.debug(`Full error: ${JSON.stringify(error)}`);
      return null;
    }
  }

  /**
   * @param endpoint
   * @return string
   */
  createEndpoint(endpoint: string): string {
    // Normalize base URL (remove trailing slash if present)
    const normalizedBaseUrl = this.baseUrl.replace(/\/+$/, '');
    // Ensure endpoint starts with /
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${normalizedBaseUrl}${normalizedEndpoint}`;
  }

  /**
   * @param result
   * @return boolean
   */
  async setValue(result: TokenResult): Promise<boolean> {
    try {
      const state = await this.getState();
      if (state === null) {
        // State API not available, skip caching
        return true; // Return true since token generation succeeded
      }

      await state.put(this.key, result.token, { ttl: result.expire_in });
      return true;
    } catch (error) {
      this.logger.debug('Failed to cache token, continuing without caching');
      return true; // Return true since token generation succeeded
    }
  }

  /**
   * @return string | null
   */
  async getValue(): Promise<string | null> {
    try {
      const state = await this.getState();
      if (state === null) {
        // State API not available, skip caching
        return null;
      }

      const value = await state.get(this.key);
      if (value !== undefined) {
        return value.value;
      }
    } catch (error) {
      this.logger.debug('State API not available, skipping cache lookup');
    }

    return null;
  }

  /**
   * @return any
   */
  async getState(): Promise<any> {
    if (this.state === undefined) {
      try {
        this.state = await State.init();
      } catch (error) {
        this.logger.debug('State API initialization failed, running without caching');
        this.state = null;
      }
    }
    return this.state;
  }
}

export default GenerateBasicAuthToken;
