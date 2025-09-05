/**
 * <license header>
 */

import fetch, { RequestInit, Response } from 'node-fetch';
import { Headers } from './types';

class RestClient {
  /**
   * A generic method to make GET rest call
   *
   * @param endpoint
   * @param headers
   * @returns {Promise<any>}
   */
  async get(endpoint: string, headers: Headers = {}): Promise<any> {
    return await this.apiCall(endpoint, 'GET', headers);
  }

  /**
   * A generic method to make POST rest call
   *
   * @param endpoint
   * @param headers
   * @param payload
   * @returns {Promise<any>}
   */
  async post(endpoint: string, headers: Headers = {}, payload: any = null): Promise<any> {
    return await this.apiCall(endpoint, 'POST', headers, payload);
  }

  /**
   * A generic method to make PUT rest call
   *
   * @param endpoint
   * @param headers
   * @param payload
   * @returns {Promise<any>}
   */
  async put(endpoint: string, headers: Headers = {}, payload: any = null): Promise<any> {
    return await this.apiCall(endpoint, 'PUT', headers, payload);
  }

  /**
   * A generic method to make DELETE rest call
   *
   * @param endpoint
   * @param headers
   * @returns {Promise<any>}
   */
  async delete(endpoint: string, headers: Headers = {}): Promise<any> {
    return await this.apiCall(endpoint, 'DELETE', headers);
  }

  /**
   * A generic method to make rest call
   *
   * @param endpoint
   * @param method
   * @param headers
   * @param payload
   * @returns {Promise<any>}
   */
  async apiCall(
    endpoint: string,
    method: string = 'POST',
    headers: Headers = {},
    payload: any = null
  ): Promise<any> {
    let options: RequestInit = {
      method: method,
      headers: headers,
    };

    if (payload !== null) {
      options = {
        ...options,
        body: JSON.stringify(payload),
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
      };
    }

    const response: Response = await fetch(endpoint, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle responses with no content (like 204 No Content)
    if (response.status === 204 || response.headers?.get('content-length') === '0') {
      return null;
    }

    // Try JSON first (for both real responses and mocked responses)
    if (typeof response.json === 'function') {
      const contentType = response.headers?.get('content-type');
      // If no content-type header (mocked response) or JSON content-type, parse as JSON
      if (
        !contentType ||
        contentType.includes('application/json') ||
        contentType.includes('application/hal+json')
      ) {
        return await response.json();
      }
    }

    // For non-JSON responses, return text
    if (typeof response.text === 'function') {
      const text = await response.text();
      return text;
    }

    // Fallback for responses without text/json methods
    return null;
  }
}

export default RestClient;
