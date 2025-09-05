/**
 * Adobe App Builder GraphQL framework utilities
 *
 * <license header>
 */

import { graphql, buildSchema, parse, validate } from 'graphql';

import RuntimeAction from '../runtime-action';
import RuntimeActionResponse from '../runtime-action/response';

import { HttpMethod, HttpStatus } from '../runtime-action/types';
import { RuntimeActionResponseType } from '../runtime-action/response/types';

class GraphQlAction {
  static execute(
    schema: string = `
      type Query {
        hello: String
      }
    `,
    resolvers: (ctx: {
      logger: any;
      headers: { [key: string]: any };
      params: { [key: string]: any };
    }) => Promise<any> = async (_params): Promise<any> => {
      return {
        hello: (): string => 'Hello World!',
      };
    },
    name: string = 'main',
    disableIntrospection: boolean = false
  ): (params: { [key: string]: any }) => Promise<RuntimeActionResponseType> {
    return RuntimeAction.execute(
      `graphql-${name}`,
      [HttpMethod.GET, HttpMethod.POST],
      ['query'],
      [],
      async (params, ctx) => {
        let graphqlSchema;
        try {
          graphqlSchema = buildSchema(schema);
        } catch (error) {
          return RuntimeActionResponse.error(HttpStatus.BAD_REQUEST, (error as Error).message);
        }
        const graphqlResolvers = await resolvers({
          ...ctx,
          ...{
            params,
          },
        });

        const context = {};
        const query = params.query;

        let parsedQuery;
        try {
          parsedQuery = parse(query);
        } catch (error) {
          return RuntimeActionResponse.error(HttpStatus.BAD_REQUEST, (error as Error).message);
        }

        const validationErrors = validate(graphqlSchema, parsedQuery);
        if (validationErrors.length) {
          return RuntimeActionResponse.error(
            HttpStatus.BAD_REQUEST,
            validationErrors.map(err => err.message).join(', ')
          );
        }

        if (disableIntrospection) {
          // Check for introspection queries
          const isIntrospectionQuery = parsedQuery.definitions.some((definition: any) =>
            definition.selectionSet.selections.some((selection: any) =>
              selection.name.value.startsWith('__')
            )
          );
          if (isIntrospectionQuery) {
            // return and log client errors
            return RuntimeActionResponse.error(
              HttpStatus.BAD_REQUEST,
              'Introspection is disabled for security reasons.'
            );
          }
        }

        const variables =
          typeof params.variables === 'string' ? JSON.parse(params.variables) : params.variables;

        return RuntimeActionResponse.success(
          await graphql({
            schema: graphqlSchema,
            source: query,
            rootValue: graphqlResolvers,
            contextValue: context,
            variableValues: variables,
            operationName: params.operationName,
          })
        );
      }
    );
  }
}

export default GraphQlAction;
