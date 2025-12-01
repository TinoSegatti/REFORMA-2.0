/**
 * Declaración de tipos para json2csv
 * Compatible con json2csv v6.0.0-alpha.2
 */

declare module 'json2csv' {
  export interface ParserOptions {
    fields?: string[] | FieldInfo[];
    header?: boolean;
    withBOM?: boolean;
    delimiter?: string;
    quote?: string;
    escapedQuote?: string;
    eol?: string;
    excelStrings?: boolean;
    includeEmptyRows?: boolean;
    withTitle?: boolean;
    title?: string;
    transforms?: Array<(item: any) => any>;
  }

  export interface FieldInfo {
    label?: string;
    value: string | ((row: any) => any);
    default?: string;
  }

  export class Parser {
    constructor(opts?: ParserOptions);
    parse(data: any[] | any): string;
  }

  export function parse(data: any[] | any, opts?: ParserOptions): string;
}


