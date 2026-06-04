export type ExprType = 'number' | 'variable' | 'binary' | 'unary' | 'call' | 'conditional';

export interface NumberExpr {
  type: 'number';
  value: number;
}
export interface VariableExpr {
  type: 'variable';
  id: string;
}
export interface BinaryExpr {
  type: 'binary';
  op: '+' | '-' | '*' | '/' | '**' | '%' | 'min' | 'max';
  left: Expr;
  right: Expr;
}
export interface UnaryExpr {
  type: 'unary';
  op: '-' | 'abs' | 'sqrt' | 'log' | 'log10' | 'exp' | 'floor' | 'ceil' | 'round';
  operand: Expr;
}
export interface CallExpr {
  type: 'call';
  fn: 'max' | 'min' | 'pow' | 'clamp';
  args: Expr[];
}
export interface ConditionalExpr {
  type: 'conditional';
  condition: BoolExpr;
  then: Expr;
  else: Expr;
}

export type Expr = NumberExpr | VariableExpr | BinaryExpr | UnaryExpr | CallExpr | ConditionalExpr;

export interface CompareExpr {
  type: 'compare';
  op: '<' | '<=' | '>' | '>=' | '==' | '!=';
  left: Expr;
  right: Expr;
}
export interface LogicalExpr {
  type: 'logical';
  op: 'and' | 'or' | 'not';
  operands: BoolExpr[];
}
export type BoolExpr = CompareExpr | LogicalExpr;

export interface OutputExprDef {
  id: string;
  expr: Expr;
}

export interface SerializableScenario {
  id: string;
  version: string;
  title: string;
  description: string;
  domain: string;
  tags?: string[];
  inputs: SerializableInput[];
  outputs: SerializableOutput[];
  outputExprs: OutputExprDef[];
  intermediates?: IntermediateDef[];
  constraints?: SerializableConstraint[];
}

export interface SerializableInput {
  id: string;
  label: string;
  description?: string;
  unit?: string;
  format?: string;
  distribution: unknown;
}

export interface SerializableOutput {
  id: string;
  label: string;
  description?: string;
  unit?: string;
  format?: string;
  higherIsBetter?: boolean;
}

export interface IntermediateDef {
  id: string;
  label: string;
  expr: Expr;
}

export interface SerializableConstraint {
  id: string;
  description: string;
  expr: BoolExpr;
}

export class EvalError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = 'EvalError';
  }
}

export function evalExpr(expr: Expr, vars: Record<string, number>): number {
  switch (expr.type) {
    case 'number':
      return expr.value;

    case 'variable': {
      const val = vars[expr.id];
      if (val === undefined) throw new EvalError(`Unknown variable: ${expr.id}`);
      return val;
    }

    case 'binary': {
      const l = evalExpr(expr.left, vars);
      const r = evalExpr(expr.right, vars);
      switch (expr.op) {
        case '+':
          return l + r;
        case '-':
          return l - r;
        case '*':
          return l * r;
        case '/':
          if (r === 0) throw new EvalError('Division by zero');
          return l / r;
        case '**':
          return l ** r;
        case '%':
          return l % r;
        case 'min':
          return Math.min(l, r);
        case 'max':
          return Math.max(l, r);
      }
      break;
    }

    case 'unary': {
      const v = evalExpr(expr.operand, vars);
      switch (expr.op) {
        case '-':
          return -v;
        case 'abs':
          return Math.abs(v);
        case 'sqrt':
          return Math.sqrt(v);
        case 'log':
          return Math.log(v);
        case 'log10':
          return Math.log10(v);
        case 'exp':
          return Math.exp(v);
        case 'floor':
          return Math.floor(v);
        case 'ceil':
          return Math.ceil(v);
        case 'round':
          return Math.round(v);
      }
      break;
    }

    case 'call': {
      const args = expr.args.map((a) => evalExpr(a, vars));
      switch (expr.fn) {
        case 'max':
          return Math.max(...args);
        case 'min':
          return Math.min(...args);
        case 'pow':
          return args[0]! ** args[1]!;
        case 'clamp':
          return Math.min(Math.max(args[0]!, args[1]!), args[2]!);
      }
      break;
    }

    case 'conditional': {
      const cond = evalBool(expr.condition, vars);
      return cond ? evalExpr(expr.then, vars) : evalExpr(expr.else, vars);
    }
  }
  throw new EvalError(`Unknown expression type: ${(expr as { type: string }).type}`);
}

function evalBool(expr: BoolExpr, vars: Record<string, number>): boolean {
  switch (expr.type) {
    case 'compare': {
      const l = evalExpr(expr.left, vars);
      const r = evalExpr(expr.right, vars);
      switch (expr.op) {
        case '<':
          return l < r;
        case '<=':
          return l <= r;
        case '>':
          return l > r;
        case '>=':
          return l >= r;
        case '==':
          return l === r;
        case '!=':
          return l !== r;
      }
      break;
    }
    case 'logical': {
      switch (expr.op) {
        case 'and':
          return expr.operands.every((o) => evalBool(o, vars));
        case 'or':
          return expr.operands.some((o) => evalBool(o, vars));
        case 'not':
          return !evalBool(expr.operands[0]!, vars);
      }
    }
  }
  return false;
}

