/**
 * Test for WebhookAction class
 * <license header>
 */

import WebhookAction from '../../../src/framework/webhook-action';
import WebhookActionResponse from '../../../src/framework/webhook-action/response';
import { HttpStatus } from '../../../src/framework/runtime-action/types';
import { SignatureVerification } from '../../../src/framework/webhook-action/types';
import * as crypto from 'crypto';

// Mock the entire crypto module at the top level
jest.mock('crypto', () => {
  const originalCrypto = jest.requireActual('crypto');
  return {
    ...originalCrypto,
    createVerify: jest.fn(),
  };
});

describe('WebhookAction', () => {
  let mockCreateVerify: jest.MockedFunction<typeof crypto.createVerify>;

  beforeEach(() => {
    mockCreateVerify = crypto.createVerify as jest.MockedFunction<typeof crypto.createVerify>;
    mockCreateVerify.mockClear();
  });

  it('should be a class with execute static method', () => {
    expect(typeof WebhookAction).toBe('function');
    expect(WebhookAction.name).toBe('WebhookAction');
    expect(typeof WebhookAction.execute).toBe('function');
  });

  it('should create a webhook handler function using execute method', () => {
    const webhookHandler = WebhookAction.execute(
      'test-webhook',
      ['name'],
      ['Authorization'],
      SignatureVerification.DISABLED,
      async _params => {
        return { statusCode: HttpStatus.OK, body: { message: 'Hello WebhookAction World' } };
      }
    );
    expect(typeof webhookHandler).toBe('function');
  });

  it('should handle webhook execution with disabled signature verification', async () => {
    const webhookHandler = WebhookAction.execute(
      'test-webhook',
      [],
      [],
      SignatureVerification.DISABLED,
      (async (_params, _ctx) => {
        return WebhookActionResponse.success();
      }) as any
    );

    const params = {
      __ow_headers: {},
      __ow_body: null,
      __ow_method: 'post',
    };

    const result = await webhookHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(typeof result.body).toBe('string');
      const operations = JSON.parse(result.body as string);
      expect(Array.isArray(operations)).toBe(true);
      expect(operations[0].op).toBe('success');
    }
  });

  it('should parse JSON payload from __ow_body', async () => {
    const testPayload = { userId: '123', action: 'create' };
    const encodedPayload = btoa(JSON.stringify(testPayload));

    const webhookHandler = WebhookAction.execute(
      'test-webhook',
      [],
      [],
      SignatureVerification.DISABLED,
      (async (params, _ctx) => {
        // Check if payload was merged with params
        expect(params.userId).toBe('123');
        expect(params.action).toBe('create');
        return WebhookActionResponse.success();
      }) as any
    );

    const params = {
      __ow_headers: {},
      __ow_body: encodedPayload,
      __ow_method: 'post',
    };

    await webhookHandler(params);
  });

  it('should handle invalid JSON payload gracefully', async () => {
    const invalidPayload = btoa('invalid-json');

    const webhookHandler = WebhookAction.execute(
      'test-webhook',
      [],
      [],
      SignatureVerification.DISABLED,
      (async (_params, _ctx) => {
        return WebhookActionResponse.success();
      }) as any
    );

    const params = {
      __ow_headers: {},
      __ow_body: invalidPayload,
      __ow_method: 'post',
    };

    const result = await webhookHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
    }
  });

  it('should handle missing required parameters', async () => {
    const webhookHandler = WebhookAction.execute(
      'test-webhook',
      ['requiredParam'],
      [],
      SignatureVerification.DISABLED
    );

    const params = {
      __ow_headers: {},
      __ow_body: null,
      __ow_method: 'post',
    };

    const result = await webhookHandler(params);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.error.body.error).toBe("missing parameter(s) 'requiredParam'");
    }
  });

  it('should handle missing required headers', async () => {
    const webhookHandler = WebhookAction.execute(
      'test-webhook',
      [],
      ['Authorization'],
      SignatureVerification.DISABLED
    );

    const params = {
      __ow_headers: {},
      __ow_body: null,
      __ow_method: 'post',
    };

    const result = await webhookHandler(params);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.error.body.error).toBe("missing header(s) 'authorization'");
    }
  });

  it('should handle signature verification with missing public key', async () => {
    const webhookHandler = WebhookAction.execute(
      'test-webhook',
      [],
      [],
      SignatureVerification.ENABLED
    );

    const params = {
      __ow_headers: {},
      __ow_body: null,
      __ow_method: 'post',
    };

    const result = await webhookHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      const operations = JSON.parse(result.body as string);
      expect(operations[0].op).toBe('exception');
      expect(operations[0].class).toBe('Magento\\Framework\\Exception\\LocalizedException');
      expect(operations[0].message).toBe('The public key is invalid');
    }
  });

  it('should use default values when parameters are not provided', async () => {
    const webhookHandler = WebhookAction.execute();

    const params = {
      __ow_headers: {
        authorization: 'Bearer token123',
      },
      __ow_body: null,
      __ow_method: 'post',
    };

    const result = await webhookHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
    }
  });

  it('should handle webhook execution errors and return error response', async () => {
    const webhookHandler = WebhookAction.execute(
      'error-webhook',
      [],
      [],
      SignatureVerification.DISABLED,
      async () => {
        throw new Error('Something went wrong in webhook');
      }
    );

    const params = {
      __ow_headers: {},
      __ow_body: null,
      __ow_method: 'post',
    };

    const result = await webhookHandler(params);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.statusCode).toBe(HttpStatus.INTERNAL_ERROR);
      expect(result.error.body.error).toBe('server error');
    }
  });

  it('should pass logger and headers context to action function', async () => {
    const mockAction = jest.fn(async (_params, _ctx) => {
      return WebhookActionResponse.success();
    }) as any;

    const webhookHandler = WebhookAction.execute(
      'context-webhook',
      [],
      [],
      SignatureVerification.DISABLED,
      mockAction
    );

    const params = {
      __ow_headers: { 'x-custom-header': 'value' },
      __ow_body: null,
      __ow_method: 'post',
    };

    await webhookHandler(params);
    expect(mockAction).toHaveBeenCalledWith(params, {
      logger: expect.any(Object),
      headers: { 'x-custom-header': 'value' },
    });
  });

  it('should handle custom LOG_LEVEL parameter for debug logging', async () => {
    const testPayload = { test: 'data' };
    const encodedPayload = btoa(JSON.stringify(testPayload));

    const webhookHandler = WebhookAction.execute(
      'debug-webhook',
      [],
      [],
      SignatureVerification.DISABLED,
      (async (_params, _ctx) => {
        return WebhookActionResponse.success();
      }) as any
    );

    const params = {
      LOG_LEVEL: 'debug',
      __ow_headers: {},
      __ow_body: encodedPayload,
      __ow_method: 'post',
    };

    const result = await webhookHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
    }
  });

  it('should handle signature verification with valid signature', async () => {
    // Mock crypto module for signature verification
    const mockVerify = {
      update: jest.fn(),
      verify: jest.fn().mockReturnValue(true),
    };

    mockCreateVerify.mockReturnValue(mockVerify as any);

    const webhookHandler = WebhookAction.execute(
      'signed-webhook',
      [],
      [],
      SignatureVerification.ENABLED,
      (async (_params, _ctx) => {
        return WebhookActionResponse.success();
      }) as any
    );

    const params = {
      PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\nMOCK_KEY\n-----END PUBLIC KEY-----',
      __ow_headers: {
        'x-adobe-commerce-webhook-signature': 'valid-signature',
      },
      __ow_body: 'test-body',
      __ow_method: 'post',
    };

    const result = await webhookHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      const operations = JSON.parse(result.body as string);
      expect(operations[0].op).toBe('success');
    }

    expect(mockCreateVerify).toHaveBeenCalledWith('SHA256');
    expect(mockVerify.update).toHaveBeenCalledWith('test-body');
    expect(mockVerify.verify).toHaveBeenCalledWith(
      '-----BEGIN PUBLIC KEY-----\nMOCK_KEY\n-----END PUBLIC KEY-----',
      'valid-signature',
      'base64'
    );
  });

  it('should handle signature verification with invalid signature', async () => {
    // Mock crypto module for signature verification
    const mockVerify = {
      update: jest.fn(),
      verify: jest.fn().mockReturnValue(false),
    };

    mockCreateVerify.mockReturnValue(mockVerify as any);

    const webhookHandler = WebhookAction.execute(
      'signed-webhook',
      [],
      [],
      SignatureVerification.ENABLED,
      (async (_params, _ctx) => {
        return WebhookActionResponse.success();
      }) as any
    );

    const params = {
      PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\nMOCK_KEY\n-----END PUBLIC KEY-----',
      __ow_headers: {
        'x-adobe-commerce-webhook-signature': 'invalid-signature',
      },
      __ow_body: 'test-body',
      __ow_method: 'post',
    };

    const result = await webhookHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      const operations = JSON.parse(result.body as string);
      expect(operations[0].op).toBe('exception');
      expect(operations[0].class).toBe('Magento\\Framework\\Exception\\LocalizedException');
      expect(operations[0].message).toBe('The signature is invalid.');
    }
  });

  it('should handle signature verification with base64 encoded public key', async () => {
    // Mock crypto module for signature verification
    const mockVerify = {
      update: jest.fn(),
      verify: jest.fn().mockReturnValue(true),
    };

    mockCreateVerify.mockReturnValue(mockVerify as any);

    const webhookHandler = WebhookAction.execute(
      'base64-signed-webhook',
      [],
      [],
      SignatureVerification.ENABLED_WITH_BASE64,
      (async (_params, _ctx) => {
        return WebhookActionResponse.add('/test', { key: 'value' });
      }) as any
    );

    const publicKey = '-----BEGIN PUBLIC KEY-----\nMOCK_KEY\n-----END PUBLIC KEY-----';
    const base64PublicKey = btoa(publicKey);

    const params = {
      PUBLIC_KEY: base64PublicKey,
      __ow_headers: {
        'x-adobe-commerce-webhook-signature': 'valid-signature',
      },
      __ow_body: 'test-body',
      __ow_method: 'post',
    };

    const result = await webhookHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      const operations = JSON.parse(result.body as string);
      expect(operations[0].op).toBe('add');
      expect(operations[0].path).toBe('/test');
      expect(operations[0].value).toEqual({ key: 'value' });
    }

    expect(mockVerify.verify).toHaveBeenCalledWith(
      publicKey, // Should be decoded from base64
      'valid-signature',
      'base64'
    );
  });

  it('should handle signature verification with required params and headers', async () => {
    // Mock crypto module for signature verification
    const mockVerify = {
      update: jest.fn(),
      verify: jest.fn().mockReturnValue(true),
    };

    mockCreateVerify.mockReturnValue(mockVerify as any);

    const webhookHandler = WebhookAction.execute(
      'param-signed-webhook',
      ['userId'],
      ['x-custom-header'],
      SignatureVerification.ENABLED,
      (async (params, _ctx) => {
        expect(params.userId).toBe('123');
        return WebhookActionResponse.replace('/user', { id: params.userId });
      }) as any
    );

    const params = {
      PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\nMOCK_KEY\n-----END PUBLIC KEY-----',
      userId: '123',
      __ow_headers: {
        'x-adobe-commerce-webhook-signature': 'valid-signature',
        'x-custom-header': 'custom-value',
      },
      __ow_body: 'test-body',
      __ow_method: 'post',
    };

    const result = await webhookHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      const operations = JSON.parse(result.body as string);
      expect(operations[0].op).toBe('replace');
      expect(operations[0].path).toBe('/user');
      expect(operations[0].value).toEqual({ id: '123' });
    }
  });

  it('should handle signature verification with missing signature header', async () => {
    // Mock crypto module for signature verification
    const mockVerify = {
      update: jest.fn(),
      verify: jest.fn().mockReturnValue(false),
    };

    mockCreateVerify.mockReturnValue(mockVerify as any);

    const webhookHandler = WebhookAction.execute(
      'no-signature-webhook',
      [],
      [],
      SignatureVerification.ENABLED,
      (async (_params, _ctx) => {
        return WebhookActionResponse.success();
      }) as any
    );

    const params = {
      PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\nMOCK_KEY\n-----END PUBLIC KEY-----',
      __ow_headers: {
        // Missing x-adobe-commerce-webhook-signature header
      },
      __ow_body: 'test-body',
      __ow_method: 'post',
    };

    const result = await webhookHandler(params);
    expect('statusCode' in result).toBe(true);
    if ('statusCode' in result) {
      expect(result.statusCode).toBe(HttpStatus.OK);
      const operations = JSON.parse(result.body as string);
      expect(operations[0].op).toBe('exception');
      expect(operations[0].class).toBe('Magento\\Framework\\Exception\\LocalizedException');
      expect(operations[0].message).toBe('The signature is invalid.');
    }

    expect(mockCreateVerify).toHaveBeenCalledWith('SHA256');
    expect(mockVerify.update).toHaveBeenCalledWith('test-body');
    expect(mockVerify.verify).toHaveBeenCalledWith(
      '-----BEGIN PUBLIC KEY-----\nMOCK_KEY\n-----END PUBLIC KEY-----',
      '', // Empty signature header
      'base64'
    );
  });

  it('should handle signature verification with missing required parameters', async () => {
    const webhookHandler = WebhookAction.execute(
      'required-params-webhook',
      ['requiredParam'], // Required parameter
      [], // No required headers
      SignatureVerification.ENABLED
    );

    const params = {
      __ow_headers: {
        'x-adobe-commerce-webhook-signature': 'test-signature',
      },
      __ow_body: 'test-body',
      __ow_method: 'post',
      PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\nMOCK_KEY\n-----END PUBLIC KEY-----',
      // Missing requiredParam
    };

    const result = await webhookHandler(params);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.error.body.error).toBe("missing parameter(s) 'requiredParam'");
    }
  });

  it('should handle signature verification with missing required headers', async () => {
    const webhookHandler = WebhookAction.execute(
      'required-headers-webhook',
      [], // No required parameters
      ['x-custom-header'], // Required header
      SignatureVerification.ENABLED
    );

    const params = {
      __ow_headers: {
        'x-adobe-commerce-webhook-signature': 'test-signature',
        // Missing x-custom-header
      },
      __ow_body: 'test-body',
      __ow_method: 'post',
      PUBLIC_KEY: '-----BEGIN PUBLIC KEY-----\nMOCK_KEY\n-----END PUBLIC KEY-----',
    };

    const result = await webhookHandler(params);
    expect('error' in result).toBe(true);
    if ('error' in result) {
      expect(result.error.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(result.error.body.error).toBe("missing header(s) 'x-custom-header'");
    }
  });
});
