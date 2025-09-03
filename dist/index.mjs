var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/framework/action/index.ts
import { Core } from "@adobe/aio-sdk";

// src/framework/action/types.ts
var HttpStatus = /* @__PURE__ */ ((HttpStatus2) => {
  HttpStatus2[HttpStatus2["OK"] = 200] = "OK";
  HttpStatus2[HttpStatus2["BAD_REQUEST"] = 400] = "BAD_REQUEST";
  HttpStatus2[HttpStatus2["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
  HttpStatus2[HttpStatus2["NOT_FOUND"] = 404] = "NOT_FOUND";
  HttpStatus2[HttpStatus2["METHOD_NOT_ALLOWED"] = 405] = "METHOD_NOT_ALLOWED";
  HttpStatus2[HttpStatus2["INTERNAL_ERROR"] = 500] = "INTERNAL_ERROR";
  return HttpStatus2;
})(HttpStatus || {});
var HttpMethod = /* @__PURE__ */ ((HttpMethod3) => {
  HttpMethod3["GET"] = "get";
  HttpMethod3["POST"] = "post";
  HttpMethod3["PUT"] = "put";
  HttpMethod3["DELETE"] = "delete";
  HttpMethod3["PATCH"] = "patch";
  HttpMethod3["HEAD"] = "head";
  HttpMethod3["OPTIONS"] = "options";
  return HttpMethod3;
})(HttpMethod || {});

// src/framework/action/response/index.ts
var _ActionResponse = class _ActionResponse {
  /**
   * Returns a success response object, this method should be called on the handlers actions
   *
   * @param response a descriptive message of the result
   *        e.g. 'missing xyz parameter'
   * @param headers optional headers to include in the response
   * @returns the response object, ready to be returned from the action main's function.
   */
  static success(response, headers = {}) {
    return {
      statusCode: 200 /* OK */,
      body: response,
      headers
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
  static error(statusCode, error) {
    return {
      error: {
        statusCode,
        body: {
          error
        }
      }
    };
  }
};
__name(_ActionResponse, "ActionResponse");
var ActionResponse = _ActionResponse;
var response_default = ActionResponse;

// src/framework/utils/parameters/index.ts
var _Parameters = class _Parameters {
  /**
   * Returns a log-ready string of the action input parameters.
   * The `Authorization` header content will be replaced by '<hidden>'.
   *
   * @param params action input parameters.
   *
   * @returns string
   */
  static stringify(params) {
    let headers = params.__ow_headers || {};
    if (headers.authorization) {
      headers = { ...headers, authorization: "<hidden>" };
    }
    return JSON.stringify({ ...params, __ow_headers: headers });
  }
};
__name(_Parameters, "Parameters");
var Parameters = _Parameters;
var parameters_default = Parameters;

// src/framework/utils/validator/index.ts
var _Validator = class _Validator {
  /**
   * Returns the list of missing keys given an object and its required keys.
   * A parameter is missing if its value is undefined or ''.
   * A value of 0 or null is not considered as missing.
   *
   * @param obj object to check.
   * @param required list of required keys.
   *        Each element can be multi-level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'
   *
   * @returns array
   * @private
   */
  static getMissingKeys(obj, required) {
    return required.filter((r) => {
      const splits = r.split(".");
      const last = splits[splits.length - 1];
      const traverse = splits.slice(0, -1).reduce((tObj, split) => tObj[split] || {}, obj);
      return last && (traverse[last] === void 0 || traverse[last] === "");
    });
  }
  /**
   * Returns the list of missing keys given an object and its required keys.
   * A parameter is missing if its value is undefined or ''.
   * A value of 0 or null is not considered as missing.
   *
   * @param params action input parameters.
   * @param requiredHeaders list of required input headers.
   * @param requiredParams list of required input parameters.
   *        Each element can be multi-level deep using a '.' separator e.g. 'myRequiredObj.myRequiredKey'.
   *
   * @returns string|null if the return value is not null, then it holds an error message describing the missing inputs.
   *
   */
  static checkMissingRequestInputs(params, requiredParams = [], requiredHeaders = []) {
    let errorMessage = null;
    requiredHeaders = requiredHeaders.map((h) => h.toLowerCase());
    const normalizedHeaders = Object.keys(params.__ow_headers || {}).reduce(
      (acc, key) => {
        acc[key.toLowerCase()] = params.__ow_headers?.[key];
        return acc;
      },
      {}
    );
    const missingHeaders = _Validator.getMissingKeys(normalizedHeaders, requiredHeaders);
    if (missingHeaders.length > 0) {
      errorMessage = `missing header(s) '${missingHeaders.join(", ")}'`;
    }
    const missingParams = _Validator.getMissingKeys(params, requiredParams);
    if (missingParams.length > 0) {
      if (errorMessage) {
        errorMessage += " and ";
      } else {
        errorMessage = "";
      }
      errorMessage += `missing parameter(s) '${missingParams.join(", ")}'`;
    }
    return errorMessage;
  }
};
__name(_Validator, "Validator");
var Validator = _Validator;
var validator_default = Validator;

// src/framework/action/index.ts
var _Action = class _Action {
  /**
   * @param name
   * @param httpMethods
   * @param requiredParams
   * @param requiredHeaders
   * @param action
   * @returns {(function(*): Promise<any>)|*}
   */
  static execute(name = "main", httpMethods = [], requiredParams = [], requiredHeaders = [], action = async (_params) => {
    return { statusCode: 200 /* OK */, body: {} };
  }) {
    return async (params) => {
      const logger = Core.Logger(name, { level: params.LOG_LEVEL || "info" });
      try {
        logger.info(`Calling the ${name} action`);
        logger.debug(parameters_default.stringify(params));
        const validationError = _Action.validateRequest(
          params,
          requiredParams,
          requiredHeaders,
          httpMethods,
          logger
        );
        if (validationError) {
          return validationError;
        }
        const result = await action(params, { logger, headers: params.__ow_headers || {} });
        logger.info(result);
        return result;
      } catch (error) {
        logger.error(error);
        return response_default.error(500 /* INTERNAL_ERROR */, "server error");
      }
    };
  }
  static validateRequest(params, requiredParams, requiredHeaders, httpMethods, logger) {
    const errorMessage = validator_default.checkMissingRequestInputs(params, requiredParams, requiredHeaders) ?? "";
    if (errorMessage) {
      return response_default.error(400 /* BAD_REQUEST */, errorMessage);
    }
    const requestMethod = params.__ow_method;
    if (httpMethods.length > 0 && !httpMethods.includes(requestMethod)) {
      const errorMessage2 = `Invalid HTTP method: ${requestMethod}. Allowed methods are: ${httpMethods.join(", ")}`;
      logger.error(errorMessage2);
      return response_default.error(405 /* METHOD_NOT_ALLOWED */, errorMessage2);
    }
    return null;
  }
};
__name(_Action, "Action");
var Action = _Action;
var action_default = Action;
export {
  action_default as Action,
  response_default as ActionResponse,
  HttpMethod,
  HttpStatus,
  parameters_default as Parameters,
  validator_default as Validator
};
//# sourceMappingURL=index.mjs.map