/**
 * Adobe App Builder GraphQL framework utilities tests
 *
 * Copyright © Adobe, Inc. All rights reserved.
 */

import GraphQL from '../../../src/framework/graphql';

describe('GraphQL', () => {
  const testSchema = `
    type Query {
      hello(name: String): String
      user(id: ID!): User
      users: [User]
    }
    
    type User {
      id: ID!
      name: String!
      email: String!
    }
  `;

  const testResolvers = async (_ctx: any): Promise<any> => {
    return {
      hello: (args: { name?: string }): string => {
        return `Hello ${args.name || 'World'}!`;
      },
      user: (args: { id: string }): any => {
        return {
          id: args.id,
          name: `User ${args.id}`,
          email: `user${args.id}@example.com`,
        };
      },
      users: (): any[] => {
        return [
          { id: '1', name: 'John Doe', email: 'john@example.com' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
        ];
      },
    };
  };

  it('should be a class with execute static method', () => {
    expect(typeof GraphQL).toBe('function');
    expect(GraphQL.name).toBe('GraphQl');
    expect(typeof GraphQL.execute).toBe('function');
  });

  it('should create a GraphQL handler function using execute method', () => {
    const handler = GraphQL.execute(testSchema, testResolvers);
    expect(typeof handler).toBe('function');
  });

  it('should handle simple GraphQL query execution', async () => {
    const handler = GraphQL.execute(testSchema, testResolvers, 'test-graphql');

    const result = await handler({
      query: '{ hello }',
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      data: { hello: 'Hello World!' },
    });
  });

  it('should handle GraphQL query with arguments', async () => {
    const handler = GraphQL.execute(testSchema, testResolvers, 'test-args-graphql');

    const result = await handler({
      query: '{ hello(name: "Test User") }',
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      data: { hello: 'Hello Test User!' },
    });
  });

  it('should handle GraphQL query with variables', async () => {
    const handler = GraphQL.execute(testSchema, testResolvers, 'test-variables-graphql');

    const result = await handler({
      query: 'query GetUser($id: ID!) { user(id: $id) { id name email } }',
      variables: { id: '123' },
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      data: {
        user: {
          id: '123',
          name: 'User 123',
          email: 'user123@example.com',
        },
      },
    });
  });

  it('should handle GraphQL query with string variables', async () => {
    const handler = GraphQL.execute(testSchema, testResolvers, 'test-string-variables-graphql');

    const result = await handler({
      query: 'query GetUser($id: ID!) { user(id: $id) { id name } }',
      variables: JSON.stringify({ id: '456' }),
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      data: {
        user: {
          id: '456',
          name: 'User 456',
        },
      },
    });
  });

  it('should handle GraphQL query with operation name', async () => {
    const handler = GraphQL.execute(testSchema, testResolvers, 'test-operation-graphql');

    const result = await handler({
      query: `
        query GetHello { hello }
        query GetUsers { users { id name } }
      `,
      operationName: 'GetHello',
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      data: { hello: 'Hello World!' },
    });
  });

  it('should handle GraphQL syntax errors', async () => {
    const handler = GraphQL.execute(testSchema, testResolvers, 'test-syntax-error-graphql');

    const result = await handler({
      query: '{ hello syntax error }',
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    // Framework validation errors are nested
    expect(result.error?.statusCode || result.statusCode).toBe(400);
    expect(result.error?.body?.error || result.body?.error).toBeDefined();
  });

  it('should handle GraphQL parse errors', async () => {
    const handler = GraphQL.execute(testSchema, testResolvers, 'test-parse-error-graphql');

    const result = await handler({
      query: '{ hello', // Missing closing brace
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    // Parse errors are also nested framework responses
    expect(result.error?.statusCode || result.statusCode).toBe(400);
    expect(result.error?.body?.error || result.body?.error).toBeDefined();
    expect((result.error?.body?.error || result.body?.error) as string).toContain('Syntax Error');
  });

  it('should handle GraphQL validation errors', async () => {
    const handler = GraphQL.execute(testSchema, testResolvers, 'test-validation-error-graphql');

    const result = await handler({
      query: '{ nonExistentField }',
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    // Framework validation errors are nested
    expect(result.error?.statusCode || result.statusCode).toBe(400);
    expect(result.error?.body?.error || result.body?.error).toBeDefined();
  });

  it('should handle invalid schema errors', async () => {
    const invalidSchema = 'invalid schema syntax';
    const handler = GraphQL.execute(invalidSchema, testResolvers, 'test-invalid-schema-graphql');

    const result = await handler({
      query: '{ hello }',
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    // Framework validation errors are nested
    expect(result.error?.statusCode || result.statusCode).toBe(400);
    expect(result.error?.body?.error || result.body?.error).toBeDefined();
  });

  it('should support introspection by default', async () => {
    const handler = GraphQL.execute(testSchema, testResolvers, 'test-introspection-graphql');

    const result = await handler({
      query: '{ __schema { types { name } } }',
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.data).toBeDefined();
    expect(result.body.data.__schema).toBeDefined();
  });

  it('should disable introspection when configured', async () => {
    const handler = GraphQL.execute(
      testSchema,
      testResolvers,
      'test-no-introspection-graphql',
      true
    );

    const result = await handler({
      query: '{ __schema { types { name } } }',
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    // Framework validation errors are nested
    expect(result.error?.statusCode || result.statusCode).toBe(400);
    expect(result.error?.body?.error || result.body?.error).toBe(
      'Introspection is disabled for security reasons.'
    );
  });

  it('should disable __type introspection when configured', async () => {
    const handler = GraphQL.execute(
      testSchema,
      testResolvers,
      'test-no-type-introspection-graphql',
      true
    );

    const result = await handler({
      query: '{ __type(name: "User") { name } }',
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    // Framework validation errors are nested
    expect(result.error?.statusCode || result.statusCode).toBe(400);
    expect(result.error?.body?.error || result.body?.error).toBe(
      'Introspection is disabled for security reasons.'
    );
  });

  it('should disable simple introspection fields when configured', async () => {
    const handler = GraphQL.execute(
      testSchema,
      testResolvers,
      'test-simple-introspection-graphql',
      true
    );

    const result = await handler({
      query: '{ __typename }',
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    expect(result.error?.statusCode || result.statusCode).toBe(400);
    expect(result.error?.body?.error || result.body?.error).toBe(
      'Introspection is disabled for security reasons.'
    );
  });

  it('should allow normal queries when introspection is disabled', async () => {
    const handler = GraphQL.execute(
      testSchema,
      testResolvers,
      'test-normal-with-introspection-disabled-graphql',
      true
    );

    const result = await handler({
      query: '{ hello }',
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.data.hello).toBe('Hello World!');
  });

  it('should handle missing required query parameter', async () => {
    const handler = GraphQL.execute(testSchema, testResolvers, 'test-missing-query-graphql');

    const result = await handler({
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    // Framework validation errors are nested
    expect(result.error?.statusCode || result.statusCode).toBe(400);
    expect((result.error?.body?.error || result.body?.error) as string).toContain(
      "missing parameter(s) 'query'"
    );
  });

  it('should support GET method', async () => {
    const handler = GraphQL.execute(testSchema, testResolvers, 'test-get-graphql');

    const result = await handler({
      query: '{ hello }',
      __ow_headers: {},
      __ow_method: 'get',
      LOG_LEVEL: 'info',
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      data: { hello: 'Hello World!' },
    });
  });

  it('should support POST method', async () => {
    const handler = GraphQL.execute(testSchema, testResolvers, 'test-post-graphql');

    const result = await handler({
      query: '{ hello }',
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual({
      data: { hello: 'Hello World!' },
    });
  });

  it('should reject unsupported HTTP methods', async () => {
    const handler = GraphQL.execute(testSchema, testResolvers, 'test-method-graphql');

    const result = await handler({
      query: '{ hello }',
      __ow_headers: {},
      __ow_method: 'delete',
      LOG_LEVEL: 'info',
    });

    // Framework validation errors are nested
    expect(result.error?.statusCode || result.statusCode).toBe(405);
    expect((result.error?.body?.error || result.body?.error) as string).toContain(
      'Invalid HTTP method'
    );
  });

  it('should pass context to resolvers', async () => {
    const contextResolver = async (ctx: any): Promise<any> => {
      return {
        contextTest: (): any => {
          return {
            hasLogger: typeof ctx.logger !== 'undefined',
            hasHeaders: typeof ctx.headers !== 'undefined',
            hasParams: typeof ctx.params !== 'undefined',
          };
        },
      };
    };

    const contextSchema = `
      type Query {
        contextTest: ContextInfo
      }
      
      type ContextInfo {
        hasLogger: Boolean!
        hasHeaders: Boolean!
        hasParams: Boolean!
      }
    `;

    const handler = GraphQL.execute(contextSchema, contextResolver, 'test-context-graphql');

    const result = await handler({
      query: '{ contextTest { hasLogger hasHeaders hasParams } }',
      __ow_headers: { 'x-test': 'value' },
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.data.contextTest).toEqual({
      hasLogger: true,
      hasHeaders: true,
      hasParams: true,
    });
  });

  it('should handle resolver errors gracefully', async () => {
    const errorResolver = async (): Promise<any> => {
      return {
        errorField: (): never => {
          throw new Error('Resolver error');
        },
      };
    };

    const errorSchema = `
      type Query {
        errorField: String
      }
    `;

    const handler = GraphQL.execute(errorSchema, errorResolver, 'test-resolver-error-graphql');

    const result = await handler({
      query: '{ errorField }',
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.data).toEqual({ errorField: null });
    expect(result.body.errors).toBeDefined();
    expect(result.body.errors[0].message).toBe('Resolver error');
  });

  it('should use default values when parameters are not provided', async () => {
    const handler = GraphQL.execute(); // Using all defaults

    const result = await handler({
      query: '{ hello }',
      __ow_headers: {},
      __ow_method: 'post',
      LOG_LEVEL: 'info',
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.data).toBeDefined();
    expect(result.body.data.hello).toBe('Hello World!');
  });
});
