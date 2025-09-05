# @adobe-commerce/aio-toolkit

## Overview

This toolkit provides a standardized set of backend tools and utilities for Adobe App Builder application development. It aims to standardize common patterns and provide reusable components for backend functionality.

## Installation

Before installing the package, you need to set up authentication for GitHub Packages registry.

1. Create a personal access token (PAT) with `read:packages` scope from GitHub:
   - Go to GitHub Settings → Developer Settings → Personal Access Tokens
   - Generate a new token with `read:packages` scope
   - Copy the generated token

2. Create or update your `.npmrc` file:

   ```bash
   # Create .npmrc in your project root or home directory
   echo "@adobe-commerce:registry=https://npm.pkg.github.com" >> .npmrc
   echo "//npm.pkg.github.com/:_authToken=YOUR_GITHUB_PAT" >> .npmrc
   ```

   Replace `YOUR_GITHUB_PAT` with your personal access token.

3. Install the package:
   ```bash
   npm install @adobe-commerce/aio-toolkit
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
