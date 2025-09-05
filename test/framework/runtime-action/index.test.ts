/**
 * Test for RuntimeAction class
 * <license header>
 */

import RuntimeAction from '../../../src/framework/runtime-action';
import { HttpMethod, HttpStatus } from '../../../src/framework/runtime-action/types';

describe('RuntimeAction', () => {
  it('should be a class with execute static method', () => {
    expect(typeof RuntimeAction).toBe('function');
    expect(RuntimeAction.name).toBe('RuntimeAction');
    expect(typeof RuntimeAction.execute).toBe('function');
  });

  it('should create an action handler function using execute method', () => {
    const actionHandler = RuntimeAction.execute(
      'test-action',
      [HttpMethod.GET],
      ['name'],
      [],
      async params => {
        return { statusCode: HttpStatus.OK, body: { message: 'Hello ' + params.name } };
      }
    );

    expect(typeof actionHandler).toBe('function');
  });

  it('should handle action execution with valid parameters', async () => {
    const actionHandler = RuntimeAction.execute(
      'test-action',
      [HttpMethod.GET],
      ['name'],
      [],
      async params => {
        return { statusCode: HttpStatus.OK, body: { message: 'Hello ' + params.name } };
      }
    );

    const params = {
      name: 'World',
      LOG_LEVEL: 'info',
      __ow_method: 'get',
    };

    const result = await actionHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.body).toEqual({ message: 'Hello World' });
    }
  });

  it('should handle missing required parameters', async () => {
    const actionHandler = RuntimeAction.execute(
      'test-action',
      [HttpMethod.GET],
      ['name', 'age'],
      [],
      async _params => {
        return { statusCode: HttpStatus.OK, body: { message: 'Success' } };
      }
    );

    const params = {
      name: 'World',
      LOG_LEVEL: 'info',
      // age is missing
    };

    const result = await actionHandler(params);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.error.body.error).toContain("missing parameter(s) 'age'");
    }
  });

  it('should use default values when parameters are not provided', () => {
    const actionHandler = RuntimeAction.execute();
    expect(typeof actionHandler).toBe('function');
  });

  it('should handle action execution without required params and headers', async () => {
    const actionHandler = RuntimeAction.execute('simple-action');

    const params = {
      LOG_LEVEL: 'info',
    };

    const result = await actionHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.body).toEqual({});
    }
  });

  it('should handle action execution errors and return 500 response', async () => {
    const actionHandler = RuntimeAction.execute(
      'error-action',
      [HttpMethod.POST],
      [],
      [],
      async () => {
        throw new Error('Something went wrong in action');
      }
    );

    const params = {
      LOG_LEVEL: 'info',
      __ow_method: 'post',
    };

    const result = await actionHandler(params);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.statusCode).toBe(HttpStatus.INTERNAL_ERROR);
      expect(result.error.body.error).toBe('server error');
    }
  });

  it('should handle invalid HTTP method and return 405 response', async () => {
    const actionHandler = RuntimeAction.execute(
      'method-action',
      [HttpMethod.GET, HttpMethod.POST],
      [],
      [],
      async () => {
        return { statusCode: HttpStatus.OK, body: { message: 'Success' } };
      }
    );

    const params = {
      LOG_LEVEL: 'info',
      __ow_method: 'delete', // invalid method
    };

    const result = await actionHandler(params);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.statusCode).toBe(HttpStatus.METHOD_NOT_ALLOWED);
      expect(result.error.body.error).toContain('Invalid HTTP method: delete');
      expect(result.error.body.error).toContain('Allowed methods are: get, post');
    }
  });

  it('should use default log level when LOG_LEVEL is not provided', async () => {
    const actionHandler = RuntimeAction.execute('default-log-action', [], [], [], async () => {
      return { statusCode: HttpStatus.OK, body: { message: 'No log level provided' } };
    });

    const params = {
      // No LOG_LEVEL provided - should default to 'info'
      name: 'test',
    };

    const result = await actionHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(result.body).toEqual({ message: 'No log level provided' });
    }
  });
});