export function buildScenarioCalculate(
  outputExprs: OutputExprDef[],
  intermediates: IntermediateDef[] = [],
): (inputs: Record<string, number>) => Record<string, number> {
  return (inputs: Record<string, number>): Record<string, number> => {
    const ctx: Record<string, number> = { ...inputs };

    for (const inter of intermediates) {
      ctx[inter.id] = evalExpr(inter.expr, ctx);
    }

    const result: Record<string, number> = {};
    for (const output of outputExprs) {
      result[output.id] = evalExpr(output.expr, ctx);
    }
    return result;
  };
}

export const DSL_HELPERS = {
  n: (value: number): NumberExpr => ({ type: 'number', value }),
  v: (id: string): VariableExpr => ({ type: 'variable', id }),
  add: (left: Expr, right: Expr): BinaryExpr => ({ type: 'binary', op: '+', left, right }),
  sub: (left: Expr, right: Expr): BinaryExpr => ({ type: 'binary', op: '-', left, right }),
  mul: (left: Expr, right: Expr): BinaryExpr => ({ type: 'binary', op: '*', left, right }),
  div: (left: Expr, right: Expr): BinaryExpr => ({ type: 'binary', op: '/', left, right }),
  pow: (left: Expr, right: Expr): BinaryExpr => ({ type: 'binary', op: '**', left, right }),
  max: (left: Expr, right: Expr): BinaryExpr => ({ type: 'binary', op: 'max', left, right }),
  min: (left: Expr, right: Expr): BinaryExpr => ({ type: 'binary', op: 'min', left, right }),
  neg: (operand: Expr): UnaryExpr => ({ type: 'unary', op: '-', operand }),
  sqrt: (operand: Expr): UnaryExpr => ({ type: 'unary', op: 'sqrt', operand }),
  log: (operand: Expr): UnaryExpr => ({ type: 'unary', op: 'log', operand }),
  exp: (operand: Expr): UnaryExpr => ({ type: 'unary', op: 'exp', operand }),
  clamp: (val: Expr, lo: Expr, hi: Expr): CallExpr => ({
    type: 'call',
    fn: 'clamp',
    args: [val, lo, hi],
  }),
  ifGt: (left: Expr, right: Expr, then: Expr, otherwise: Expr): ConditionalExpr => ({
    type: 'conditional',
    condition: { type: 'compare', op: '>', left, right },
    then,
    else: otherwise,
  }),
};

const VALID_DISTRIBUTION_TYPES = new Set([
  'normal',
  'log_normal',
  'uniform',
  'triangular',
  'beta',
  'poisson',
  'constant',
  'custom',
]);

const REQUIRED_DIST_FIELDS: Record<string, string[]> = {
  normal: ['mean', 'stdDev'],
  log_normal: ['mean', 'stdDev'],
  uniform: ['min', 'max'],
  triangular: ['min', 'mode', 'max'],
  beta: ['alpha', 'beta'],
  poisson: ['lambda'],
  constant: ['value'],
  custom: ['values'],
};

function validateDistribution(dist: unknown): boolean {
  if (!dist || typeof dist !== 'object') return false;
  const d = dist as Record<string, unknown>;
  if (typeof d.type !== 'string') return false;
  if (!VALID_DISTRIBUTION_TYPES.has(d.type)) return false;
  const required = REQUIRED_DIST_FIELDS[d.type as string] ?? [];
  for (const field of required) {
    if (d[field] === undefined || d[field] === null) return false;
  }
  if (d.type === 'custom' && !Array.isArray(d.values)) return false;
  return true;
}

const VALID_BINARY_OPS = new Set(['+', '-', '*', '/', '**', '%', 'min', 'max']);
const VALID_UNARY_OPS = new Set([
  '-',
  'abs',
  'sqrt',
  'log',
  'log10',
  'exp',
  'floor',
  'ceil',
  'round',
]);
const VALID_CALL_FNS = new Set(['max', 'min', 'pow', 'clamp']);
const VALID_COMPARE_OPS = new Set(['<', '<=', '>', '>=', '==', '!=']);
const VALID_LOGICAL_OPS = new Set(['and', 'or', 'not']);
const MAX_EXPR_DEPTH = 32;

function validateBoolExprNode(expr: unknown, depth: number): boolean {
  if (depth > MAX_EXPR_DEPTH) return false;
  if (!expr || typeof expr !== 'object') return false;
  const e = expr as Record<string, unknown>;
  if (typeof e.type !== 'string') return false;
  if (e.type === 'compare') {
    if (typeof e.op !== 'string' || !VALID_COMPARE_OPS.has(e.op)) return false;
    if (!validateExprNode(e.left, depth + 1)) return false;
    if (!validateExprNode(e.right, depth + 1)) return false;
    return true;
  }
  if (e.type === 'logical') {
    if (typeof e.op !== 'string' || !VALID_LOGICAL_OPS.has(e.op)) return false;
    if (!Array.isArray(e.operands) || e.operands.length === 0) return false;
    for (const operand of e.operands as unknown[]) {
      if (!validateBoolExprNode(operand, depth + 1)) return false;
    }
    return true;
  }
  return false;
}

