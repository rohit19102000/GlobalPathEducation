/**
 * Global Path Education – Enquiry Form Handler
 * Vercel Serverless Function (Node.js)
 * Sends enquiry emails via Resend API
 */

const TO_EMAIL = 'info@globalpatheducation.com';
const FROM_EMAIL = 'Global Path Education <no-reply@globalpatheducation.com>';

function respond(res, ok, message, code = 200) {
  res.status(code).json({ ok, message });
}

function clean(value, max = 200) {
  if (!value) return '';
  return String(value)
    .trim()
    .replace(/[\r\n]/g, ' ')
    .replace(/<[^>]*>/g, '')
    .substring(0, max);
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return respond(res, false, 'Method not allowed', 405);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY environment variable is not set');
    return respond(res, false, 'Server configuration error', 500);
  }

  // Parse body (supports both FormData and JSON)
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = Object.fromEntries(new URLSearchParams(body)); }
  }

  // Honeypot – bots fill this hidden field
  if (body.website) {
    return respond(res, true, 'Thank you');
  }

  const name        = clean(body.name, 100);
  const phone       = clean(body.phone, 20);
  const email       = clean(body.email, 150);
  const destination = clean(body.destination, 50);
  const level       = clean(body.level, 50);
  const city        = clean(body.city, 80);

  // Validation
  const phoneValid = /^[0-9+\s\-]{10,15}$/.test(phone);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!name || !phoneValid || !emailValid) {
    return respond(res, false, 'Please check your name, phone and email.', 422);
  }

  const emailBody = `
New enquiry from the Global Path Education website

Name:        ${name}
Phone:       ${phone}
Email:       ${email}
Destination: ${destination || '-'}
Study level: ${level || '-'}
City:        ${city || '-'}

Submitted:   ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST
  `.trim();

  try {
    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [TO_EMAIL],
        reply_to: email,
        subject: `New counselling enquiry: ${name}`,
        text: emailBody,
        html: `<pre style="font-family:sans-serif;font-size:14px;">${emailBody.replace(/\n/g, '<br>')}</pre>`,
      }),
    });

    const result = await resendRes.json();

    if (!resendRes.ok) {
      console.error('Resend API error:', result);
      return respond(res, false, 'Mail could not be sent', 500);
    }

    return respond(res, true, 'Thank you');
  } catch (err) {
    console.error('Error sending email:', err);
    return respond(res, false, 'Mail could not be sent', 500);
  }
}
