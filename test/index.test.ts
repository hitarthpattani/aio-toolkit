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

  it('should export Action class', () => {
    expect(toolkit.Action).toBeDefined();
    expect(typeof toolkit.Action).toBe('function');
  });

  it('should export ActionResponse class', () => {
    expect(toolkit.ActionResponse).toBeDefined();
    expect(typeof toolkit.ActionResponse).toBe('function');
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
