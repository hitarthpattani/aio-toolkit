/**
 * Test for WebhookResponse class
 * Copyright © Adobe, Inc. All rights reserved.
 */

import WebhookResponse from '../../../../src/framework/webhook/response';
import { WebhookOperation } from '../../../../src/framework/webhook/response/types';

describe('WebhookResponse', () => {
  describe('success', () => {
    it('should create a success response', () => {
      const response = WebhookResponse.success();
      expect(response).toEqual({
        op: WebhookOperation.SUCCESS,
      });
    });
  });

  describe('exception', () => {
    it('should create an exception response with class and message', () => {
      const response = WebhookResponse.exception(
        'Magento\\Framework\\Exception\\LocalizedException',
        'Test error message'
      );
      expect(response).toEqual({
        op: WebhookOperation.EXCEPTION,
        class: 'Magento\\Framework\\Exception\\LocalizedException',
        message: 'Test error message',
      });
    });

    it('should create an exception response with only class', () => {
      const response = WebhookResponse.exception('TestException');
      expect(response).toEqual({
        op: WebhookOperation.EXCEPTION,
        class: 'TestException',
        message: undefined,
      });
    });

    it('should create an exception response with only message', () => {
      const response = WebhookResponse.exception(undefined, 'Error occurred');
      expect(response).toEqual({
        op: WebhookOperation.EXCEPTION,
        class: undefined,
        message: 'Error occurred',
      });
    });

    it('should create an exception response with no parameters', () => {
      const response = WebhookResponse.exception();
      expect(response).toEqual({
        op: WebhookOperation.EXCEPTION,
        class: undefined,
        message: undefined,
      });
    });
  });

  describe('add', () => {
    it('should create an add response with path, value, and instance', () => {
      const response = WebhookResponse.add('/test/path', { key: 'value' }, 'instance1');
      expect(response).toEqual({
        op: WebhookOperation.ADD,
        path: '/test/path',
        value: { key: 'value' },
        instance: 'instance1',
      });
    });

    it('should create an add response without instance', () => {
      const response = WebhookResponse.add('/test/path', { key: 'value' });
      expect(response).toEqual({
        op: WebhookOperation.ADD,
        path: '/test/path',
        value: { key: 'value' },
        instance: undefined,
      });
    });

    it('should create an add response with string value', () => {
      const response = WebhookResponse.add('/test/path', 'string value');
      expect(response).toEqual({
        op: WebhookOperation.ADD,
        path: '/test/path',
        value: 'string value',
        instance: undefined,
      });
    });

    it('should create an add response with number value', () => {
      const response = WebhookResponse.add('/test/path', 42);
      expect(response).toEqual({
        op: WebhookOperation.ADD,
        path: '/test/path',
        value: 42,
        instance: undefined,
      });
    });

    it('should create an add response with boolean value', () => {
      const response = WebhookResponse.add('/test/path', true);
      expect(response).toEqual({
        op: WebhookOperation.ADD,
        path: '/test/path',
        value: true,
        instance: undefined,
      });
    });

    it('should create an add response with array value', () => {
      const response = WebhookResponse.add('/test/path', [1, 2, 3]);
      expect(response).toEqual({
        op: WebhookOperation.ADD,
        path: '/test/path',
        value: [1, 2, 3],
        instance: undefined,
      });
    });
  });

  describe('replace', () => {
    it('should create a replace response with path, value, and instance', () => {
      const response = WebhookResponse.replace('/test/path', { key: 'new value' }, 'instance1');
      expect(response).toEqual({
        op: WebhookOperation.REPLACE,
        path: '/test/path',
        value: { key: 'new value' },
        instance: 'instance1',
      });
    });

    it('should create a replace response without instance', () => {
      const response = WebhookResponse.replace('/test/path', { key: 'new value' });
      expect(response).toEqual({
        op: WebhookOperation.REPLACE,
        path: '/test/path',
        value: { key: 'new value' },
        instance: undefined,
      });
    });

    it('should create a replace response with string value', () => {
      const response = WebhookResponse.replace('/test/path', 'new string value');
      expect(response).toEqual({
        op: WebhookOperation.REPLACE,
        path: '/test/path',
        value: 'new string value',
        instance: undefined,
      });
    });

    it('should create a replace response with null value', () => {
      const response = WebhookResponse.replace('/test/path', null);
      expect(response).toEqual({
        op: WebhookOperation.REPLACE,
        path: '/test/path',
        value: null,
        instance: undefined,
      });
    });
  });

  describe('remove', () => {
    it('should create a remove response with path', () => {
      const response = WebhookResponse.remove('/test/path');
      expect(response).toEqual({
        op: WebhookOperation.REMOVE,
        path: '/test/path',
      });
    });

    it('should create a remove response with nested path', () => {
      const response = WebhookResponse.remove('/test/nested/path/item');
      expect(response).toEqual({
        op: WebhookOperation.REMOVE,
        path: '/test/nested/path/item',
      });
    });

    it('should create a remove response with root path', () => {
      const response = WebhookResponse.remove('/');
      expect(response).toEqual({
        op: WebhookOperation.REMOVE,
        path: '/',
      });
    });
  });
});
