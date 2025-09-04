/**
 * Test for RuntimeActionResponse class
 * Copyright © Adobe, Inc. All rights reserved.
 */

import RuntimeActionResponse from '../../../../src/framework/runtime-action/response';
import { HttpStatus } from '../../../../src/framework/runtime-action/types';

describe('RuntimeActionResponse', () => {
  describe('success', () => {
    it('should create a success response with default status and empty headers', () => {
      const body = { message: 'Success' };
      const response = RuntimeActionResponse.success(body);

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body).toEqual(body);
      expect(response.headers).toEqual({});
    });

    it('should create a success response with custom headers', () => {
      const body = { id: 123 };
      const headers = { 'Custom-Header': 'value' };
      const response = RuntimeActionResponse.success(body, headers);

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body).toEqual(body);
      expect(response.headers).toEqual(headers);
    });

    it('should handle string body', () => {
      const body = 'Success message';
      const response = RuntimeActionResponse.success(body);

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body).toBe(body);
      expect(response.headers).toEqual({});
    });

    it('should handle object body', () => {
      const body = { data: 'test', count: 5 };
      const response = RuntimeActionResponse.success(body);

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.body).toEqual(body);
      expect(response.headers).toEqual({});
    });
  });

  describe('error', () => {
    it('should create an error response with custom status and message', () => {
      const message = 'Something went wrong';
      const status = HttpStatus.INTERNAL_ERROR;
      const response = RuntimeActionResponse.error(status, message);

      expect(response.error.statusCode).toBe(status);
      expect(response.error.body.error).toBe(message);
    });

    it('should create a bad request error response', () => {
      const message = 'Bad request';
      const status = HttpStatus.BAD_REQUEST;
      const response = RuntimeActionResponse.error(status, message);

      expect(response.error.statusCode).toBe(status);
      expect(response.error.body.error).toBe(message);
    });

    it('should create an unauthorized error response', () => {
      const message = 'Unauthorized access';
      const status = HttpStatus.UNAUTHORIZED;
      const response = RuntimeActionResponse.error(status, message);

      expect(response.error.statusCode).toBe(status);
      expect(response.error.body.error).toBe(message);
    });

    it('should create a not found error response', () => {
      const message = 'Resource not found';
      const status = HttpStatus.NOT_FOUND;
      const response = RuntimeActionResponse.error(status, message);

      expect(response.error.statusCode).toBe(status);
      expect(response.error.body.error).toBe(message);
    });

    it('should create an internal server error response', () => {
      const message = 'Internal server error';
      const status = HttpStatus.INTERNAL_ERROR;
      const response = RuntimeActionResponse.error(status, message);

      expect(response.error.statusCode).toBe(status);
      expect(response.error.body.error).toBe(message);
    });
  });
});
