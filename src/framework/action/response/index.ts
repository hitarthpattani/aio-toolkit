/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import { HttpStatus } from '../types';
import { SuccessResponse, ErrorResponse } from './types';

class ActionResponse {
  /**
   * Returns a success response object, this method should be called on the handlers actions
   *
   * @param response a descriptive message of the result
   *        e.g. 'missing xyz parameter'
   * @param headers optional headers to include in the response
   * @returns the response object, ready to be returned from the action main's function.
   */
  static success(
    response: object | string,
    headers: { [key: string]: string } = {}
  ): SuccessResponse {
    return {
      statusCode: HttpStatus.OK,
      body: response,
      headers: headers,
    };
  }

  /**
   * Returns an error response object, this method should be called on the handlers actions
   *
   * @param statusCode the status code.
   *        e.g. 400
   * @param error a descriptive message of the result
   *        e.g. 'missing xyz parameter'
   * @returns the response object, ready to be returned from the action main's function.
   */
  static error(statusCode: HttpStatus, error: string): ErrorResponse {
    return {
      error: {
        statusCode,
        body: {
          error: error,
        },
      },
    };
  }
}

export default ActionResponse;
