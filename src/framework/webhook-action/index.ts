/**
 * Adobe App Builder Webhook handler
 *
 * <license header>
 */

import * as crypto from 'crypto';
import { Verify } from 'crypto';

import WebhookActionResponse from './response';

import RuntimeAction from '../runtime-action';
import RuntimeActionResponse from '../runtime-action/response';
import Parameters from '../runtime-action/parameters';
import Validator from '../runtime-action/validator';

import { HttpMethod, HttpStatus } from '../runtime-action/types';
import { SignatureVerification } from './types';
import { RuntimeActionResponseType } from '../runtime-action/response/types';

class WebhookAction {
  /**
   * @param name
   * @param requiredParams
   * @param requiredHeaders
   * @param signatureVerification
   * @param action
   * @returns {(function(*): Promise<any>)|*}
   */
  static execute(
    name: string = 'main',
    requiredParams: string[] = [],
    requiredHeaders: string[] = ['Authorization'],
    signatureVerification: SignatureVerification = SignatureVerification.DISABLED,
    action: (
      params: { [key: string]: any },
      ctx: { logger: any; headers: { [key: string]: any } }
    ) => Promise<RuntimeActionResponseType> = async (
      _params
    ): Promise<RuntimeActionResponseType> => {
      return { statusCode: HttpStatus.OK, body: {} };
    }
  ): (params: { [key: string]: any }) => Promise<RuntimeActionResponseType> {
    return RuntimeAction.execute(
      `webhook-${name}`,
      [HttpMethod.GET, HttpMethod.POST],
      [],
      [],
      async (params, ctx) => {
        const operations = [];

        // Preserve the original body for signature verification before parsing
        const originalBody = params.__ow_body;

        if (originalBody !== null) {
          let payload = {};
          try {
            payload = JSON.parse(atob(originalBody));
          } catch {
            // Ignore parsing errors
          }
          params = {
            ...params,
            ...payload,
          };
          // log parameters, only if params.LOG_LEVEL === 'debug'
          ctx.logger.debug(Parameters.stringify(payload));
        }

        if (signatureVerification !== SignatureVerification.DISABLED) {
          if (params.PUBLIC_KEY === undefined) {
            operations.push(
              WebhookActionResponse.exception(
                'Magento\\Framework\\Exception\\LocalizedException',
                'The public key is invalid'
              )
            );
          } else {
            // check for missing request input parameters and headers
            const errorMessage: string =
              Validator.checkMissingRequestInputs(params, requiredParams, requiredHeaders) || '';
            if (errorMessage) {
              // return and log client errors
              return RuntimeActionResponse.error(HttpStatus.BAD_REQUEST, errorMessage);
            }

            const signature: any = params.__ow_headers['x-adobe-commerce-webhook-signature'] || '';
            const verifier: Verify = crypto.createVerify('SHA256');

            // Adobe Commerce signs the base64-encoded request body
            // Use the original body (which is base64 encoded) for signature verification
            const bodyData = originalBody || '';
            verifier.update(bodyData);

            let publicKey: string = params.PUBLIC_KEY;
            if (signatureVerification === SignatureVerification.ENABLED_WITH_BASE64) {
              publicKey = atob(publicKey);
            }

            const isSignatureValid = verifier.verify(publicKey, signature, 'base64');

            if (isSignatureValid) {
              operations.push(await action(params, ctx));
            } else {
              operations.push(
                WebhookActionResponse.exception(
                  'Magento\\Framework\\Exception\\LocalizedException',
                  `The signature is invalid.`
                )
              );
            }
          }
        } else {
          // check for missing request input parameters and headers
          const errorMessage: string =
            Validator.checkMissingRequestInputs(params, requiredParams, requiredHeaders) || '';
          if (errorMessage) {
            // return and log client errors
            return RuntimeActionResponse.error(HttpStatus.BAD_REQUEST, errorMessage);
          }

          operations.push(await action(params, ctx));
        }

        return RuntimeActionResponse.success(JSON.stringify(operations));
      }
    );
  }
}

export default WebhookAction;
