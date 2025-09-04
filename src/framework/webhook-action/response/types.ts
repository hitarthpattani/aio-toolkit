/**
 * Adobe App Builder Webhook Response types and interfaces
 *
 * Copyright © Adobe, Inc. All rights reserved.
 */

export enum WebhookOperation {
  SUCCESS = 'success',
  EXCEPTION = 'exception',
  ADD = 'add',
  REPLACE = 'replace',
  REMOVE = 'remove',
}

export interface SuccessResponse {
  op: typeof WebhookOperation.SUCCESS;
}

export interface ExceptionResponse {
  op: typeof WebhookOperation.EXCEPTION;
  class?: string | undefined;
  message?: string | undefined;
}

export interface AddResponse {
  op: typeof WebhookOperation.ADD;
  path: string;
  value: any;
  instance?: string | undefined;
}

export interface ReplaceResponse {
  op: typeof WebhookOperation.REPLACE;
  path: string;
  value: any;
  instance?: string | undefined;
}

export interface RemoveResponse {
  op: typeof WebhookOperation.REMOVE;
  path: string;
}
