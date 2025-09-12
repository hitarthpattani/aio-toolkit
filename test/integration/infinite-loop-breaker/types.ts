/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

/**
 * Interface for infinite loop data containing key and fingerprint functions
 */
export interface InfiniteLoopData {
  /** Function or string to generate the key for the fingerprint */
  keyFn: string | (() => string);

  /** Function or string to generate the fingerprint */
  fingerprintFn: string | (() => any);

  /** The event types to include in the infinite loop check */
  eventTypes: string[];

  /** The event to check for potential infinite loops */
  event: string;
}
