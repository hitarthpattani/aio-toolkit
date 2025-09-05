/**
 * Copyright © Adobe, Inc. All rights reserved.
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

    this.logger.debug(`Response: ${response}`);

    if (response !== null) {
      return {
        token: response,
        expire_in: 3600,
      };
    }

    return null;
  }

  /**
   * @param endpoint
   * @return string
   */
  createEndpoint(endpoint: string): string {
    return `${this.baseUrl}/${endpoint}`;
  }

  /**
   * @param result
   * @return boolean
   */
  async setValue(result: TokenResult): Promise<boolean> {
    const state = await this.getState();

    try {
      await state.put(this.key, result.token, { ttl: result.expire_in });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @return string | null
   */
  async getValue(): Promise<string | null> {
    const state = await this.getState();

    const value = await state.get(this.key);
    if (value !== undefined) {
      return value.value;
    }

    return null;
  }

  /**
   * @return any
   */
  async getState(): Promise<any> {
    if (this.state === undefined) {
      this.state = await State.init();
    }
    return this.state;
  }
}

export default GenerateBasicAuthToken;
