/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import { Core } from '@adobe/aio-sdk';
import got, { Got } from 'got';

import { HttpStatus } from '../../framework/runtime-action/types';
import { Connection, ExtendedRequestError } from './types';

class AdobeCommerceClient {
  private baseUrl: string;
  private connection: Connection;
  private logger: any;

  /**
   * @param baseUrl
   * @param connection
   * @param logger
   */
  constructor(baseUrl: string, connection: Connection, logger: any = null) {
    if (!baseUrl) {
      throw new Error('Commerce URL must be provided');
    }
    this.baseUrl = baseUrl;
    this.connection = connection;

    if (logger === null) {
      logger = Core.Logger('adobe-commerce-client', {
        level: 'debug',
      });
    }
    this.logger = logger;
  }

  /**
   * @param endpoint
   * @param headers
   */
  async get(endpoint: string, headers: Record<string, string> = {}): Promise<any> {
    return await this.apiCall(endpoint, 'GET', headers);
  }

  /**
   * @param endpoint
   * @param headers
   * @param payload
   */
  async post(
    endpoint: string,
    headers: Record<string, string> = {},
    payload: any = null
  ): Promise<any> {
    return await this.apiCall(endpoint, 'POST', headers, payload);
  }

  /**
   * @param endpoint
   * @param headers
   * @param payload
   */
  async put(
    endpoint: string,
    headers: Record<string, string> = {},
    payload: any = null
  ): Promise<any> {
    return await this.apiCall(endpoint, 'PUT', headers, payload);
  }

  /**
   * @param endpoint
   * @param headers
   */
  async delete(endpoint: string, headers: Record<string, string> = {}): Promise<any> {
    return await this.apiCall(endpoint, 'DELETE', headers);
  }

  /**
   * @param endpoint
   * @param method
   * @param headers
   * @param payload
   * @private
   */
  private async apiCall(
    endpoint: string,
    method: string = 'POST',
    headers: Record<string, string> = {},
    payload: any = null
  ): Promise<any> {
    const commerceGot = await this.getHttpClient();

    commerceGot.extend({
      headers: headers,
    });

    const wrapper = async (callable: () => Promise<any>): Promise<any> => {
      try {
        const message = await callable();
        return { success: true, message };
      } catch (e: any) {
        if (e.code === 'ERR_GOT_REQUEST_ERROR') {
          this.logger.error('Error while calling Commerce API', e);
          return {
            success: false,
            statusCode: HttpStatus.INTERNAL_ERROR,
            message: `Unexpected error, check logs. Original error "${e.message}"`,
          };
        }
        return {
          success: false,
          statusCode: e.response?.statusCode || HttpStatus.INTERNAL_ERROR,
          message: e.message,
          body: (e as ExtendedRequestError).responseBody,
        };
      }
    };

    let options: any = {
      method: method,
    };

    if (payload !== null) {
      options = {
        ...options,
        json: payload,
      };
    }

    return await wrapper(() => commerceGot(endpoint, options).json());
  }

  /**
   * @private
   */
  private async getHttpClient(): Promise<Got> {
    const commerceGot = got.extend({
      http2: true,
      responseType: 'json',
      prefixUrl: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
      hooks: {
        beforeRequest: [
          (options): void => this.logger.debug(`Request [${options.method}] ${options.url}`),
        ],
        beforeRetry: [
          (options, error, retryCount): void =>
            this.logger.debug(
              `Retrying request [${options.method}] ${options.url} - count: ${retryCount} - error: ${error?.code} - ${error?.message}`
            ),
        ],
        beforeError: [
          (error: ExtendedRequestError): ExtendedRequestError => {
            const { response } = error;
            if (response?.body) {
              error.responseBody = response.body;
            }
            return error;
          },
        ],
        afterResponse: [
          (response): any => {
            this.logger.debug(
              `Response [${response.request.options.method}] ${response.request.options.url} - ${response.statusCode} ${response.statusMessage}`
            );
            return response;
          },
        ],
      },
    });

    return await this.connection.extend(commerceGot);
  }
}

export default AdobeCommerceClient;
