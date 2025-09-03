# @adobe-commerce/aio-toolkit

Backend toolkit for Adobe App Builder applications - standardized tools and utilities

## Overview

This toolkit provides a standardized set of backend tools and utilities for Adobe App Builder application development. It aims to standardize common patterns and provide reusable components for backend functionality.

## Installation

```bash
npm install @adobe-commerce/aio-toolkit
```

## Usage

```typescript
import { initializeToolkit, VERSION } from '@adobe-commerce/aio-toolkit';

// Initialize the toolkit
const toolkit = initializeToolkit({
  environment: 'development'
});

console.log(`Toolkit version: ${VERSION}`);
```

## Development

### Building the Library

```bash
# Build all formats (CommonJS, ESM, and types)
npm run build

# Build specific formats
npm run build:cjs    # CommonJS
npm run build:esm    # ES Modules  
npm run build:types  # Type declarations

# Watch mode for development
npm run dev
```

### Project Structure

```
src/
├── index.ts          # Main entry point
├── auth/             # Authentication utilities (to be added)
├── logging/          # Logging utilities (to be added)  
├── utils/            # General utilities (to be added)
└── validation/       # Validation utilities (to be added)
```

## Contributing

Components are being migrated to this toolkit. Please follow TypeScript best practices and ensure all exports are properly typed.

## License

MIT
