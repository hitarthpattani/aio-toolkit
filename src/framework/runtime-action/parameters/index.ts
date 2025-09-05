/**
 * <license header>
 */

class Parameters {
  /**
   * Returns a log-ready string of the action input parameters.
   * The `Authorization` header content will be replaced by '<hidden>'.
   *
   * @param params action input parameters.
   *
   * @returns string
   */
  static stringify(params: { [key: string]: any }): string {
    // hide authorization token without overriding params
    let headers = params.__ow_headers || {};
    if (headers.authorization) {
      headers = { ...headers, authorization: '<hidden>' };
    }
    return JSON.stringify({ ...params, __ow_headers: headers });
  }
}

export default Parameters;
