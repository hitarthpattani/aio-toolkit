var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/framework/runtime-action/index.ts
import { Core } from "@adobe/aio-sdk";

// src/framework/runtime-action/types.ts
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

// src/framework/runtime-action/response/index.ts
var _RuntimeActionResponse = class _RuntimeActionResponse {
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
__name(_RuntimeActionResponse, "RuntimeActionResponse");
var RuntimeActionResponse = _RuntimeActionResponse;
var response_default = RuntimeActionResponse;

// src/framework/runtime-action/parameters/index.ts
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

// src/framework/runtime-action/index.ts
var _RuntimeAction = class _RuntimeAction {
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
        const validationError = _RuntimeAction.validateRequest(
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
__name(_RuntimeAction, "RuntimeAction");
var RuntimeAction = _RuntimeAction;
var runtime_action_default = RuntimeAction;

// src/framework/event-action/index.ts
import { Core as Core2 } from "@adobe/aio-sdk";
var _EventAction = class _EventAction {
  /**
   * @param name
   * @param requiredParams
   * @param requiredHeaders
   * @param action
   * @returns {(function(*): Promise<any>)|*}
   */
  static execute(name = "main", requiredParams = [], requiredHeaders = [], action = async (_params) => {
    return { statusCode: 200 /* OK */, body: {} };
  }) {
    return async (params) => {
      const logger = Core2.Logger(name, { level: params.LOG_LEVEL || "info" });
      try {
        logger.info(`Calling the ${name} action`);
        logger.debug(parameters_default.stringify(params));
        const errorMessage = validator_default.checkMissingRequestInputs(params, requiredParams, requiredHeaders) || "";
        if (errorMessage) {
          return response_default.error(400 /* BAD_REQUEST */, errorMessage);
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
};
__name(_EventAction, "EventAction");
var EventAction = _EventAction;
var event_action_default = EventAction;

// src/framework/webhook-action/index.ts
import * as crypto from "crypto";

// src/framework/webhook-action/response/types.ts
var WebhookOperation = /* @__PURE__ */ ((WebhookOperation2) => {
  WebhookOperation2["SUCCESS"] = "success";
  WebhookOperation2["EXCEPTION"] = "exception";
  WebhookOperation2["ADD"] = "add";
  WebhookOperation2["REPLACE"] = "replace";
  WebhookOperation2["REMOVE"] = "remove";
  return WebhookOperation2;
})(WebhookOperation || {});

// src/framework/webhook-action/response/index.ts
var _WebhookActionResponse = class _WebhookActionResponse {
  static success() {
    return {
      op: "success" /* SUCCESS */
    };
  }
  static exception(exceptionClass, message) {
    return {
      op: "exception" /* EXCEPTION */,
      class: exceptionClass,
      message
    };
  }
  static add(path, value, instance) {
    return {
      op: "add" /* ADD */,
      path,
      value,
      instance
    };
  }
  static replace(path, value, instance) {
    return {
      op: "replace" /* REPLACE */,
      path,
      value,
      instance
    };
  }
  static remove(path) {
    return {
      op: "remove" /* REMOVE */,
      path
    };
  }
};
__name(_WebhookActionResponse, "WebhookActionResponse");
var WebhookActionResponse = _WebhookActionResponse;
var response_default2 = WebhookActionResponse;

// src/framework/webhook-action/types.ts
var SignatureVerification = /* @__PURE__ */ ((SignatureVerification2) => {
  SignatureVerification2[SignatureVerification2["DISABLED"] = 0] = "DISABLED";
  SignatureVerification2[SignatureVerification2["ENABLED"] = 1] = "ENABLED";
  SignatureVerification2[SignatureVerification2["ENABLED_WITH_BASE64"] = 2] = "ENABLED_WITH_BASE64";
  return SignatureVerification2;
})(SignatureVerification || {});

// src/framework/webhook-action/index.ts
var _WebhookAction = class _WebhookAction {
  /**
   * @param name
   * @param requiredParams
   * @param requiredHeaders
   * @param signatureVerification
   * @param action
   * @returns {(function(*): Promise<any>)|*}
   */
  static execute(name = "main", requiredParams = [], requiredHeaders = ["Authorization"], signatureVerification = 0 /* DISABLED */, action = async (_params) => {
    return { statusCode: 200 /* OK */, body: {} };
  }) {
    return runtime_action_default.execute(
      `webhook-${name}`,
      ["get" /* GET */, "post" /* POST */],
      [],
      [],
      async (params, ctx) => {
        const operations = [];
        if (params.__ow_body !== null) {
          let payload = {};
          try {
            payload = JSON.parse(atob(params.__ow_body));
          } catch {
          }
          params = {
            ...params,
            ...payload
          };
          ctx.logger.debug(parameters_default.stringify(payload));
        }
        if (signatureVerification !== 0 /* DISABLED */) {
          if (params.PUBLIC_KEY === void 0) {
            operations.push(
              response_default2.exception(
                "Magento\\Framework\\Exception\\LocalizedException",
                "The public key is invalid"
              )
            );
          } else {
            const errorMessage = validator_default.checkMissingRequestInputs(params, requiredParams, requiredHeaders) || "";
            if (errorMessage) {
              return response_default.error(400 /* BAD_REQUEST */, errorMessage);
            }
            const signature = params.__ow_headers["x-adobe-commerce-webhook-signature"] || "";
            const verifier = crypto.createVerify("SHA256");
            verifier.update(params.__ow_body);
            let publicKey = params.PUBLIC_KEY;
            if (signatureVerification === 2 /* ENABLED_WITH_BASE64 */) {
              publicKey = atob(publicKey);
            }
            const isSignatureValid = verifier.verify(publicKey, signature, "base64");
            if (isSignatureValid) {
              operations.push(await action(params, ctx));
            } else {
              operations.push(
                response_default2.exception(
                  "Magento\\Framework\\Exception\\LocalizedException",
                  `The signature is invalid.`
                )
              );
            }
          }
        } else {
          const errorMessage = validator_default.checkMissingRequestInputs(params, requiredParams, requiredHeaders) || "";
          if (errorMessage) {
            return response_default.error(400 /* BAD_REQUEST */, errorMessage);
          }
          operations.push(await action(params, ctx));
        }
        return response_default.success(JSON.stringify(operations));
      }
    );
  }
};
__name(_WebhookAction, "WebhookAction");
var WebhookAction = _WebhookAction;
var webhook_action_default = WebhookAction;

// src/framework/openwhisk/index.ts
import openwhisk from "openwhisk";
var _Openwhisk = class _Openwhisk {
  /**
   * @param host
   * @param apiKey
   */
  constructor(host, apiKey) {
    this.openwhiskClient = openwhisk({ apihost: host, api_key: apiKey });
  }
  /**
   * @param action
   * @param params
   * @returns {Promise<Activation<Dict>>}
   */
  async execute(action, params) {
    return await this.openwhiskClient.actions.invoke({
      name: action,
      blocking: true,
      params
    });
  }
};
__name(_Openwhisk, "Openwhisk");
var Openwhisk = _Openwhisk;
var openwhisk_default = Openwhisk;

// src/framework/openwhisk-action/index.ts
import { Core as Core3 } from "@adobe/aio-sdk";
var _OpenwhiskAction = class _OpenwhiskAction {
  /**
   * @param name
   * @param action
   * @returns {(function(*): Promise<any>)|*}
   */
  static execute(name = "main", action = async (_params) => {
    return { statusCode: 200 /* OK */, body: {} };
  }) {
    return async (params) => {
      const logger = Core3.Logger(name, { level: params.LOG_LEVEL || "info" });
      try {
        logger.info(`Calling the ${name} webhook action`);
        logger.debug(parameters_default.stringify(params));
        const result = await action(params, { logger, headers: params.__ow_headers || {} });
        logger.info(result);
        return result;
      } catch (error) {
        logger.error(error);
        return response_default.error(500 /* INTERNAL_ERROR */, "server error");
      }
    };
  }
};
__name(_OpenwhiskAction, "OpenwhiskAction");
var OpenwhiskAction = _OpenwhiskAction;
var openwhisk_action_default = OpenwhiskAction;
export {
  event_action_default as EventAction,
  HttpMethod,
  HttpStatus,
  openwhisk_default as Openwhisk,
  openwhisk_action_default as OpenwhiskAction,
  parameters_default as Parameters,
  runtime_action_default as RuntimeAction,
  response_default as RuntimeActionResponse,
  SignatureVerification,
  validator_default as Validator,
  webhook_action_default as WebhookAction,
  response_default2 as WebhookActionResponse,
  WebhookOperation
};
//# sourceMappingURL=index.mjs.map