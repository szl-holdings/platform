export interface SchemaValidationResult {
  valid: boolean;
  errors: string[];
}

type JsonSchemaValue =
  | { type: 'string'; enum?: string[] }
  | { type: 'number' | 'integer'; minimum?: number; maximum?: number; enum?: number[] }
  | { type: 'boolean' }
  | { type: 'array'; items?: JsonSchemaValue }
  | { type: 'object'; properties?: Record<string, JsonSchemaValue>; required?: string[] }
  | { type?: string; [key: string]: unknown };

function validateValue(value: unknown, schema: Record<string, unknown>, path: string): string[] {
  const errors: string[] = [];
  const type = schema.type as string | undefined;

  if (type) {
    const actualType = Array.isArray(value) ? 'array' : value === null ? 'null' : typeof value;
    const expectedType = type === 'integer' ? 'number' : type;
    if (actualType !== expectedType) {
      errors.push(`${path}: expected type '${type}', got '${actualType}'`);
      return errors;
    }
    if (type === 'integer' && typeof value === 'number' && !Number.isInteger(value)) {
      errors.push(`${path}: expected integer, got float`);
    }
  }

  if (type === 'object' || (typeof value === 'object' && value !== null && !Array.isArray(value))) {
    const obj = value as Record<string, unknown>;

    const required = schema.required;
    if (Array.isArray(required)) {
      for (const field of required) {
        if (typeof field === 'string' && !(field in obj)) {
          errors.push(`${path}: missing required field '${field}'`);
        }
      }
    }

    const properties = schema.properties;
    if (properties && typeof properties === 'object') {
      for (const [key, propSchema] of Object.entries(properties as Record<string, unknown>)) {
        if (key in obj && propSchema && typeof propSchema === 'object') {
          const nested = validateValue(
            obj[key],
            propSchema as Record<string, unknown>,
            `${path}.${key}`,
          );
          errors.push(...nested);
        }
      }
    }
  }

  if (type === 'array' && Array.isArray(value)) {
    const items = schema.items;
    if (items && typeof items === 'object') {
      value.forEach((item, i) => {
        const nested = validateValue(item, items as Record<string, unknown>, `${path}[${i}]`);
        errors.push(...nested);
      });
    }
  }

  const enumValues = schema.enum;
  if (Array.isArray(enumValues) && !enumValues.includes(value)) {
    errors.push(`${path}: value '${value}' not in allowed enum ${JSON.stringify(enumValues)}`);
  }

  if (typeof value === 'number') {
    const minimum = schema.minimum;
    if (typeof minimum === 'number' && value < minimum) {
      errors.push(`${path}: value ${value} is less than minimum ${minimum}`);
    }
    const maximum = schema.maximum;
    if (typeof maximum === 'number' && value > maximum) {
      errors.push(`${path}: value ${value} is greater than maximum ${maximum}`);
    }
  }

  if (typeof value === 'string') {
    const minLength = schema.minLength;
    if (typeof minLength === 'number' && value.length < minLength) {
      errors.push(`${path}: string length ${value.length} is less than minLength ${minLength}`);
    }
    const maxLength = schema.maxLength;
    if (typeof maxLength === 'number' && value.length > maxLength) {
      errors.push(`${path}: string length ${value.length} exceeds maxLength ${maxLength}`);
    }
    const pattern = schema.pattern;
    if (typeof pattern === 'string' && !new RegExp(pattern).test(value)) {
      errors.push(`${path}: value does not match pattern '${pattern}'`);
    }
  }

  return errors;
}

export function validateAgainstSchema(
  toolId: string,
  input: unknown,
  inputSchema: Record<string, unknown> | undefined,
): SchemaValidationResult {
  if (!inputSchema) {
    return { valid: true, errors: [] };
  }

  const topType = inputSchema.type;
  if (topType && topType !== 'object') {
    return {
      valid: false,
      errors: [`Tool '${toolId}' inputSchema root type must be 'object', got '${topType}'`],
    };
  }

  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return {
      valid: false,
      errors: [`Tool '${toolId}' input must be a JSON object`],
    };
  }

  const errors = validateValue(input, inputSchema, `input`);
  return { valid: errors.length === 0, errors };
}
