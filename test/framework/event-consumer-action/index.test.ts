/**
 * Test for EventConsumerAction class
 * <license header>
 */

import EventConsumerAction from '../../../src/framework/event-consumer-action';
import { HttpStatus } from '../../../src/framework/runtime-action/types';

describe('EventConsumerAction', () => {
  it('should be a class with execute static method', () => {
    expect(typeof EventConsumerAction).toBe('function');
    expect(EventConsumerAction.name).toBe('EventConsumerAction');
    expect(typeof EventConsumerAction.execute).toBe('function');
  });

  it('should create an action handler function using execute method', () => {
    const actionHandler = EventConsumerAction.execute(
      'test-event-action',
      ['name'],
      ['Authorization'],
      async _params => {
        return { statusCode: HttpStatus.OK, body: { message: 'Hello Event World' } };
      }
    );

    expect(typeof actionHandler).toBe('function');
  });

  it('should handle event action execution with valid parameters', async () => {
    const actionHandler = EventConsumerAction.execute(
      'test-event-action',
      ['name'],
      ['Authorization'],
      async _params => {
        return { statusCode: HttpStatus.OK, body: { message: 'Hello Event World' } };
      }
    );

    const params = {
      name: 'test',
      __ow_headers: {
        authorization: 'Bearer token123',
      },
    };

    const result = await actionHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.body).toEqual({ message: 'Hello Event World' });
    }
  });

  it('should handle missing required parameters', async () => {
    const actionHandler = EventConsumerAction.execute(
      'test-event-action',
      ['requiredParam'],
      ['Authorization']
    );

    const params = {
      __ow_headers: {
        authorization: 'Bearer token123',
      },
    };

    const result = await actionHandler(params);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.statusCode).toBe(HttpStatus.BAD_REQUEST);
    }
  });

  it('should handle missing required headers', async () => {
    const actionHandler = EventConsumerAction.execute(
      'test-event-action',
      ['name'],
      ['Authorization']
    );

    const params = {
      name: 'test',
      __ow_headers: {},
    };

    const result = await actionHandler(params);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.statusCode).toBe(HttpStatus.BAD_REQUEST);
    }
  });

  it('should use default values when parameters are not provided', async () => {
    const actionHandler = EventConsumerAction.execute();

    const params = {
      __ow_headers: {},
    };

    const result = await actionHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.body).toEqual({});
    }
  });

  it('should handle event action execution without required params and headers', async () => {
    const actionHandler = EventConsumerAction.execute('simple-event-action');

    const params = {};

    const result = await actionHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.body).toEqual({});
    }
  });

  it('should handle event action execution errors and return 500 response', async () => {
    const actionHandler = EventConsumerAction.execute('error-event-action', [], [], async () => {
      throw new Error('Something went wrong in event action');
    });

    const params = {};

    const result = await actionHandler(params);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.statusCode).toBe(HttpStatus.INTERNAL_ERROR);
      expect(result.error.body.error).toBe('server error');
    }
  });

  it('should use default log level when LOG_LEVEL is not provided', async () => {
    const actionHandler = EventConsumerAction.execute(
      'default-log-event-action',
      [],
      [],
      async () => {
        return { statusCode: HttpStatus.OK, body: { message: 'No log level provided' } };
      }
    );

    const params = {};

    const result = await actionHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.body).toEqual({ message: 'No log level provided' });
    }
  });
});
