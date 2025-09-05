/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import { Core } from '@adobe/aio-sdk';
import AdobeAuth from '../../adobe-auth';
import { Connection } from '../types';

class ImsConnection implements Connection {
  private clientId: string;
  private clientSecret: string;
  private technicalAccountId: string;
  private technicalAccountEmail: string;
  private imsOrgId: string;
  private scopes: Array<string>;
  private logger: any;
  private currentContext: string;

  /**
   * @param clientId
   * @param clientSecret
   * @param technicalAccountId
   * @param technicalAccountEmail
   * @param imsOrgId
   * @param scopes
   * @param logger
   * @param currentContext
   */
  constructor(
    clientId: string,
    clientSecret: string,
    technicalAccountId: string,
    technicalAccountEmail: string,
    imsOrgId: string,
    scopes: Array<string>,
    logger: any = null,
    currentContext: string = 'adobe-commerce-client'
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.technicalAccountId = technicalAccountId;
    this.technicalAccountEmail = technicalAccountEmail;
    this.imsOrgId = imsOrgId;
    this.scopes = scopes;
    this.currentContext = currentContext;

    if (logger === null) {
      logger = Core.Logger(currentContext, {
        level: 'debug',
      });
    }
    this.logger = logger;
  }

  /**
   * @param commerceGot
   */
  async extend(commerceGot: any): Promise<any> {
    this.logger.debug('Using Commerce client with IMS authentication');

    const token = await AdobeAuth.getToken(
      this.clientId,
      this.clientSecret,
      this.technicalAccountId,
      this.technicalAccountEmail,
      this.imsOrgId,
      this.scopes,
      this.currentContext
    );

    this.logger.debug(`IMS token being extended to header: ${token}`);

    return commerceGot.extend({
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

export default ImsConnection;
