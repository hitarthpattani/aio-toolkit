/**
 * Copyright © Adobe, Inc. All rights reserved.
 */

import { Files } from '@adobe/aio-sdk';
import { FileRecord } from './types';

/**
 * FileRepository class for managing file-based storage operations
 * Provides CRUD operations for JSON files in a specified directory
 */
class FileRepository {
  private readonly filepath: string;
  private files: any = null;

  /**
   * Creates a new FileRepository instance
   * @param filepath - The base directory path for file operations
   */
  constructor(filepath: string) {
    this.filepath = filepath;
  }

  /**
   * Lists all files in the repository directory
   * @returns Promise<FileRecord[]> Array of file records
   */
  async list(): Promise<FileRecord[]> {
    const filesLib = await this.getFiles();
    const results: FileRecord[] = [];

    const existingFiles = await filesLib.list(`${this.filepath}/`);
    if (existingFiles.length) {
      for (const { name } of existingFiles) {
        const buffer = await filesLib.read(`${name}`);
        results.push(JSON.parse(buffer.toString()));
      }
    }

    return results;
  }

  /**
   * Loads a specific file by ID
   * @param id - The ID of the file to load
   * @returns Promise<FileRecord> The loaded file record or empty object if not found
   */
  async load(id: string = ''): Promise<FileRecord> {
    const filepath = `${this.filepath}/${id}.json`;
    const filesLib = await this.getFiles();

    const existingFile = await filesLib.list(filepath);
    if (existingFile.length) {
      const buffer = await filesLib.read(filepath);
      return JSON.parse(buffer.toString());
    }

    return {} as FileRecord;
  }

  /**
   * Saves a file record to the repository
   * @param payload - The data to save
   * @returns Promise<boolean> True if save was successful, false otherwise
   */
  async save(payload: Partial<FileRecord> = {}): Promise<boolean> {
    try {
      const filesLib = await this.getFiles();

      let requestFileId: number = new Date().getTime();
      if ('id' in payload && payload.id !== undefined) {
        requestFileId = Number(payload.id);
      }

      const filepath = `${this.filepath}/${requestFileId}.json`;

      const existingFile = await filesLib.list(filepath);
      if (existingFile.length) {
        const buffer = await filesLib.read(filepath);
        const existingData = JSON.parse(buffer.toString());

        payload = {
          ...payload,
          updated_at: new Date().toDateString(),
        };

        payload = { ...existingData, ...payload };
        await filesLib.delete(filepath);
      } else {
        payload = {
          ...payload,
          id: requestFileId,
          created_at: new Date().toDateString(),
          updated_at: new Date().toDateString(),
        };
      }

      await filesLib.write(filepath, JSON.stringify(payload));
      return true;
    } catch (error) {
      console.error('Error saving file:', error);
      return false;
    }
  }

  /**
   * Deletes files by their IDs
   * @param ids - Array of file IDs to delete
   * @returns Promise<FileRecord[]> Updated list of remaining files
   */
  async delete(ids: (string | number)[] = []): Promise<FileRecord[]> {
    const filesLib = await this.getFiles();

    for (const id of ids) {
      await filesLib.delete(`${this.filepath}/${id}.json`);
    }

    return await this.list();
  }

  /**
   * Initializes and returns the Files library instance
   * @returns Promise<any> Initialized Files library instance
   */
  private async getFiles(): Promise<any> {
    if (!this.files) {
      this.files = await Files.init();
    }
    return this.files;
  }
}

export default FileRepository;
