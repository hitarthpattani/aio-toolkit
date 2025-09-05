/**
 * Type declarations for @adobe/aio-lib-ims
 *
 * <license header>
 */

declare module '@adobe/aio-lib-ims' {
  export interface Context {
    setCurrent(contextName: string): Promise<void>;
    set(contextName: string, config: any): Promise<void>;
  }

  export const context: Context;
  export function getToken(): Promise<string>;
}
