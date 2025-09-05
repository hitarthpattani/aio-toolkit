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

declare class EventConsumerAction {
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

declare class GraphQlAction {
    static execute(schema?: string, resolvers?: (ctx: {
        logger: any;
        headers: {
            [key: string]: any;
        };
        params: {
            [key: string]: any;
        };
    }) => Promise<any>, name?: string, disableIntrospection?: boolean): (params: {
        [key: string]: any;
    }) => Promise<RuntimeActionResponseType>;
}

declare enum SignatureVerification {
    DISABLED = 0,
    ENABLED = 1,
    ENABLED_WITH_BASE64 = 2
}

declare class WebhookAction {
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

declare class WebhookActionResponse {
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

declare class BearerToken {
    static extract(params: {
        [key: string]: any;
    }): string | undefined;
}

interface Headers {
    [key: string]: string;
}

declare class RestClient {
    get(endpoint: string, headers?: Headers): Promise<any>;
    post(endpoint: string, headers?: Headers, payload?: any): Promise<any>;
    put(endpoint: string, headers?: Headers, payload?: any): Promise<any>;
    delete(endpoint: string, headers?: Headers): Promise<any>;
    apiCall(endpoint: string, method?: string, headers?: Headers, payload?: any): Promise<any>;
}

declare class AdobeAuth {
    static getToken(clientId: string, clientSecret: string, technicalAccountId: string, technicalAccountEmail: string, imsOrgId: string, scopes: string[], currentContext?: string): Promise<string>;
}

interface AdobeIMSConfig {
    client_id: string;
    client_secrets: string[];
    technical_account_id: string;
    technical_account_email: string;
    ims_org_id: string;
    scopes: string[];
}

declare const IoEventsGlobals: {
    readonly BASE_URL: "https://api.adobe.io";
    readonly STATUS_CODES: {
        readonly OK: 200;
        readonly BAD_REQUEST: 400;
        readonly UNAUTHORIZED: 401;
        readonly FORBIDDEN: 403;
        readonly NOT_FOUND: 404;
        readonly REQUEST_TIMEOUT: 408;
        readonly TIMEOUT: 408;
        readonly CONFLICT: 409;
        readonly INTERNAL_SERVER_ERROR: 500;
    };
    readonly HEADERS: {
        readonly CONFLICTING_ID: "x-conflicting-id";
    };
};
interface HALLink {
    href: string;
    templated?: boolean;
    type?: string;
    title?: string;
}
interface IOEventsError {
    error?: string;
    message?: string;
    error_code?: string;
    details?: string;
}
declare class IOEventsApiError extends Error {
    readonly statusCode: number;
    readonly errorCode: string | undefined;
    readonly details: string | undefined;
    constructor(message: string, statusCode: number, errorCode?: string, details?: string);
}

interface Provider {
    id: string;
    label: string;
    description: string;
    source: string;
    docs_url?: string;
    provider_metadata: string;
    instance_id?: string;
    event_delivery_format: string;
    publisher: string;
    _links?: {
        'rel:eventmetadata'?: HALLink;
        'rel:update'?: HALLink;
        self?: HALLink;
    };
}

interface GetProviderQueryParams {
    eventmetadata?: boolean;
}

interface ListProvidersQueryParams {
    providerMetadataId?: string;
    instanceId?: string;
    providerMetadataIds?: string[];
    eventmetadata?: boolean;
}

interface ProviderInputModel {
    label: string;
    description?: string;
    docs_url?: string;
    provider_metadata?: string;
    instance_id?: string;
    data_residency_region?: string;
}
interface CreateProviderParams {
    projectId: string;
    workspaceId: string;
    providerData: ProviderInputModel;
}

declare class ProviderManager {
    private readonly clientId;
    private readonly consumerId;
    private readonly projectId;
    private readonly workspaceId;
    private readonly accessToken;
    private readonly listService;
    private readonly getService;
    private readonly createService;
    private readonly deleteService;
    constructor(clientId: string, consumerId: string, projectId: string, workspaceId: string, accessToken: string);
    list(queryParams?: ListProvidersQueryParams): Promise<Provider[]>;
    get(providerId: string, queryParams?: GetProviderQueryParams): Promise<Provider>;
    create(providerData: ProviderInputModel): Promise<Provider>;
    delete(providerId: string): Promise<void>;
}

interface EventMetadata {
    event_code: string;
    label?: string;
    description?: string;
    sample_event_template?: string;
    [key: string]: any;
}

interface EventMetadataInputModel {
    description: string;
    label: string;
    event_code: string;
    sample_event_template?: Record<string, any>;
}

declare class EventMetadataManager {
    private readonly clientId;
    private readonly consumerId;
    private readonly projectId;
    private readonly workspaceId;
    private readonly accessToken;
    private readonly listService;
    private readonly getService;
    private readonly createService;
    private readonly deleteService;
    constructor(clientId: string, consumerId: string, projectId: string, workspaceId: string, accessToken: string);
    list(providerId: string): Promise<EventMetadata[]>;
    get(providerId: string, eventCode: string): Promise<EventMetadata>;
    create(providerId: string, eventMetadataData: EventMetadataInputModel): Promise<EventMetadata>;
    delete(providerId: string, eventCode?: string): Promise<void>;
}

interface EventMetadataListResponse {
    _embedded?: {
        eventmetadata: EventMetadata[];
    };
    _links?: {
        self?: {
            href: string;
        };
        next?: {
            href: string;
        };
    };
    [key: string]: any;
}

export { AdobeAuth, type AdobeIMSConfig, BearerToken, type CreateProviderParams, type ErrorResponse, EventConsumerAction, type EventMetadata, type EventMetadataInputModel, type EventMetadataListResponse, EventMetadataManager, type GetProviderQueryParams, GraphQlAction, type HALLink, type Headers, HttpMethod, HttpStatus, IOEventsApiError, type IOEventsError, IoEventsGlobals, type ListProvidersQueryParams, Openwhisk, OpenwhiskAction, Parameters, type Provider, type ProviderInputModel, ProviderManager, RestClient, RuntimeAction, RuntimeActionResponse, type RuntimeActionResponseType, SignatureVerification, type SuccessResponse$1 as SuccessResponse, Validator, WebhookAction, type AddResponse as WebhookActionAddResponse, type ExceptionResponse as WebhookActionExceptionResponse, type RemoveResponse as WebhookActionRemoveResponse, type ReplaceResponse as WebhookActionReplaceResponse, WebhookActionResponse, type SuccessResponse as WebhookActionSuccessResponse, WebhookOperation };
