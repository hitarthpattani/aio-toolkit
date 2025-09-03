# JavaScript Usage Guide

## For JavaScript Projects (CommonJS)

```javascript
const { Action, HttpMethod, HttpStatus, ActionResponse } = require('@adobe-commerce/aio-toolkit');

// Create an action handler
const handler = Action.execute(
  'my-action',                           // Action name
  [HttpMethod.GET, HttpMethod.POST],     // Allowed HTTP methods  
  ['name', 'email'],                     // Required parameters
  ['authorization'],                     // Required headers
  async (params, ctx) => {               // Your action logic
    const { name, email } = params;
    ctx.logger.info(`Processing request for ${name}`);
    
    return ActionResponse.success({
      message: `Hello ${name}!`,
      email: email
    });
  }
);

// Export for Adobe App Builder
exports.main = handler;
```

## For JavaScript Projects (ES Modules)

If using `"type": "module"` in package.json:

```javascript
import { Action, HttpMethod, HttpStatus, ActionResponse } from '@adobe-commerce/aio-toolkit';

// Same usage as above
const handler = Action.execute(/* ... */);

export { handler as main };
```

## IDE IntelliSense Support

### VS Code Setup
1. Install the **TypeScript and JavaScript Language Features** extension (usually pre-installed)
2. Create a `jsconfig.json` in your project root:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs", 
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  },
  "include": ["**/*"],
  "exclude": ["node_modules"]
}
```

3. Add JSDoc comments in your code for better IntelliSense:

```javascript
/**
 * @typedef {import('@adobe-commerce/aio-toolkit').ActionResponseType} ActionResponseType
 */

const { Action, HttpMethod } = require('@adobe-commerce/aio-toolkit');

/**
 * My action handler
 * @param {Object} params - Action parameters
 * @param {Object} ctx - Action context
 * @returns {Promise<ActionResponseType>} Action response
 */
async function myAction(params, ctx) {
  // Your code here
}

const handler = Action.execute('my-action', [HttpMethod.POST], [], [], myAction);
```

### WebStorm/IntelliJ Setup
1. Enable **TypeScript Language Service** in Settings
2. Make sure **Node.js and NPM** plugin is enabled
3. The IDE should automatically pick up the type definitions

## Available Exports

All exports work the same in JavaScript as TypeScript:

- `Action.execute()` - Creates action handler
- `HttpMethod.GET`, `HttpMethod.POST`, etc. - HTTP method constants
- `HttpStatus.OK`, `HttpStatus.BAD_REQUEST`, etc. - HTTP status constants  
- `ActionResponse.success()`, `ActionResponse.error()` - Response helpers
- `Parameters.stringify()` - Parameter utilities
- `Validator.getMissingKeys()`, `Validator.checkMissingRequestInputs()` - Validation helpers

## Troubleshooting

If you still don't see IntelliSense:

1. **Restart your IDE** after installing the package
2. **Clear IDE cache** (VS Code: Cmd/Ctrl + Shift + P → "Reload Window")
3. **Check node_modules**: Make sure `node_modules/@adobe-commerce/aio-toolkit/dist/index.d.ts` exists
4. **Try explicit typing**:
   ```javascript
   /** @type {import('@adobe-commerce/aio-toolkit')} */
   const toolkit = require('@adobe-commerce/aio-toolkit');
   const { Action } = toolkit;
   ```

The package **works perfectly at runtime** - the IDE issues are just for developer experience!
