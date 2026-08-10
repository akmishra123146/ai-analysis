import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth';
import { query } from '@/lib/db';
import crypto from 'crypto';

function hashPassword(password: string): string {
  const salt = 'crm_static_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
}

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.max(1, parseInt(searchParams.get('limit') || '10'));
  const offset = (page - 1) * limit;

  const countRes = await query(`SELECT COUNT(*) AS total FROM users;`);
  const total = parseInt(countRes.rows[0]?.total || '0');
  const totalPages = Math.ceil(total / limit) || 1;

  const usersRes = await query(
    `SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2;`,
    [limit, offset]
  );

  return NextResponse.json({
    success: true,
    users: usersRes.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
}

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const { name, email, password, role } = await req.json();
    if (!name || !email || !password || !role) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, is_active, created_at;`,
      [name, email.toLowerCase().trim(), passwordHash, role]
    );

    return NextResponse.json({ user: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { userId, name, email, role, is_active } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const result = await query(
      `UPDATE users
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           role = CASE WHEN $3::text IS NOT NULL THEN $3::user_role ELSE role END,
           is_active = COALESCE($4, is_active)
       WHERE id = $5
       RETURNING id, name, email, role, is_active, created_at;`,
      [name || null, email ? email.toLowerCase().trim() : null, role || null, is_active !== undefined ? is_active : null, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user: result.rows[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  if (!session || session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const result = await query(`DELETE FROM users WHERE id = $1 RETURNING id;`, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete user' }, { status: 500 });
  }
}
