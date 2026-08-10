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
      `SELECT COUNT(*) AS total FROM invoices i JOIN contacts c ON i.contact_id = c.id;`
    );
    const total = parseInt(countRes.rows[0]?.total || '0');
    const totalPages = Math.ceil(total / limit) || 1;

    // Paginated Rows under RLS
    const res = await executeWithRLS(
      user.userId,
      user.role,
      `SELECT i.id, i.contact_id, c.company_name, i.invoice_number, i.amount, i.currency, i.issue_date, i.due_date, i.status, i.paid_at
       FROM invoices i
       JOIN contacts c ON i.contact_id = c.id
       ORDER BY i.due_date DESC
       LIMIT $1 OFFSET $2;`,
      [limit, offset]
    );

    return NextResponse.json({
      success: true,
      invoices: res.rows,
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
    const { contact_id, invoice_number, amount, currency, issue_date, due_date, status } = body;

    if (!contact_id || !invoice_number || !amount || !issue_date || !due_date) {
      return NextResponse.json({ error: 'Missing required invoice fields' }, { status: 400 });
    }

    const res = await executeWithRLS(
      user.userId,
      user.role,
      `INSERT INTO invoices (contact_id, invoice_number, amount, currency, issue_date, due_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *;`,
      [contact_id, invoice_number, amount, currency || 'INR', issue_date, due_date, status || 'DRAFT']
    );

    return NextResponse.json({ success: true, invoice: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedSession(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, amount, due_date, status } = body;

    if (!id) return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });

    const res = await executeWithRLS(
      user.userId,
      user.role,
      `UPDATE invoices
       SET amount = COALESCE($1, amount),
           due_date = COALESCE($2, due_date),
           status = COALESCE($3, status),
           paid_at = CASE WHEN $3 = 'PAID' THEN NOW() ELSE paid_at END
       WHERE id = $4
       RETURNING *;`,
      [amount || null, due_date || null, status || null, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, invoice: res.rows[0] });
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

    if (!id) return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });

    const res = await executeWithRLS(
      user.userId,
      user.role,
      `DELETE FROM invoices WHERE id = $1 RETURNING id;`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Invoice not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}
