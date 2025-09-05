/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import { Got, RequestError } from 'got';

export interface Connection {
  extend: (client: Got) => Promise<Got>;
}

export interface ExtendedRequestError extends RequestError {
  responseBody?: any;
}
