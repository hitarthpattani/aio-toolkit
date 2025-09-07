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

## Documentation

### Quick Links

#### Commerce Components

- **[AdobeAuth](./docs/adobe-auth.md)** - Adobe IMS authentication and token management
- **[AdobeCommerceClient](./docs/adobe-commerce-client.md)** - HTTP client for Adobe Commerce API integration

#### Framework Components

- **[EventConsumerAction](./docs/event-consumer-action.md)** - Event-driven processing for Adobe I/O Events
- **[GraphQlAction](./docs/graphql-action.md)** - GraphQL server implementation with schema validation
- **[OpenWhisk](./docs/openwhisk.md)** - OpenWhisk client for serverless action invocation
- **[OpenWhiskAction](./docs/openwhisk-action.md)** - OpenWhisk action wrapper with logging and error handling
- **[RuntimeAction](./docs/runtime-action.md)** - HTTP request handling and business logic execution
- **[WebhookAction](./docs/webhook-action.md)** - Secure webhook processing with signature verification

#### Integration Components

- **[BearerToken](./docs/bearer-token.md)** - Bearer token extraction utility for OpenWhisk actions
- **[RestClient](./docs/rest-client.md)** - HTTP client for external API integration

#### I/O Events Components

- **[EventMetadataManager](./docs/event-metadata.md)** - Manage event metadata for Adobe I/O Events providers
- **[ProviderManager](./docs/provider.md)** - Manage event providers for Adobe I/O Events
- **[RegistrationManager](./docs/registration.md)** - Manage event registrations and subscriptions

## Development

### Prerequisites

- Node.js (v18 or later)
- npm (v8 or later)
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/adobe-commerce/aio-toolkit.git
cd aio-toolkit

# Install dependencies
npm install

# Build the project
npm run build
```

### Development Workflow

This project uses a comprehensive development workflow with automated quality checks:

#### Code Quality

```bash
# Format code with Prettier
npm run format

# Lint code with ESLint
npm run lint

# Fix linting issues automatically
npm run lint:fix

# Type checking
npm run type-check
```

#### Testing

```bash
# Run all tests
npm test

# Run tests with coverage (requires 100% coverage)
npm run test:coverage

# Run tests in watch mode during development
npm run test:watch
```

#### Build & Validation

```bash
# Build the project
npm run build

# Run complete validation pipeline (tests, linting, type-check, build)
npm run validate

# Run ultra-strict pre-push validation
npm run validate:push
```

### Git Hooks & Automation

This project uses Husky for automated code quality enforcement:

- **Pre-commit**: Runs Prettier formatting and ESLint fixing on staged files
- **Pre-push**: Runs comprehensive validation (type-check, build, full test suite with coverage)

### Development Standards

- **Test Coverage**: 100% code coverage is required for all statements, branches, functions, and lines
- **TypeScript**: All code must be properly typed with strict TypeScript configuration
- **Code Style**: Prettier and ESLint configurations ensure consistent code formatting
- **Documentation**: All public APIs must be documented with JSDoc comments

### Project Structure

```
src/
├── commerce/           # Adobe Commerce integration utilities
├── framework/          # Core framework components (actions, responses)
├── integration/        # Integration utilities (REST client, authentication)
└── io-events/         # Adobe I/O Events management

test/                  # Comprehensive test suite mirroring src/ structure
```

### Available Scripts

- `npm run build` - Build the project using tsup
- `npm run dev` - Development mode with watch
- `npm test` - Run Jest tests
- `npm run test:coverage` - Run tests with coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript compiler check
- `npm run validate` - Run all validation steps
- `npm run validate:push` - Ultra-strict validation for push operations

## Contributing

Components are being migrated to this toolkit. Please follow TypeScript best practices and ensure all exports are properly typed.
