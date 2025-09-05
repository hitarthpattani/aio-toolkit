/**
 * <license header>
 */

import { context, getToken } from '@adobe/aio-lib-ims';
import { AdobeIMSConfig } from './types';

/**
 * Class providing authentication functionality for Adobe IMS (Identity Management System)
 */
class AdobeAuth {
  /**
   * Retrieves an authentication token from Adobe IMS
   *
   * @param clientId - The client ID for the Adobe IMS integration
   * @param clientSecret - The client secret for the Adobe IMS integration
   * @param technicalAccountId - The technical account ID for the Adobe IMS integration
   * @param technicalAccountEmail - The technical account email for the Adobe IMS integration
   * @param imsOrgId - The IMS organization ID
   * @param scopes - Array of permission scopes to request for the token
   * @param currentContext - The context name for storing the configuration (defaults to 'onboarding-config')
   * @returns Promise<string> - A promise that resolves to the authentication token
   *
   * @example
   * const token = await AdobeAuth.getToken(
   *   'your-client-id',
   *   'your-client-secret',
   *   'your-technical-account-id',
   *   'your-technical-account-email',
   *   'your-ims-org-id',
   *   ['AdobeID', 'openid', 'adobeio_api']
   * );
   */
  static async getToken(
    clientId: string,
    clientSecret: string,
    technicalAccountId: string,
    technicalAccountEmail: string,
    imsOrgId: string,
    scopes: string[],
    currentContext: string = 'onboarding-config'
  ): Promise<string> {
    const config: AdobeIMSConfig = {
      client_id: clientId,
      client_secrets: [clientSecret],
      technical_account_id: technicalAccountId,
      technical_account_email: technicalAccountEmail,
      ims_org_id: imsOrgId,
      scopes: scopes,
    };

    await context.setCurrent(currentContext);
    await context.set(currentContext, config);

    return await getToken();
  }
}

export default AdobeAuth;
