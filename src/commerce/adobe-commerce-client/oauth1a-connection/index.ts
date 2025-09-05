/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import { Core } from '@adobe/aio-sdk';
import Oauth1a from 'oauth-1.0a';
import * as crypto from 'crypto';
import { Got } from 'got';

import { Connection } from '../types';

class Oauth1aConnection implements Connection {
  private consumerKey: string;
  private consumerSecret: string;
  private accessToken: string;
  private accessTokenSecret: string;
  private logger: any;

  /**
   * @param consumerKey
   * @param consumerSecret
   * @param accessToken
   * @param accessTokenSecret
   * @param logger
   */
  constructor(
    consumerKey: string,
    consumerSecret: string,
    accessToken: string,
    accessTokenSecret: string,
    logger: any = null
  ) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.accessToken = accessToken;
    this.accessTokenSecret = accessTokenSecret;

    if (logger === null) {
      logger = Core.Logger('adobe-commerce-client', {
        level: 'debug',
      });
    }
    this.logger = logger;
  }

  /**
   * @param commerceGot
   */
  async extend(commerceGot: Got): Promise<Got> {
    this.logger.debug('Using Commerce client with integration options');

    const headers = this.headersProvider();

    return commerceGot.extend({
      handlers: [
        (options: any, next: any): Promise<any> => {
          options.headers = {
            ...options.headers,
            ...headers(options.url.toString(), options.method),
          };
          return next(options);
        },
      ],
    });
  }

  /**
   * return () => { }
   */
  headersProvider(): (url: string, method: string) => any {
    const oauth = new Oauth1a({
      consumer: {
        key: this.consumerKey,
        secret: this.consumerSecret,
      },
      signature_method: 'HMAC-SHA256',
      hash_function: (baseString: string, key: string): string =>
        crypto.createHmac('sha256', key).update(baseString).digest('base64'),
    });

    const oauthToken = {
      key: this.accessToken,
      secret: this.accessTokenSecret,
    };

    return (url: string, method: string): any =>
      oauth.toHeader(oauth.authorize({ url, method }, oauthToken));
  }
}

export default Oauth1aConnection;
