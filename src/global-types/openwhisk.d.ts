/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

declare module 'openwhisk' {
  export interface Dict {
    [key: string]: any;
  }

  export interface ActivationResponse {
    success: boolean;
    result: Dict;
  }

  export interface Activation<T = Dict> {
    activationId: string;
    response: ActivationResponse;
  }

  export interface InvokeOptions {
    name: string;
    blocking: boolean;
    params: Dict;
  }

  export interface ActionsClient {
    invoke(options: InvokeOptions): Promise<Activation<Dict>>;
  }

  export interface OpenWhiskClient {
    actions: ActionsClient;
  }

  export interface OpenWhiskOptions {
    apihost: string;
    api_key: string;
  }

  function openwhisk(options: OpenWhiskOptions): OpenWhiskClient;
  export = openwhisk;
}
