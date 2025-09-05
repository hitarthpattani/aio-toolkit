/**
 * <license header>
 */

import { Core } from '@adobe/aio-sdk';

import GenerateBasicAuthToken from './generate-basic-auth-token';
import { Connection } from '../types';

class BasicAuthConnection implements Connection {
  private baseUrl: string;
  private username: string;
  private password: string;
  private logger: any;

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
  async extend(commerceGot: any): Promise<any> {
    this.logger.debug('Using Commerce client with integration options');

    const generateToken = new GenerateBasicAuthToken(
      this.baseUrl,
      this.username,
      this.password,
      this.logger
    );
    const token = await generateToken.execute();

    return commerceGot.extend({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export default BasicAuthConnection;
