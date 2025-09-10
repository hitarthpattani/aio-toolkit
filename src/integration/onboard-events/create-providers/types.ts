/**
 * <license header>
 */

/**
 * Provider creation result interface
 */
export interface CreateProviderResult {
  created: boolean;
  skipped: boolean;
  provider: {
    id?: string;
    instanceId?: string;
    label: string;
    originalLabel: string;
    description?: string;
    docsUrl?: string | null;
  };
  error?: string;
  reason?: string;
  raw?: any;
}
