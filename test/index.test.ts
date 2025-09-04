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

  it('should export EventAction class', () => {
    expect(toolkit.EventAction).toBeDefined();
    expect(typeof toolkit.EventAction).toBe('function');
  });

  it('should export Parameters utility', () => {
    expect(toolkit.Parameters).toBeDefined();
    expect(typeof toolkit.Parameters).toBe('function');
  });

  it('should export Validator utility', () => {
    expect(toolkit.Validator).toBeDefined();
    expect(typeof toolkit.Validator).toBe('function');
  });
});
