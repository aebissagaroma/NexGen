import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { query, queryOne } from '@/lib/db';
import { getSession } from '@/lib/session';
import { rateLimit, clientIp } from '@/lib/rate-limit';

// POST /api/register/id-doc — upload a photo of an identity document.
//
// Used twice: with the Fayda at sign-up, and afterwards by players who asked to
// submit a Kebele or other ID instead. Session-gated so a document can only ever
// be attached to the uploader's own registration.

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB — a phone photo, not a scan archive
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'];
const TYPES = ['fayda', 'kebele', 'other'];

export async function POST(req: Request) {
  const session = getSession('user');
  if (!session) {
    return NextResponse.json({ error: 'Verify your email first.' }, { status: 401 });
  }
  const rl = await rateLimit(`iddoc:ip:${clientIp(req)}`, 20, 60 * 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'Too many uploads. Try again later.' },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfter) } },
    );
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get('file');
  const docType = String(form?.get('docType') || 'fayda').toLowerCase();
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Attach a photo of your ID.' }, { status: 400 });
  }
  if (!TYPES.includes(docType)) {
    return NextResponse.json({ error: 'Unknown document type.' }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'That file is empty.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'That file is larger than 8 MB. Take a photo rather than a scan.' },
      { status: 400 },
    );
  }
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: 'Upload a photo (JPG, PNG, WEBP or HEIC) or a PDF.' },
      { status: 400 },
    );
  }

  // Checked after validating the file, so a player with an oversized photo gets
  // told that rather than a misleading "unavailable" — and so the validation
  // above stays reachable when storage is unconfigured. Storage is a deployment
  // concern, not a user error, so say so plainly rather than letting the SDK
  // throw an opaque 500 at someone mid-registration.
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error('[id-doc] BLOB_READ_WRITE_TOKEN is not set — cannot store ID documents.');
    return NextResponse.json(
      { error: 'ID uploads are not available right now. Please try again later.' },
      { status: 503 },
    );
  }

  // Must already be registered: the document attaches to an entry.
  const reg = await queryOne<{ id: string }>(
    `SELECT id FROM registrations
     WHERE user_id = $1 OR ec_email_canon(email) = ec_email_canon($2) LIMIT 1`,
    [session.sub, session.email],
  );
  if (!reg) {
    return NextResponse.json({ error: 'Complete your registration first.' }, { status: 409 });
  }

  // addRandomSuffix keeps the URL unguessable. Vercel Blob serves over public
  // URLs, so that randomness is what protects the document — the URL is only
  // ever returned to staff, never listed publicly. See the note in the PR.
  const ext = file.name.includes('.') ? file.name.split('.').pop()!.slice(0, 8) : 'jpg';
  const blob = await put(`id-docs/${reg.id}/${docType}.${ext}`, file, {
    access: 'public',
    addRandomSuffix: true,
    contentType: file.type,
  });

  await query(
    `UPDATE registrations
     SET id_doc_url = $1, id_doc_type = $2, id_doc_status = 'provided'
     WHERE id = $3`,
    [blob.url, docType, reg.id],
  );

  return NextResponse.json({ ok: true, status: 'provided', docType });
}
