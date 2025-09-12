/**
 * <license header>
 */

import * as repository from '../../../src/framework/repository';
import type { FileRecord } from '../../../src/framework/repository';

describe('Repository Module', () => {
  it('should export FileRepository class', () => {
    expect(repository.FileRepository).toBeDefined();
    expect(typeof repository.FileRepository).toBe('function');
    expect(() => new repository.FileRepository('test')).not.toThrow();
  });

  it('should export FileRecord type', () => {
    // Type check - if FileRecord type is exported, this will compile
    const testRecord: FileRecord = {
      id: 'test',
      created_at: '2023-01-01',
      updated_at: '2023-01-01',
      data: 'test',
    };
    expect(testRecord).toBeDefined();
  });
});
