# FileRepository Documentation

## Overview

The **FileRepository** provides a robust, file-based storage solution for Adobe I/O Runtime applications. Built on top of the Adobe I/O SDK Files API, it offers CRUD operations for JSON data with automatic timestamping, error handling, and seamless integration with the Adobe App Builder ecosystem. This utility is perfect for persisting application state, user preferences, configuration data, or any structured information in your Adobe Commerce AIO applications.

## Table of Contents

- [Overview](#overview)
- [Core Features](#core-features)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [Integration with Other Toolkit Components](#integration-with-other-toolkit-components)
- [Performance Considerations](#performance-considerations)

## Core Features

### 1. File-Based Storage

- **JSON storage** with automatic serialization/deserialization
- **Directory-based organization** for logical data grouping
- **Adobe I/O Files integration** with built-in SDK support
- **Automatic file naming** using timestamp-based IDs

### 2. CRUD Operations

- **Create/Update operations** with smart merging of existing data
- **List functionality** to retrieve all files in a repository
- **Load operations** for specific file retrieval by ID
- **Batch delete operations** with multiple ID support

### 3. Data Management

- **Automatic timestamping** with `created_at` and `updated_at` fields
- **Flexible data structure** supporting any JSON-serializable content
- **ID generation** using timestamp-based unique identifiers
- **Data integrity** with proper error handling and validation

### 4. Performance Features

- **Lazy initialization** of Adobe I/O Files SDK
- **Connection reuse** for optimal performance
- **Memory-efficient processing** for large file operations
- **Async/await support** throughout the API

## Usage

### Basic Usage

```typescript
import { FileRepository } from '@adobe-commerce/aio-toolkit';

// Create a repository instance
const userPreferences = new FileRepository('user-preferences');

// Save user preferences
await userPreferences.save({
  userId: 'user123',
  theme: 'dark',
  language: 'en',
  notifications: true
});
```

### Advanced Usage

```typescript
import { FileRepository, FileRecord } from '@adobe-commerce/aio-toolkit';

const applicationData = new FileRepository('app-data');

// Create structured data with custom ID
const configData: Partial<FileRecord> = {
  id: 'app-config-v1',
  version: '1.0.0',
  features: {
    analytics: true,
    debugging: false
  },
  endpoints: {
    api: 'https://api.example.com',
    webhook: 'https://webhook.example.com'
  }
};

await applicationData.save(configData);
```

## API Reference

### Class: FileRepository

Creates a new FileRepository instance for managing JSON files in a specific directory.

#### Constructor

```typescript
constructor(filepath: string)
```

**Parameters:**
- `filepath` (string): The base directory path for file operations

**Example:**
```typescript
const repository = new FileRepository('my-app/data');
```

#### Methods

##### `list(): Promise<FileRecord[]>`

Lists all files in the repository directory.

**Returns:** Promise resolving to an array of FileRecord objects

**Example:**
```typescript
const allFiles = await repository.list();
console.log(`Found ${allFiles.length} files`);
```

##### `load(id?: string): Promise<FileRecord>`

Loads a specific file by ID.

**Parameters:**
- `id` (string, optional): The ID of the file to load. Defaults to empty string.

**Returns:** Promise resolving to a FileRecord object, or empty object if not found

**Example:**
```typescript
const userConfig = await repository.load('user-123');
if (userConfig.id) {
  console.log('User found:', userConfig);
} else {
  console.log('User not found');
}
```

##### `save(payload?: Partial<FileRecord>): Promise<boolean>`

Saves a file record to the repository.

**Parameters:**
- `payload` (Partial<FileRecord>, optional): The data to save

**Returns:** Promise resolving to boolean indicating success

**Example:**
```typescript
const success = await repository.save({
  name: 'John Doe',
  email: 'john@example.com',
  preferences: {
    theme: 'light',
    notifications: true
  }
});

if (success) {
  console.log('Data saved successfully');
}
```

##### `delete(ids?: (string | number)[]): Promise<FileRecord[]>`

Deletes files by their IDs and returns the updated list.

**Parameters:**
- `ids` (Array<string | number>, optional): Array of file IDs to delete

**Returns:** Promise resolving to the updated list of remaining files

**Example:**
```typescript
const remainingFiles = await repository.delete(['user-123', 'user-456']);
console.log(`${remainingFiles.length} files remaining`);
```

### Interface: FileRecord

Represents the structure of a file record in the repository.

```typescript
interface FileRecord {
  id: string | number;
  created_at: string;
  updated_at: string;
  [key: string]: any;
}
```

**Properties:**
- `id`: Unique identifier for the record
- `created_at`: ISO date string of creation time
- `updated_at`: ISO date string of last update time
- Additional properties as needed for your application data

## Examples

### User Profile Management

```typescript
import { FileRepository } from '@adobe-commerce/aio-toolkit';

class UserProfileService {
  private profiles: FileRepository;

  constructor() {
    this.profiles = new FileRepository('user-profiles');
  }

  async createProfile(userData: any) {
    const success = await this.profiles.save({
      ...userData,
      status: 'active',
      lastLogin: new Date().toISOString()
    });

    return success;
  }

  async getProfile(userId: string) {
    return await this.profiles.load(userId);
  }

  async updateProfile(userId: string, updates: any) {
    const existing = await this.profiles.load(userId);
    if (!existing.id) {
      throw new Error('Profile not found');
    }

    return await this.profiles.save({
      id: userId,
      ...updates
    });
  }

  async deleteProfile(userId: string) {
    const remaining = await this.profiles.delete([userId]);
    return remaining.length;
  }

  async listAllProfiles() {
    return await this.profiles.list();
  }
}
```

### Configuration Management

```typescript
import { FileRepository } from '@adobe-commerce/aio-toolkit';

class ConfigurationManager {
  private config: FileRepository;

  constructor() {
    this.config = new FileRepository('app-config');
  }

  async getConfig(environment: string = 'production') {
    const configData = await this.config.load(`config-${environment}`);
    return configData.id ? configData : this.getDefaultConfig();
  }

  async updateConfig(environment: string, settings: any) {
    const currentConfig = await this.getConfig(environment);
    
    return await this.config.save({
      id: `config-${environment}`,
      environment,
      settings: { ...currentConfig.settings, ...settings },
      lastModified: new Date().toISOString()
    });
  }

  private getDefaultConfig() {
    return {
      settings: { theme: 'default', timeout: 30000, retries: 3 }
    };
  }
}
```

### Session Storage

```typescript
import { FileRepository } from '@adobe-commerce/aio-toolkit';

class SessionManager {
  private sessions: FileRepository;
  
  constructor() {
    this.sessions = new FileRepository('user-sessions');
  }

  async createSession(userId: string, sessionData: any) {
    const sessionId = `session-${userId}-${Date.now()}`;
    
    const success = await this.sessions.save({
      id: sessionId,
      userId,
      ...sessionData,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });

    return success ? sessionId : null;
  }

  async getSession(sessionId: string) {
    const session = await this.sessions.load(sessionId);
    
    if (!session.id || new Date() > new Date(session.expiresAt)) {
      if (session.id) await this.sessions.delete([sessionId]);
      return null;
    }

    return session;
  }
}
```

### Audit Log Implementation

```typescript
import { FileRepository } from '@adobe-commerce/aio-toolkit';

class AuditLogger {
  private logs: FileRepository;

  constructor() {
    this.logs = new FileRepository('audit-logs');
  }

  async logAction(action: string, userId: string, details: any = {}) {
    return await this.logs.save({
      action,
      userId,
      timestamp: new Date().toISOString(),
      details,
      ip: details.ip || 'unknown'
    });
  }

  async getRecentLogs(limit: number = 100) {
    const allLogs = await this.logs.list();
    return allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                 .slice(0, limit);
  }

  async getLogsForUser(userId: string) {
    const allLogs = await this.logs.list();
    return allLogs.filter(log => log.userId === userId);
  }
}
```

## Error Handling

The FileRepository implements comprehensive error handling:

### Automatic Error Recovery

```typescript
const repository = new FileRepository('data');

try {
  const result = await repository.save(userData);
  if (!result) {
    console.error('Save operation failed');
    // Handle failure case
  }
} catch (error) {
  console.error('Repository error:', error.message);
  // Handle exception
}
```

### Graceful Degradation

```typescript
const repository = new FileRepository('cache');

async function getCachedData(key: string) {
  try {
    const cached = await repository.load(key);
    if (cached.id && !isExpired(cached)) {
      return cached.data;
    }
  } catch (error) {
    console.warn('Cache read failed, falling back to API');
  }
  
  // Fallback to primary data source
  return await fetchFromAPI(key);
}

function isExpired(cached: any): boolean {
  const expiryTime = new Date(cached.expiresAt);
  return new Date() > expiryTime;
}
```

### Retry Logic

```typescript
async function saveWithRetry(repository: FileRepository, data: any, maxRetries: number = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const success = await repository.save(data);
      if (success) return true;
      
      if (attempt === maxRetries) {
        throw new Error('Max retries exceeded');
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.warn(`Attempt ${attempt} failed, retrying...`);
    }
  }
  
  return false;
}
```

## Best Practices

### 1. Repository Organization

```typescript
// Good: Organize by feature/domain
const userRepository = new FileRepository('users');
const orderRepository = new FileRepository('orders');
const configRepository = new FileRepository('config');

// Avoid: Generic repositories
const dataRepository = new FileRepository('data'); // Too generic
```

### 2. Data Validation

```typescript
class ValidatedRepository {
  private repository: FileRepository;

  constructor(path: string) {
    this.repository = new FileRepository(path);
  }

  async saveUser(userData: any) {
    // Validate before saving
    if (!userData.email || !userData.name) {
      throw new Error('Email and name are required');
    }

    // Sanitize data
    const sanitizedData = {
      name: userData.name.trim(),
      email: userData.email.toLowerCase().trim(),
      preferences: userData.preferences || {}
    };

    return await this.repository.save(sanitizedData);
  }
}
```

### 3. Error Boundary Implementation

```typescript
class RepositoryService {
  private repository: FileRepository;

  constructor(path: string) {
    this.repository = new FileRepository(path);
  }

  async safeLoad(id: string): Promise<any | null> {
    try {
      const result = await this.repository.load(id);
      return result.id ? result : null;
    } catch (error) {
      console.error(`Failed to load ${id}:`, error);
      return null;
    }
  }

  async safeSave(data: any): Promise<boolean> {
    try {
      return await this.repository.save(data);
    } catch (error) {
      console.error('Save failed:', error);
      return false;
    }
  }
}
```

### 4. Performance Optimization

```typescript
class OptimizedRepository {
  private repository: FileRepository;
  private cache = new Map();

  constructor(path: string) {
    this.repository = new FileRepository(path);
  }

  async loadWithCache(id: string) {
    if (this.cache.has(id)) return this.cache.get(id);

    const data = await this.repository.load(id);
    if (data.id) this.cache.set(id, data);
    return data;
  }

  async saveWithCache(data: any) {
    const success = await this.repository.save(data);
    if (success && data.id) this.cache.set(data.id, data);
    return success;
  }
}
```

## Integration with Other Toolkit Components

### With RuntimeAction

```typescript
import { RuntimeAction, FileRepository } from '@adobe-commerce/aio-toolkit';

const repository = new FileRepository('runtime-data');

export const main = RuntimeAction.execute({
  requiredParams: ['userId'],
  action: async (params) => {
    const { userId, ...data } = params;
    
    // Load existing user data
    const existing = await repository.load(userId);
    
    // Merge with new data
    const updated = {
      id: userId,
      ...existing,
      ...data,
      lastAccessed: new Date().toISOString()
    };
    
    // Save updated data
    const success = await repository.save(updated);
    
    return {
      success,
      data: success ? updated : null
    };
  }
});
```

### With BearerToken Authentication

```typescript
import { RuntimeAction, FileRepository, BearerToken } from '@adobe-commerce/aio-toolkit';

const sessionsRepo = new FileRepository('sessions');

export const main = RuntimeAction.execute({
  requiredHeaders: ['authorization'],
  action: async (params) => {
    // Extract token
    const tokenInfo = BearerToken.extract(params);
    if (!tokenInfo.token) {
      throw new Error('Invalid token');
    }

    // Load session
    const session = await sessionsRepo.load(tokenInfo.token);
    if (!session.id) {
      throw new Error('Session not found');
    }

    // Update last activity
    await sessionsRepo.save({
      id: tokenInfo.token,
      lastActivity: new Date().toISOString()
    });

    return { user: session.userId, activity: 'logged' };
  }
});
```

### With RestClient

```typescript
import { RestClient, FileRepository } from '@adobe-commerce/aio-toolkit';

class SyncService {
  private localRepo: FileRepository;
  private restClient: RestClient;

  constructor() {
    this.localRepo = new FileRepository('synced-data');
    this.restClient = new RestClient();
  }

  async syncFromRemote(endpoint: string) {
    try {
      // Fetch from remote API
      const response = await this.restClient.get(endpoint);
      
      // Save locally for offline access
      await this.localRepo.save({
        id: 'remote-data',
        data: response,
        syncedAt: new Date().toISOString()
      });

      return response;
    } catch (error) {
      // Fallback to local data if remote fails
      console.warn('Remote sync failed, using local data');
      const local = await this.localRepo.load('remote-data');
      return local.data || {};
    }
  }
}
```

## Performance Considerations

### FileRepository Optimization

1. **Lazy Initialization**: The Adobe I/O Files SDK is initialized only when first needed, reducing startup time.

2. **Connection Reuse**: Once initialized, the Files connection is reused across all operations.

3. **Memory Management**: Large file lists are processed efficiently without loading all content into memory simultaneously.

4. **Async Operations**: All file operations are fully asynchronous, preventing blocking of the event loop.

### Best Practices for Performance

1. **Batch Operations**: When possible, batch multiple delete operations into a single call:

```typescript
// Good: Batch delete
await repository.delete(['id1', 'id2', 'id3', 'id4']);

// Avoid: Individual deletes
await repository.delete(['id1']);
await repository.delete(['id2']);
await repository.delete(['id3']);
await repository.delete(['id4']);
```

2. **Selective Loading**: Only load the data you need:

```typescript
// Load specific item when you know the ID
const specificItem = await repository.load('known-id');

// Avoid loading all items when you only need one
const allItems = await repository.list(); // Less efficient
```

3. **Caching Strategy**: Implement caching for frequently accessed data:

```typescript
class CachedRepository {
  private cache = new Map();
  private ttl = 5 * 60 * 1000; // 5 minutes
  
  async get(id: string) {
    const cached = this.cache.get(id);
    if (cached && (Date.now() - cached.timestamp) < this.ttl) return cached.data;
    
    const fresh = await this.repository.load(id);
    this.cache.set(id, { data: fresh, timestamp: Date.now() });
    return fresh;
  }
}
```

The FileRepository provides a powerful, efficient foundation for file-based storage in Adobe I/O Runtime applications, with seamless integration into the broader Adobe Commerce AIO Toolkit ecosystem.
