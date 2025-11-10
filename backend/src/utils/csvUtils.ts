import { parse } from 'csv-parse/sync';
import { Parser } from 'json2csv';

export interface CsvParseOptions {
  requiredHeaders: string[];
  optionalHeaders?: string[];
  lowercaseHeaders?: boolean;
}

export interface CsvParseResult {
  headers: string[];
  rows: Array<Record<string, string>>;
}

export function parseCsvBuffer(buffer: Buffer, options: CsvParseOptions): CsvParseResult {
  if (!buffer || buffer.length === 0) {
    throw new Error('El archivo CSV está vacío');
  }

  const raw = buffer.toString('utf-8');
  const rows = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<Record<string, string>>;

  if (!rows || rows.length === 0) {
    throw new Error('El archivo CSV no contiene registros para procesar');
  }

  const headers = Object.keys(rows[0] || {});
  const headerSet = new Set(headers.map((h) => h.trim()));

  options.requiredHeaders.forEach((header) => {
    if (!headerSet.has(header)) {
      throw new Error(`El archivo CSV no contiene la columna requerida "${header}"`);
    }
  });

  if (options.optionalHeaders) {
    const allowed = new Set([...options.requiredHeaders, ...options.optionalHeaders]);
    const invalid = headers.filter((header) => !allowed.has(header));
    if (invalid.length > 0) {
      throw new Error(
        `El archivo CSV contiene columnas no permitidas: ${invalid.join(', ')}. Verifica el formato esperado.`
      );
    }
  }

  return {
    headers,
    rows,
  };
}

export interface CsvBuildOptions<T> {
  fields: string[];
  data: T[];
}

export function buildCsv<T>({ fields, data }: CsvBuildOptions<T>): string {
  const parser = new Parser({
    fields,
    header: true,
    withBOM: true,
  });
  return parser.parse(data);
}


