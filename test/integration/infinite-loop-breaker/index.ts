/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import { Core, State } from '@adobe/aio-sdk';
import crypto from 'crypto';

import { InfiniteLoopData } from './types';

/**
 * Utility class for detecting and preventing infinite loops in event processing
 */
class InfiniteLoopBreaker {
  /** The algorithm used to generate the fingerprint */
  private static readonly FINGERPRINT_ALGORITHM = 'sha256';

  /** The encoding used to generate the fingerprint */
  private static readonly FINGERPRINT_ENCODING = 'hex';

  /** The default time to live for the fingerprint in the lib state */
  private static readonly DEFAULT_INFINITE_LOOP_BREAKER_TTL = 60; // seconds

  /**
   * This function checks if there is a potential infinite loop
   *
   * @param state - The state object
   * @param infiniteLoopData - The event data containing the key and fingerprint functions, event types, and event name
   * @returns Returns true if the event is a potential infinite loop
   */
  static async isInfiniteLoop({
    keyFn,
    fingerprintFn,
    eventTypes,
    event,
  }: InfiniteLoopData): Promise<boolean> {
    const logLevel = process.env.LOG_LEVEL || 'info';
    const logger = Core.Logger('infiniteLoopBreaker', { level: logLevel });

    logger.debug(`Checking for potential infinite loop for event: ${event}`);

    if (!eventTypes.includes(event)) {
      logger.debug(`Event type ${event} is not in the infinite loop event types list`);
      return false;
    }

    const key = typeof keyFn === 'function' ? keyFn() : keyFn;
    const data = typeof fingerprintFn === 'function' ? fingerprintFn() : fingerprintFn;

    // Create a state instance
    const state = await State.init();
    const persistedFingerPrint = await state.get(key);
    if (!persistedFingerPrint) {
      logger.debug(`No persisted fingerprint found for key ${key}`);
      return false;
    }

    logger.debug(
      `Persisted fingerprint found for key ${key}: ${persistedFingerPrint.value}, ` +
        `Generated fingerprint: ${InfiniteLoopBreaker.fingerPrint(data)}`
    );

    return (
      persistedFingerPrint && persistedFingerPrint.value === InfiniteLoopBreaker.fingerPrint(data)
    );
  }

  /**
   * This function stores the fingerprint in the state
   *
   * @param keyFn - Function to generate the key for the fingerprint
   * @param fingerprintFn - Function to generate the fingerprint
   * @param ttl - The time to live for the fingerprint in the lib state
   */
  static async storeFingerPrint(
    keyFn: string | (() => string),
    fingerprintFn: string | (() => any),
    ttl?: number
  ): Promise<void> {
    const key = typeof keyFn === 'function' ? keyFn() : keyFn;
    const data = typeof fingerprintFn === 'function' ? fingerprintFn() : fingerprintFn;

    // Create a state instance
    const state = await State.init();

    await state.put(key, InfiniteLoopBreaker.fingerPrint(data), {
      ttl: ttl || InfiniteLoopBreaker.DEFAULT_INFINITE_LOOP_BREAKER_TTL,
    });
  }

  /**
   * This function generates a function to generate fingerprint for the data to be used in infinite loop detection based on params.
   *
   * @param obj - Data received from the event
   * @returns The function that generates the fingerprint
   */
  static fnFingerprint(obj: any): () => any {
    return () => {
      return obj;
    };
  }

  /**
   * This function generates a function to create a key for the infinite loop detection based on params.
   *
   * @param key - Data received from the event
   * @returns The function that generates the key
   */
  static fnInfiniteLoopKey(key: any): () => any {
    return () => {
      return key;
    };
  }

  /**
   * This function generates a fingerprint for the data
   *
   * @param data - The data to generate the fingerprint
   * @returns The fingerprint
   */
  private static fingerPrint(data: any): string {
    const hash = crypto.createHash(InfiniteLoopBreaker.FINGERPRINT_ALGORITHM);
    hash.update(JSON.stringify(data));
    return hash.digest(InfiniteLoopBreaker.FINGERPRINT_ENCODING);
  }
}

export default InfiniteLoopBreaker;
