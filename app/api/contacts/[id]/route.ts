import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth';
import { executeWithRLS } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  const session = await getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resolvedParams = await Promise.resolve(params);
  const id = resolvedParams?.id;

  if (!id) {
    return NextResponse.json({ error: 'No matching contact found' }, { status: 404 });
  }

  try {
    // 1. Fetch Contact with RLS
    const contactRes = await executeWithRLS(
      session.userId,
      session.role,
      `SELECT c.*, 
              m.name AS sales_manager_name, 
              g.name AS lead_generator_name 
       FROM contacts c
       LEFT JOIN users m ON c.sales_manager_id = m.id
       LEFT JOIN users g ON c.lead_generator_id = g.id
       WHERE c.id = $1;`,
      [id]
    );

    const contact = contactRes.rows[0];

    // Anti-Enumeration Principle (PRD §5.4): Returning 404 "No matching contact found"
    // ensures unauthorized contact IDs are indistinguishable from non-existent IDs.
    if (!contact) {
      return NextResponse.json({ error: 'No matching contact found' }, { status: 404 });
    }

    // 2. Fetch Subsidiary Entities with RLS (Inherited Visibility)
    const tasksRes = await executeWithRLS(session.userId, session.role, `SELECT * FROM tasks WHERE contact_id = $1 ORDER BY due_date ASC;`, [id]);
    const invoicesRes = await executeWithRLS(session.userId, session.role, `SELECT * FROM invoices WHERE contact_id = $1 ORDER BY due_date DESC;`, [id]);
    const estimatesRes = await executeWithRLS(session.userId, session.role, `SELECT * FROM estimates WHERE contact_id = $1 ORDER BY valid_until DESC;`, [id]);
    const activitiesRes = await executeWithRLS(session.userId, session.role, `SELECT a.*, u.name AS user_name FROM activities a LEFT JOIN users u ON a.user_id = u.id WHERE a.contact_id = $1 ORDER BY a.occurred_at DESC;`, [id]);
    const attachmentsRes = await executeWithRLS(session.userId, session.role, `SELECT * FROM attachments WHERE contact_id = $1 ORDER BY uploaded_at DESC;`, [id]);

    return NextResponse.json({
      contact,
      tasks: tasksRes.rows,
      invoices: invoicesRes.rows,
      estimates: estimatesRes.rows,
      activities: activitiesRes.rows,
      attachments: attachmentsRes.rows,
    });
  } catch (error: any) {
    console.error('Get contact by ID error:', error);
    return NextResponse.json({ error: 'No matching contact found' }, { status: 404 });
  }
}
