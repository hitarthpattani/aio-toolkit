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

// src/framework/runtime-action/validator/index.ts
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

// src/framework/event-consumer-action/index.ts
import { Core as Core2 } from "@adobe/aio-sdk";
var _EventConsumerAction = class _EventConsumerAction {
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
__name(_EventConsumerAction, "EventConsumerAction");
var EventConsumerAction = _EventConsumerAction;
var event_consumer_action_default = EventConsumerAction;

// src/framework/graphql-action/index.ts
import { graphql, buildSchema, parse, validate } from "graphql";
var _GraphQlAction = class _GraphQlAction {
  static execute(schema = `
      type Query {
        hello: String
      }
    `, resolvers = async (_params) => {
    return {
      hello: /* @__PURE__ */ __name(() => "Hello World!", "hello")
    };
  }, name = "main", disableIntrospection = false) {
    return runtime_action_default.execute(
      `graphql-${name}`,
      ["get" /* GET */, "post" /* POST */],
      ["query"],
      [],
      async (params, ctx) => {
        let graphqlSchema;
        try {
          graphqlSchema = buildSchema(schema);
        } catch (error) {
          return response_default.error(400 /* BAD_REQUEST */, error.message);
        }
        const graphqlResolvers = await resolvers({
          ...ctx,
          ...{
            params
          }
        });
        const context2 = {};
        const query = params.query;
        let parsedQuery;
        try {
          parsedQuery = parse(query);
        } catch (error) {
          return response_default.error(400 /* BAD_REQUEST */, error.message);
        }
        const validationErrors = validate(graphqlSchema, parsedQuery);
        if (validationErrors.length) {
          return response_default.error(
            400 /* BAD_REQUEST */,
            validationErrors.map((err) => err.message).join(", ")
          );
        }
        if (disableIntrospection) {
          const isIntrospectionQuery = parsedQuery.definitions.some(
            (definition) => definition.selectionSet.selections.some(
              (selection) => selection.name.value.startsWith("__")
            )
          );
          if (isIntrospectionQuery) {
            return response_default.error(
              400 /* BAD_REQUEST */,
              "Introspection is disabled for security reasons."
            );
          }
        }
        const variables = typeof params.variables === "string" ? JSON.parse(params.variables) : params.variables;
        return response_default.success(
          await graphql({
            schema: graphqlSchema,
            source: query,
            rootValue: graphqlResolvers,
            contextValue: context2,
            variableValues: variables,
            operationName: params.operationName
          })
        );
      }
    );
  }
};
__name(_GraphQlAction, "GraphQlAction");
var GraphQlAction = _GraphQlAction;
var graphql_action_default = GraphQlAction;

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

// src/integration/bearer-token/index.ts
var _BearerToken = class _BearerToken {
  /**
   * Extracts the Bearer token from OpenWhisk action parameters.
   * Looks for the authorization header in __ow_headers and extracts the token value
   * after the "Bearer " prefix.
   *
   * @param params - OpenWhisk action input parameters containing headers
   * @returns The Bearer token string if found, undefined otherwise
   *
   * @example
   * const params = {
   *   __ow_headers: {
   *     authorization: 'Bearer abc123token'
   *   }
   * };
   * const token = BearerToken.extract(params); // returns 'abc123token'
   */
  static extract(params) {
    if (params.__ow_headers?.authorization?.startsWith("Bearer ")) {
      return params.__ow_headers.authorization.substring("Bearer ".length);
    }
    return void 0;
  }
};
__name(_BearerToken, "BearerToken");
var BearerToken = _BearerToken;
var bearer_token_default = BearerToken;

// src/integration/rest-client/index.ts
import fetch from "node-fetch";
var _RestClient = class _RestClient {
  /**
   * A generic method to make GET rest call
   *
   * @param endpoint
   * @param headers
   * @returns {Promise<any>}
   */
  async get(endpoint, headers = {}) {
    return await this.apiCall(endpoint, "GET", headers);
  }
  /**
   * A generic method to make POST rest call
   *
   * @param endpoint
   * @param headers
   * @param payload
   * @returns {Promise<any>}
   */
  async post(endpoint, headers = {}, payload = null) {
    return await this.apiCall(endpoint, "POST", headers, payload);
  }
  /**
   * A generic method to make PUT rest call
   *
   * @param endpoint
   * @param headers
   * @param payload
   * @returns {Promise<any>}
   */
  async put(endpoint, headers = {}, payload = null) {
    return await this.apiCall(endpoint, "PUT", headers, payload);
  }
  /**
   * A generic method to make DELETE rest call
   *
   * @param endpoint
   * @param headers
   * @returns {Promise<any>}
   */
  async delete(endpoint, headers = {}) {
    return await this.apiCall(endpoint, "DELETE", headers);
  }
  /**
   * A generic method to make rest call
   *
   * @param endpoint
   * @param method
   * @param headers
   * @param payload
   * @returns {Promise<any>}
   */
  async apiCall(endpoint, method = "POST", headers = {}, payload = null) {
    let options = {
      method,
      headers
    };
    if (payload !== null) {
      options = {
        ...options,
        body: JSON.stringify(payload),
        headers: {
          ...headers,
          "Content-Type": "application/json"
        }
      };
    }
    const response = await fetch(endpoint, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    if (response.status === 204 || response.headers?.get("content-length") === "0") {
      return null;
    }
    if (typeof response.json === "function") {
      const contentType = response.headers?.get("content-type");
      if (!contentType || contentType.includes("application/json") || contentType.includes("application/hal+json")) {
        return await response.json();
      }
    }
    if (typeof response.text === "function") {
      const text = await response.text();
      return text;
    }
    return null;
  }
};
__name(_RestClient, "RestClient");
var RestClient = _RestClient;
var rest_client_default = RestClient;

// src/commerce/adobe-auth/index.ts
import { context, getToken } from "@adobe/aio-lib-ims";
var _AdobeAuth = class _AdobeAuth {
  /**
   * Retrieves an authentication token from Adobe IMS
   *
   * @param clientId - The client ID for the Adobe IMS integration
   * @param clientSecret - The client secret for the Adobe IMS integration
   * @param technicalAccountId - The technical account ID for the Adobe IMS integration
   * @param technicalAccountEmail - The technical account email for the Adobe IMS integration
   * @param imsOrgId - The IMS organization ID
   * @param scopes - Array of permission scopes to request for the token
   * @param currentContext - The context name for storing the configuration (defaults to 'onboarding-config')
   * @returns Promise<string> - A promise that resolves to the authentication token
   *
   * @example
   * const token = await AdobeAuth.getToken(
   *   'your-client-id',
   *   'your-client-secret',
   *   'your-technical-account-id',
   *   'your-technical-account-email',
   *   'your-ims-org-id',
   *   ['AdobeID', 'openid', 'adobeio_api']
   * );
   */
  static async getToken(clientId, clientSecret, technicalAccountId, technicalAccountEmail, imsOrgId, scopes, currentContext = "onboarding-config") {
    const config = {
      client_id: clientId,
      client_secrets: [clientSecret],
      technical_account_id: technicalAccountId,
      technical_account_email: technicalAccountEmail,
      ims_org_id: imsOrgId,
      scopes
    };
    await context.setCurrent(currentContext);
    await context.set(currentContext, config);
    return await getToken();
  }
};
__name(_AdobeAuth, "AdobeAuth");
var AdobeAuth = _AdobeAuth;
var adobe_auth_default = AdobeAuth;

// src/commerce/adobe-commerce-client/index.ts
import { Core as Core4 } from "@adobe/aio-sdk";
import got from "got";
var _AdobeCommerceClient = class _AdobeCommerceClient {
  /**
   * @param baseUrl
   * @param connection
   * @param logger
   */
  constructor(baseUrl, connection, logger = null) {
    if (!baseUrl) {
      throw new Error("Commerce URL must be provided");
    }
    this.baseUrl = baseUrl;
    this.connection = connection;
    if (logger === null) {
      logger = Core4.Logger("adobe-commerce-client", {
        level: "debug"
      });
    }
    this.logger = logger;
  }
  /**
   * @param endpoint
   * @param headers
   */
  async get(endpoint, headers = {}) {
    return await this.apiCall(endpoint, "GET", headers);
  }
  /**
   * @param endpoint
   * @param headers
   * @param payload
   */
  async post(endpoint, headers = {}, payload = null) {
    return await this.apiCall(endpoint, "POST", headers, payload);
  }
  /**
   * @param endpoint
   * @param headers
   * @param payload
   */
  async put(endpoint, headers = {}, payload = null) {
    return await this.apiCall(endpoint, "PUT", headers, payload);
  }
  /**
   * @param endpoint
   * @param headers
   */
  async delete(endpoint, headers = {}) {
    return await this.apiCall(endpoint, "DELETE", headers);
  }
  /**
   * @param endpoint
   * @param method
   * @param headers
   * @param payload
   * @private
   */
  async apiCall(endpoint, method, headers, payload = null) {
    const commerceGot = await this.getHttpClient();
    commerceGot.extend({
      headers
    });
    const wrapper = /* @__PURE__ */ __name(async (callable) => {
      try {
        const message = await callable();
        return { success: true, message };
      } catch (e) {
        if (e.code === "ERR_GOT_REQUEST_ERROR") {
          this.logger.error("Error while calling Commerce API", e);
          return {
            success: false,
            statusCode: 500 /* INTERNAL_ERROR */,
            message: `Unexpected error, check logs. Original error "${e.message}"`
          };
        }
        return {
          success: false,
          statusCode: e.response?.statusCode || 500 /* INTERNAL_ERROR */,
          message: e.message,
          body: e.responseBody
        };
      }
    }, "wrapper");
    let options = {
      method
    };
    if (payload !== null) {
      options = {
        ...options,
        json: payload
      };
    }
    return await wrapper(() => commerceGot(endpoint, options).json());
  }
  /**
   * @private
   */
  async getHttpClient() {
    const commerceGot = got.extend({
      http2: true,
      responseType: "json",
      prefixUrl: this.baseUrl,
      headers: {
        "Content-Type": "application/json"
      },
      hooks: {
        beforeRequest: [
          (options) => this.logger.debug(`Request [${options.method}] ${options.url}`)
        ],
        beforeRetry: [
          (options, error, retryCount) => this.logger.debug(
            `Retrying request [${options.method}] ${options.url} - count: ${retryCount} - error: ${error?.code} - ${error?.message}`
          )
        ],
        beforeError: [
          (error) => {
            const { response } = error;
            if (response?.body) {
              error.responseBody = response.body;
            }
            return error;
          }
        ],
        afterResponse: [
          (response) => {
            this.logger.debug(
              `Response [${response.request.options.method}] ${response.request.options.url} - ${response.statusCode} ${response.statusMessage}`
            );
            return response;
          }
        ]
      }
    });
    return await this.connection.extend(commerceGot);
  }
};
__name(_AdobeCommerceClient, "AdobeCommerceClient");
var AdobeCommerceClient = _AdobeCommerceClient;
var adobe_commerce_client_default = AdobeCommerceClient;

// src/commerce/adobe-commerce-client/basic-auth-connection/index.ts
import { Core as Core6 } from "@adobe/aio-sdk";

// src/commerce/adobe-commerce-client/basic-auth-connection/generate-basic-auth-token/index.ts
import { State, Core as Core5 } from "@adobe/aio-sdk";
var _GenerateBasicAuthToken = class _GenerateBasicAuthToken {
  /**
   * @param baseUrl
   * @param username
   * @param password
   * @param logger
   */
  constructor(baseUrl, username, password, logger = null) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.password = password;
    this.key = "adobe_commerce_basic_auth_token";
    if (logger === null) {
      logger = Core5.Logger("adobe-commerce-client", {
        level: "debug"
      });
    }
    this.logger = logger;
  }
  /**
   * @return string | null
   */
  async execute() {
    const currentValue = await this.getValue();
    if (currentValue !== null) {
      return currentValue;
    }
    let result = {
      token: null,
      expire_in: 3600
    };
    const response = await this.getCommerceToken();
    if (response !== null) {
      result = response;
    }
    this.logger.debug(`Token: ${JSON.stringify(result)}`);
    if (result.token !== null) {
      await this.setValue(result);
    }
    return result.token;
  }
  /**
   * @return TokenResult | null
   */
  async getCommerceToken() {
    const endpoint = this.createEndpoint("rest/V1/integration/admin/token");
    this.logger.debug(`Endpoint: ${endpoint}`);
    try {
      const restClient = new rest_client_default();
      const response = await restClient.post(
        endpoint,
        {
          "Content-Type": "application/json"
        },
        {
          username: this.username,
          password: this.password
        }
      );
      this.logger.debug(`Raw response type: ${typeof response}`);
      this.logger.debug(`Raw response: ${JSON.stringify(response)}`);
      if (response !== null && response !== void 0) {
        let tokenValue;
        if (typeof response === "string") {
          tokenValue = response;
        } else if (typeof response === "object" && response.token) {
          tokenValue = response.token;
        } else {
          try {
            tokenValue = response.toString();
            this.logger.debug(`Converted response to string: ${tokenValue?.substring(0, 10)}...`);
          } catch {
            this.logger.error(`Unexpected response format: ${JSON.stringify(response)}`);
            return null;
          }
        }
        this.logger.debug(`Extracted token: ${tokenValue?.substring(0, 10)}...`);
        return {
          token: tokenValue,
          expire_in: 3600
          // Adobe Commerce tokens typically expire in 1 hour
        };
      }
      this.logger.error("Received null or undefined response from Commerce API");
      return null;
    } catch (error) {
      this.logger.error(`Failed to get Commerce token: ${error.message}`);
      this.logger.debug(`Full error: ${JSON.stringify(error)}`);
      return null;
    }
  }
  /**
   * @param endpoint
   * @return string
   */
  createEndpoint(endpoint) {
    const normalizedBaseUrl = this.baseUrl.replace(/\/+$/, "");
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${normalizedBaseUrl}${normalizedEndpoint}`;
  }
  /**
   * @param result
   * @return boolean
   */
  async setValue(result) {
    try {
      const state = await this.getState();
      if (state === null) {
        return true;
      }
      await state.put(this.key, result.token, { ttl: result.expire_in });
      return true;
    } catch (error) {
      this.logger.debug("Failed to cache token, continuing without caching");
      return true;
    }
  }
  /**
   * @return string | null
   */
  async getValue() {
    try {
      const state = await this.getState();
      if (state === null) {
        return null;
      }
      const value = await state.get(this.key);
      if (value !== void 0) {
        return value.value;
      }
    } catch (error) {
      this.logger.debug("State API not available, skipping cache lookup");
    }
    return null;
  }
  /**
   * @return any
   */
  async getState() {
    if (this.state === void 0) {
      try {
        this.state = await State.init();
      } catch (error) {
        this.logger.debug("State API initialization failed, running without caching");
        this.state = null;
      }
    }
    return this.state;
  }
};
__name(_GenerateBasicAuthToken, "GenerateBasicAuthToken");
var GenerateBasicAuthToken = _GenerateBasicAuthToken;
var generate_basic_auth_token_default = GenerateBasicAuthToken;

// src/commerce/adobe-commerce-client/basic-auth-connection/index.ts
var _BasicAuthConnection = class _BasicAuthConnection {
  /**
   * @param baseUrl
   * @param username
   * @param password
   * @param logger
   */
  constructor(baseUrl, username, password, logger = null) {
    this.baseUrl = baseUrl;
    this.username = username;
    this.password = password;
    if (logger === null) {
      logger = Core6.Logger("adobe-commerce-client", {
        level: "debug"
      });
    }
    this.logger = logger;
  }
  /**
   * @param commerceGot
   */
  async extend(commerceGot) {
    this.logger.debug("Using Commerce client with integration options");
    const generateToken = new generate_basic_auth_token_default(
      this.baseUrl,
      this.username,
      this.password,
      this.logger
    );
    const token = await generateToken.execute();
    return commerceGot.extend({
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
};
__name(_BasicAuthConnection, "BasicAuthConnection");
var BasicAuthConnection = _BasicAuthConnection;
var basic_auth_connection_default = BasicAuthConnection;

// src/commerce/adobe-commerce-client/oauth1a-connection/index.ts
import { Core as Core7 } from "@adobe/aio-sdk";
import Oauth1a from "oauth-1.0a";
import * as crypto2 from "crypto";
var _Oauth1aConnection = class _Oauth1aConnection {
  /**
   * @param consumerKey
   * @param consumerSecret
   * @param accessToken
   * @param accessTokenSecret
   * @param logger
   */
  constructor(consumerKey, consumerSecret, accessToken, accessTokenSecret, logger = null) {
    this.consumerKey = consumerKey;
    this.consumerSecret = consumerSecret;
    this.accessToken = accessToken;
    this.accessTokenSecret = accessTokenSecret;
    if (logger === null) {
      logger = Core7.Logger("adobe-commerce-client", {
        level: "debug"
      });
    }
    this.logger = logger;
  }
  /**
   * @param commerceGot
   */
  async extend(commerceGot) {
    this.logger.debug("Using Commerce client with integration options");
    const headers = this.headersProvider();
    return commerceGot.extend({
      handlers: [
        (options, next) => {
          options.headers = {
            ...options.headers,
            ...headers(options.url.toString(), options.method)
          };
          return next(options);
        }
      ]
    });
  }
  /**
   * return () => { }
   */
  headersProvider() {
    const oauth = new Oauth1a({
      consumer: {
        key: this.consumerKey,
        secret: this.consumerSecret
      },
      signature_method: "HMAC-SHA256",
      hash_function: /* @__PURE__ */ __name((baseString, key) => crypto2.createHmac("sha256", key).update(baseString).digest("base64"), "hash_function")
    });
    const oauthToken = {
      key: this.accessToken,
      secret: this.accessTokenSecret
    };
    return (url, method) => oauth.toHeader(oauth.authorize({ url, method }, oauthToken));
  }
};
__name(_Oauth1aConnection, "Oauth1aConnection");
var Oauth1aConnection = _Oauth1aConnection;
var oauth1a_connection_default = Oauth1aConnection;

// src/commerce/adobe-commerce-client/ims-connection/index.ts
import { Core as Core8 } from "@adobe/aio-sdk";
var _ImsConnection = class _ImsConnection {
  /**
   * @param clientId
   * @param clientSecret
   * @param technicalAccountId
   * @param technicalAccountEmail
   * @param imsOrgId
   * @param scopes
   * @param logger
   * @param currentContext
   */
  constructor(clientId, clientSecret, technicalAccountId, technicalAccountEmail, imsOrgId, scopes, logger = null, currentContext = "adobe-commerce-client") {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.technicalAccountId = technicalAccountId;
    this.technicalAccountEmail = technicalAccountEmail;
    this.imsOrgId = imsOrgId;
    this.scopes = scopes;
    this.currentContext = currentContext;
    if (logger === null) {
      logger = Core8.Logger(currentContext, {
        level: "debug"
      });
    }
    this.logger = logger;
  }
  /**
   * @param commerceGot
   */
  async extend(commerceGot) {
    this.logger.debug("Using Commerce client with IMS authentication");
    const token = await adobe_auth_default.getToken(
      this.clientId,
      this.clientSecret,
      this.technicalAccountId,
      this.technicalAccountEmail,
      this.imsOrgId,
      this.scopes,
      this.currentContext
    );
    this.logger.debug(`IMS token being extended to header: ${token}`);
    return commerceGot.extend({
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }
};
__name(_ImsConnection, "ImsConnection");
var ImsConnection = _ImsConnection;
var ims_connection_default = ImsConnection;

// src/io-events/types.ts
var IoEventsGlobals = {
  BASE_URL: "https://api.adobe.io",
  STATUS_CODES: {
    OK: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    REQUEST_TIMEOUT: 408,
    TIMEOUT: 408,
    CONFLICT: 409,
    INTERNAL_SERVER_ERROR: 500
  },
  HEADERS: {
    CONFLICTING_ID: "x-conflicting-id"
  }
};
var _IOEventsApiError = class _IOEventsApiError extends Error {
  constructor(message, statusCode, errorCode, details) {
    super(message);
    this.name = "IOEventsApiError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
  }
};
__name(_IOEventsApiError, "IOEventsApiError");
var IOEventsApiError = _IOEventsApiError;

// src/io-events/provider/list/index.ts
var _List = class _List {
  /**
   * Constructor for List providers service
   *
   * @param clientId - Client ID from Adobe Developer Console (x-api-key header)
   * @param consumerId - Project Organization ID from Adobe Developer Console
   * @param projectId - Project ID from Adobe Developer Console
   * @param workspaceId - Workspace ID from Adobe Developer Console
   * @param accessToken - IMS token for authentication (Bearer token)
   */
  constructor(clientId, consumerId, projectId, workspaceId, accessToken) {
    this.clientId = clientId;
    this.consumerId = consumerId;
    this.projectId = projectId;
    this.workspaceId = workspaceId;
    this.accessToken = accessToken;
    this.endpoint = IoEventsGlobals.BASE_URL;
    if (!clientId?.trim()) {
      throw new Error("clientId is required and cannot be empty");
    }
    if (!consumerId?.trim()) {
      throw new Error("consumerId is required and cannot be empty");
    }
    if (!projectId?.trim()) {
      throw new Error("projectId is required and cannot be empty");
    }
    if (!workspaceId?.trim()) {
      throw new Error("workspaceId is required and cannot be empty");
    }
    if (!accessToken?.trim()) {
      throw new Error("accessToken is required and cannot be empty");
    }
    this.restClient = new rest_client_default();
  }
  /**
   * Execute the list providers API call with automatic pagination
   *
   * This method automatically handles pagination by following the `_links.next.href` from the HAL+JSON response.
   * It makes recursive API calls to fetch all pages and returns a complete array containing all providers
   * across all pages.
   *
   * @param queryParams - Optional query parameters for filtering providers
   * @param queryParams.providerMetadataId - Filter by provider metadata id
   * @param queryParams.instanceId - Filter by instance id
   * @param queryParams.providerMetadataIds - List of provider metadata ids to filter (mutually exclusive with providerMetadataId)
   * @param queryParams.eventmetadata - Boolean to fetch provider's event metadata (default: false)
   * @returns Promise<Provider[]> - Complete array of all providers across all pages
   * @throws IOEventsApiError - When API call fails with specific error details
   */
  async execute(queryParams = {}) {
    try {
      if (queryParams.providerMetadataId && queryParams.providerMetadataIds) {
        throw new Error("Cannot specify both providerMetadataId and providerMetadataIds");
      }
      const url = `${this.endpoint}/events/${this.consumerId}/providers`;
      const queryString = this.buildQueryString(queryParams);
      const fullUrl = queryString ? `${url}?${queryString}` : url;
      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
        "x-api-key": this.clientId,
        Accept: "application/hal+json"
      };
      return await this.fetchAllPages(fullUrl, headers);
    } catch (error) {
      this.handleError(error);
    }
  }
  /**
   * Recursively fetches all pages of providers using pagination links
   *
   * @param url - The URL to fetch (either initial URL or next page URL)
   * @param headers - Headers for the API request
   * @param accumulatedResults - Array to accumulate results across pages
   * @returns Promise<Provider[]> - Complete array of all providers
   * @private
   */
  async fetchAllPages(url, headers, accumulatedResults = []) {
    const response = await this.restClient.get(url, headers);
    if (response === null || response === void 0) {
      throw new Error("Invalid response format: Expected object");
    }
    if (typeof response !== "object") {
      throw new Error("Invalid response format: Expected object");
    }
    const providers = response._embedded?.providers;
    if (providers !== void 0 && !Array.isArray(providers)) {
      throw new Error("Invalid response format: providers should be an array");
    }
    const currentPageResults = providers || [];
    const allResults = [...accumulatedResults, ...currentPageResults];
    const nextPageUrl = response._links?.next?.href;
    if (nextPageUrl) {
      return await this.fetchAllPages(nextPageUrl, headers, allResults);
    }
    return allResults;
  }
  /**
   * Handle and transform errors from the API call
   * @private
   * @param error - The caught error
   * @throws IOEventsApiError - Transformed error with proper details
   */
  handleError(error) {
    if (error instanceof Error && error.message.includes("HTTP error! status:")) {
      const statusCode = this.extractStatusCodeFromMessage(error.message);
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }
    if (error.response?.body) {
      const errorBody = error.response.body;
      const statusCode = error.response.statusCode || IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
      const message = errorBody.message || errorBody.error || this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(message, statusCode, errorBody.error_code, errorBody.details);
    }
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      throw new IOEventsApiError(
        "Network error: Unable to connect to Adobe I/O Events API. Please check your internet connection.",
        0,
        "NETWORK_ERROR"
      );
    }
    if (error.code === "ETIMEDOUT") {
      throw new IOEventsApiError(
        "Request timeout: Adobe I/O Events API did not respond in time.",
        0,
        "TIMEOUT_ERROR"
      );
    }
    if (error.message?.includes("JSON") || error.name === "SyntaxError") {
      throw new IOEventsApiError(
        "Invalid response format: Unable to parse API response.",
        0,
        "PARSE_ERROR"
      );
    }
    if (error.message?.includes("Cannot specify both") || error.message?.includes("Invalid response format")) {
      throw new IOEventsApiError(
        error.message,
        IoEventsGlobals.STATUS_CODES.BAD_REQUEST,
        "VALIDATION_ERROR"
      );
    }
    throw new IOEventsApiError(
      `Failed to list providers: ${error.message || "Unknown error occurred"}`,
      IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
      "UNKNOWN_ERROR"
    );
  }
  /**
   * Extracts the status code from RestClient error message
   *
   * @param errorMessage - Error message like "HTTP error! status: 404"
   * @returns The HTTP status code
   */
  extractStatusCodeFromMessage(errorMessage) {
    const match = errorMessage.match(/HTTP error! status:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
  /**
   * Get user-friendly error message based on HTTP status code
   * @private
   * @param statusCode - HTTP status code
   * @returns string - User-friendly error message
   */
  getErrorMessageForStatus(statusCode) {
    switch (statusCode) {
      case IoEventsGlobals.STATUS_CODES.UNAUTHORIZED:
        return "Unauthorized: Invalid or expired access token";
      case IoEventsGlobals.STATUS_CODES.FORBIDDEN:
        return "Forbidden: Insufficient permissions or invalid API key";
      case IoEventsGlobals.STATUS_CODES.NOT_FOUND:
        return "Not Found: Provider associated with the consumerOrgId, providerMetadataId or instanceID does not exist";
      case IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR:
        return "Internal Server Error: Adobe I/O Events service is temporarily unavailable";
      default:
        return `API Error: HTTP ${statusCode}`;
    }
  }
  /**
   * Build query string from parameters
   * @private
   */
  buildQueryString(params) {
    const queryParts = [];
    if (params.providerMetadataId) {
      queryParts.push(`providerMetadataId=${encodeURIComponent(params.providerMetadataId)}`);
    }
    if (params.instanceId) {
      queryParts.push(`instanceId=${encodeURIComponent(params.instanceId)}`);
    }
    if (params.providerMetadataIds && Array.isArray(params.providerMetadataIds)) {
      params.providerMetadataIds.forEach((id) => {
        queryParts.push(`providerMetadataIds=${encodeURIComponent(id)}`);
      });
    }
    if (typeof params.eventmetadata === "boolean") {
      queryParts.push(`eventmetadata=${params.eventmetadata}`);
    }
    return queryParts.join("&");
  }
};
__name(_List, "List");
var List = _List;
var list_default = List;

// src/io-events/provider/get/index.ts
var _Get = class _Get {
  /**
   * Constructor for Get provider service
   *
   * @param clientId - Client ID from Adobe Developer Console (x-api-key header)
   * @param consumerId - Project Organization ID from Adobe Developer Console
   * @param projectId - Project ID from Adobe Developer Console
   * @param workspaceId - Workspace ID from Adobe Developer Console
   * @param accessToken - IMS token for authentication (Bearer token)
   */
  constructor(clientId, consumerId, projectId, workspaceId, accessToken) {
    this.clientId = clientId;
    this.consumerId = consumerId;
    this.projectId = projectId;
    this.workspaceId = workspaceId;
    this.accessToken = accessToken;
    this.endpoint = IoEventsGlobals.BASE_URL;
    if (!clientId?.trim()) {
      throw new Error("clientId is required and cannot be empty");
    }
    if (!consumerId?.trim()) {
      throw new Error("consumerId is required and cannot be empty");
    }
    if (!projectId?.trim()) {
      throw new Error("projectId is required and cannot be empty");
    }
    if (!workspaceId?.trim()) {
      throw new Error("workspaceId is required and cannot be empty");
    }
    if (!accessToken?.trim()) {
      throw new Error("accessToken is required and cannot be empty");
    }
    this.restClient = new rest_client_default();
  }
  /**
   * Execute the get provider by ID API call
   *
   * @param providerId - The ID of the provider to retrieve
   * @param queryParams - Optional query parameters
   * @param queryParams.eventmetadata - Boolean to fetch provider's event metadata (default: false)
   * @returns Promise<Provider> - The provider details
   * @throws IOEventsApiError - When API call fails with specific error details
   *
   * @example
   * ```typescript
   * // Get basic provider details
   * const provider = await getService.execute('provider-123');
   *
   * // Get provider details with event metadata
   * const providerWithMetadata = await getService.execute('provider-123', {
   *   eventmetadata: true
   * });
   * ```
   */
  async execute(providerId, queryParams = {}) {
    try {
      if (!providerId?.trim()) {
        throw new Error("Provider ID is required and cannot be empty");
      }
      const url = `${this.endpoint}/events/providers/${encodeURIComponent(providerId)}`;
      const queryString = this.buildQueryString(queryParams);
      const fullUrl = queryString ? `${url}?${queryString}` : url;
      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
        "x-api-key": this.clientId,
        Accept: "application/hal+json"
      };
      const response = await this.restClient.get(fullUrl, headers);
      if (response === null || response === void 0) {
        throw new Error("Invalid response format: Expected provider object");
      }
      if (typeof response !== "object") {
        throw new Error("Invalid response format: Expected provider object");
      }
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }
  /**
   * Build query string from parameters
   */
  buildQueryString(queryParams) {
    const params = new URLSearchParams();
    if (queryParams.eventmetadata !== void 0) {
      params.append("eventmetadata", String(queryParams.eventmetadata));
    }
    return params.toString();
  }
  /**
   * Handle and transform errors into IOEventsApiError
   */
  handleError(error) {
    if (error instanceof Error && error.message.includes("HTTP error! status:")) {
      const statusCode = this.extractStatusCodeFromMessage(error.message);
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }
    if (error.response) {
      const status = this.extractStatusCode(error);
      const errorMessage = this.getErrorMessageForStatus(status);
      throw new IOEventsApiError(errorMessage, status, "API_ERROR");
    }
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      throw new IOEventsApiError(
        "Network error: Unable to connect to Adobe I/O Events API",
        IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
        "NETWORK_ERROR"
      );
    }
    if (error.code === "ETIMEDOUT") {
      throw new IOEventsApiError(
        "Request timeout: Adobe I/O Events API did not respond in time",
        IoEventsGlobals.STATUS_CODES.TIMEOUT,
        "TIMEOUT_ERROR"
      );
    }
    if (error.message?.includes("JSON")) {
      throw new IOEventsApiError(
        "Invalid response format from Adobe I/O Events API",
        IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
        "PARSE_ERROR"
      );
    }
    if (error.message?.includes("Provider ID is required") || error.message?.includes("Invalid response format")) {
      throw new IOEventsApiError(
        error.message,
        IoEventsGlobals.STATUS_CODES.BAD_REQUEST,
        "VALIDATION_ERROR"
      );
    }
    throw new IOEventsApiError(
      `Unexpected error: ${error.message || "Unknown error occurred"}`,
      IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
      "UNKNOWN_ERROR"
    );
  }
  /**
   * Extract status code from error response
   */
  extractStatusCode(error) {
    return error.response?.status || error.status || IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
  /**
   * Extracts the status code from RestClient error message
   *
   * @param errorMessage - Error message like "HTTP error! status: 404"
   * @returns The HTTP status code
   */
  extractStatusCodeFromMessage(errorMessage) {
    const match = errorMessage.match(/HTTP error! status:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
  /**
   * Get specific error message based on HTTP status code
   */
  getErrorMessageForStatus(status) {
    switch (status) {
      case IoEventsGlobals.STATUS_CODES.UNAUTHORIZED:
        return "Unauthorized: Invalid or expired access token";
      case IoEventsGlobals.STATUS_CODES.FORBIDDEN:
        return "Forbidden: Insufficient permissions to access this provider";
      case IoEventsGlobals.STATUS_CODES.NOT_FOUND:
        return "Provider ID does not exist";
      case IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR:
        return "Internal server error occurred while fetching provider";
      default:
        return `HTTP ${status}: Provider request failed`;
    }
  }
};
__name(_Get, "Get");
var Get = _Get;
var get_default = Get;

// src/io-events/provider/create/index.ts
var _Create = class _Create {
  /**
   * Constructor for Create provider service
   *
   * @param clientId - Client ID from Adobe Developer Console (x-api-key header)
   * @param consumerId - Project Organization ID from Adobe Developer Console
   * @param projectId - Project ID from Adobe Developer Console
   * @param workspaceId - Workspace ID from Adobe Developer Console
   * @param accessToken - IMS token for authentication (Bearer token)
   */
  constructor(clientId, consumerId, projectId, workspaceId, accessToken) {
    this.clientId = clientId;
    this.consumerId = consumerId;
    this.projectId = projectId;
    this.workspaceId = workspaceId;
    this.accessToken = accessToken;
    this.endpoint = IoEventsGlobals.BASE_URL;
    if (!clientId?.trim()) {
      throw new Error("clientId is required and cannot be empty");
    }
    if (!consumerId?.trim()) {
      throw new Error("consumerId is required and cannot be empty");
    }
    if (!projectId?.trim()) {
      throw new Error("projectId is required and cannot be empty");
    }
    if (!workspaceId?.trim()) {
      throw new Error("workspaceId is required and cannot be empty");
    }
    if (!accessToken?.trim()) {
      throw new Error("accessToken is required and cannot be empty");
    }
    this.restClient = new rest_client_default();
  }
  /**
   * Execute the create provider API call
   *
   * @param providerData - Provider input data
   * @returns Promise<Provider> - The created provider
   * @throws IOEventsApiError - When API call fails with specific error details
   */
  async execute(providerData) {
    try {
      if (!providerData) {
        throw new Error("providerData is required");
      }
      if (!providerData.label?.trim()) {
        throw new Error("label is required in providerData");
      }
      const url = `${this.endpoint}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/providers`;
      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
        "x-api-key": this.clientId,
        Accept: "application/hal+json",
        "Content-Type": "application/json"
      };
      const response = await this.restClient.post(url, headers, providerData);
      if (response === null || response === void 0) {
        throw new Error("Invalid response format: Expected provider object");
      }
      if (typeof response !== "object") {
        throw new Error("Invalid response format: Expected provider object");
      }
      if (!response.id) {
        throw new Error("Invalid response format: Missing provider id");
      }
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }
  /**
   * Handle and transform errors from the API call
   * @private
   * @param error - The caught error
   * @throws IOEventsApiError - Transformed error with proper details
   */
  handleError(error) {
    if (error instanceof Error && error.message.includes("HTTP error! status:")) {
      const statusCode = this.extractStatusCodeFromMessage(error.message);
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }
    if (error.response?.body) {
      const errorBody = error.response.body;
      const statusCode = error.response.statusCode || IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
      const message = errorBody.message || errorBody.error || this.getErrorMessageForStatus(statusCode);
      if (statusCode === IoEventsGlobals.STATUS_CODES.CONFLICT && error.response.headers?.[IoEventsGlobals.HEADERS.CONFLICTING_ID]) {
        const conflictingId = error.response.headers[IoEventsGlobals.HEADERS.CONFLICTING_ID];
        throw new IOEventsApiError(
          `Provider already exists with conflicting ID: ${conflictingId}`,
          statusCode,
          "CONFLICT_ERROR",
          `Conflicting provider ID: ${conflictingId}`
        );
      }
      throw new IOEventsApiError(message, statusCode, errorBody.error_code, errorBody.details);
    }
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      throw new IOEventsApiError(
        "Network error: Unable to connect to Adobe I/O Events API",
        IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
        "NETWORK_ERROR"
      );
    }
    if (error.code === "ETIMEDOUT") {
      throw new IOEventsApiError(
        "Request timeout: Adobe I/O Events API did not respond in time",
        IoEventsGlobals.STATUS_CODES.TIMEOUT,
        "TIMEOUT_ERROR"
      );
    }
    if (error.message?.includes("JSON")) {
      throw new IOEventsApiError(
        "Invalid response format from Adobe I/O Events API",
        IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
        "PARSE_ERROR"
      );
    }
    if (error.message?.includes("is required") || error.message?.includes("Invalid response format")) {
      throw new IOEventsApiError(
        error.message,
        IoEventsGlobals.STATUS_CODES.BAD_REQUEST,
        "VALIDATION_ERROR"
      );
    }
    throw new IOEventsApiError(
      `Failed to create provider: ${error.message || "Unknown error occurred"}`,
      IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
      "UNKNOWN_ERROR"
    );
  }
  /**
   * Extracts the status code from RestClient error message
   *
   * @param errorMessage - Error message like "HTTP error! status: 404"
   * @returns The HTTP status code
   */
  extractStatusCodeFromMessage(errorMessage) {
    const match = errorMessage.match(/HTTP error! status:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
  /**
   * Get specific error message based on HTTP status code
   */
  getErrorMessageForStatus(status) {
    switch (status) {
      case IoEventsGlobals.STATUS_CODES.UNAUTHORIZED:
        return "Unauthorized: Invalid or expired access token";
      case IoEventsGlobals.STATUS_CODES.FORBIDDEN:
        return "Forbidden: Insufficient permissions or invalid scopes, or attempt to create non multi-instance provider";
      case IoEventsGlobals.STATUS_CODES.NOT_FOUND:
        return "Provider metadata provided in the input model does not exist";
      case IoEventsGlobals.STATUS_CODES.CONFLICT:
        return "The event provider already exists";
      case IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR:
        return "Internal server error occurred while creating provider";
      default:
        return `HTTP ${status}: Provider creation failed`;
    }
  }
};
__name(_Create, "Create");
var Create = _Create;
var create_default = Create;

// src/io-events/provider/delete/index.ts
var _Delete = class _Delete {
  /**
   * Creates an instance of Delete service
   *
   * @param clientId - Client ID from Adobe Developer Console
   * @param consumerId - Project Organization ID
   * @param projectId - Project ID from Adobe Developer Console
   * @param workspaceId - Workspace ID from Adobe Developer Console
   * @param accessToken - IMS token for authentication
   */
  constructor(clientId, consumerId, projectId, workspaceId, accessToken) {
    this.clientId = clientId;
    this.consumerId = consumerId;
    this.projectId = projectId;
    this.workspaceId = workspaceId;
    this.accessToken = accessToken;
    this.endpoint = IoEventsGlobals.BASE_URL;
    if (!clientId?.trim()) {
      throw new Error("clientId is required and cannot be empty");
    }
    if (!consumerId?.trim()) {
      throw new Error("consumerId is required and cannot be empty");
    }
    if (!projectId?.trim()) {
      throw new Error("projectId is required and cannot be empty");
    }
    if (!workspaceId?.trim()) {
      throw new Error("workspaceId is required and cannot be empty");
    }
    if (!accessToken?.trim()) {
      throw new Error("accessToken is required and cannot be empty");
    }
    this.restClient = new rest_client_default();
  }
  /**
   * Delete a provider by ID
   *
   * @param providerId - The ID of the provider to delete
   * @returns Promise<void> - Resolves when provider is successfully deleted
   * @throws IOEventsApiError - When the API request fails
   */
  async execute(providerId) {
    try {
      if (!providerId?.trim()) {
        throw new Error("providerId is required and cannot be empty");
      }
      const url = `${this.endpoint}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/providers/${providerId}`;
      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
        "x-api-key": this.clientId,
        Accept: "application/hal+json",
        "Content-Type": "application/json"
      };
      await this.restClient.delete(url, headers);
    } catch (error) {
      this.handleError(error);
    }
  }
  /**
   * Handle and transform errors from the API call
   * @private
   * @param error - The caught error
   * @throws IOEventsApiError - Transformed error with proper details
   */
  handleError(error) {
    if (error instanceof Error && error.message.includes("HTTP error! status:")) {
      const statusCode = this.extractStatusCodeFromMessage(error.message);
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }
    if (error.response) {
      const status = this.extractStatusCode(error);
      const errorMessage = this.getErrorMessageForStatus(status);
      throw new IOEventsApiError(errorMessage, status, "API_ERROR");
    }
    if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
      throw new IOEventsApiError(
        "Network error: Unable to connect to Adobe I/O Events API",
        IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
        "NETWORK_ERROR"
      );
    }
    if (error.code === "ETIMEDOUT" || error.message?.includes("timeout")) {
      throw new IOEventsApiError(
        "Request timeout: Adobe I/O Events API did not respond in time",
        IoEventsGlobals.STATUS_CODES.TIMEOUT,
        "TIMEOUT_ERROR"
      );
    }
    if (error.message?.includes("JSON")) {
      throw new IOEventsApiError(
        "Invalid response format from Adobe I/O Events API",
        IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
        "PARSE_ERROR"
      );
    }
    if (error.message?.includes("required") || error.message?.includes("empty")) {
      throw new IOEventsApiError(
        `Validation error: ${error.message}`,
        IoEventsGlobals.STATUS_CODES.BAD_REQUEST,
        "VALIDATION_ERROR"
      );
    }
    if (error instanceof Error) {
      throw new IOEventsApiError(
        `Failed to delete provider: ${error.message}`,
        IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
        "UNKNOWN_ERROR"
      );
    }
    throw new IOEventsApiError(
      "Unexpected error: Unknown error occurred",
      IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
      "UNKNOWN_ERROR"
    );
  }
  /**
   * Extract status code from error response
   */
  extractStatusCode(error) {
    return error.response?.status || error.status || IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
  /**
   * Extracts the status code from RestClient error message
   *
   * @param errorMessage - Error message like "HTTP error! status: 404"
   * @returns The HTTP status code
   */
  extractStatusCodeFromMessage(errorMessage) {
    const match = errorMessage.match(/HTTP error! status:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
  /**
   * Get appropriate error message for HTTP status code
   */
  getErrorMessageForStatus(status) {
    switch (status) {
      case IoEventsGlobals.STATUS_CODES.UNAUTHORIZED:
        return "Unauthorized: Invalid or expired access token";
      case IoEventsGlobals.STATUS_CODES.FORBIDDEN:
        return "Forbidden: Insufficient permissions to delete provider";
      case IoEventsGlobals.STATUS_CODES.NOT_FOUND:
        return "Provider not found: The specified provider ID does not exist";
      case IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR:
        return "Internal server error occurred while deleting provider";
      default:
        return `HTTP ${status}: Provider deletion failed`;
    }
  }
};
__name(_Delete, "Delete");
var Delete = _Delete;

// src/io-events/provider/index.ts
var _ProviderManager = class _ProviderManager {
  /**
   * Constructor for Providers service
   *
   * @param clientId - Client ID from Adobe Developer Console (x-api-key header)
   * @param consumerId - Project Organization ID from Adobe Developer Console
   * @param projectId - Project ID from Adobe Developer Console
   * @param workspaceId - Workspace ID from Adobe Developer Console
   * @param accessToken - IMS token for authentication (Bearer token)
   */
  constructor(clientId, consumerId, projectId, workspaceId, accessToken) {
    this.clientId = clientId;
    this.consumerId = consumerId;
    this.projectId = projectId;
    this.workspaceId = workspaceId;
    this.accessToken = accessToken;
    this.listService = new list_default(clientId, consumerId, projectId, workspaceId, accessToken);
    this.getService = new get_default(clientId, consumerId, projectId, workspaceId, accessToken);
    this.createService = new create_default(clientId, consumerId, projectId, workspaceId, accessToken);
    this.deleteService = new Delete(clientId, consumerId, projectId, workspaceId, accessToken);
  }
  /**
   * List all event providers entitled to the provided organization ID
   *
   * @param queryParams - Optional query parameters for filtering providers
   * @param queryParams.providerMetadataId - Filter by provider metadata id
   * @param queryParams.instanceId - Filter by instance id
   * @param queryParams.providerMetadataIds - List of provider metadata ids to filter (mutually exclusive with providerMetadataId)
   * @param queryParams.eventmetadata - Boolean to fetch provider's event metadata (default: false)
   * @returns Promise<Provider[]> - Array of providers
   * @throws IOEventsApiError - When API call fails with specific error details
   *
   * @example
   * ```typescript
   * // List all providers
   * const providers = await providersService.list();
   *
   * // Filter by provider metadata ID
   * const customProviders = await providersService.list({
   *   providerMetadataId: '3rd_party_custom_events'
   * });
   *
   * // Include event metadata in response
   * const providersWithMetadata = await providersService.list({
   *   eventmetadata: true
   * });
   * ```
   */
  async list(queryParams = {}) {
    try {
      return await this.listService.execute(queryParams);
    } catch (error) {
      if (error instanceof IOEventsApiError) {
        throw error;
      }
      throw new IOEventsApiError(
        `Unexpected error in providers list: ${error instanceof Error ? error.message : "Unknown error"}`,
        500,
        "UNEXPECTED_ERROR"
      );
    }
  }
  /**
   * Get a specific event provider by its ID
   *
   * @param providerId - The ID of the provider to retrieve
   * @param queryParams - Optional query parameters
   * @param queryParams.eventmetadata - Boolean to fetch provider's event metadata (default: false)
   * @returns Promise<Provider> - The provider details
   * @throws IOEventsApiError - When API call fails with specific error details
   *
   * @example
   * ```typescript
   * // Get basic provider details
   * const provider = await providersService.get('provider-123');
   *
   * // Get provider details with event metadata
   * const providerWithMetadata = await providersService.get('provider-123', {
   *   eventmetadata: true
   * });
   * ```
   */
  async get(providerId, queryParams = {}) {
    try {
      return await this.getService.execute(providerId, queryParams);
    } catch (error) {
      if (error instanceof IOEventsApiError) {
        throw error;
      }
      throw new IOEventsApiError(
        `Unexpected error in providers get: ${error instanceof Error ? error.message : "Unknown error"}`,
        500,
        "UNEXPECTED_ERROR"
      );
    }
  }
  /**
   * Create a new event provider
   *
   * @param providerData - Provider input data
   * @param providerData.label - The label of this event provider (required)
   * @param providerData.description - Optional description for the provider
   * @param providerData.docs_url - Optional documentation URL for the provider
   * @param providerData.provider_metadata - Optional provider metadata ID (defaults to '3rd_party_custom_events')
   * @param providerData.instance_id - Optional technical instance ID
   * @param providerData.data_residency_region - Optional data residency region (defaults to 'va6')
   * @returns Promise<Provider> - The created provider
   * @throws IOEventsApiError - When API call fails with specific error details
   *
   * @example
   * ```typescript
   * // Create a basic provider
   * const provider = await providersService.create({
   *   label: 'My Event Provider'
   * });
   *
   * // Create a provider with custom details
   * const customProvider = await providersService.create({
   *   label: 'My Custom Provider',
   *   description: 'Provider for custom business events',
   *   provider_metadata: '3rd_party_custom_events',
   *   instance_id: 'production-instance'
   * });
   * ```
   */
  async create(providerData) {
    try {
      return await this.createService.execute(providerData);
    } catch (error) {
      if (error instanceof IOEventsApiError) {
        throw error;
      }
      throw new IOEventsApiError(
        `Unexpected error in providers create: ${error instanceof Error ? error.message : "Unknown error"}`,
        500,
        "UNEXPECTED_ERROR"
      );
    }
  }
  /**
   * Delete an event provider by ID
   *
   * @param providerId - The ID of the provider to delete
   * @returns Promise<void> - Resolves when provider is successfully deleted
   * @throws IOEventsApiError - When API call fails with specific error details
   *
   * @example
   * ```typescript
   * // Delete a provider by ID
   * await providersService.delete('provider-123');
   * console.log('Provider deleted successfully');
   * ```
   */
  async delete(providerId) {
    try {
      return await this.deleteService.execute(providerId);
    } catch (error) {
      if (error instanceof IOEventsApiError) {
        throw error;
      }
      throw new IOEventsApiError(
        `Unexpected error in providers delete: ${error instanceof Error ? error.message : "Unknown error"}`,
        500,
        "UNEXPECTED_ERROR"
      );
    }
  }
};
__name(_ProviderManager, "ProviderManager");
var ProviderManager = _ProviderManager;
var provider_default = ProviderManager;

// src/io-events/event-metadata/list/index.ts
var _List2 = class _List2 {
  /**
   * Creates an instance of List service
   *
   * @param clientId - The Adobe I/O client ID (API key)
   * @param consumerId - The consumer organization ID
   * @param projectId - The project ID
   * @param workspaceId - The workspace ID
   * @param accessToken - The access token for authentication
   */
  constructor(clientId, consumerId, projectId, workspaceId, accessToken) {
    this.clientId = clientId;
    this.consumerId = consumerId;
    this.projectId = projectId;
    this.workspaceId = workspaceId;
    this.accessToken = accessToken;
    if (!clientId?.trim()) {
      throw new Error("clientId is required and cannot be empty");
    }
    if (!consumerId?.trim()) {
      throw new Error("consumerId is required and cannot be empty");
    }
    if (!projectId?.trim()) {
      throw new Error("projectId is required and cannot be empty");
    }
    if (!workspaceId?.trim()) {
      throw new Error("workspaceId is required and cannot be empty");
    }
    if (!accessToken?.trim()) {
      throw new Error("accessToken is required and cannot be empty");
    }
    this.restClient = new rest_client_default();
  }
  /**
   * Retrieves all event metadata for a provider with automatic pagination
   *
   * This method automatically follows pagination links to fetch all event metadata
   * across multiple pages, returning a complete array of all event metadata.
   *
   * @param providerId - The ID of the provider to fetch event metadata for
   * @returns Promise<EventMetadata[]> - Array of all event metadata across all pages
   * @throws IOEventsApiError - When the API request fails
   */
  async execute(providerId) {
    if (!providerId?.trim()) {
      throw new IOEventsApiError(
        "providerId is required and cannot be empty",
        400,
        "VALIDATION_ERROR"
      );
    }
    try {
      const url = `${IoEventsGlobals.BASE_URL}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/providers/${providerId}/eventmetadata`;
      return await this.fetchAllPages(url);
    } catch (error) {
      this.handleError(error);
    }
  }
  /**
   * Recursively fetches all pages of event metadata using pagination links
   *
   * @param url - The URL to fetch (either initial URL or next page URL)
   * @param accumulatedResults - Array to accumulate results across pages
   * @returns Promise<EventMetadata[]> - Complete array of all event metadata
   * @private
   */
  async fetchAllPages(url, accumulatedResults = []) {
    const response = await this.restClient.get(url, {
      Authorization: `Bearer ${this.accessToken}`,
      "x-api-key": this.clientId,
      Accept: "application/hal+json"
    });
    if (response === null || response === void 0) {
      throw new IOEventsApiError(
        "Invalid response format: Expected object",
        IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
        "PARSE_ERROR"
      );
    }
    if (typeof response !== "object") {
      throw new IOEventsApiError(
        "Invalid response format: Expected object",
        IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
        "PARSE_ERROR"
      );
    }
    const data = response;
    if (!data._embedded || !Array.isArray(data._embedded.eventmetadata)) {
      throw new IOEventsApiError(
        "Invalid response format: Expected eventmetadata array",
        IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
        "PARSE_ERROR"
      );
    }
    const currentPageResults = data._embedded.eventmetadata;
    const allResults = [...accumulatedResults, ...currentPageResults];
    const nextPageUrl = data._links?.next?.href;
    if (nextPageUrl) {
      return await this.fetchAllPages(nextPageUrl, allResults);
    }
    return allResults;
  }
  /**
   * Handles errors from the API request
   *
   * @param error - The error object from the API request
   * @throws IOEventsApiError - Always throws with appropriate error details
   */
  handleError(error) {
    if (error instanceof Error && error.message.includes("HTTP error! status:")) {
      const statusCode2 = this.extractStatusCodeFromMessage(error.message);
      const errorMessage2 = this.getErrorMessageForStatus(statusCode2);
      throw new IOEventsApiError(errorMessage2, statusCode2);
    }
    if (error.response) {
      const statusCode2 = this.extractStatusCode(error);
      const errorMessage2 = error.response.body?.message || this.getErrorMessageForStatus(statusCode2);
      throw new IOEventsApiError(
        errorMessage2,
        statusCode2,
        error.response.body,
        error.response.headers
      );
    }
    let errorMessage;
    let statusCode;
    if (error instanceof Error) {
      if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
        errorMessage = "Request timeout while listing event metadata";
        statusCode = IoEventsGlobals.STATUS_CODES.REQUEST_TIMEOUT;
      } else if (error.message.includes("JSON") || error.message.includes("parse")) {
        errorMessage = "Invalid response format from Adobe I/O Events API";
        statusCode = IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
        throw new IOEventsApiError(errorMessage, statusCode, "PARSE_ERROR");
      } else {
        errorMessage = `Network error: ${error.message}`;
        statusCode = IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
      }
    } else {
      errorMessage = `API Error: HTTP ${IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR}`;
      statusCode = IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
    }
    throw new IOEventsApiError(errorMessage, statusCode);
  }
  /**
   * Extracts the status code from the error response
   *
   * @param error - The error object
   * @returns The HTTP status code
   */
  extractStatusCode(error) {
    return error.response?.status || IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
  /**
   * Extracts the status code from RestClient error message
   *
   * @param errorMessage - Error message like "HTTP error! status: 404"
   * @returns The HTTP status code
   */
  extractStatusCodeFromMessage(errorMessage) {
    const match = errorMessage.match(/HTTP error! status:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
  /**
   * Gets a human-readable error message for a given HTTP status code
   *
   * @param statusCode - The HTTP status code
   * @returns A descriptive error message
   */
  getErrorMessageForStatus(statusCode) {
    switch (statusCode) {
      case IoEventsGlobals.STATUS_CODES.BAD_REQUEST:
        return "Invalid request parameters for listing event metadata";
      case IoEventsGlobals.STATUS_CODES.UNAUTHORIZED:
        return "Authentication failed. Please check your access token";
      case IoEventsGlobals.STATUS_CODES.FORBIDDEN:
        return "Access forbidden. You do not have permission to access event metadata";
      case IoEventsGlobals.STATUS_CODES.NOT_FOUND:
        return "Provider not found or no event metadata available";
      case IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR:
        return "Internal server error occurred while listing event metadata";
      default:
        return `Unexpected error occurred: HTTP ${statusCode}`;
    }
  }
};
__name(_List2, "List");
var List2 = _List2;

// src/io-events/event-metadata/get/index.ts
var _Get2 = class _Get2 {
  /**
   * Creates an instance of Get service
   *
   * @param clientId - The Adobe I/O client ID (API key)
   * @param consumerId - The consumer organization ID
   * @param projectId - The project ID
   * @param workspaceId - The workspace ID
   * @param accessToken - The access token for authentication
   */
  constructor(clientId, consumerId, projectId, workspaceId, accessToken) {
    this.clientId = clientId;
    this.consumerId = consumerId;
    this.projectId = projectId;
    this.workspaceId = workspaceId;
    this.accessToken = accessToken;
    if (!clientId?.trim()) {
      throw new Error("clientId is required and cannot be empty");
    }
    if (!consumerId?.trim()) {
      throw new Error("consumerId is required and cannot be empty");
    }
    if (!projectId?.trim()) {
      throw new Error("projectId is required and cannot be empty");
    }
    if (!workspaceId?.trim()) {
      throw new Error("workspaceId is required and cannot be empty");
    }
    if (!accessToken?.trim()) {
      throw new Error("accessToken is required and cannot be empty");
    }
    this.restClient = new rest_client_default();
  }
  /**
   * Retrieves specific event metadata by provider ID and event code
   *
   * @param providerId - The ID of the provider
   * @param eventCode - The event code to get metadata for
   * @returns Promise<EventMetadata> - The event metadata
   * @throws IOEventsApiError - When the API request fails
   */
  async execute(providerId, eventCode) {
    if (!providerId?.trim()) {
      throw new IOEventsApiError(
        "providerId is required and cannot be empty",
        400,
        "VALIDATION_ERROR"
      );
    }
    if (!eventCode?.trim()) {
      throw new IOEventsApiError(
        "eventCode is required and cannot be empty",
        400,
        "VALIDATION_ERROR"
      );
    }
    try {
      const url = `${IoEventsGlobals.BASE_URL}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/providers/${providerId}/eventmetadata/${encodeURIComponent(eventCode)}`;
      const response = await this.restClient.get(url, {
        Authorization: `Bearer ${this.accessToken}`,
        "x-api-key": this.clientId,
        Accept: "application/hal+json"
      });
      if (response === null || response === void 0) {
        throw new IOEventsApiError(
          "Invalid response format: Expected object",
          IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
          "PARSE_ERROR"
        );
      }
      if (typeof response !== "object") {
        throw new IOEventsApiError(
          "Invalid response format: Expected object",
          IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR,
          "PARSE_ERROR"
        );
      }
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }
  /**
   * Handles errors from the API request
   *
   * @param error - The error object from the API request
   * @throws IOEventsApiError - Always throws with appropriate error details
   */
  handleError(error) {
    if (error instanceof Error && error.message.includes("HTTP error! status:")) {
      const statusCode2 = this.extractStatusCodeFromMessage(error.message);
      const errorMessage2 = this.getErrorMessageForStatus(statusCode2);
      throw new IOEventsApiError(errorMessage2, statusCode2);
    }
    if (error.response) {
      const statusCode2 = this.extractStatusCode(error);
      const errorMessage2 = error.response.body?.message || this.getErrorMessageForStatus(statusCode2);
      throw new IOEventsApiError(
        errorMessage2,
        statusCode2,
        error.response.body?.error_code,
        error.response.body?.details
      );
    }
    let errorMessage;
    let statusCode;
    if (error instanceof Error) {
      if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
        errorMessage = "Request timeout while getting event metadata";
        statusCode = IoEventsGlobals.STATUS_CODES.REQUEST_TIMEOUT;
      } else if (error.message.includes("JSON") || error.message.includes("parse")) {
        errorMessage = "Invalid response format from Adobe I/O Events API";
        statusCode = IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
        throw new IOEventsApiError(errorMessage, statusCode, "PARSE_ERROR");
      } else {
        errorMessage = `Network error: ${error.message}`;
        statusCode = IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
      }
    } else {
      errorMessage = `API Error: HTTP ${IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR}`;
      statusCode = IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
    }
    throw new IOEventsApiError(errorMessage, statusCode);
  }
  /**
   * Extracts the status code from the error response
   *
   * @param error - The error object
   * @returns The HTTP status code
   */
  extractStatusCode(error) {
    return error.response?.status || IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
  /**
   * Extracts the status code from RestClient error message
   *
   * @param errorMessage - Error message like "HTTP error! status: 404"
   * @returns The HTTP status code
   */
  extractStatusCodeFromMessage(errorMessage) {
    const match = errorMessage.match(/HTTP error! status:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
  /**
   * Gets a human-readable error message for a given HTTP status code
   *
   * @param statusCode - The HTTP status code
   * @returns A descriptive error message
   */
  getErrorMessageForStatus(statusCode) {
    switch (statusCode) {
      case IoEventsGlobals.STATUS_CODES.BAD_REQUEST:
        return "Invalid request parameters for getting event metadata";
      case IoEventsGlobals.STATUS_CODES.UNAUTHORIZED:
        return "Authentication failed. Please check your access token";
      case IoEventsGlobals.STATUS_CODES.FORBIDDEN:
        return "Access forbidden. You do not have permission to access this event metadata";
      case IoEventsGlobals.STATUS_CODES.NOT_FOUND:
        return "Event metadata not found for the specified provider and event code";
      case IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR:
        return "Internal server error occurred while getting event metadata";
      default:
        return `Unexpected error occurred: HTTP ${statusCode}`;
    }
  }
};
__name(_Get2, "Get");
var Get2 = _Get2;

// src/io-events/event-metadata/create/index.ts
var _Create2 = class _Create2 {
  /**
   * Constructor for Create event metadata service
   *
   * @param clientId - Client ID from Adobe Developer Console (x-api-key header)
   * @param consumerId - Project Organization ID from Adobe Developer Console
   * @param projectId - Project ID from Adobe Developer Console
   * @param workspaceId - Workspace ID from Adobe Developer Console
   * @param accessToken - IMS token for authentication (Bearer token)
   */
  constructor(clientId, consumerId, projectId, workspaceId, accessToken) {
    this.clientId = clientId;
    this.consumerId = consumerId;
    this.projectId = projectId;
    this.workspaceId = workspaceId;
    this.accessToken = accessToken;
    this.endpoint = IoEventsGlobals.BASE_URL;
    if (!clientId?.trim()) {
      throw new Error("clientId is required and cannot be empty");
    }
    if (!consumerId?.trim()) {
      throw new Error("consumerId is required and cannot be empty");
    }
    if (!projectId?.trim()) {
      throw new Error("projectId is required and cannot be empty");
    }
    if (!workspaceId?.trim()) {
      throw new Error("workspaceId is required and cannot be empty");
    }
    if (!accessToken?.trim()) {
      throw new Error("accessToken is required and cannot be empty");
    }
    this.restClient = new rest_client_default();
  }
  /**
   * Execute the create event metadata API call
   *
   * @param providerId - The ID of the provider to create event metadata for
   * @param eventMetadataData - The event metadata input model
   * @returns Promise<EventMetadata> - The created event metadata
   * @throws IOEventsApiError - When API call fails with specific error details
   */
  async execute(providerId, eventMetadataData) {
    try {
      if (!providerId?.trim()) {
        throw new IOEventsApiError(
          "providerId is required and cannot be empty",
          400,
          "VALIDATION_ERROR"
        );
      }
      if (!eventMetadataData) {
        throw new IOEventsApiError("eventMetadataData is required", 400, "VALIDATION_ERROR");
      }
      this.validateEventMetadataInput(eventMetadataData);
      const apiPayload = this.convertToApiPayload(eventMetadataData);
      const url = `${this.endpoint}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/providers/${providerId}/eventmetadata`;
      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
        "x-api-key": this.clientId,
        Accept: "application/hal+json",
        "Content-Type": "application/json"
      };
      const response = await this.restClient.post(url, headers, apiPayload);
      if (response === null || response === void 0) {
        throw new IOEventsApiError(
          "Invalid response format: Expected object",
          IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR
        );
      }
      if (typeof response !== "object") {
        throw new IOEventsApiError(
          "Invalid response format: Expected object",
          IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR
        );
      }
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }
  /**
   * Validates the event metadata input data
   *
   * @param eventMetadataData - The event metadata input to validate
   * @throws Error - When validation fails
   * @private
   */
  validateEventMetadataInput(eventMetadataData) {
    const { description, label, event_code, sample_event_template } = eventMetadataData;
    if (!description?.trim()) {
      throw new IOEventsApiError(
        "description is required and cannot be empty",
        400,
        "VALIDATION_ERROR"
      );
    }
    if (!label?.trim()) {
      throw new IOEventsApiError("label is required and cannot be empty", 400, "VALIDATION_ERROR");
    }
    if (!event_code?.trim()) {
      throw new IOEventsApiError(
        "event_code is required and cannot be empty",
        400,
        "VALIDATION_ERROR"
      );
    }
    if (description.length > 255) {
      throw new Error("description cannot exceed 255 characters");
    }
    if (label.length > 255) {
      throw new Error("label cannot exceed 255 characters");
    }
    if (event_code.length > 255) {
      throw new Error("event_code cannot exceed 255 characters");
    }
    const descriptionPattern = /^[\w\s\-_.(),:''`?#!]+$/;
    if (!descriptionPattern.test(description)) {
      throw new Error("description contains invalid characters");
    }
    const labelPattern = /^[\w\s\-_.(),:''`?#!]+$/;
    if (!labelPattern.test(label)) {
      throw new Error("label contains invalid characters");
    }
    const eventCodePattern = /^[\w\-_.]+$/;
    if (!eventCodePattern.test(event_code)) {
      throw new Error("event_code contains invalid characters");
    }
    if (sample_event_template !== void 0) {
      if (typeof sample_event_template !== "object" || sample_event_template === null) {
        throw new Error("sample_event_template must be a valid JSON object");
      }
      try {
        const jsonString = JSON.stringify(sample_event_template);
        const base64Length = Buffer.from(jsonString).toString("base64").length;
        if (base64Length > 87382) {
          throw new Error("sample_event_template JSON object is too large when base64 encoded");
        }
      } catch (error) {
        if (error instanceof Error && error.message.includes("sample_event_template JSON object is too large")) {
          throw error;
        }
        throw new Error("sample_event_template must be a valid JSON object");
      }
    }
  }
  /**
   * Converts the input data to the format expected by the API
   *
   * @param eventMetadataData - The event metadata input data
   * @returns The converted payload for the API
   * @private
   */
  convertToApiPayload(eventMetadataData) {
    const { sample_event_template, ...rest } = eventMetadataData;
    const payload = { ...rest };
    if (sample_event_template !== void 0) {
      payload.sample_event_template = Buffer.from(JSON.stringify(sample_event_template)).toString(
        "base64"
      );
    }
    return payload;
  }
  /**
   * Handles errors from the API request
   *
   * @param error - The error object from the API request
   * @throws IOEventsApiError - Always throws with appropriate error details
   * @private
   */
  handleError(error) {
    if (error instanceof IOEventsApiError) {
      throw error;
    }
    if (error instanceof Error && error.message.includes("HTTP error! status:")) {
      const statusCode2 = this.extractStatusCodeFromMessage(error.message);
      const errorMessage2 = this.getErrorMessageForStatus(statusCode2);
      throw new IOEventsApiError(errorMessage2, statusCode2);
    }
    if (error.response) {
      const statusCode2 = this.extractStatusCode(error);
      const errorMessage2 = error.response.body?.message || this.getErrorMessageForStatus(statusCode2);
      throw new IOEventsApiError(
        errorMessage2,
        statusCode2,
        error.response.body?.error_code,
        error.response.body?.details
      );
    }
    let errorMessage;
    let statusCode;
    if (error instanceof Error) {
      if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
        errorMessage = "Request timeout while creating event metadata";
        statusCode = IoEventsGlobals.STATUS_CODES.REQUEST_TIMEOUT;
      } else if (error.message.includes("is required") || error.message.includes("cannot be empty") || error.message.includes("cannot exceed") || error.message.includes("contains invalid characters") || error.message.includes("must be a valid") || error.message.includes("too large when base64 encoded")) {
        throw new IOEventsApiError(
          error.message,
          IoEventsGlobals.STATUS_CODES.BAD_REQUEST,
          "VALIDATION_ERROR"
        );
      } else if (error.message.includes("JSON") || error.message.includes("parse")) {
        errorMessage = "Invalid response format from Adobe I/O Events API";
        statusCode = IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
      } else {
        errorMessage = `Network error: ${error.message}`;
        statusCode = IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
      }
    } else {
      errorMessage = `API Error: HTTP ${IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR}`;
      statusCode = IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
    }
    throw new IOEventsApiError(errorMessage, statusCode);
  }
  /**
   * Extracts the status code from the error response
   *
   * @param error - The error object
   * @returns The HTTP status code
   * @private
   */
  extractStatusCode(error) {
    return error.response?.status || IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
  /**
   * Extracts the status code from RestClient error message
   *
   * @param errorMessage - Error message like "HTTP error! status: 404"
   * @returns The HTTP status code
   * @private
   */
  extractStatusCodeFromMessage(errorMessage) {
    const match = errorMessage.match(/HTTP error! status:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
  /**
   * Gets a human-readable error message based on HTTP status code
   *
   * @param statusCode - HTTP status code
   * @returns string - User-friendly error message
   * @private
   */
  getErrorMessageForStatus(statusCode) {
    switch (statusCode) {
      case IoEventsGlobals.STATUS_CODES.BAD_REQUEST:
        return "Invalid request parameters for creating event metadata";
      case IoEventsGlobals.STATUS_CODES.UNAUTHORIZED:
        return "Authentication failed. Please check your access token";
      case IoEventsGlobals.STATUS_CODES.FORBIDDEN:
        return "Access forbidden. You do not have permission to create event metadata";
      case IoEventsGlobals.STATUS_CODES.NOT_FOUND:
        return "Provider not found. The specified provider ID does not exist";
      case IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR:
        return "Internal server error occurred while creating event metadata";
      default:
        return `Unexpected error occurred: HTTP ${statusCode}`;
    }
  }
};
__name(_Create2, "Create");
var Create2 = _Create2;
var create_default2 = Create2;

// src/io-events/event-metadata/delete/index.ts
var _Delete2 = class _Delete2 {
  /**
   * Constructor for Delete event metadata service
   *
   * @param clientId - Client ID from Adobe Developer Console (x-api-key header)
   * @param consumerId - Project Organization ID from Adobe Developer Console
   * @param projectId - Project ID from Adobe Developer Console
   * @param workspaceId - Workspace ID from Adobe Developer Console
   * @param accessToken - IMS token for authentication (Bearer token)
   */
  constructor(clientId, consumerId, projectId, workspaceId, accessToken) {
    this.clientId = clientId;
    this.consumerId = consumerId;
    this.projectId = projectId;
    this.workspaceId = workspaceId;
    this.accessToken = accessToken;
    this.endpoint = IoEventsGlobals.BASE_URL;
    if (!clientId?.trim()) {
      throw new Error("clientId is required and cannot be empty");
    }
    if (!consumerId?.trim()) {
      throw new Error("consumerId is required and cannot be empty");
    }
    if (!projectId?.trim()) {
      throw new Error("projectId is required and cannot be empty");
    }
    if (!workspaceId?.trim()) {
      throw new Error("workspaceId is required and cannot be empty");
    }
    if (!accessToken?.trim()) {
      throw new Error("accessToken is required and cannot be empty");
    }
    this.restClient = new rest_client_default();
  }
  /**
   * Execute the delete event metadata API call
   *
   * @param providerId - The ID of the provider to delete event metadata for
   * @param eventCode - Optional event code to delete specific event metadata. If not provided, deletes all event metadata for the provider
   * @returns Promise<void> - No content returned on successful deletion (204)
   * @throws IOEventsApiError - When API call fails with specific error details
   */
  async execute(providerId, eventCode) {
    try {
      if (!providerId?.trim()) {
        throw new IOEventsApiError(
          "providerId is required and cannot be empty",
          400,
          "VALIDATION_ERROR"
        );
      }
      if (eventCode !== void 0 && !eventCode?.trim()) {
        throw new IOEventsApiError(
          "eventCode cannot be empty when provided",
          400,
          "VALIDATION_ERROR"
        );
      }
      let url = `${this.endpoint}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/providers/${providerId}/eventmetadata`;
      if (eventCode?.trim()) {
        url += `/${encodeURIComponent(eventCode.trim())}`;
      }
      const headers = {
        Authorization: `Bearer ${this.accessToken}`,
        "x-api-key": this.clientId,
        Accept: "application/hal+json"
      };
      await this.restClient.delete(url, headers);
    } catch (error) {
      this.handleError(error);
    }
  }
  /**
   * Handles errors from the API request
   *
   * @param error - The error object from the API request
   * @throws IOEventsApiError - Always throws with appropriate error details
   * @private
   */
  handleError(error) {
    if (error instanceof IOEventsApiError) {
      throw error;
    }
    if (error instanceof Error && error.message.includes("HTTP error! status:")) {
      const statusCode2 = this.extractStatusCodeFromMessage(error.message);
      const errorMessage2 = this.getErrorMessageForStatus(statusCode2);
      throw new IOEventsApiError(errorMessage2, statusCode2);
    }
    if (error.response) {
      const statusCode2 = this.extractStatusCode(error);
      const errorMessage2 = error.response.body?.message || this.getErrorMessageForStatus(statusCode2);
      throw new IOEventsApiError(
        errorMessage2,
        statusCode2,
        error.response.body?.error_code,
        error.response.body?.details
      );
    }
    let errorMessage;
    let statusCode;
    if (error instanceof Error) {
      if (error.message.includes("timeout") || error.message.includes("ETIMEDOUT")) {
        errorMessage = "Request timeout while deleting event metadata";
        statusCode = IoEventsGlobals.STATUS_CODES.REQUEST_TIMEOUT;
      } else if (error.message.includes("is required") || error.message.includes("cannot be empty")) {
        throw new IOEventsApiError(
          error.message,
          IoEventsGlobals.STATUS_CODES.BAD_REQUEST,
          "VALIDATION_ERROR"
        );
      } else if (error.message.includes("JSON") || error.message.includes("parse")) {
        errorMessage = "Invalid response format from Adobe I/O Events API";
        statusCode = IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
      } else {
        errorMessage = `Network error: ${error.message}`;
        statusCode = IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
      }
    } else {
      errorMessage = `API Error: HTTP ${IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR}`;
      statusCode = IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
    }
    throw new IOEventsApiError(errorMessage, statusCode);
  }
  /**
   * Extracts the status code from the error response
   *
   * @param error - The error object
   * @returns The HTTP status code
   * @private
   */
  extractStatusCode(error) {
    return error.response?.status || IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
  /**
   * Extracts the status code from RestClient error message
   *
   * @param errorMessage - Error message like "HTTP error! status: 404"
   * @returns The HTTP status code
   * @private
   */
  extractStatusCodeFromMessage(errorMessage) {
    const match = errorMessage.match(/HTTP error! status:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
  /**
   * Gets a human-readable error message based on HTTP status code
   *
   * @param statusCode - HTTP status code
   * @returns string - User-friendly error message
   * @private
   */
  getErrorMessageForStatus(statusCode) {
    switch (statusCode) {
      case IoEventsGlobals.STATUS_CODES.UNAUTHORIZED:
        return "Authentication failed. Please check your access token";
      case IoEventsGlobals.STATUS_CODES.FORBIDDEN:
        return "Access forbidden. You do not have permission to delete event metadata";
      case IoEventsGlobals.STATUS_CODES.NOT_FOUND:
        return "Provider or event metadata not found. The specified provider ID or event code does not exist";
      case IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR:
        return "Internal server error occurred while deleting event metadata";
      default:
        return `Unexpected error occurred: HTTP ${statusCode}`;
    }
  }
};
__name(_Delete2, "Delete");
var Delete2 = _Delete2;
var delete_default = Delete2;

// src/io-events/event-metadata/index.ts
var _EventMetadataManager = class _EventMetadataManager {
  /**
   * Creates an instance of EventMetadataManager
   *
   * @param clientId - Adobe I/O Client ID for API authentication
   * @param consumerId - Consumer organization ID
   * @param projectId - Project ID within the consumer organization
   * @param workspaceId - Workspace ID within the project
   * @param accessToken - Access token for API authentication
   */
  constructor(clientId, consumerId, projectId, workspaceId, accessToken) {
    this.clientId = clientId;
    this.consumerId = consumerId;
    this.projectId = projectId;
    this.workspaceId = workspaceId;
    this.accessToken = accessToken;
    this.listService = new List2(clientId, consumerId, projectId, workspaceId, accessToken);
    this.getService = new Get2(clientId, consumerId, projectId, workspaceId, accessToken);
    this.createService = new create_default2(clientId, consumerId, projectId, workspaceId, accessToken);
    this.deleteService = new delete_default(clientId, consumerId, projectId, workspaceId, accessToken);
  }
  /**
   * Lists all event metadata for a provider
   *
   * @param providerId - The ID of the provider to fetch event metadata for
   * @returns Promise<EventMetadata[]> - Array of event metadata
   * @throws IOEventsApiError - When the API request fails
   *
   * @example
   * // List all event metadata for a provider
   * const allMetadata = await eventMetadata.list('provider-123');
   */
  async list(providerId) {
    try {
      return await this.listService.execute(providerId);
    } catch (error) {
      if (error instanceof IOEventsApiError) {
        throw error;
      }
      throw new IOEventsApiError(
        `Unexpected error in event metadata list: ${error instanceof Error ? error.message : "Unknown error"}`,
        500,
        "UNEXPECTED_ERROR"
      );
    }
  }
  /**
   * Gets specific event metadata by provider ID and event code
   *
   * @param providerId - The ID of the provider
   * @param eventCode - The event code to get metadata for
   * @returns Promise<EventMetadata> - The event metadata
   * @throws IOEventsApiError - When the API request fails
   *
   * @example
   * // Get specific event metadata by event code
   * const specificMetadata = await eventMetadata.get('provider-123', 'user.created');
   */
  async get(providerId, eventCode) {
    try {
      return await this.getService.execute(providerId, eventCode);
    } catch (error) {
      if (error instanceof IOEventsApiError) {
        throw error;
      }
      throw new IOEventsApiError(
        `Unexpected error in event metadata get: ${error instanceof Error ? error.message : "Unknown error"}`,
        500,
        "UNEXPECTED_ERROR"
      );
    }
  }
  /**
   * Creates new event metadata for a provider
   *
   * @param providerId - The ID of the provider to create event metadata for
   * @param eventMetadataData - The event metadata input data
   * @returns Promise<EventMetadata> - The created event metadata
   * @throws IOEventsApiError - When the API request fails
   *
   * @example
   * // Create new event metadata
   * const newMetadata = await eventMetadata.create('provider-123', {
   *   event_code: 'com.example.user.created',
   *   label: 'User Created',
   *   description: 'Triggered when a new user is created',
   *   sample_event_template: { name: 'John Doe', email: 'john@example.com' } // JSON object
   * });
   */
  async create(providerId, eventMetadataData) {
    try {
      return await this.createService.execute(providerId, eventMetadataData);
    } catch (error) {
      if (error instanceof IOEventsApiError) {
        throw error;
      }
      throw new IOEventsApiError(
        `Unexpected error in event metadata create: ${error instanceof Error ? error.message : "Unknown error"}`,
        500,
        "UNEXPECTED_ERROR"
      );
    }
  }
  /**
   * Deletes event metadata for a provider
   *
   * @param providerId - The ID of the provider to delete event metadata for
   * @param eventCode - Optional event code to delete specific event metadata. If not provided, deletes all event metadata for the provider
   * @returns Promise<void> - No content returned on successful deletion
   * @throws IOEventsApiError - When the API request fails
   *
   * @example
   * // Delete all event metadata for a provider
   * await eventMetadata.delete('provider-123');
   *
   * @example
   * // Delete specific event metadata by event code
   * await eventMetadata.delete('provider-123', 'com.example.user.created');
   */
  async delete(providerId, eventCode) {
    try {
      return await this.deleteService.execute(providerId, eventCode);
    } catch (error) {
      if (error instanceof IOEventsApiError) {
        throw error;
      }
      throw new IOEventsApiError(
        `Unexpected error in event metadata delete: ${error instanceof Error ? error.message : "Unknown error"}`,
        500,
        "UNEXPECTED_ERROR"
      );
    }
  }
};
__name(_EventMetadataManager, "EventMetadataManager");
var EventMetadataManager = _EventMetadataManager;
var event_metadata_default = EventMetadataManager;

// src/io-events/registration/create/index.ts
var _Create3 = class _Create3 {
  /**
   * Initialize the Create service
   */
  constructor(clientId, consumerId, projectId, workspaceId, accessToken) {
    if (!clientId?.trim()) {
      throw new IOEventsApiError("clientId is required and cannot be empty", 400);
    }
    if (!consumerId?.trim()) {
      throw new IOEventsApiError("consumerId is required and cannot be empty", 400);
    }
    if (!projectId?.trim()) {
      throw new IOEventsApiError("projectId is required and cannot be empty", 400);
    }
    if (!workspaceId?.trim()) {
      throw new IOEventsApiError("workspaceId is required and cannot be empty", 400);
    }
    if (!accessToken?.trim()) {
      throw new IOEventsApiError("accessToken is required and cannot be empty", 400);
    }
    this.restClient = new rest_client_default();
    this.endpoint = IoEventsGlobals.BASE_URL;
    this.consumerId = consumerId;
    this.projectId = projectId;
    this.workspaceId = workspaceId;
    this.accessToken = accessToken;
  }
  /**
   * Create a new registration
   *
   * @param registrationData - The registration data to create
   * @returns Promise<Registration> - The created registration
   * @throws IOEventsApiError - When the API call fails
   *
   * @example
   * ```typescript
   * const registration = await registrationManager.create({
   *   client_id: 'your-client-id',
   *   name: 'My Registration',
   *   description: 'Registration for user events',
   *   webhook_url: 'https://example.com/webhook',
   *   events_of_interest: [
   *     {
   *       provider_id: 'provider-123',
   *       event_code: 'com.example.user.created'
   *     }
   *   ],
   *   delivery_type: 'webhook',
   *   enabled: true
   * });
   * console.log(registration.registration_id);
   * ```
   */
  async execute(registrationData) {
    try {
      this.validateRegistrationInput(registrationData);
      const url = `${this.endpoint}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/registrations`;
      const response = await this.restClient.post(
        url,
        {
          Authorization: `Bearer ${this.accessToken}`,
          "x-api-key": this.consumerId,
          "Content-Type": "application/json",
          Accept: "application/hal+json"
        },
        registrationData
      );
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }
  /**
   * Validates the registration input data
   */
  validateRegistrationInput(registrationData) {
    if (!registrationData) {
      throw new IOEventsApiError("Registration data is required", 400);
    }
    if (!registrationData.client_id?.trim()) {
      throw new IOEventsApiError("Client ID is required", 400);
    }
    if (registrationData.client_id.length < 3 || registrationData.client_id.length > 255) {
      throw new IOEventsApiError("Client ID must be between 3 and 255 characters", 400);
    }
    if (!registrationData.name?.trim()) {
      throw new IOEventsApiError("Registration name is required", 400);
    }
    if (registrationData.name.length < 3 || registrationData.name.length > 255) {
      throw new IOEventsApiError("Registration name must be between 3 and 255 characters", 400);
    }
    if (registrationData.description && registrationData.description.length > 5e3) {
      throw new IOEventsApiError("Description must not exceed 5000 characters", 400);
    }
    if (registrationData.webhook_url && registrationData.webhook_url.length > 4e3) {
      throw new IOEventsApiError("Webhook URL must not exceed 4000 characters", 400);
    }
    if (!registrationData.events_of_interest || !Array.isArray(registrationData.events_of_interest)) {
      throw new IOEventsApiError("Events of interest is required and must be an array", 400);
    }
    if (registrationData.events_of_interest.length === 0) {
      throw new IOEventsApiError("At least one event of interest is required", 400);
    }
    registrationData.events_of_interest.forEach((event, index) => {
      if (!event.provider_id?.trim()) {
        throw new IOEventsApiError(`Provider ID is required for event at index ${index}`, 400);
      }
      if (!event.event_code?.trim()) {
        throw new IOEventsApiError(`Event code is required for event at index ${index}`, 400);
      }
    });
    if (!registrationData.delivery_type?.trim()) {
      throw new IOEventsApiError("Delivery type is required", 400);
    }
    const validDeliveryTypes = ["webhook", "webhook_batch", "journal", "aws_eventbridge"];
    if (!validDeliveryTypes.includes(registrationData.delivery_type)) {
      throw new IOEventsApiError(
        `Delivery type must be one of: ${validDeliveryTypes.join(", ")}`,
        400
      );
    }
    if (registrationData.runtime_action && registrationData.runtime_action.length > 255) {
      throw new IOEventsApiError("Runtime action must not exceed 255 characters", 400);
    }
  }
  /**
   * Handles errors from the API call
   */
  handleError(error) {
    if (error instanceof IOEventsApiError) {
      throw error;
    }
    if (error instanceof Error && error.message.includes("HTTP error! status:")) {
      const statusCode = this.extractStatusCodeFromMessage(error.message);
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }
    if (error.response?.status) {
      const statusCode = error.response.status;
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }
    if (error.status) {
      const statusCode = error.status;
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }
    throw new IOEventsApiError("Network error occurred", 500);
  }
  /**
   * Extracts status code from HTTP error message
   */
  extractStatusCodeFromMessage(message) {
    const match = message.match(/HTTP error! status:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : 500;
  }
  /**
   * Gets appropriate error message for HTTP status code
   */
  getErrorMessageForStatus(statusCode) {
    switch (statusCode) {
      case 400:
        return "Bad request: Invalid registration data provided";
      case 401:
        return "Unauthorized: Invalid or missing authentication";
      case 403:
        return "Forbidden: Insufficient permissions";
      case 409:
        return "Conflict: Registration with this name already exists";
      case 422:
        return "Unprocessable entity: Invalid registration data";
      case 500:
        return "Internal server error";
      default:
        return `API error: HTTP ${statusCode}`;
    }
  }
};
__name(_Create3, "Create");
var Create3 = _Create3;
var create_default3 = Create3;

// src/io-events/registration/delete/index.ts
var _Delete3 = class _Delete3 {
  /**
   * Initialize the Delete service
   */
  constructor(clientId, consumerId, projectId, workspaceId, accessToken) {
    if (!clientId?.trim()) {
      throw new IOEventsApiError("clientId is required and cannot be empty", 400);
    }
    if (!consumerId?.trim()) {
      throw new IOEventsApiError("consumerId is required and cannot be empty", 400);
    }
    if (!projectId?.trim()) {
      throw new IOEventsApiError("projectId is required and cannot be empty", 400);
    }
    if (!workspaceId?.trim()) {
      throw new IOEventsApiError("workspaceId is required and cannot be empty", 400);
    }
    if (!accessToken?.trim()) {
      throw new IOEventsApiError("accessToken is required and cannot be empty", 400);
    }
    this.restClient = new rest_client_default();
    this.endpoint = IoEventsGlobals.BASE_URL;
    this.consumerId = consumerId;
    this.projectId = projectId;
    this.workspaceId = workspaceId;
    this.accessToken = accessToken;
  }
  /**
   * Delete a registration by ID
   *
   * @param registrationId - The registration ID to delete
   * @returns Promise<void> - Resolves when deletion is successful
   * @throws IOEventsApiError - When the API call fails
   *
   * @example
   * ```typescript
   * await registrationManager.delete('your-registration-id');
   * console.log('Registration deleted successfully');
   * ```
   */
  async execute(registrationId) {
    try {
      this.validateInputs(registrationId);
      const url = `${this.endpoint}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/registrations/${registrationId}`;
      await this.restClient.delete(url, {
        Authorization: `Bearer ${this.accessToken}`,
        "x-api-key": this.consumerId,
        Accept: "text/plain"
      });
    } catch (error) {
      this.handleError(error);
    }
  }
  /**
   * Validates the input parameters
   */
  validateInputs(registrationId) {
    if (!registrationId?.trim()) {
      throw new IOEventsApiError("Registration ID is required", 400);
    }
  }
  /**
   * Handles errors from the API call
   */
  handleError(error) {
    if (error instanceof IOEventsApiError) {
      throw error;
    }
    if (error instanceof Error && error.message.includes("HTTP error! status:")) {
      const statusCode = this.extractStatusCodeFromMessage(error.message);
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }
    if (error.response?.status) {
      const statusCode = error.response.status;
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }
    if (error.status) {
      const statusCode = error.status;
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }
    throw new IOEventsApiError("Network error occurred", 500);
  }
  /**
   * Extracts status code from HTTP error message
   */
  extractStatusCodeFromMessage(message) {
    const match = message.match(/HTTP error! status:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : 500;
  }
  /**
   * Gets appropriate error message for HTTP status code
   */
  getErrorMessageForStatus(statusCode) {
    switch (statusCode) {
      case 400:
        return "Bad request: Invalid registration ID provided";
      case 401:
        return "Unauthorized: Invalid or missing authentication";
      case 403:
        return "Forbidden: Insufficient permissions";
      case 404:
        return "Registration not found";
      case 500:
        return "Internal server error";
      default:
        return `API error: HTTP ${statusCode}`;
    }
  }
};
__name(_Delete3, "Delete");
var Delete3 = _Delete3;
var delete_default2 = Delete3;

// src/io-events/registration/get/index.ts
var _Get3 = class _Get3 {
  /**
   * Initialize the Get service
   */
  constructor(clientId, consumerId, projectId, workspaceId, accessToken) {
    if (!clientId?.trim()) {
      throw new IOEventsApiError("clientId is required and cannot be empty", 400);
    }
    if (!consumerId?.trim()) {
      throw new IOEventsApiError("consumerId is required and cannot be empty", 400);
    }
    if (!projectId?.trim()) {
      throw new IOEventsApiError("projectId is required and cannot be empty", 400);
    }
    if (!workspaceId?.trim()) {
      throw new IOEventsApiError("workspaceId is required and cannot be empty", 400);
    }
    if (!accessToken?.trim()) {
      throw new IOEventsApiError("accessToken is required and cannot be empty", 400);
    }
    this.restClient = new rest_client_default();
    this.endpoint = IoEventsGlobals.BASE_URL;
    this.consumerId = consumerId;
    this.projectId = projectId;
    this.workspaceId = workspaceId;
    this.accessToken = accessToken;
  }
  /**
   * Get a registration by ID
   *
   * @param registrationId - The registration ID to retrieve
   * @returns Promise<Registration> - The registration data
   * @throws IOEventsApiError - When the API call fails
   *
   * @example
   * ```typescript
   * const registration = await registrationManager.get('your-registration-id');
   * console.log(registration.name);
   * ```
   */
  async execute(registrationId) {
    try {
      this.validateInputs(registrationId);
      const url = `${this.endpoint}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/registrations/${registrationId}`;
      const response = await this.restClient.get(url, {
        Authorization: `Bearer ${this.accessToken}`,
        "x-api-key": this.consumerId,
        Accept: "application/hal+json"
      });
      return response;
    } catch (error) {
      this.handleError(error);
    }
  }
  /**
   * Validates the input parameters
   */
  validateInputs(registrationId) {
    if (!registrationId?.trim()) {
      throw new IOEventsApiError("Registration ID is required", 400);
    }
  }
  /**
   * Handles errors from the API call
   */
  handleError(error) {
    if (error instanceof IOEventsApiError) {
      throw error;
    }
    if (error instanceof Error && error.message.includes("HTTP error! status:")) {
      const statusCode = this.extractStatusCodeFromMessage(error.message);
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }
    if (error.response?.status) {
      const statusCode = error.response.status;
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }
    if (error.status) {
      const statusCode = error.status;
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }
    throw new IOEventsApiError("Network error occurred", 500);
  }
  /**
   * Extracts status code from HTTP error message
   */
  extractStatusCodeFromMessage(message) {
    const match = message.match(/HTTP error! status:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : 500;
  }
  /**
   * Gets appropriate error message for HTTP status code
   */
  getErrorMessageForStatus(statusCode) {
    switch (statusCode) {
      case 400:
        return "Bad request: Invalid parameters provided";
      case 401:
        return "Unauthorized: Invalid or missing authentication";
      case 403:
        return "Forbidden: Insufficient permissions";
      case 404:
        return "Registration not found";
      case 500:
        return "Internal server error";
      default:
        return `API error: HTTP ${statusCode}`;
    }
  }
};
__name(_Get3, "Get");
var Get3 = _Get3;
var get_default2 = Get3;

// src/io-events/registration/list/index.ts
var _List3 = class _List3 {
  /**
   * Initialize the List service
   */
  constructor(clientId, consumerId, projectId, workspaceId, accessToken) {
    if (!clientId?.trim()) {
      throw new IOEventsApiError("clientId is required and cannot be empty", 400);
    }
    if (!consumerId?.trim()) {
      throw new IOEventsApiError("consumerId is required and cannot be empty", 400);
    }
    if (!projectId?.trim()) {
      throw new IOEventsApiError("projectId is required and cannot be empty", 400);
    }
    if (!workspaceId?.trim()) {
      throw new IOEventsApiError("workspaceId is required and cannot be empty", 400);
    }
    if (!accessToken?.trim()) {
      throw new IOEventsApiError("accessToken is required and cannot be empty", 400);
    }
    this.restClient = new rest_client_default();
    this.endpoint = IoEventsGlobals.BASE_URL;
    this.consumerId = consumerId;
    this.projectId = projectId;
    this.workspaceId = workspaceId;
    this.accessToken = accessToken;
  }
  /**
   * Execute registration list with automatic pagination
   */
  async execute(queryParams) {
    try {
      this.validateInputs();
      let url = `${this.endpoint}/events/${this.consumerId}/${this.projectId}/${this.workspaceId}/registrations`;
      if (queryParams && Object.keys(queryParams).length > 0) {
        const searchParams = new URLSearchParams();
        Object.entries(queryParams).forEach(([key, value]) => {
          if (value !== void 0 && value !== null) {
            searchParams.append(key, String(value));
          }
        });
        if (searchParams.toString()) {
          url += `?${searchParams.toString()}`;
        }
      }
      return await this.fetchAllPages(url);
    } catch (error) {
      this.handleError(error);
    }
  }
  /**
   * Fetch all pages recursively
   */
  async fetchAllPages(url, accumulatedResults = []) {
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      "x-api-key": this.consumerId,
      "Content-Type": "application/json"
    };
    const data = await this.restClient.get(url, headers);
    const currentPageRegistrations = data._embedded?.registrations || [];
    const allResults = [...accumulatedResults, ...currentPageRegistrations];
    const nextPageUrl = data._links?.next?.href;
    if (nextPageUrl) {
      return await this.fetchAllPages(nextPageUrl, allResults);
    }
    return allResults;
  }
  /**
   * Validate required inputs
   */
  validateInputs() {
    if (!this.consumerId?.trim()) {
      throw new IOEventsApiError(
        "Consumer ID is required",
        IoEventsGlobals.STATUS_CODES.BAD_REQUEST
      );
    }
    if (!this.projectId?.trim()) {
      throw new IOEventsApiError(
        "Project ID is required",
        IoEventsGlobals.STATUS_CODES.BAD_REQUEST
      );
    }
    if (!this.workspaceId?.trim()) {
      throw new IOEventsApiError(
        "Workspace ID is required",
        IoEventsGlobals.STATUS_CODES.BAD_REQUEST
      );
    }
    if (!this.accessToken?.trim()) {
      throw new IOEventsApiError(
        "Access token is required",
        IoEventsGlobals.STATUS_CODES.BAD_REQUEST
      );
    }
  }
  /**
   * Handle and categorize errors
   */
  handleError(error) {
    if (error instanceof Error && error.message.includes("HTTP error! status:")) {
      const statusCode = this.extractStatusCodeFromMessage(error.message);
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }
    if (error.response) {
      const statusCode = error.response.status || error.status || IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
      const errorMessage = this.getErrorMessageForStatus(statusCode);
      throw new IOEventsApiError(errorMessage, statusCode);
    }
    if (error instanceof IOEventsApiError) {
      throw error;
    }
    throw new IOEventsApiError(
      error.message || "An unexpected error occurred while listing registrations",
      IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR
    );
  }
  /**
   * Extract status code from error message
   */
  extractStatusCodeFromMessage(errorMessage) {
    const match = errorMessage.match(/HTTP error! status:\s*(\d+)/);
    return match ? parseInt(match[1], 10) : IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR;
  }
  /**
   * Get appropriate error message for status code
   */
  getErrorMessageForStatus(statusCode) {
    switch (statusCode) {
      case IoEventsGlobals.STATUS_CODES.BAD_REQUEST:
        return "Bad request. Please check your input parameters";
      case IoEventsGlobals.STATUS_CODES.UNAUTHORIZED:
        return "Unauthorized. Please check your access token";
      case IoEventsGlobals.STATUS_CODES.FORBIDDEN:
        return "Forbidden. You do not have permission to access registrations";
      case IoEventsGlobals.STATUS_CODES.NOT_FOUND:
        return "Registrations not found. The specified workspace may not exist or have no registrations";
      case IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR:
        return "Internal server error. Please try again later";
      default:
        return `API request failed with status ${statusCode}`;
    }
  }
};
__name(_List3, "List");
var List3 = _List3;
var list_default2 = List3;

// src/io-events/registration/index.ts
var _RegistrationManager = class _RegistrationManager {
  /**
   * Initialize the RegistrationManager
   */
  constructor(clientId, consumerId, projectId, workspaceId, accessToken) {
    this.createService = new create_default3(clientId, consumerId, projectId, workspaceId, accessToken);
    this.deleteService = new delete_default2(clientId, consumerId, projectId, workspaceId, accessToken);
    this.getService = new get_default2(clientId, consumerId, projectId, workspaceId, accessToken);
    this.listService = new list_default2(clientId, consumerId, projectId, workspaceId, accessToken);
  }
  /**
   * Create a new registration
   *
   * @param registrationData - The registration data to create
   * @returns Promise<Registration> - The created registration
   *
   * @example
   * ```typescript
   * const registration = await registrationManager.create({
   *   client_id: 'your-client-id',
   *   name: 'My Registration',
   *   description: 'Registration for user events',
   *   webhook_url: 'https://example.com/webhook',
   *   events_of_interest: [
   *     {
   *       provider_id: 'provider-123',
   *       event_code: 'com.example.user.created'
   *     }
   *   ],
   *   delivery_type: 'webhook',
   *   enabled: true
   * });
   * console.log(registration.registration_id);
   * ```
   */
  async create(registrationData) {
    return await this.createService.execute(registrationData);
  }
  /**
   * Delete a registration by ID
   *
   * @param registrationId - The registration ID to delete
   * @returns Promise<void> - Resolves when deletion is successful
   *
   * @example
   * ```typescript
   * await registrationManager.delete('your-registration-id');
   * console.log('Registration deleted successfully');
   * ```
   */
  async delete(registrationId) {
    return await this.deleteService.execute(registrationId);
  }
  /**
   * Get a registration by ID
   *
   * @param registrationId - The registration ID to retrieve
   * @returns Promise<Registration> - The registration data
   *
   * @example
   * ```typescript
   * const registration = await registrationManager.get('your-registration-id');
   * console.log(registration.name);
   * ```
   */
  async get(registrationId) {
    return await this.getService.execute(registrationId);
  }
  /**
   * List all registrations with automatic pagination
   *
   * @param queryParams - Optional query parameters for filtering
   * @returns Promise<Registration[]> - Array of all registrations across all pages
   *
   * @example
   * ```typescript
   * // List all registrations
   * const registrations = await registrationManager.list();
   *
   * // List with query parameters
   * const filteredRegistrations = await registrationManager.list({
   *   enabled: true
   * });
   * ```
   */
  async list(queryParams) {
    return await this.listService.execute(queryParams);
  }
};
__name(_RegistrationManager, "RegistrationManager");
var RegistrationManager = _RegistrationManager;
var registration_default = RegistrationManager;
export {
  adobe_auth_default as AdobeAuth,
  adobe_commerce_client_default as AdobeCommerceClient,
  basic_auth_connection_default as BasicAuthConnection,
  bearer_token_default as BearerToken,
  event_consumer_action_default as EventConsumerAction,
  event_metadata_default as EventMetadataManager,
  generate_basic_auth_token_default as GenerateBasicAuthToken,
  graphql_action_default as GraphQlAction,
  HttpMethod,
  HttpStatus,
  IOEventsApiError,
  ims_connection_default as ImsConnection,
  IoEventsGlobals,
  oauth1a_connection_default as Oauth1aConnection,
  openwhisk_default as Openwhisk,
  openwhisk_action_default as OpenwhiskAction,
  parameters_default as Parameters,
  provider_default as ProviderManager,
  registration_default as RegistrationManager,
  rest_client_default as RestClient,
  runtime_action_default as RuntimeAction,
  response_default as RuntimeActionResponse,
  SignatureVerification,
  validator_default as Validator,
  webhook_action_default as WebhookAction,
  response_default2 as WebhookActionResponse,
  WebhookOperation
};
//# sourceMappingURL=index.mjs.map