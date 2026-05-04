export interface MappingConfig {
  sourceField: string;
  destinationField: string;
  transform: string | null;
  transformConfig: Record<string, unknown>;
}

export interface TransformError {
  field: string;
  message: string;
}

function applyTransform(value: unknown, transform: string | null, config: Record<string, unknown>, sourceRow: Record<string, unknown>): unknown {
  if (transform === null || transform === '') return value;

  const str = value != null ? String(value) : '';

  switch (transform) {
    case 'uppercase':
      return str.toUpperCase();

    case 'lowercase':
      return str.toLowerCase();

    case 'concat': {
      const separator = typeof config.separator === 'string' ? config.separator : ' ';
      const fields = config.fields as string[] | undefined;
      if (fields && Array.isArray(fields)) {
        return fields.map(f => {
          const v = sourceRow[f];
          return v != null ? String(v) : '';
        }).join(separator);
      }
      const suffix = typeof config.suffix === 'string' ? config.suffix : '';
      const prefix = typeof config.prefix === 'string' ? config.prefix : '';
      return `${prefix}${str}${suffix}`;
    }

    case 'split': {
      const delimiter = typeof config.delimiter === 'string' ? config.delimiter : ',';
      const index = typeof config.index === 'number' ? config.index : 0;
      const parts = str.split(delimiter);
      return parts[index]?.trim() ?? '';
    }

    case 'format_date': {
      const format = typeof config.format === 'string' ? config.format : 'YYYY-MM-DD';
      try {
        const date = new Date(str);
        if (isNaN(date.getTime())) return str;
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        const min = String(date.getMinutes()).padStart(2, '0');
        const s = String(date.getSeconds()).padStart(2, '0');
        return format
          .replace('YYYY', String(y))
          .replace('MM', m)
          .replace('DD', d)
          .replace('HH', h)
          .replace('mm', min)
          .replace('ss', s);
      } catch {
        return str;
      }
    }

    case 'json_extract': {
      const path = typeof config.path === 'string' ? config.path : '';
      try {
        let obj = typeof value === 'string' ? JSON.parse(value) : value;
        for (const key of path.split('.')) {
          if (obj == null) return null;
          obj = (obj as Record<string, unknown>)[key];
        }
        return obj;
      } catch {
        return null;
      }
    }

    case 'constant': {
      return config.value ?? '';
    }

    case 'conditional': {
      const operator = (config.operator as string) || 'equals';
      const compareValue = config.compareValue as string | undefined;
      const thenValue = config.thenValue;
      const elseValue = config.elseValue ?? value;

      let matches = false;
      switch (operator) {
        case 'equals': matches = str === compareValue; break;
        case 'not_equals': matches = str !== compareValue; break;
        case 'contains': matches = str.includes(compareValue ?? ''); break;
        case 'starts_with': matches = str.startsWith(compareValue ?? ''); break;
        case 'ends_with': matches = str.endsWith(compareValue ?? ''); break;
        case 'is_empty': matches = str.trim().length === 0; break;
        case 'is_not_empty': matches = str.trim().length > 0; break;
        default: matches = false;
      }
      return matches ? thenValue : elseValue;
    }

    case 'lookup': {
      const table = config.lookupTable as Record<string, unknown> | undefined;
      if (table && typeof table === 'object') {
        return table[str] ?? config.defaultValue ?? value;
      }
      return value;
    }

    default:
      return value;
  }
}

export function applyMappings(
  sourceRows: Array<Record<string, unknown>>,
  mappings: MappingConfig[],
): { records: Array<Record<string, unknown>>; errors: Array<{ rowIndex: number; errors: TransformError[] }> } {
  const records: Array<Record<string, unknown>> = [];
  const allErrors: Array<{ rowIndex: number; errors: TransformError[] }> = [];

  for (let i = 0; i < sourceRows.length; i++) {
    const row = sourceRows[i];
    const record: Record<string, unknown> = {};
    const rowErrors: TransformError[] = [];

    for (const mapping of mappings) {
      try {
        const sourceValue = row[mapping.sourceField];
        record[mapping.destinationField] = applyTransform(sourceValue, mapping.transform, mapping.transformConfig, row);
      } catch (err) {
        rowErrors.push({
          field: mapping.sourceField,
          message: err instanceof Error ? err.message : 'Transform failed',
        });
        record[mapping.destinationField] = row[mapping.sourceField];
      }
    }

    records.push(record);
    if (rowErrors.length > 0) {
      allErrors.push({ rowIndex: i, errors: rowErrors });
    }
  }

  return { records, errors: allErrors };
}
