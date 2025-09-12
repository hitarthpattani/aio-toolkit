/**
 * <license header>
 */

declare module '@adobe/aio-sdk' {
  interface Logger {
    info(message: any): void;
    debug(message: any): void;
    error(message: any): void;
    warn(message: any): void;
  }

  interface LoggerOptions {
    level?: string;
  }

  export namespace Core {
    function Logger(name: string, options?: LoggerOptions): Logger;
  }

  // Add other interfaces as needed for the SDK
  export interface Config {
    get(key: string): any;
    set(key: string, value: any): void;
  }

  export interface State {
    get(key: string): any;
    put(key: string, value: any, options?: { ttl?: number }): Promise<void>;
    delete(key: string): Promise<void>;
  }

  export namespace State {
    function init(): Promise<State>;
  }

  // UUID utility functions (using Node.js crypto.randomUUID)
  export namespace Utils {
    function uuid(): string;
  }

  // Files storage interface
  export interface Files {
    list(path: string): Promise<Array<{ name: string }>>;
    read(path: string): Promise<Buffer>;
    write(path: string, data: string): Promise<void>;
    delete(path: string): Promise<void>;
  }

  export namespace Files {
    function init(): Promise<Files>;
  }
}