function validateExprNode(expr: unknown, depth = 0): boolean {
  if (depth > MAX_EXPR_DEPTH) return false;
  if (!expr || typeof expr !== 'object') return false;
  const e = expr as Record<string, unknown>;
  if (typeof e.type !== 'string') return false;
  switch (e.type) {
    case 'number':
      return typeof e.value === 'number' && Number.isFinite(e.value as number);
    case 'variable':
      return typeof e.id === 'string' && (e.id as string).length > 0;
    case 'binary':
      if (typeof e.op !== 'string' || !VALID_BINARY_OPS.has(e.op)) return false;
      return validateExprNode(e.left, depth + 1) && validateExprNode(e.right, depth + 1);
    case 'unary':
      if (typeof e.op !== 'string' || !VALID_UNARY_OPS.has(e.op)) return false;
      return validateExprNode(e.operand, depth + 1);
    case 'call': {
      if (typeof e.fn !== 'string' || !VALID_CALL_FNS.has(e.fn)) return false;
      if (!Array.isArray(e.args)) return false;
      const args = e.args as unknown[];
      const REQUIRED_ARGS: Record<string, number> = { pow: 2, clamp: 3, max: 2, min: 2 };
      const requiredArgCount = REQUIRED_ARGS[e.fn as string];
      if (requiredArgCount !== undefined && args.length !== requiredArgCount) return false;
      for (const arg of args) {
        if (!validateExprNode(arg, depth + 1)) return false;
      }
      return true;
    }
    case 'conditional':
      if (!validateBoolExprNode(e.condition, depth + 1)) return false;
      return validateExprNode(e.then, depth + 1) && validateExprNode(e.else, depth + 1);
    default:
      return false;
  }
}

export function validateSerializableScenario(s: unknown): s is SerializableScenario {
  if (!s || typeof s !== 'object') return false;
  const sc = s as Record<string, unknown>;

  if (typeof sc.id !== 'string' || !sc.id) return false;
  if (typeof sc.title !== 'string' || !sc.title) return false;
  if (typeof sc.domain !== 'string' || !sc.domain) return false;
  if (
    !Array.isArray(sc.inputs) ||
    !Array.isArray(sc.outputs) ||
    !Array.isArray(sc.outputExprs)
  )
    return false;

  const inputs = sc.inputs as unknown[];
  for (const inp of inputs) {
    if (!inp || typeof inp !== 'object') return false;
    const i = inp as Record<string, unknown>;
    if (typeof i.id !== 'string' || !i.id) return false;
    if (!validateDistribution(i.distribution)) return false;
  }

  const VALID_OUTPUT_FORMATS = new Set(['currency', 'percentage', 'number', 'years']);

  const outputs = sc.outputs as unknown[];
  for (const out of outputs) {
    if (!out || typeof out !== 'object') return false;
    const o = out as Record<string, unknown>;
    if (typeof o.id !== 'string' || !o.id) return false;
    if (typeof o.label !== 'string') return false;
    if (
      o.format !== undefined &&
      o.format !== null &&
      !VALID_OUTPUT_FORMATS.has(o.format as string)
    )
      return false;
  }

  const outputIds = new Set<string>();
  for (const out of outputs) {
    const o = out as Record<string, unknown>;
    outputIds.add(o.id as string);
  }

  const outputExprs = sc.outputExprs as unknown[];
  const exprIds = new Set<string>();
  for (const expr of outputExprs) {
    if (!expr || typeof expr !== 'object') return false;
    const e = expr as Record<string, unknown>;
    if (typeof e.id !== 'string' || !e.id) return false;
    if (exprIds.has(e.id as string)) return false;
    exprIds.add(e.id as string);
    if (!validateExprNode(e.expr)) return false;
  }

  for (const oid of outputIds) {
    if (!exprIds.has(oid)) return false;
  }

  if (Array.isArray(sc.intermediates)) {
    for (const inter of sc.intermediates as unknown[]) {
      if (!inter || typeof inter !== 'object') return false;
      const m = inter as Record<string, unknown>;
      if (typeof m.id !== 'string' || !m.id) return false;
      if (!validateExprNode(m.expr)) return false;
    }
  }

  if (Array.isArray(sc.constraints)) {
    for (const con of sc.constraints as unknown[]) {
      if (!con || typeof con !== 'object') return false;
      const c = con as Record<string, unknown>;
      if (typeof c.id !== 'string' || !c.id) return false;
      if (typeof c.description !== 'string') return false;
      if (!validateBoolExprNode(c.expr, 0)) return false;
    }
  }

  return true;
}
