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
      `SELECT COUNT(*) AS total FROM estimates e JOIN contacts c ON e.contact_id = c.id;`
    );
    const total = parseInt(countRes.rows[0]?.total || '0');
    const totalPages = Math.ceil(total / limit) || 1;

    // Paginated Rows under RLS
    const res = await executeWithRLS(
      user.userId,
      user.role,
      `SELECT e.id, e.contact_id, c.company_name, e.estimate_number, e.amount, e.currency, e.valid_until, e.status
       FROM estimates e
       JOIN contacts c ON e.contact_id = c.id
       ORDER BY e.valid_until ASC
       LIMIT $1 OFFSET $2;`,
      [limit, offset]
    );

    return NextResponse.json({
      success: true,
      estimates: res.rows,
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
    const { contact_id, estimate_number, amount, currency, valid_until, status } = body;

    if (!contact_id || !estimate_number || !amount || !valid_until) {
      return NextResponse.json({ error: 'Missing required estimate fields' }, { status: 400 });
    }

    const res = await executeWithRLS(
      user.userId,
      user.role,
      `INSERT INTO estimates (contact_id, estimate_number, amount, currency, valid_until, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [contact_id, estimate_number, amount, currency || 'INR', valid_until, status || 'DRAFT']
    );

    return NextResponse.json({ success: true, estimate: res.rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedSession(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { id, amount, valid_until, status } = body;

    if (!id) return NextResponse.json({ error: 'Estimate ID is required' }, { status: 400 });

    const res = await executeWithRLS(
      user.userId,
      user.role,
      `UPDATE estimates
       SET amount = COALESCE($1, amount),
           valid_until = COALESCE($2, valid_until),
           status = COALESCE($3, status)
       WHERE id = $4
       RETURNING *;`,
      [amount || null, valid_until || null, status || null, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Estimate not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, estimate: res.rows[0] });
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

    if (!id) return NextResponse.json({ error: 'Estimate ID is required' }, { status: 400 });

    const res = await executeWithRLS(
      user.userId,
      user.role,
      `DELETE FROM estimates WHERE id = $1 RETURNING id;`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Estimate not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}
