/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import { Core } from '@adobe/aio-sdk';

import RuntimeActionResponse from './response';
import Parameters from './parameters';
import Validator from '../utils/validator';

import { HttpStatus, HttpMethod } from './types';
import { RuntimeActionResponseType } from './response/types';

class RuntimeAction {
  /**
   * @param name
   * @param httpMethods
   * @param requiredParams
   * @param requiredHeaders
   * @param action
   * @returns {(function(*): Promise<any>)|*}
   */
  static execute(
    name: string = 'main',
    httpMethods: HttpMethod[] = [],
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

        // validate request
        const validationError = RuntimeAction.validateRequest(
          params,
          requiredParams,
          requiredHeaders,
          httpMethods,
          logger
        );
        if (validationError) {
          return validationError;
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

  private static validateRequest(
    params: { [key: string]: any },
    requiredParams: string[],
    requiredHeaders: string[],
    httpMethods: HttpMethod[],
    logger: any
  ): RuntimeActionResponseType | null {
    // check for missing request input parameters and headers
    const errorMessage =
      Validator.checkMissingRequestInputs(params, requiredParams, requiredHeaders) ?? '';
    if (errorMessage) {
      // return and log client errors
      return RuntimeActionResponse.error(HttpStatus.BAD_REQUEST, errorMessage);
    }

    // validate HTTP method
    const requestMethod = params.__ow_method;
    if (httpMethods.length > 0 && !httpMethods.includes(requestMethod)) {
      const errorMessage = `Invalid HTTP method: ${requestMethod}. Allowed methods are: ${httpMethods.join(', ')}`;
      logger.error(errorMessage);
      return RuntimeActionResponse.error(HttpStatus.METHOD_NOT_ALLOWED, errorMessage);
    }

    return null;
  }
}

export default RuntimeAction;
