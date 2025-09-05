/**
 * <license header>
 */

import { IOEventsApiError, IoEventsGlobals } from '../../src/io-events/types';

describe('IO Events Types', () => {
  describe('IoEventsGlobals', () => {
    it('should have correct BASE_URL', () => {
      expect(IoEventsGlobals.BASE_URL).toBe('https://api.adobe.io');
    });

    it('should have correct STATUS_CODES', () => {
      expect(IoEventsGlobals.STATUS_CODES.OK).toBe(200);
      expect(IoEventsGlobals.STATUS_CODES.BAD_REQUEST).toBe(400);
      expect(IoEventsGlobals.STATUS_CODES.UNAUTHORIZED).toBe(401);
      expect(IoEventsGlobals.STATUS_CODES.FORBIDDEN).toBe(403);
      expect(IoEventsGlobals.STATUS_CODES.NOT_FOUND).toBe(404);
      expect(IoEventsGlobals.STATUS_CODES.REQUEST_TIMEOUT).toBe(408);
      expect(IoEventsGlobals.STATUS_CODES.TIMEOUT).toBe(408);
      expect(IoEventsGlobals.STATUS_CODES.CONFLICT).toBe(409);
      expect(IoEventsGlobals.STATUS_CODES.INTERNAL_SERVER_ERROR).toBe(500);
    });

    it('should have correct HEADERS', () => {
      expect(IoEventsGlobals.HEADERS.CONFLICTING_ID).toBe('x-conflicting-id');
    });

    it('should be immutable (as const)', () => {
      // This test ensures the object is properly typed as const
      const statusCodes = IoEventsGlobals.STATUS_CODES;
      expect(typeof statusCodes.OK).toBe('number');
    });
  });

  describe('IOEventsApiError', () => {
    it('should create error with message and status code only', () => {
      const error = new IOEventsApiError('Test error', 400);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBeUndefined();
      expect(error.details).toBeUndefined();
      expect(error.name).toBe('IOEventsApiError');
      expect(error instanceof Error).toBe(true);
      expect(error instanceof IOEventsApiError).toBe(true);
    });

    it('should create error with message, status code, and error code', () => {
      const error = new IOEventsApiError('Test error', 400, 'VALIDATION_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.details).toBeUndefined();
    });

    it('should create error with all parameters', () => {
      const error = new IOEventsApiError(
        'Test error',
        400,
        'VALIDATION_ERROR',
        'Additional details'
      );

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.errorCode).toBe('VALIDATION_ERROR');
      expect(error.details).toBe('Additional details');
    });

    it('should handle empty/undefined optional parameters', () => {
      const error1 = new IOEventsApiError('Test error', 400, '', '');
      expect(error1.errorCode).toBe('');
      expect(error1.details).toBe('');

      const error2 = new IOEventsApiError('Test error', 400, undefined, undefined);
      expect(error2.errorCode).toBeUndefined();
      expect(error2.details).toBeUndefined();
    });

    it('should preserve error stack trace', () => {
      const error = new IOEventsApiError('Test error', 400);
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('IOEventsApiError');
    });

    it('should work with different status codes from constants', () => {
      Object.entries(IoEventsGlobals.STATUS_CODES).forEach(([key, value]) => {
        const error = new IOEventsApiError(`${key} error`, value);
        expect(error.statusCode).toBe(value);
      });
    });

    it('should handle custom status codes not in constants', () => {
      const error = new IOEventsApiError('Custom error', 418);
      expect(error.statusCode).toBe(418);
    });

    it('should be throwable and catchable', () => {
      expect(() => {
        throw new IOEventsApiError('Test error', 400);
      }).toThrow(IOEventsApiError);

      expect(() => {
        throw new IOEventsApiError('Test error', 400);
      }).toThrow('Test error');

      try {
        throw new IOEventsApiError('Test error', 400, 'TEST_CODE', 'Test details');
      } catch (error) {
        expect(error instanceof IOEventsApiError).toBe(true);
        const ioError = error as IOEventsApiError;
        expect(ioError.statusCode).toBe(400);
        expect(ioError.errorCode).toBe('TEST_CODE');
        expect(ioError.details).toBe('Test details');
      }
    });
  });
});
