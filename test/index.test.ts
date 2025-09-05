/**
 * Test for main entry point
 * Copyright © Adobe, Inc. All rights reserved.
 */

import * as toolkit from '../src/index';

describe('Adobe Commerce AIO Toolkit', () => {
  it('should export framework utilities', () => {
    expect(toolkit).toBeDefined();
    expect(typeof toolkit).toBe('object');
  });

  it('should export RuntimeAction class', () => {
    expect(toolkit.RuntimeAction).toBeDefined();
    expect(typeof toolkit.RuntimeAction).toBe('function');
  });

  it('should export RuntimeActionResponse class', () => {
    expect(toolkit.RuntimeActionResponse).toBeDefined();
    expect(typeof toolkit.RuntimeActionResponse).toBe('function');
  });

  it('should export EventConsumerAction class', () => {
    expect(toolkit.EventConsumerAction).toBeDefined();
    expect(typeof toolkit.EventConsumerAction).toBe('function');
  });

  it('should export GraphQlAction class', () => {
    expect(toolkit.GraphQlAction).toBeDefined();
    expect(typeof toolkit.GraphQlAction).toBe('function');
  });

  it('should export WebhookAction class', () => {
    expect(toolkit.WebhookAction).toBeDefined();
    expect(typeof toolkit.WebhookAction).toBe('function');
  });

  it('should export WebhookActionResponse class', () => {
    expect(toolkit.WebhookActionResponse).toBeDefined();
    expect(typeof toolkit.WebhookActionResponse).toBe('function');
  });

  it('should export Openwhisk class', () => {
    expect(toolkit.Openwhisk).toBeDefined();
    expect(typeof toolkit.Openwhisk).toBe('function');
  });

  it('should export OpenwhiskAction class', () => {
    expect(toolkit.OpenwhiskAction).toBeDefined();
    expect(typeof toolkit.OpenwhiskAction).toBe('function');
  });

  it('should export Parameters utility', () => {
    expect(toolkit.Parameters).toBeDefined();
    expect(typeof toolkit.Parameters).toBe('function');
  });

  it('should export Validator utility', () => {
    expect(toolkit.Validator).toBeDefined();
    expect(typeof toolkit.Validator).toBe('function');
  });

  it('should export BearerToken class', () => {
    expect(toolkit.BearerToken).toBeDefined();
    expect(typeof toolkit.BearerToken).toBe('function');
  });

  it('should export AdobeAuth class', () => {
    expect(toolkit.AdobeAuth).toBeDefined();
    expect(typeof toolkit.AdobeAuth).toBe('function');
  });

  it('should export RestClient class', () => {
    expect(toolkit.RestClient).toBeDefined();
    expect(typeof toolkit.RestClient).toBe('function');
  });

  it('should export EventMetadataManager class', () => {
    expect(toolkit.EventMetadataManager).toBeDefined();
    expect(typeof toolkit.EventMetadataManager).toBe('function');
  });
});
