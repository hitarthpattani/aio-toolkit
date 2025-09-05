/**
 * <license header>
 */

/**
 * Commerce utilities for Adobe Commerce AIO Toolkit
 */

// Export Adobe Auth utility
export { default as AdobeAuth } from './adobe-auth';

// Export Adobe Commerce Client utility
export { default as AdobeCommerceClient } from './adobe-commerce-client';

// Export Adobe Commerce Client connection implementations
export { default as BasicAuthConnection } from './adobe-commerce-client/basic-auth-connection';
export { default as Oauth1aConnection } from './adobe-commerce-client/oauth1a-connection';
export { default as ImsConnection } from './adobe-commerce-client/ims-connection';
export { default as GenerateBasicAuthToken } from './adobe-commerce-client/basic-auth-connection/generate-basic-auth-token';

// Export Adobe Auth types
export type { AdobeIMSConfig } from './adobe-auth/types';

// Export Adobe Commerce Client types
export type { Connection, ExtendedRequestError } from './adobe-commerce-client/types';

// Export Basic Auth Token types
export type { TokenResult } from './adobe-commerce-client/basic-auth-connection/generate-basic-auth-token/types';
