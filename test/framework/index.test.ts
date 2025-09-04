/**
 * Test for framework entry point
 * Copyright © Adobe, Inc. All rights reserved.
 */

import * as framework from '../../src/framework';

describe('Framework', () => {
  it('should export RuntimeAction class', () => {
    expect(framework.RuntimeAction).toBeDefined();
    expect(typeof framework.RuntimeAction).toBe('function');
  });

  it('should export RuntimeActionResponse class', () => {
    expect(framework.RuntimeActionResponse).toBeDefined();
    expect(typeof framework.RuntimeActionResponse).toBe('function');
  });

  it('should export EventAction class', () => {
    expect(framework.EventAction).toBeDefined();
    expect(typeof framework.EventAction).toBe('function');
  });

  it('should export Webhook class', () => {
    expect(framework.Webhook).toBeDefined();
    expect(typeof framework.Webhook).toBe('function');
  });

  it('should export WebhookResponse class', () => {
    expect(framework.WebhookResponse).toBeDefined();
    expect(typeof framework.WebhookResponse).toBe('function');
  });

  it('should export Openwhisk class', () => {
    expect(framework.Openwhisk).toBeDefined();
    expect(typeof framework.Openwhisk).toBe('function');
  });

  it('should export OpenwhiskAction class', () => {
    expect(framework.OpenwhiskAction).toBeDefined();
    expect(typeof framework.OpenwhiskAction).toBe('function');
  });

  it('should export Parameters utility', () => {
    expect(framework.Parameters).toBeDefined();
    expect(typeof framework.Parameters).toBe('function');
  });

  it('should export Validator utility', () => {
    expect(framework.Validator).toBeDefined();
    expect(typeof framework.Validator).toBe('function');
  });

  it('should export HttpStatus enum', () => {
    expect(framework.HttpStatus).toBeDefined();
    expect(typeof framework.HttpStatus).toBe('object');
  });

  it('should export HttpMethod enum', () => {
    expect(framework.HttpMethod).toBeDefined();
    expect(typeof framework.HttpMethod).toBe('object');
  });

  it('should export SignatureVerification enum', () => {
    expect(framework.SignatureVerification).toBeDefined();
    expect(typeof framework.SignatureVerification).toBe('object');
  });

  it('should export WebhookOperation enum', () => {
    expect(framework.WebhookOperation).toBeDefined();
    expect(typeof framework.WebhookOperation).toBe('object');
  });
});
