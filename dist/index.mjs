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
export {
  adobe_auth_default as AdobeAuth,
  bearer_token_default as BearerToken,
  event_consumer_action_default as EventConsumerAction,
  graphql_action_default as GraphQlAction,
  HttpMethod,
  HttpStatus,
  IOEventsApiError,
  IoEventsGlobals,
  openwhisk_default as Openwhisk,
  openwhisk_action_default as OpenwhiskAction,
  parameters_default as Parameters,
  provider_default as ProviderManager,
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