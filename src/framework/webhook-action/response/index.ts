/**
 * Adobe App Builder Webhook Response utilities
 *
 * Copyright © Adobe, Inc. All rights reserved.
 */

import {
  WebhookOperation,
  SuccessResponse,
  ExceptionResponse,
  AddResponse,
  ReplaceResponse,
  RemoveResponse,
} from './types';

class WebhookActionResponse {
  static success(): SuccessResponse {
    return {
      op: WebhookOperation.SUCCESS,
    };
  }

  static exception(exceptionClass?: string, message?: string): ExceptionResponse {
    return {
      op: WebhookOperation.EXCEPTION,
      class: exceptionClass,
      message: message,
    };
  }

  static add(path: string, value: any, instance?: string): AddResponse {
    return {
      op: WebhookOperation.ADD,
      path: path,
      value: value,
      instance: instance,
    };
  }

  static replace(path: string, value: any, instance?: string): ReplaceResponse {
    return {
      op: WebhookOperation.REPLACE,
      path: path,
      value: value,
      instance: instance,
    };
  }

  static remove(path: string): RemoveResponse {
    return {
      op: WebhookOperation.REMOVE,
      path: path,
    };
  }
}

export default WebhookActionResponse;
