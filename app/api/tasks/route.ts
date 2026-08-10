import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth';
import { executeWithRLS } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedSession(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));
    const offset = (page - 1) * limit;

    // Total Count under RLS
    const countRes = await executeWithRLS(
      user.userId,
      user.role,
      `SELECT COUNT(*) AS total FROM tasks t JOIN contacts c ON t.contact_id = c.id;`
    );
    const total = parseInt(countRes.rows[0]?.total || '0');
    const totalPages = Math.ceil(total / limit) || 1;

    // Paginated Rows under RLS
    const res = await executeWithRLS(
      user.userId,
      user.role,
      `SELECT t.id, t.contact_id, c.company_name, t.title, t.due_date, t.status, t.assigned_to
       FROM tasks t
       JOIN contacts c ON t.contact_id = c.id
       ORDER BY t.due_date ASC
       LIMIT $1 OFFSET $2;`,
      [limit, offset]
    );

    return NextResponse.json({
      success: true,
      tasks: res.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedSession(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { contact_id, title, due_date, status, assigned_to } = body;

    if (!contact_id || !title) {
      return NextResponse.json({ error: 'Contact ID and Task Title are required' }, { status: 400 });
    }

    const res = await executeWithRLS(
      user.userId,
      user.role,
      `INSERT INTO tasks (contact_id, assigned_to, title, due_date, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *;`,
      [contact_id, assigned_to || user.userId, title, due_date || null, status || 'OPEN']
    );

    return NextResponse.json({ success: true, task: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedSession(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, title, due_date, status } = body;

    if (!id) return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });

    const res = await executeWithRLS(
      user.userId,
      user.role,
      `UPDATE tasks
       SET title = COALESCE($1, title),
           due_date = COALESCE($2, due_date),
           status = COALESCE($3, status)
       WHERE id = $4
       RETURNING *;`,
      [title || null, due_date || null, status || null, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedSession(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Task ID is required' }, { status: 400 });

    const res = await executeWithRLS(
      user.userId,
      user.role,
      `DELETE FROM tasks WHERE id = $1 RETURNING id;`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Task not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}
