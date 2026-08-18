// Deno runtime type declarations for IDE support
// This file allows the standard TypeScript language server to understand
// Deno-specific globals without requiring the Deno VS Code extension.

declare namespace Deno {
  /** Deno environment variable access */
  export interface Env {
    /** Get the value of an environment variable */
    get(key: string): string | undefined;
    /** Set an environment variable */
    set(key: string, value: string): void;
    /** Check if an environment variable exists */
    has(key: string): boolean;
    /** Delete an environment variable */
    delete(key: string): void;
    /** Return all environment variables as a plain object */
    toObject(): Record<string, string>;
  }
  export const env: Env;

  /** Start an HTTP server */
  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
    options?: {
      port?: number;
      hostname?: string;
      signal?: AbortSignal;
      onListen?: (params: { hostname: string; port: number }) => void;
    }
  ): Promise<void>;
}

// Map Deno-style URL imports to their npm equivalents so TypeScript can
// resolve types from the root node_modules folder.

declare module "https://esm.sh/@supabase/supabase-js@2.45.0" {
  export * from "@supabase/supabase-js";
}

declare module "npm:mqtt@5.10.4" {
  export * from "mqtt";
  import mqtt from "mqtt";
  export default mqtt;
}
