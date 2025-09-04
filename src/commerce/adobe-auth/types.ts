/**
 * Interface defining the configuration required for Adobe IMS authentication
 */
export interface AdobeIMSConfig {
  client_id: string;
  client_secrets: string[];
  technical_account_id: string;
  technical_account_email: string;
  ims_org_id: string;
  scopes: string[];
}
