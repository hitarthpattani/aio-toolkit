import openwhisk, { Dict, Activation } from 'openwhisk';

declare enum HttpStatus {
    OK = 200,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,
    INTERNAL_ERROR = 500
}
declare enum HttpMethod {
    GET = "get",
    POST = "post",
    PUT = "put",
    DELETE = "delete",
    PATCH = "patch",
    HEAD = "head",
    OPTIONS = "options"
}

interface SuccessResponse$1 {
    statusCode: HttpStatus;
    body: object | string;
    headers?: {
        [key: string]: string;
    };
}
interface ErrorResponse {
    error: {
        statusCode: HttpStatus;
        body: {
            error: string;
        };
    };
}
type RuntimeActionResponseType = SuccessResponse$1 | ErrorResponse;

declare class RuntimeAction {
    static execute(name?: string, httpMethods?: HttpMethod[], requiredParams?: string[], requiredHeaders?: string[], action?: (params: {
        [key: string]: any;
    }, ctx: {
        logger: any;
        headers: {
            [key: string]: any;
        };
    }) => Promise<RuntimeActionResponseType>): (params: {
        [key: string]: any;
    }) => Promise<RuntimeActionResponseType>;
    private static validateRequest;
}

declare class RuntimeActionResponse {
    static success(response: object | string, headers?: {
        [key: string]: string;
    }): SuccessResponse$1;
    static error(statusCode: HttpStatus, error: string): ErrorResponse;
}

declare class EventAction {
    static execute(name?: string, requiredParams?: string[], requiredHeaders?: string[], action?: (params: {
        [key: string]: any;
    }, ctx: {
        logger: any;
        headers: {
            [key: string]: any;
        };
    }) => Promise<RuntimeActionResponseType>): (params: {
        [key: string]: any;
    }) => Promise<RuntimeActionResponseType>;
}

declare enum SignatureVerification {
    DISABLED = 0,
    ENABLED = 1,
    ENABLED_WITH_BASE64 = 2
}

declare class Webhook {
    static execute(name?: string, requiredParams?: string[], requiredHeaders?: string[], signatureVerification?: SignatureVerification, action?: (params: {
        [key: string]: any;
    }, ctx: {
        logger: any;
        headers: {
            [key: string]: any;
        };
    }) => Promise<RuntimeActionResponseType>): (params: {
        [key: string]: any;
    }) => Promise<RuntimeActionResponseType>;
}

declare enum WebhookOperation {
    SUCCESS = "success",
    EXCEPTION = "exception",
    ADD = "add",
    REPLACE = "replace",
    REMOVE = "remove"
}
interface SuccessResponse {
    op: typeof WebhookOperation.SUCCESS;
}
interface ExceptionResponse {
    op: typeof WebhookOperation.EXCEPTION;
    class?: string | undefined;
    message?: string | undefined;
}
interface AddResponse {
    op: typeof WebhookOperation.ADD;
    path: string;
    value: any;
    instance?: string | undefined;
}
interface ReplaceResponse {
    op: typeof WebhookOperation.REPLACE;
    path: string;
    value: any;
    instance?: string | undefined;
}
interface RemoveResponse {
    op: typeof WebhookOperation.REMOVE;
    path: string;
}

declare class WebhookResponse {
    static success(): SuccessResponse;
    static exception(exceptionClass?: string, message?: string): ExceptionResponse;
    static add(path: string, value: any, instance?: string): AddResponse;
    static replace(path: string, value: any, instance?: string): ReplaceResponse;
    static remove(path: string): RemoveResponse;
}

declare class Openwhisk {
    openwhiskClient: ReturnType<typeof openwhisk>;
    constructor(host: string, apiKey: string);
    execute(action: string, params: Dict): Promise<Activation<Dict>>;
}

declare class OpenwhiskAction {
    static execute(name?: string, action?: (params: {
        [key: string]: any;
    }, ctx: {
        logger: any;
        headers: {
            [key: string]: any;
        };
    }) => Promise<RuntimeActionResponseType>): (params: {
        [key: string]: any;
    }) => Promise<RuntimeActionResponseType>;
}

declare class Parameters {
    static stringify(params: {
        [key: string]: any;
    }): string;
}

declare class Validator {
    static getMissingKeys(obj: {
        [key: string]: any;
    }, required: string[]): string[];
    static checkMissingRequestInputs(params: {
        [key: string]: any;
    }, requiredParams?: string[], requiredHeaders?: string[]): string | null;
}

export { type ErrorResponse, EventAction, HttpMethod, HttpStatus, Openwhisk, OpenwhiskAction, Parameters, RuntimeAction, RuntimeActionResponse, type RuntimeActionResponseType, SignatureVerification, type SuccessResponse$1 as SuccessResponse, Validator, Webhook, type AddResponse as WebhookAddResponse, type ExceptionResponse as WebhookExceptionResponse, WebhookOperation, type RemoveResponse as WebhookRemoveResponse, type ReplaceResponse as WebhookReplaceResponse, WebhookResponse, type SuccessResponse as WebhookSuccessResponse };
