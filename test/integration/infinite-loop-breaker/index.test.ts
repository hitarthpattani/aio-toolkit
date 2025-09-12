/**
 * <license header>
 */

import { Core, State } from '@adobe/aio-sdk';
import crypto from 'crypto';

import InfiniteLoopBreaker from '../../../src/integration/infinite-loop-breaker';
import { InfiniteLoopData } from '../../../src/integration/infinite-loop-breaker/types';

// Mock Adobe I/O SDK modules
jest.mock('@adobe/aio-sdk', () => ({
  Core: {
    Logger: jest.fn(() => ({
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    })),
  },
  State: {
    init: jest.fn(),
  },
}));

// Mock crypto module
jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn(),
    digest: jest.fn(() => 'mocked-hash'),
  })),
}));

describe('InfiniteLoopBreaker', () => {
  let mockState: any;
  let mockLogger: any;
  let mockHash: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock state instance
    mockState = {
      get: jest.fn(),
      put: jest.fn(),
    };
    (State.init as jest.Mock).mockResolvedValue(mockState);

    // Mock logger
    mockLogger = {
      debug: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
    };
    (Core.Logger as jest.Mock).mockReturnValue(mockLogger);

    // Mock crypto hash
    mockHash = {
      update: jest.fn(),
      digest: jest.fn(() => 'test-fingerprint'),
    };
    (crypto.createHash as jest.Mock).mockReturnValue(mockHash);

    // Reset environment variables
    delete process.env.LOG_LEVEL;
  });

  describe('isInfiniteLoop', () => {
    const mockInfiniteLoopData: InfiniteLoopData = {
      keyFn: 'test-key',
      fingerprintFn: { id: 1, data: 'test' },
      eventTypes: ['test.event', 'another.event'],
      event: 'test.event',
    };

    it('should return false when event is not in eventTypes list', async () => {
      const data = {
        ...mockInfiniteLoopData,
        event: 'unknown.event',
      };

      const result = await InfiniteLoopBreaker.isInfiniteLoop(data);

      expect(result).toBe(false);
      expect(Core.Logger).toHaveBeenCalledWith('infiniteLoopBreaker', { level: 'info' });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Checking for potential infinite loop for event: unknown.event'
      );
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Event type unknown.event is not in the infinite loop event types list'
      );
      expect(State.init).not.toHaveBeenCalled();
    });

    it('should return false when no persisted fingerprint is found', async () => {
      mockState.get.mockResolvedValue(null);

      const result = await InfiniteLoopBreaker.isInfiniteLoop(mockInfiniteLoopData);

      expect(result).toBe(false);
      expect(State.init).toHaveBeenCalled();
      expect(mockState.get).toHaveBeenCalledWith('test-key');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'No persisted fingerprint found for key test-key'
      );
    });

    it('should return true when persisted fingerprint matches generated fingerprint', async () => {
      const persistedData = { value: 'test-fingerprint' };
      mockState.get.mockResolvedValue(persistedData);

      const result = await InfiniteLoopBreaker.isInfiniteLoop(mockInfiniteLoopData);

      expect(result).toBe(true);
      expect(mockState.get).toHaveBeenCalledWith('test-key');
      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith(JSON.stringify({ id: 1, data: 'test' }));
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Persisted fingerprint found for key test-key: test-fingerprint, Generated fingerprint: test-fingerprint'
      );
    });

    it('should return false when persisted fingerprint does not match generated fingerprint', async () => {
      const persistedData = { value: 'different-fingerprint' };
      mockState.get.mockResolvedValue(persistedData);

      const result = await InfiniteLoopBreaker.isInfiniteLoop(mockInfiniteLoopData);

      expect(result).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Persisted fingerprint found for key test-key: different-fingerprint, Generated fingerprint: test-fingerprint'
      );
    });

    it('should handle keyFn and fingerprintFn as functions', async () => {
      mockState.get.mockResolvedValue(null);

      const data = {
        ...mockInfiniteLoopData,
        keyFn: (): string => 'function-key',
        fingerprintFn: (): { dynamic: string } => ({ dynamic: 'data' }),
      };

      const result = await InfiniteLoopBreaker.isInfiniteLoop(data);

      expect(result).toBe(false);
      expect(mockState.get).toHaveBeenCalledWith('function-key');
      // No hash operation expected since no persisted fingerprint was found
    });

    it('should use custom LOG_LEVEL from environment', async () => {
      process.env.LOG_LEVEL = 'debug';
      mockState.get.mockResolvedValue(null);

      await InfiniteLoopBreaker.isInfiniteLoop(mockInfiniteLoopData);

      expect(Core.Logger).toHaveBeenCalledWith('infiniteLoopBreaker', { level: 'debug' });
    });

    it('should handle mixed keyFn string and fingerprintFn function', async () => {
      mockState.get.mockResolvedValue(null);

      const data = {
        ...mockInfiniteLoopData,
        keyFn: 'string-key',
        fingerprintFn: (): string => 'function-data',
      };

      const result = await InfiniteLoopBreaker.isInfiniteLoop(data);

      expect(result).toBe(false);
      expect(mockState.get).toHaveBeenCalledWith('string-key');
      // No hash operation expected since no persisted fingerprint was found
    });

    it('should handle complex nested objects in fingerprintFn', async () => {
      mockState.get.mockResolvedValue(null);

      const complexData = {
        nested: {
          array: [1, 2, { deep: 'value' }],
          object: { key: 'value' },
        },
        timestamp: '2023-01-01T00:00:00Z',
      };

      const data = {
        ...mockInfiniteLoopData,
        fingerprintFn: complexData,
      };

      const result = await InfiniteLoopBreaker.isInfiniteLoop(data);

      expect(result).toBe(false);
      // No hash operation expected since no persisted fingerprint was found
    });
  });

  describe('storeFingerPrint', () => {
    it('should store fingerprint with custom TTL', async () => {
      const customTTL = 120;

      await InfiniteLoopBreaker.storeFingerPrint('test-key', { data: 'test' }, customTTL);

      expect(State.init).toHaveBeenCalled();
      expect(mockState.put).toHaveBeenCalledWith('test-key', 'test-fingerprint', {
        ttl: customTTL,
      });
      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.update).toHaveBeenCalledWith(JSON.stringify({ data: 'test' }));
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
    });

    it('should store fingerprint with default TTL when not specified', async () => {
      await InfiniteLoopBreaker.storeFingerPrint('test-key', { data: 'test' });

      expect(mockState.put).toHaveBeenCalledWith('test-key', 'test-fingerprint', { ttl: 60 });
    });

    it('should handle keyFn and fingerprintFn as functions', async () => {
      const keyFn = (): string => 'dynamic-key';
      const fingerprintFn = (): { dynamic: string } => ({ dynamic: 'fingerprint-data' });

      await InfiniteLoopBreaker.storeFingerPrint(keyFn, fingerprintFn, 90);

      expect(mockState.put).toHaveBeenCalledWith('dynamic-key', 'test-fingerprint', { ttl: 90 });
      expect(mockHash.update).toHaveBeenCalledWith(JSON.stringify({ dynamic: 'fingerprint-data' }));
    });

    it('should handle mixed string and function parameters', async () => {
      const fingerprintFn = (): string => 'dynamic-data';

      await InfiniteLoopBreaker.storeFingerPrint('string-key', fingerprintFn);

      expect(mockState.put).toHaveBeenCalledWith('string-key', 'test-fingerprint', { ttl: 60 });
      expect(mockHash.update).toHaveBeenCalledWith(JSON.stringify('dynamic-data'));
    });

    it('should handle null and undefined values in fingerprint data', async () => {
      const dataWithNulls = {
        nullValue: null,
        undefinedValue: undefined,
        emptyString: '',
        zero: 0,
        false: false,
      };

      await InfiniteLoopBreaker.storeFingerPrint('null-test-key', dataWithNulls);

      expect(mockHash.update).toHaveBeenCalledWith(JSON.stringify(dataWithNulls));
    });
  });

  describe('fnFingerprint', () => {
    it('should return a function that returns the provided object', () => {
      const testData = { id: 1, name: 'test' };
      const fingerprintFn = InfiniteLoopBreaker.fnFingerprint(testData);

      expect(typeof fingerprintFn).toBe('function');
      expect(fingerprintFn()).toEqual(testData);
    });

    it('should handle primitive values', () => {
      const stringFn = InfiniteLoopBreaker.fnFingerprint('test-string');
      const numberFn = InfiniteLoopBreaker.fnFingerprint(42);
      const booleanFn = InfiniteLoopBreaker.fnFingerprint(true);

      expect(stringFn()).toBe('test-string');
      expect(numberFn()).toBe(42);
      expect(booleanFn()).toBe(true);
    });

    it('should handle null and undefined values', () => {
      const nullFn = InfiniteLoopBreaker.fnFingerprint(null);
      const undefinedFn = InfiniteLoopBreaker.fnFingerprint(undefined);

      expect(nullFn()).toBe(null);
      expect(undefinedFn()).toBe(undefined);
    });

    it('should handle arrays and complex objects', () => {
      const arrayData = [1, 2, { nested: 'value' }];
      const complexData = {
        array: [1, 2, 3],
        nested: { deep: { value: 'test' } },
        function: (): string => 'test', // Functions won't be serialized but should not cause errors
      };

      const arrayFn = InfiniteLoopBreaker.fnFingerprint(arrayData);
      const complexFn = InfiniteLoopBreaker.fnFingerprint(complexData);

      expect(arrayFn()).toEqual(arrayData);
      expect(complexFn()).toEqual(complexData);
    });
  });

  describe('fnInfiniteLoopKey', () => {
    it('should return a function that returns the provided key', () => {
      const testKey = 'test-key-123';
      const keyFn = InfiniteLoopBreaker.fnInfiniteLoopKey(testKey);

      expect(typeof keyFn).toBe('function');
      expect(keyFn()).toBe(testKey);
    });

    it('should handle different types of keys', () => {
      const stringKeyFn = InfiniteLoopBreaker.fnInfiniteLoopKey('string-key');
      const numberKeyFn = InfiniteLoopBreaker.fnInfiniteLoopKey(123);
      const objectKeyFn = InfiniteLoopBreaker.fnInfiniteLoopKey({ id: 'object-key' });

      expect(stringKeyFn()).toBe('string-key');
      expect(numberKeyFn()).toBe(123);
      expect(objectKeyFn()).toEqual({ id: 'object-key' });
    });

    it('should handle null and undefined keys', () => {
      const nullKeyFn = InfiniteLoopBreaker.fnInfiniteLoopKey(null);
      const undefinedKeyFn = InfiniteLoopBreaker.fnInfiniteLoopKey(undefined);

      expect(nullKeyFn()).toBe(null);
      expect(undefinedKeyFn()).toBe(undefined);
    });
  });

  describe('fingerPrint (private method integration)', () => {
    it('should generate consistent fingerprints for identical data', async () => {
      const data1 = { id: 1, name: 'test' };
      const data2 = { id: 1, name: 'test' };

      await InfiniteLoopBreaker.storeFingerPrint('key1', data1);
      await InfiniteLoopBreaker.storeFingerPrint('key2', data2);

      // Both calls should generate the same fingerprint for identical data
      expect(mockHash.update).toHaveBeenCalledWith(JSON.stringify(data1));
      expect(mockHash.update).toHaveBeenCalledWith(JSON.stringify(data2));
      expect(mockState.put).toHaveBeenCalledTimes(2);
      expect(mockState.put).toHaveBeenNthCalledWith(1, 'key1', 'test-fingerprint', { ttl: 60 });
      expect(mockState.put).toHaveBeenNthCalledWith(2, 'key2', 'test-fingerprint', { ttl: 60 });
    });

    it('should use SHA256 algorithm and hex encoding', async () => {
      await InfiniteLoopBreaker.storeFingerPrint('test-key', 'test-data');

      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
    });

    it('should handle JSON serialization of complex objects', async () => {
      const complexObject = {
        string: 'value',
        number: 123,
        boolean: true,
        array: [1, 2, { nested: 'value' }],
        nested: {
          deep: {
            value: 'test',
            array: ['a', 'b', 'c'],
          },
        },
        nullValue: null,
      };

      await InfiniteLoopBreaker.storeFingerPrint('complex-key', complexObject);

      expect(mockHash.update).toHaveBeenCalledWith(JSON.stringify(complexObject));
    });
  });

  describe('Integration scenarios', () => {
    it('should handle complete infinite loop detection workflow', async () => {
      const eventData = { orderId: '12345', status: 'updated' };
      const keyFn = (): string => `order-${eventData.orderId}`;
      const fingerprintFn = (): { orderId: string; status: string } => eventData;

      // First, store the fingerprint
      await InfiniteLoopBreaker.storeFingerPrint(keyFn, fingerprintFn, 30);

      // Then check for infinite loop with the same data
      mockState.get.mockResolvedValue({ value: 'test-fingerprint' });

      const isLoop = await InfiniteLoopBreaker.isInfiniteLoop({
        keyFn,
        fingerprintFn,
        eventTypes: ['order.updated'],
        event: 'order.updated',
      });

      expect(isLoop).toBe(true);
      expect(mockState.put).toHaveBeenCalledWith('order-12345', 'test-fingerprint', { ttl: 30 });
      expect(mockState.get).toHaveBeenCalledWith('order-12345');
    });

    it('should handle different event data resulting in different fingerprints', async () => {
      const originalData = { orderId: '12345', status: 'updated' };
      const modifiedData = { orderId: '12345', status: 'processed' };

      // Store original fingerprint
      await InfiniteLoopBreaker.storeFingerPrint('order-12345', originalData);

      // Check with modified data (should not be infinite loop)
      mockState.get.mockResolvedValue({ value: 'original-fingerprint' });
      mockHash.digest.mockReturnValue('different-fingerprint');

      const isLoop = await InfiniteLoopBreaker.isInfiniteLoop({
        keyFn: 'order-12345',
        fingerprintFn: modifiedData,
        eventTypes: ['order.updated'],
        event: 'order.updated',
      });

      expect(isLoop).toBe(false);
    });

    it('should handle State.init failure gracefully', async () => {
      (State.init as jest.Mock).mockRejectedValue(new Error('State initialization failed'));

      await expect(
        InfiniteLoopBreaker.isInfiniteLoop({
          keyFn: 'test-key',
          fingerprintFn: 'test-data',
          eventTypes: ['test.event'],
          event: 'test.event',
        })
      ).rejects.toThrow('State initialization failed');
    });

    it('should handle state.get failure', async () => {
      mockState.get.mockRejectedValue(new Error('State get failed'));

      await expect(
        InfiniteLoopBreaker.isInfiniteLoop({
          keyFn: 'test-key',
          fingerprintFn: 'test-data',
          eventTypes: ['test.event'],
          event: 'test.event',
        })
      ).rejects.toThrow('State get failed');
    });

    it('should handle state.put failure', async () => {
      mockState.put.mockRejectedValue(new Error('State put failed'));

      await expect(InfiniteLoopBreaker.storeFingerPrint('test-key', 'test-data')).rejects.toThrow(
        'State put failed'
      );
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle empty eventTypes array', async () => {
      const result = await InfiniteLoopBreaker.isInfiniteLoop({
        keyFn: 'test-key',
        fingerprintFn: 'test-data',
        eventTypes: [],
        event: 'test.event',
      });

      expect(result).toBe(false);
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'Event type test.event is not in the infinite loop event types list'
      );
    });

    it('should handle empty event string', async () => {
      const result = await InfiniteLoopBreaker.isInfiniteLoop({
        keyFn: 'test-key',
        fingerprintFn: 'test-data',
        eventTypes: ['test.event'],
        event: '',
      });

      expect(result).toBe(false);
    });

    it('should handle functions that return null or undefined', async () => {
      mockState.get.mockResolvedValue(null);

      const result = await InfiniteLoopBreaker.isInfiniteLoop({
        keyFn: (): any => null as any,
        fingerprintFn: (): undefined => undefined,
        eventTypes: ['test.event'],
        event: 'test.event',
      });

      expect(result).toBe(false);
      expect(mockState.get).toHaveBeenCalledWith(null);
      // No hash operation expected since no persisted fingerprint was found
    });

    it('should handle circular reference in fingerprint data', async () => {
      const circularObj: any = { name: 'test' };
      circularObj.self = circularObj;

      // JSON.stringify should be called, but will throw for circular references
      // The error should be handled by the calling code or allowed to propagate
      await expect(
        InfiniteLoopBreaker.storeFingerPrint('circular-key', circularObj)
      ).rejects.toThrow();
    });

    it('should handle TTL of 0', async () => {
      await InfiniteLoopBreaker.storeFingerPrint('test-key', 'test-data', 0);

      expect(mockState.put).toHaveBeenCalledWith('test-key', 'test-fingerprint', { ttl: 0 });
    });

    it('should handle negative TTL', async () => {
      await InfiniteLoopBreaker.storeFingerPrint('test-key', 'test-data', -1);

      expect(mockState.put).toHaveBeenCalledWith('test-key', 'test-fingerprint', { ttl: -1 });
    });
  });

  describe('Logger configuration', () => {
    it('should create logger with correct name and level', async () => {
      process.env.LOG_LEVEL = 'error';

      await InfiniteLoopBreaker.isInfiniteLoop({
        keyFn: 'test-key',
        fingerprintFn: 'test-data',
        eventTypes: ['other.event'],
        event: 'test.event',
      });

      expect(Core.Logger).toHaveBeenCalledWith('infiniteLoopBreaker', { level: 'error' });
    });

    it('should use info level when LOG_LEVEL is not set', async () => {
      delete process.env.LOG_LEVEL;

      await InfiniteLoopBreaker.isInfiniteLoop({
        keyFn: 'test-key',
        fingerprintFn: 'test-data',
        eventTypes: ['other.event'],
        event: 'test.event',
      });

      expect(Core.Logger).toHaveBeenCalledWith('infiniteLoopBreaker', { level: 'info' });
    });

    it('should log all debug messages in correct order', async () => {
      mockState.get.mockResolvedValue({ value: 'test-fingerprint' });

      await InfiniteLoopBreaker.isInfiniteLoop({
        keyFn: 'debug-key',
        fingerprintFn: 'debug-data',
        eventTypes: ['debug.event'],
        event: 'debug.event',
      });

      expect(mockLogger.debug).toHaveBeenCalledTimes(2);
      expect(mockLogger.debug).toHaveBeenNthCalledWith(
        1,
        'Checking for potential infinite loop for event: debug.event'
      );
      expect(mockLogger.debug).toHaveBeenNthCalledWith(
        2,
        'Persisted fingerprint found for key debug-key: test-fingerprint, Generated fingerprint: test-fingerprint'
      );
    });
  });

  describe('Constants and static properties', () => {
    it('should use correct algorithm and encoding for fingerprinting', async () => {
      // Test the constants indirectly by verifying crypto.createHash is called with correct algorithm
      await InfiniteLoopBreaker.storeFingerPrint('test', 'data');

      expect(crypto.createHash).toHaveBeenCalledWith('sha256');
      expect(mockHash.digest).toHaveBeenCalledWith('hex');
    });

    it('should use correct default TTL', async () => {
      await InfiniteLoopBreaker.storeFingerPrint('test', 'data');

      expect(mockState.put).toHaveBeenCalledWith('test', 'test-fingerprint', { ttl: 60 });
    });
  });
});
