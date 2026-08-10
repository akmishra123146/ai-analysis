import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth';
import { executeWithRLS } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));
    const offset = (page - 1) * limit;

    // Total Count under RLS
    const countRes = await executeWithRLS(
      session.userId,
      session.role,
      `SELECT COUNT(*) AS total FROM contacts;`
    );
    const total = parseInt(countRes.rows[0]?.total || '0');
    const totalPages = Math.ceil(total / limit) || 1;

    // Paginated Rows under RLS
    const res = await executeWithRLS(
      session.userId,
      session.role,
      `SELECT id, company_name, contact_name, email, phone, status, sales_manager_id, lead_generator_id, created_at
       FROM contacts
       ORDER BY company_name ASC
       LIMIT $1 OFFSET $2;`,
      [limit, offset]
    );

    return NextResponse.json({
      success: true,
      contacts: res.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Contacts API GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { company_name, contact_name, email, phone, status } = body;

    if (!company_name || !contact_name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const res = await executeWithRLS(
      session.userId,
      session.role,
      `INSERT INTO contacts (company_name, contact_name, email, phone, status, sales_manager_id, lead_generator_id)
       VALUES ($1, $2, $3, $4, $5, $6, $6)
       RETURNING *;`,
      [company_name, contact_name, email, phone || null, status || 'LEAD', session.userId]
    );

    return NextResponse.json({ success: true, contact: res.rows[0] });
  } catch (error: any) {
    console.error('Contacts API POST error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create contact' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { id, company_name, contact_name, email, phone, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const res = await executeWithRLS(
      session.userId,
      session.role,
      `UPDATE contacts
       SET company_name = COALESCE($1, company_name),
           contact_name = COALESCE($2, contact_name),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           status = COALESCE($5, status)
       WHERE id = $6
       RETURNING *;`,
      [company_name || null, contact_name || null, email || null, phone || null, status || null, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Contact not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, contact: res.rows[0] });
  } catch (error: any) {
    console.error('Contacts API PATCH error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update contact' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getAuthenticatedSession(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Contact ID is required' }, { status: 400 });
    }

    const res = await executeWithRLS(
      session.userId,
      session.role,
      `DELETE FROM contacts WHERE id = $1 RETURNING id;`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Contact not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Contacts API DELETE error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete contact' }, { status: 500 });
  }
}
