/**
 * <license header>
 */

import FileRepository from '../../../src/framework/repository/file-repository';
import type { FileRecord } from '../../../src/framework/repository/file-repository/types';
import { Files } from '@adobe/aio-sdk';

// Mock the Adobe I/O SDK Files to avoid external dependencies
const mockFiles = {
  list: jest.fn(),
  read: jest.fn(),
  write: jest.fn(),
  delete: jest.fn(),
};

jest.mock('@adobe/aio-sdk', () => ({
  Files: {
    init: jest.fn().mockImplementation(() => Promise.resolve(mockFiles)),
  },
}));

describe('FileRepository', () => {
  let fileRepository: FileRepository;
  const testFilepath = 'test-files';

  beforeEach(() => {
    fileRepository = new FileRepository(testFilepath);
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create FileRepository instance with valid filepath', () => {
      expect(fileRepository).toBeInstanceOf(FileRepository);
      expect((fileRepository as any).filepath).toBe(testFilepath);
    });
  });

  describe('list', () => {
    it('should return empty array when no files exist', async () => {
      mockFiles.list.mockResolvedValue([]);

      const result = await fileRepository.list();

      expect(result).toEqual([]);
      expect(mockFiles.list).toHaveBeenCalledWith(`${testFilepath}/`);
    });

    it('should return list of files when files exist', async () => {
      const mockFileData: FileRecord = {
        id: '123',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        title: 'Test File',
      };

      mockFiles.list.mockResolvedValue([{ name: 'file1.json' }]);
      mockFiles.read.mockResolvedValue(Buffer.from(JSON.stringify(mockFileData)));

      const result = await fileRepository.list();

      expect(result).toEqual([mockFileData]);
      expect(mockFiles.read).toHaveBeenCalledWith('file1.json');
    });
  });

  describe('load', () => {
    it('should return empty object when file does not exist', async () => {
      mockFiles.list.mockResolvedValue([]);

      const result = await fileRepository.load('nonexistent');

      expect(result).toEqual({});
      expect(mockFiles.list).toHaveBeenCalledWith(`${testFilepath}/nonexistent.json`);
    });

    it('should return file data when file exists', async () => {
      const mockFileData: FileRecord = {
        id: '123',
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        title: 'Test File',
      };

      mockFiles.list.mockResolvedValue([{ name: 'test.json' }]);
      mockFiles.read.mockResolvedValue(Buffer.from(JSON.stringify(mockFileData)));

      const result = await fileRepository.load('123');

      expect(result).toEqual(mockFileData);
      expect(mockFiles.list).toHaveBeenCalledWith(`${testFilepath}/123.json`);
      expect(mockFiles.read).toHaveBeenCalledWith(`${testFilepath}/123.json`);
    });

    it('should use default empty string ID when no ID provided', async () => {
      mockFiles.list.mockResolvedValue([]);

      await fileRepository.load();

      expect(mockFiles.list).toHaveBeenCalledWith(`${testFilepath}/.json`);
    });
  });

  describe('save', () => {
    it('should save new file successfully', async () => {
      const payload = { title: 'New File' };
      mockFiles.list.mockResolvedValue([]);
      mockFiles.write.mockResolvedValue(undefined);

      const result = await fileRepository.save(payload);

      expect(result).toBe(true);
      expect(mockFiles.write).toHaveBeenCalledWith(
        expect.stringContaining(`${testFilepath}/`),
        expect.stringContaining('"title":"New File"')
      );
    });

    it('should update existing file successfully', async () => {
      const existingData: FileRecord = {
        id: 123,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        title: 'Original Title',
      };
      const updatePayload = { id: 123, title: 'Updated Title' };

      mockFiles.list.mockResolvedValue([{ name: 'test.json' }]);
      mockFiles.read.mockResolvedValue(Buffer.from(JSON.stringify(existingData)));
      mockFiles.delete.mockResolvedValue(undefined);
      mockFiles.write.mockResolvedValue(undefined);

      const result = await fileRepository.save(updatePayload);

      expect(result).toBe(true);
      expect(mockFiles.delete).toHaveBeenCalledWith(`${testFilepath}/123.json`);
      expect(mockFiles.write).toHaveBeenCalledWith(
        `${testFilepath}/123.json`,
        expect.stringContaining('"title":"Updated Title"')
      );
    });

    it('should handle save errors gracefully', async () => {
      const payload = { title: 'Test File' };
      mockFiles.list.mockRejectedValue(new Error('File system error'));

      const result = await fileRepository.save(payload);

      expect(result).toBe(false);
    });

    it('should generate timestamp ID when no ID provided', async () => {
      const payload = { title: 'Test File' };
      mockFiles.list.mockResolvedValue([]);
      mockFiles.write.mockResolvedValue(undefined);

      const result = await fileRepository.save(payload);

      expect(result).toBe(true);
      expect(mockFiles.write).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`${testFilepath}/\\d+\\.json`)),
        expect.any(String)
      );
    });

    it('should handle default empty payload', async () => {
      mockFiles.list.mockResolvedValue([]);
      mockFiles.write.mockResolvedValue(undefined);

      const result = await fileRepository.save();

      expect(result).toBe(true);
      expect(mockFiles.write).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`${testFilepath}/\\d+\\.json`)),
        expect.any(String)
      );
    });
  });

  describe('delete', () => {
    it('should delete files by IDs and return updated list', async () => {
      const idsToDelete = ['123', '456'];
      const remainingFiles: FileRecord[] = [
        {
          id: '789',
          created_at: '2023-01-01',
          updated_at: '2023-01-01',
          title: 'Remaining File',
        },
      ];

      mockFiles.delete.mockResolvedValue(undefined);
      mockFiles.list.mockResolvedValue([{ name: 'file789.json' }]);
      mockFiles.read.mockResolvedValue(Buffer.from(JSON.stringify(remainingFiles[0])));

      const result = await fileRepository.delete(idsToDelete);

      expect(result).toEqual(remainingFiles);
      expect(mockFiles.delete).toHaveBeenCalledWith(`${testFilepath}/123.json`);
      expect(mockFiles.delete).toHaveBeenCalledWith(`${testFilepath}/456.json`);
      expect(mockFiles.delete).toHaveBeenCalledTimes(2);
    });

    it('should handle empty IDs array', async () => {
      mockFiles.list.mockResolvedValue([]);

      const result = await fileRepository.delete([]);

      expect(result).toEqual([]);
      expect(mockFiles.delete).not.toHaveBeenCalled();
    });

    it('should handle default empty IDs parameter', async () => {
      mockFiles.list.mockResolvedValue([]);

      const result = await fileRepository.delete();

      expect(result).toEqual([]);
      expect(mockFiles.delete).not.toHaveBeenCalled();
    });

    it('should handle numeric IDs', async () => {
      const idsToDelete = [123, 456];

      mockFiles.delete.mockResolvedValue(undefined);
      mockFiles.list.mockResolvedValue([]);

      await fileRepository.delete(idsToDelete);

      expect(mockFiles.delete).toHaveBeenCalledWith(`${testFilepath}/123.json`);
      expect(mockFiles.delete).toHaveBeenCalledWith(`${testFilepath}/456.json`);
    });
  });

  describe('getFiles', () => {
    it('should initialize Files library only once', async () => {
      // Call a method that uses getFiles twice
      await fileRepository.list();
      await fileRepository.list();

      // Files.init should only be called once due to caching
      expect(Files.init).toHaveBeenCalledTimes(1);
    });
  });
});
