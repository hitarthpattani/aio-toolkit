/**
 * Adobe App Builder OpenWhisk client wrapper
 *
 * Copyright © Adobe, Inc. All rights reserved.
 */

import openwhisk, { Activation, Dict } from 'openwhisk';

class Openwhisk {
  /**
   * @var openwhisk
   */
  openwhiskClient: ReturnType<typeof openwhisk>;

  /**
   * @param host
   * @param apiKey
   */
  constructor(host: string, apiKey: string) {
    this.openwhiskClient = openwhisk({ apihost: host, api_key: apiKey });
  }

  /**
   * @param action
   * @param params
   * @returns {Promise<Activation<Dict>>}
   */
  async execute(action: string, params: Dict): Promise<Activation<Dict>> {
    return await this.openwhiskClient.actions.invoke({
      name: action,
      blocking: true,
      params: params,
    });
  }
}

export default Openwhisk;
