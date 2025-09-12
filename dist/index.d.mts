import openwhisk, { Dict, Activation } from 'openwhisk';
import { Logger } from '@adobe/aio-sdk';
import { Got, RequestError } from 'got';

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

interface SuccessResponse {
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
type RuntimeActionResponseType = SuccessResponse | ErrorResponse;

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
    }): SuccessResponse;
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

interface FileRecord {
    id: string | number;
    created_at: string;
    updated_at: string;
    [key: string]: any;
}

declare class FileRepository {
    private readonly filepath;
    private files;
    constructor(filepath: string);
    list(): Promise<FileRecord[]>;
    load(id?: string): Promise<FileRecord>;
    save(payload?: Partial<FileRecord>): Promise<boolean>;
    delete(ids?: (string | number)[]): Promise<FileRecord[]>;
    private getFiles;
}

interface BearerTokenInfo {
    token: string | null;
    tokenLength: number;
    isValid: boolean;
    expiry: string | null;
    timeUntilExpiry: number | null;
}

declare class BearerToken {
    static extract(params: {
        [key: string]: any;
    }): BearerTokenInfo;
    static info(token: string | null): BearerTokenInfo;
    private static _isTokenValid;
    private static _calculateExpiry;
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

interface SampleEventTemplate {
    [key: string]: any;
}
interface OnboardEvent {
    eventCode: string;
    runtimeAction: string;
    deliveryType: string;
    sampleEventTemplate: SampleEventTemplate;
}
interface OnboardRegistration {
    key: string;
    label: string;
    description: string;
    events: OnboardEvent[];
}
interface OnboardProvider {
    key: string;
    label: string;
    description: string;
    docsUrl: string | null;
    registrations: OnboardRegistration[];
}
interface OnboardEventsInput {
    providers: OnboardProvider[];
}
interface ParsedRegistration {
    key: string;
    label: string;
    description: string;
    providerKey: string;
}
interface ParsedEvent {
    eventCode: string;
    runtimeAction: string;
    deliveryType: string;
    sampleEventTemplate: any;
    registrationKey: string;
    providerKey: string;
}
interface CreateProviderResult {
    created: boolean;
    skipped: boolean;
    provider: {
        id?: string;
        instanceId?: string;
        key: string;
        label: string;
        originalLabel: string;
        description?: string;
        docsUrl?: string | null;
    };
    error?: string;
    reason?: string;
    raw?: any;
}
interface CreateEventResult {
    created: boolean;
    skipped: boolean;
    event: {
        id?: string;
        eventCode: string;
        label?: string;
        description?: string;
        sampleEventTemplate?: any;
    };
    provider?: CreateProviderResult['provider'];
    error?: string;
    reason?: string;
    raw?: any;
}
interface CreateRegistrationResult {
    created: boolean;
    skipped: boolean;
    registration: {
        id?: string;
        key: string;
        label: string;
        originalLabel: string;
        description?: string;
        clientId?: string;
        name?: string;
        webhookUrl?: string;
        deliveryType?: string;
        runtimeAction?: string;
    };
    provider?: CreateProviderResult['provider'];
    error?: string;
    reason?: string;
    raw?: any;
}
interface OnboardEventsResponse {
    createdProviders: CreateProviderResult[];
    createdEvents: CreateEventResult[];
    createdRegistrations: CreateRegistrationResult[];
}

declare class OnboardEvents {
    private readonly projectName;
    private readonly consumerId;
    private readonly projectId;
    private readonly workspaceId;
    private readonly apiKey;
    private readonly accessToken;
    private readonly logger;
    private readonly createProviders;
    private readonly createEvents;
    private readonly createRegistrations;
    constructor(projectName: string, consumerId: string, projectId: string, workspaceId: string, apiKey: string, accessToken: string);
    getLogger(): Logger;
    process(input: OnboardEventsInput): Promise<OnboardEventsResponse>;
}

declare class CreateEvents {
    private readonly consumerId;
    private readonly projectId;
    private readonly workspaceId;
    private readonly clientId;
    private readonly accessToken;
    private readonly logger;
    private eventMetadataManager;
    constructor(consumerId: string, projectId: string, workspaceId: string, clientId: string, accessToken: string, logger: Logger);
    private getEventMetadataManager;
    private createEvent;
    private fetchMetadata;
    process(events: ParsedEvent[], providerResults: CreateProviderResult[], projectName?: string): Promise<CreateEventResult[]>;
}

interface Registration {
    registration_id: string;
    name: string;
    description?: string;
    webhook_url?: string;
    events_of_interest?: Array<{
        provider_id: string;
        event_code: string;
    }>;
    delivery_type: string;
    enabled: boolean;
    created_date: string;
    updated_date: string;
    runtime_action?: string;
    [key: string]: any;
}

declare class CreateRegistrations {
    private readonly consumerId;
    private readonly projectId;
    private readonly workspaceId;
    private readonly clientId;
    private readonly accessToken;
    private readonly logger;
    private registrationManager?;
    constructor(consumerId: string, projectId: string, workspaceId: string, clientId: string, accessToken: string, logger: Logger);
    process(registrations: ParsedRegistration[], events: ParsedEvent[], providerResults: CreateProviderResult[], projectName?: string): Promise<CreateRegistrationResult[]>;
    private getRegistrationManager;
    fetchRegistrations(): Promise<Map<string, Registration>>;
    private groupEventsByProvider;
    private preparePayload;
    private createRegistration;
}

interface InfiniteLoopData {
    keyFn: string | (() => string);
    fingerprintFn: any | (() => any);
    eventTypes: string[];
    event: string;
}

declare class InfiniteLoopBreaker {
    private static readonly FINGERPRINT_ALGORITHM;
    private static readonly FINGERPRINT_ENCODING;
    private static readonly DEFAULT_INFINITE_LOOP_BREAKER_TTL;
    static isInfiniteLoop({ keyFn, fingerprintFn, eventTypes, event, }: InfiniteLoopData): Promise<boolean>;
    static storeFingerPrint(keyFn: string | (() => string), fingerprintFn: any | (() => any), ttl?: number): Promise<void>;
    static fnFingerprint(obj: any): () => any;
    static fnInfiniteLoopKey(key: any): () => any;
    private static fingerPrint;
}

declare class AdobeAuth {
    static getToken(clientId: string, clientSecret: string, technicalAccountId: string, technicalAccountEmail: string, imsOrgId: string, scopes: string[], currentContext?: string): Promise<string>;
}

interface Connection {
    extend: (client: Got) => Promise<Got>;
}
interface ExtendedRequestError extends RequestError {
    responseBody?: any;
}

declare class AdobeCommerceClient {
    private baseUrl;
    private connection;
    private logger;
    constructor(baseUrl: string, connection: Connection, logger?: any);
    get(endpoint: string, headers?: Record<string, string>): Promise<any>;
    post(endpoint: string, headers?: Record<string, string>, payload?: any): Promise<any>;
    put(endpoint: string, headers?: Record<string, string>, payload?: any): Promise<any>;
    delete(endpoint: string, headers?: Record<string, string>): Promise<any>;
    private apiCall;
    private getHttpClient;
}

declare class BasicAuthConnection implements Connection {
    private baseUrl;
    private username;
    private password;
    private logger;
    constructor(baseUrl: string, username: string, password: string, logger?: any);
    extend(commerceGot: any): Promise<any>;
}

declare class Oauth1aConnection implements Connection {
    private consumerKey;
    private consumerSecret;
    private accessToken;
    private accessTokenSecret;
    private logger;
    constructor(consumerKey: string, consumerSecret: string, accessToken: string, accessTokenSecret: string, logger?: any);
    extend(commerceGot: Got): Promise<Got>;
    headersProvider(): (url: string, method: string) => any;
}

declare class ImsConnection implements Connection {
    private clientId;
    private clientSecret;
    private technicalAccountId;
    private technicalAccountEmail;
    private imsOrgId;
    private scopes;
    private logger;
    private currentContext;
    constructor(clientId: string, clientSecret: string, technicalAccountId: string, technicalAccountEmail: string, imsOrgId: string, scopes: Array<string>, logger?: any, currentContext?: string);
    extend(commerceGot: any): Promise<any>;
}

interface TokenResult {
    token: string | null;
    expire_in: number;
}

declare class GenerateBasicAuthToken {
    private baseUrl;
    private username;
    private password;
    private key;
    private logger;
    private state;
    constructor(baseUrl: string, username: string, password: string, logger?: any);
    execute(): Promise<string | null>;
    getCommerceToken(): Promise<TokenResult | null>;
    createEndpoint(endpoint: string): string;
    setValue(result: TokenResult): Promise<boolean>;
    getValue(): Promise<string | null>;
    getState(): Promise<any>;
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

interface EventsOfInterestInputModel {
    provider_id: string;
    event_code: string;
}
interface RegistrationCreateModel {
    client_id: string;
    name: string;
    description?: string;
    webhook_url?: string;
    events_of_interest: EventsOfInterestInputModel[];
    delivery_type: 'webhook' | 'webhook_batch' | 'journal' | 'aws_eventbridge';
    runtime_action?: string;
    enabled?: boolean;
}

interface RegistrationListResponse {
    _embedded?: {
        registrations?: Registration[];
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
interface ListRegistrationQueryParams {
    [key: string]: string | number | boolean | undefined;
}

declare class RegistrationManager {
    private createService;
    private deleteService;
    private getService;
    private listService;
    constructor(clientId: string, consumerId: string, projectId: string, workspaceId: string, accessToken: string);
    create(registrationData: RegistrationCreateModel): Promise<Registration>;
    delete(registrationId: string): Promise<void>;
    get(registrationId: string): Promise<Registration>;
    list(queryParams?: ListRegistrationQueryParams): Promise<Registration[]>;
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

interface GetRegistrationQueryParams {
    consumerOrgId: string;
    projectId: string;
    workspaceId: string;
    registrationId: string;
}

export { AdobeAuth, AdobeCommerceClient, type AdobeIMSConfig, BasicAuthConnection, BearerToken, type BearerTokenInfo, type Connection, type CreateEventResult, CreateEvents, type CreateProviderParams, type CreateProviderResult, type CreateRegistrationResult, CreateRegistrations, type ErrorResponse, EventConsumerAction, type EventMetadata, type EventMetadataInputModel, type EventMetadataListResponse, EventMetadataManager, type ExtendedRequestError, type FileRecord, FileRepository, GenerateBasicAuthToken, type GetProviderQueryParams, type GetRegistrationQueryParams, GraphQlAction, type HALLink, type Headers, HttpMethod, HttpStatus, IOEventsApiError, type IOEventsError, ImsConnection, InfiniteLoopBreaker, type InfiniteLoopData, IoEventsGlobals, type ListProvidersQueryParams, type ListRegistrationQueryParams, Oauth1aConnection, OnboardEvents, type OnboardEventsInput, type OnboardEventsResponse, Openwhisk, OpenwhiskAction, Parameters, type Provider, type ProviderInputModel, ProviderManager, type Registration, type RegistrationCreateModel, type RegistrationListResponse, RegistrationManager, RestClient, RuntimeAction, RuntimeActionResponse, type RuntimeActionResponseType, type SuccessResponse, type TokenResult, Validator };
