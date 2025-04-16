declare module 'http-status' {
  const httpStatus: {
    OK: number;
    CREATED: number;
    BAD_REQUEST: number;
    UNAUTHORIZED: number;
    FORBIDDEN: number;
    NOT_FOUND: number;
    INTERNAL_SERVER_ERROR: number;
    [key: string]: number;
  };
  export default httpStatus;
}

declare module 'xss-filters' {
  export function inHTMLData(data: string): string;
  export function inHTMLComment(data: string): string;
  export function inSingleQuotedAttr(data: string): string;
  export function inDoubleQuotedAttr(data: string): string;
  export function inUnQuotedAttr(data: string): string;
  export function inHTML(data: string): string;
  export function inURL(data: string): string;
  export function inScriptData(data: string): string;
  export function inStyleData(data: string): string;
}

declare module 'swagger-jsdoc' {
  export default function swaggerJsdoc(options: any): any;
}

declare module 'swagger-ui-express' {
  export default function swaggerUiExpress(options: any): any;
}

declare module 'node-mocks-http' {
  export function createRequest(options?: any): any;
  export function createResponse(options?: any): any;
}

declare module '@faker-js/faker' {
  export const faker: any;
  export default faker;
}

declare module 'supertest' {
  export default function supertest(app: any): any;
}

declare module '@jest/globals' {
  export const describe: any;
  export const it: any;
  export const expect: any;
  export const jest: any;
  export const beforeAll: any;
  export const afterAll: any;
  export const beforeEach: any;
  export const afterEach: any;
}
