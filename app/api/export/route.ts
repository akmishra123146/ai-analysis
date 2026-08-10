import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth';
import { executeWithRLS } from '@/lib/db';

async function handleExport(session: any, entity: string, format: string, querySql?: string) {
  let sqlToRun = querySql;
  if (!sqlToRun) {
    if (entity === 'invoices') {
      sqlToRun = `SELECT c.company_name, i.invoice_number, i.amount, i.currency, i.status, i.issue_date, i.due_date FROM invoices i JOIN contacts c ON i.contact_id = c.id ORDER BY i.due_date DESC LIMIT 1000;`;
    } else if (entity === 'tasks') {
      sqlToRun = `SELECT c.company_name, t.title, t.due_date, t.status FROM tasks t JOIN contacts c ON t.contact_id = c.id ORDER BY t.due_date ASC LIMIT 1000;`;
    } else if (entity === 'estimates') {
      sqlToRun = `SELECT c.company_name, e.estimate_number, e.amount, e.currency, e.valid_until, e.status FROM estimates e JOIN contacts c ON e.contact_id = c.id ORDER BY e.valid_until ASC LIMIT 1000;`;
    } else {
      sqlToRun = `SELECT company_name, contact_name, email, phone, status, created_at FROM contacts ORDER BY company_name ASC LIMIT 1000;`;
    }
  }

  const result = await executeWithRLS(session.userId, session.role, sqlToRun);
  const rows = result.rows;

  if (!rows || rows.length === 0) {
    return new NextResponse('No data available for export under your role scope.', {
      headers: { 'Content-Type': 'text/plain' },
    });
  }

  const headers = Object.keys(rows[0]);

  if (format === 'markdown' || format === 'md') {
    let md = `# Scoped Export (${entity || 'report'})\n\n`;
    md += `| ${headers.join(' | ')} |\n`;
    md += `| ${headers.map(() => '---').join(' | ')} |\n`;
    rows.forEach(row => {
      md += `| ${headers.map(h => row[h] !== null ? String(row[h]).replace(/\|/g, '\\|') : '').join(' | ')} |\n`;
    });

    return new NextResponse(md, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${entity || 'report'}_scoped_export.md"`,
      },
    });
  } else {
    // CSV format
    let csv = `${headers.join(',')}\n`;
    rows.forEach(row => {
      csv += `${headers.map(h => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(',')}\n`;
    });

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${entity || 'report'}_scoped_export.csv"`,
      },
    });
  }
}

export async function GET(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'csv';
    const entity = searchParams.get('entity') || 'contacts';

    return await handleExport(session, entity, format);
  } catch (error: any) {
    console.error('Export API GET error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getAuthenticatedSession(req);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { type, entity, format, querySql } = await req.json();
    return await handleExport(session, entity || type || 'contacts', format || 'csv', querySql);
  } catch (error: any) {
    console.error('Export API POST error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
