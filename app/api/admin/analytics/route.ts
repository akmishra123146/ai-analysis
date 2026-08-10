import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(req: NextRequest) {
  // 1. Enforce Server-Side Authorization (PRD Requirement §6 & Scenario 8)
  const session = await getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    // 1. Overall Summary Stats
    const statsRes = await query(`
      SELECT 
        COUNT(*) AS total_queries,
        COALESCE(SUM(cost_usd), 0) AS total_cost,
        COALESCE(SUM(input_tokens + output_tokens), 0) AS total_tokens,
        COALESCE(AVG(latency_ms), 0) AS avg_latency_ms,
        COUNT(CASE WHEN was_blocked = true THEN 1 END) AS blocked_queries
      FROM ai_queries;
    `);

    // 2. Per-User Consumption Breakdown
    const userBreakdownRes = await query(`
      SELECT 
        u.name AS user_name,
        u.email AS user_email,
        u.role,
        COUNT(q.id) AS query_count,
        COALESCE(SUM(q.input_tokens + q.output_tokens), 0) AS total_tokens,
        COALESCE(SUM(q.cost_usd), 0) AS total_cost,
        COALESCE(AVG(q.latency_ms), 0) AS avg_latency_ms
      FROM users u
      LEFT JOIN ai_queries q ON u.id = q.user_id
      GROUP BY u.id, u.name, u.email, u.role
      ORDER BY total_cost DESC;
    `);

    // 3. Execution & Security Audit Logs (Latest 100)
    const logsRes = await query(`
      SELECT 
        q.id,
        u.name AS user_name,
        u.email AS user_email,
        q.question,
        q.generated_sql,
        q.was_blocked,
        q.block_reason,
        q.row_count,
        q.input_tokens,
        q.output_tokens,
        q.cost_usd,
        q.latency_ms,
        q.created_at
      FROM ai_queries q
      JOIN users u ON q.user_id = u.id
      ORDER BY q.created_at DESC
      LIMIT 100;
    `);

    return NextResponse.json({
      stats: statsRes.rows[0],
      user_breakdown: userBreakdownRes.rows,
      logs: logsRes.rows,
    });
  } catch (error: any) {
    console.error('Admin Analytics API error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin analytics' }, { status: 500 });
  }
}
