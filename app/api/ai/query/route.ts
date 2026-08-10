import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth';
import { executeWithRLS, query } from '@/lib/db';
import { validateAndSanitizeSQL } from '@/lib/ast-validator';
import { translateQuestionToSQL } from '@/lib/nvidia-llm';

export async function POST(req: NextRequest) {
  // 1. Authenticate Identity directly from Session (PRD Requirement §4.1)
  const session = await getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    const body = await req.json();
    const { question } = body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return NextResponse.json({ error: 'A valid question string is required' }, { status: 400 });
    }

    // 2. Translate Question to SQL via NVIDIA LLM API
    const translation = await translateQuestionToSQL(question.trim(), session.role);

    // 3. Pre-execution AST Guardrail Validation (PRD Requirement §5.1)
    const validation = validateAndSanitizeSQL(translation.sql);

    if (!validation.isValid) {
      const latencyMs = Date.now() - startTime;
      
      // Log blocked query attempt in audit trail
      await query(
        `INSERT INTO ai_queries (user_id, question, generated_sql, was_blocked, block_reason, row_count, model, input_tokens, output_tokens, cost_usd, latency_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
        [
          session.userId,
          question,
          translation.sql,
          true,
          validation.reason || 'AST Security Block',
          0,
          translation.model,
          translation.inputTokens,
          translation.outputTokens,
          translation.costUsd,
          latencyMs
        ]
      );

      return NextResponse.json({
        success: false,
        was_blocked: true,
        answer: 'Your query could not be executed due to system security and guardrail policies.',
        block_reason: validation.reason,
        generated_sql: translation.sql,
        interpretation: translation.interpretation,
        format: 'blocked',
        rows: [],
        rowCount: 0,
        metadata: {
          latency_ms: latencyMs,
          model: translation.model,
          cost_usd: translation.costUsd,
        }
      });
    }

    const sanitizedSql = validation.sanitizedSql!;

    // 4. Execute validated SQL with Sub-SQL Row-Level Security (PostgreSQL RLS)
    let queryResult;
    try {
      queryResult = await executeWithRLS(session.userId, session.role, sanitizedSql);
    } catch (dbErr: any) {
      const latencyMs = Date.now() - startTime;
      
      await query(
        `INSERT INTO ai_queries (user_id, question, generated_sql, was_blocked, block_reason, row_count, model, input_tokens, output_tokens, cost_usd, latency_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`,
        [
          session.userId,
          question,
          sanitizedSql,
          true,
          `Database Execution Error: ${dbErr.message || 'Timeout or query error'}`,
          0,
          translation.model,
          translation.inputTokens,
          translation.outputTokens,
          translation.costUsd,
          latencyMs
        ]
      );

      return NextResponse.json({
        success: false,
        was_blocked: true,
        answer: 'Query execution timed out or failed to execute against the CRM database.',
        block_reason: dbErr.message || 'Database execution timeout',
        generated_sql: sanitizedSql,
        interpretation: translation.interpretation,
        format: 'error',
        rows: [],
        rowCount: 0,
        metadata: {
          latency_ms: latencyMs,
          model: translation.model,
        }
      });
    }

    const latencyMs = Date.now() - startTime;
    const rows = queryResult.rows;
    const rowCount = queryResult.rowCount || rows.length || 0;

    // 5. Determine Contextual Output Format based on result shape (PRD §4.2)
    let format: 'scalar' | 'key_value' | 'table' | 'zero_rows' = 'table';
    let contextualAnswer = '';
    let scalarValue = null;

    if (rowCount === 0) {
      format = 'zero_rows';
      contextualAnswer = `No matching records found for: "${translation.interpretation}".`;
    } else if (rowCount === 1 && Object.keys(rows[0]).length === 1) {
      format = 'scalar';
      const key = Object.keys(rows[0])[0];
      scalarValue = rows[0][key];
      contextualAnswer = `${key.replace(/_/g, ' ').toUpperCase()}: ${scalarValue}`;
    } else if (rowCount === 1 && Object.keys(rows[0]).length > 1) {
      format = 'key_value';
      contextualAnswer = `Showing 1 matching record for: ${translation.interpretation}`;
    } else {
      format = 'table';
      contextualAnswer = `Found ${rowCount} matching record${rowCount > 1 ? 's' : ''} for: ${translation.interpretation}`;
    }

    // 6. Audit & Privacy Logging (PRD §5.5)
    await query(
      `INSERT INTO ai_queries (user_id, question, generated_sql, was_blocked, block_reason, row_count, model, input_tokens, output_tokens, cost_usd, latency_ms)
       VALUES ($1, $2, $3, false, null, $4, $5, $6, $7, $8, $9);`,
      [
        session.userId,
        question,
        sanitizedSql,
        rowCount,
        translation.model,
        translation.inputTokens,
        translation.outputTokens,
        translation.costUsd,
        latencyMs
      ]
    );

    return NextResponse.json({
      success: true,
      was_blocked: false,
      answer: contextualAnswer,
      scalar_value: scalarValue,
      generated_sql: sanitizedSql,
      interpretation: translation.interpretation,
      format,
      rows,
      rowCount,
      metadata: {
        latency_ms: latencyMs,
        model: translation.model,
        cost_usd: translation.costUsd,
        tokens: translation.inputTokens + translation.outputTokens,
      }
    });

  } catch (error: any) {
    console.error('AI Query pipeline error:', error);
    return NextResponse.json({ error: 'Internal Server Error during AI query execution' }, { status: 500 });
  }
}
