// Verify SMTP credentials without running the whole registration flow.
//
//   npm run email:test -- you@example.com
//
// Reads SMTP_* from .env (same vars the app uses — see src/lib/otp.ts).
// Step 1 proves the credentials/connection are valid; step 2 proves delivery.
import nodemailer from 'nodemailer';
import 'dotenv/config';

const to = process.argv[2];

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

if (!SMTP_HOST) {
  console.error(
    '\n✗ SMTP_HOST is not set.\n' +
      '  The app is in DEV MODE: OTP codes are logged/returned, no email is sent.\n' +
      '  Set SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM in .env first.\n',
  );
  process.exit(1);
}
if (!to) {
  console.error('\n✗ Usage: npm run email:test -- you@example.com\n');
  process.exit(1);
}

const port = Number(SMTP_PORT || 587);
const transport = nodemailer.createTransport({
  host: SMTP_HOST,
  port,
  secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
  auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
});

console.log(`\n→ host=${SMTP_HOST} port=${port} user=${SMTP_USER || '(none)'}`);

try {
  process.stdout.write('→ verifying connection… ');
  await transport.verify();
  console.log('✓ credentials accepted');
} catch (e) {
  console.error('✗ failed\n');
  console.error(`  ${e.message}\n`);
  console.error('  Common causes:');
  console.error('   • Gmail: use a 16-char App Password (needs 2FA), not your account password');
  console.error('   • Wrong port: 587 (STARTTLS) or 465 (TLS)');
  console.error('   • Brevo: SMTP_USER is the SMTP login, SMTP_PASS is the SMTP key (not the API key)\n');
  process.exit(1);
}

try {
  process.stdout.write(`→ sending test email to ${to}… `);
  const info = await transport.sendMail({
    from: SMTP_FROM || 'ELECTROCUP <no-reply@electrocup.com>',
    to,
    subject: 'ELECTROCUP — SMTP test',
    text: 'If you can read this, OTP emails will send correctly. Code format: 123456',
    html:
      '<p>If you can read this, OTP emails will send correctly.</p>' +
      '<p>Sample code: <strong style="font-size:20px;letter-spacing:2px">123456</strong></p>',
  });
  console.log('✓ sent');
  console.log(`  messageId: ${info.messageId}`);
  if (info.rejected?.length) console.log(`  ⚠ rejected: ${info.rejected.join(', ')}`);
  console.log('\n✓ Done. Check the inbox — AND the spam folder.');
  console.log('  If it landed in spam, set up SPF/DKIM (domain auth) with your provider.\n');
} catch (e) {
  console.error('✗ failed\n');
  console.error(`  ${e.message}\n`);
  console.error('  If auth passed but sending failed, the From address is usually the problem:');
  console.error('   • SMTP_FROM must be a verified sender/domain with your provider\n');
  process.exit(1);
}
