/**
 * Test for Openwhisk class
 * Copyright © Adobe, Inc. All rights reserved.
 */

import Openwhisk from '../../../src/framework/openwhisk';

// Mock the openwhisk package
const mockInvoke = jest.fn();
jest.mock('openwhisk', () => {
  return jest.fn(() => ({
    actions: {
      invoke: mockInvoke,
    },
  }));
});

describe('Openwhisk', () => {
  let openwhiskClient: Openwhisk;
  let mockOpenwhisk: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInvoke.mockClear();
    mockOpenwhisk = require('openwhisk');
    openwhiskClient = new Openwhisk('https://test-host.com', 'test-api-key');
  });

  it('should be a class with constructor', () => {
    expect(typeof Openwhisk).toBe('function');
    expect(Openwhisk.name).toBe('Openwhisk');
    expect(openwhiskClient).toBeInstanceOf(Openwhisk);
  });

  it('should create openwhisk client with correct configuration', () => {
    expect(mockOpenwhisk).toHaveBeenCalledWith({
      apihost: 'https://test-host.com',
      api_key: 'test-api-key',
    });
  });

  it('should execute action with correct parameters', async () => {
    mockInvoke.mockResolvedValue({
      activationId: 'test-activation-id',
      response: {
        success: true,
        result: { message: 'success' },
      },
    });

    const actionName = 'test-action';
    const params = { name: 'test', value: 123 };

    const result = await openwhiskClient.execute(actionName, params);

    expect(mockInvoke).toHaveBeenCalledWith({
      name: actionName,
      blocking: true,
      params: params,
    });

    expect(result).toEqual({
      activationId: 'test-activation-id',
      response: {
        success: true,
        result: { message: 'success' },
      },
    });
  });

  it('should handle action execution with empty parameters', async () => {
    mockInvoke.mockResolvedValue({
      activationId: 'test-activation-id-empty',
      response: {
        success: true,
        result: {},
      },
    });

    const result = await openwhiskClient.execute('empty-action', {});

    expect(mockInvoke).toHaveBeenCalledWith({
      name: 'empty-action',
      blocking: true,
      params: {},
    });

    expect(result.activationId).toBe('test-activation-id-empty');
  });

  it('should handle action execution errors', async () => {
    mockInvoke.mockRejectedValue(new Error('Action execution failed'));

    await expect(openwhiskClient.execute('failing-action', { test: true })).rejects.toThrow(
      'Action execution failed'
    );

    expect(mockInvoke).toHaveBeenCalledWith({
      name: 'failing-action',
      blocking: true,
      params: { test: true },
    });
  });
});
