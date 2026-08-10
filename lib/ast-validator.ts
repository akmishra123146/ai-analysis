import { Parser } from 'node-sql-parser';

export interface ASTValidationResult {
  isValid: boolean;
  reason?: string;
  sanitizedSql?: string;
}

const parser = new Parser();

// Forbidden system catalog tables and side-effect functions
const FORBIDDEN_CATALOGS = [
  'pg_catalog',
  'information_schema',
  'pg_user',
  'pg_shadow',
  'pg_authid',
  'pg_roles',
  'pg_proc',
  'pg_class',
  'pg_tables',
  'pg_sleep',
  'pg_read_file',
  'pg_ls_dir',
  'version',
  'current_user',
  'session_user'
];

/**
 * Validates generated SQL using Abstract Syntax Tree (AST) parsing.
 * Treats LLM output as untrusted input.
 * Rejects non-SELECT queries, DDL, DML, multi-statements, CTE writes, and system catalogs.
 */
export function validateAndSanitizeSQL(rawSql: string): ASTValidationResult {
  if (!rawSql || typeof rawSql !== 'string') {
    return { isValid: false, reason: 'Empty or non-string query provided' };
  }

  // Clean markdown code fence wrappers if LLM returned markdown
  let cleanedSql = rawSql.trim();
  if (cleanedSql.startsWith('```sql')) {
    cleanedSql = cleanedSql.replace(/^```sql\s*/i, '').replace(/```$/, '').trim();
  } else if (cleanedSql.startsWith('```')) {
    cleanedSql = cleanedSql.replace(/^```\s*/, '').replace(/```$/, '').trim();
  }

  // Remove trailing semicolons
  if (cleanedSql.endsWith(';')) {
    cleanedSql = cleanedSql.slice(0, -1).trim();
  }

  // Reject multi-statement chaining (semicolon inside string)
  if (cleanedSql.includes(';')) {
    return { isValid: false, reason: 'Multi-statement query chaining detected' };
  }

  // Check forbidden catalog keywords via strict lowercase check
  const lowerSql = cleanedSql.toLowerCase();
  for (const catalog of FORBIDDEN_CATALOGS) {
    // Matches as whole word or catalog qualifier
    const regex = new RegExp(`\\b${catalog}\\b`, 'i');
    if (regex.test(lowerSql)) {
      return { isValid: false, reason: `Access to system catalog or restricted function '${catalog}' is blocked` };
    }
  }

  // Parse into AST using PostgreSQL dialect
  try {
    const ast = parser.astify(cleanedSql, { database: 'postgresql' });

    // AST result can be an array if multiple queries were provided
    if (Array.isArray(ast)) {
      if (ast.length !== 1) {
        return { isValid: false, reason: 'Multiple SQL statements detected' };
      }
      return checkSingleAstNode(ast[0], cleanedSql);
    } else {
      return checkSingleAstNode(ast, cleanedSql);
    }
  } catch (err: any) {
    // If AST parsing fails, return neutral failure
    return { isValid: false, reason: `AST Parsing Failed: Syntactically invalid SQL (${err.message || 'Syntax Error'})` };
  }
}

function checkSingleAstNode(node: any, cleanedSql: string): ASTValidationResult {
  if (!node || typeof node !== 'object') {
    return { isValid: false, reason: 'Invalid AST node' };
  }

  // Enforce Statement Constraint: MUST be a SELECT statement
  if (node.type !== 'select') {
    return { isValid: false, reason: `Forbidden operation type '${node.type?.toUpperCase()}'. Only single SELECT statements are allowed.` };
  }

  // Check for CTE write operations inside WITH clauses
  if (node.with && Array.isArray(node.with)) {
    for (const cte of node.with) {
      if (cte.stmt && cte.stmt.type !== 'select') {
        return { isValid: false, reason: 'Forbidden write operation detected inside CTE clause' };
      }
    }
  }

  // Enforce hard row limit (1,000 rows max)
  let finalSql = cleanedSql;
  if (!node.limit) {
    finalSql = `${cleanedSql} LIMIT 1000`;
  } else if (node.limit.value && Array.isArray(node.limit.value) && node.limit.value[0]?.value > 1000) {
    // Override excessive limit to 1000
    finalSql = cleanedSql.replace(/LIMIT\s+\d+/i, 'LIMIT 1000');
  }

  return {
    isValid: true,
    sanitizedSql: finalSql
  };
}
