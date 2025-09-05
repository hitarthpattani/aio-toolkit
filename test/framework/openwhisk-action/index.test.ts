/**
 * Test for OpenwhiskAction class
 * <license header>
 */

import OpenwhiskAction from '../../../src/framework/openwhisk-action';
import { HttpStatus } from '../../../src/framework/runtime-action/types';

describe('OpenwhiskAction', () => {
  it('should be a class with execute static method', () => {
    expect(typeof OpenwhiskAction).toBe('function');
    expect(OpenwhiskAction.name).toBe('OpenwhiskAction');
    expect(typeof OpenwhiskAction.execute).toBe('function');
  });

  it('should create an action handler function using execute method', () => {
    const actionHandler = OpenwhiskAction.execute('test-webhook-action', async _params => {
      return { statusCode: HttpStatus.OK, body: { message: 'Hello Webhook World' } };
    });

    expect(typeof actionHandler).toBe('function');
  });

  it('should handle webhook action execution with valid parameters', async () => {
    const actionHandler = OpenwhiskAction.execute('test-webhook-action', async _params => {
      return { statusCode: HttpStatus.OK, body: { message: 'Hello Webhook World' } };
    });

    const params = {
      name: 'test',
      __ow_headers: {
        'content-type': 'application/json',
      },
    };

    const result = await actionHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.body).toEqual({ message: 'Hello Webhook World' });
    }
  });

  it('should use default values when parameters are not provided', async () => {
    const actionHandler = OpenwhiskAction.execute();

    const params = {};

    const result = await actionHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.body).toEqual({});
    }
  });

  it('should handle webhook action execution without headers', async () => {
    const actionHandler = OpenwhiskAction.execute('simple-webhook-action');

    const params = {};

    const result = await actionHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.body).toEqual({});
    }
  });

  it('should handle webhook action execution errors and return 500 response', async () => {
    const actionHandler = OpenwhiskAction.execute('error-webhook-action', async () => {
      throw new Error('Something went wrong in webhook action');
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
    const actionHandler = OpenwhiskAction.execute('default-log-webhook-action', async () => {
      return { statusCode: HttpStatus.OK, body: { message: 'No log level provided' } };
    });

    const params = {};

    const result = await actionHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.body).toEqual({ message: 'No log level provided' });
    }
  });

  it('should pass logger and headers context to action function', async () => {
    let receivedContext: any = null;

    const actionHandler = OpenwhiskAction.execute(
      'context-webhook-action',
      async (_params, ctx) => {
        receivedContext = ctx;
        return { statusCode: HttpStatus.OK, body: { received: 'context' } };
      }
    );

    const params = {
      __ow_headers: {
        'user-agent': 'test-agent',
        authorization: 'Bearer token123',
      },
    };

    const result = await actionHandler(params);

    expect(receivedContext).not.toBeNull();
    expect(receivedContext.logger).toBeDefined();
    expect(typeof receivedContext.logger.info).toBe('function');
    expect(receivedContext.headers).toEqual(params.__ow_headers);

    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.body).toEqual({ received: 'context' });
    }
  });

  it('should handle custom LOG_LEVEL parameter', async () => {
    const actionHandler = OpenwhiskAction.execute('debug-webhook-action', async () => {
      return { statusCode: HttpStatus.OK, body: { debug: true } };
    });

    const params = {
      LOG_LEVEL: 'debug',
      test: 'data',
    };

    const result = await actionHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.body).toEqual({ debug: true });
    }
  });
});
