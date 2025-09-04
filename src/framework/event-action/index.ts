/**
 * Adobe App Builder Event Action handler
 *
 * Copyright © Adobe, Inc. All rights reserved.
 */

import { Core } from '@adobe/aio-sdk';

import RuntimeActionResponse from '../runtime-action/response';
import Parameters from '../utils/parameters';
import Validator from '../utils/validator';

import { HttpStatus } from '../runtime-action/types';
import { RuntimeActionResponseType } from '../runtime-action/response/types';

class EventAction {
  /**
   * @param name
   * @param requiredParams
   * @param requiredHeaders
   * @param action
   * @returns {(function(*): Promise<any>)|*}
   */
  static execute(
    name: string = 'main',
    requiredParams: string[] = [],
    requiredHeaders: string[] = [],
    action: (
      params: { [key: string]: any },
      ctx: { logger: any; headers: { [key: string]: any } }
    ) => Promise<RuntimeActionResponseType> = async (
      _params
    ): Promise<RuntimeActionResponseType> => {
      return { statusCode: HttpStatus.OK, body: {} };
    }
  ): (params: { [key: string]: any }) => Promise<RuntimeActionResponseType> {
    return async (params: { [key: string]: any }) => {
      // create a Logger
      const logger = Core.Logger(name, { level: params.LOG_LEVEL || 'info' });

      try {
        // 'info' is the default level if not set
        logger.info(`Calling the ${name} action`);

        // log parameters, only if params.LOG_LEVEL === 'debug'
        logger.debug(Parameters.stringify(params));

        // check for missing request input parameters and headers
        const errorMessage =
          Validator.checkMissingRequestInputs(params, requiredParams, requiredHeaders) || '';
        if (errorMessage) {
          // return and log client errors
          return RuntimeActionResponse.error(HttpStatus.BAD_REQUEST, errorMessage);
        }

        const result = await action(params, { logger: logger, headers: params.__ow_headers || {} });
        // log the error
        logger.info(result);
        return result;
      } catch (error) {
        // log any server errors
        logger.error(error);
        // return with 500
        return RuntimeActionResponse.error(HttpStatus.INTERNAL_ERROR, 'server error');
      }
    };
  }
}

export default EventAction;
