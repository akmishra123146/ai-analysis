import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedSession } from '@/lib/auth';
import { executeWithRLS } from '@/lib/db';
import fs from 'fs/promises';
import path from 'path';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB Limit

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedSession(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const contentType = req.headers.get('content-type') || '';

    let contact_id = '';
    let filename = '';
    let mime_type = 'application/octet-stream';
    let size_bytes = 0;
    let storage_path = '';

    if (contentType.includes('multipart/form-data')) {
      try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        contact_id = (formData.get('contact_id') as string) || '';

        if (file && contact_id) {
          if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ error: 'File size exceeds maximum limit of 10MB' }, { status: 400 });
          }

          filename = file.name;
          mime_type = file.type || 'application/octet-stream';
          size_bytes = file.size;

          const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
          await fs.mkdir(uploadsDir, { recursive: true });

          const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          const safeFilename = `${uniquePrefix}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const filePath = path.join(uploadsDir, safeFilename);

          const buffer = Buffer.from(await file.arrayBuffer());
          await fs.writeFile(filePath, buffer);
          storage_path = `/uploads/${safeFilename}`;
        }
      } catch (err) {
        console.warn('FormData parsing warning:', err);
      }
    }

    if (!storage_path) {
      // JSON / Base64 Payload Fallback
      const body = await req.json();
      contact_id = body.contact_id;
      filename = body.filename;
      mime_type = body.mime_type || 'application/pdf';

      if (!contact_id || !filename) {
        return NextResponse.json({ error: 'Contact ID and Filename are required' }, { status: 400 });
      }

      if (body.file_base64) {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });

        const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const safeFilename = `${uniquePrefix}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        const filePath = path.join(uploadsDir, safeFilename);

        const buffer = Buffer.from(body.file_base64, 'base64');
        if (buffer.length > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json({ error: 'File size exceeds maximum limit of 10MB' }, { status: 400 });
        }

        await fs.writeFile(filePath, buffer);
        storage_path = `/uploads/${safeFilename}`;
        size_bytes = buffer.length;
      } else {
        size_bytes = body.size_bytes || 1048576;
        storage_path = body.storage_path || `/uploads/${filename}`;
        if (size_bytes > MAX_FILE_SIZE_BYTES) {
          return NextResponse.json({ error: 'File size exceeds maximum limit of 10MB' }, { status: 400 });
        }
      }
    }

    const res = await executeWithRLS(
      user.userId,
      user.role,
      `INSERT INTO attachments (contact_id, filename, mime_type, size_bytes, storage_path, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *;`,
      [contact_id, filename, mime_type, size_bytes, storage_path, user.userId]
    );

    return NextResponse.json({ success: true, attachment: res.rows[0] });
  } catch (err: any) {
    console.error('Attachment upload error traceback:', err);
    return NextResponse.json({ error: err.message || 'Attachment upload failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedSession(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'Attachment ID is required' }, { status: 400 });

    const res = await executeWithRLS(
      user.userId,
      user.role,
      `DELETE FROM attachments WHERE id = $1 RETURNING id, storage_path;`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Attachment not found or access denied' }, { status: 404 });
    }

    // Attempt to remove physical file if stored locally
    const att = res.rows[0];
    if (att.storage_path && att.storage_path.startsWith('/uploads/')) {
      const filePath = path.join(process.cwd(), 'public', att.storage_path);
      await fs.unlink(filePath).catch(() => {});
    }

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Database error' }, { status: 500 });
  }
}
