/**
 * Global Path Education – Enquiry Form Handler
 * Vercel Serverless Function (Node.js CommonJS)
 * Sends enquiry emails via Resend API
 */

const https = require('https');

const TO_EMAIL   = 'info@globalpatheducation.com';
const FROM_EMAIL = 'Global Path Education <no-reply@globalpatheducation.com>';

function respond(res, ok, message, code) {
  res.statusCode = code || 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: ok, message: message }));
}

function clean(value, max) {
  if (!value) return '';
  return String(value).trim().replace(/[\r\n]/g, ' ').replace(/<[^>]*>/g, '').substring(0, max || 200);
}

function postToResend(apiKey, payload) {
  return new Promise(function (resolve, reject) {
    var body = JSON.stringify(payload);
    var options = {
      hostname: 'api.resend.com',
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body)
      }
    };
    var req = https.request(options, function (r) {
      var data = '';
      r.on('data', function (chunk) { data += chunk; });
      r.on('end', function () {
        try { resolve({ status: r.statusCode, body: JSON.parse(data) }); }
        catch (e) { resolve({ status: r.statusCode, body: {} }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function parseFormBody(raw) {
  var out = {};
  raw.split('&').forEach(function (pair) {
    var parts = pair.split('=');
    if (parts.length === 2) {
      out[decodeURIComponent(parts[0].replace(/\+/g, ' '))] = decodeURIComponent(parts[1].replace(/\+/g, ' '));
    }
  });
  return out;
}

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') { res.statusCode = 200; res.end(); return; }
  if (req.method !== 'POST') { return respond(res, false, 'Method not allowed', 405); }

  var apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    return respond(res, false, 'Server configuration error', 500);
  }

  var rawBody = '';
  req.on('data', function (chunk) { rawBody += chunk; });
  req.on('end', function () {
    var body = {};
    var ct = (req.headers['content-type'] || '');
    try {
      if (ct.indexOf('application/json') !== -1) {
        body = JSON.parse(rawBody);
      } else {
        body = parseFormBody(rawBody);
      }
    } catch (e) { body = {}; }

    // Honeypot
    if (body.website) { return respond(res, true, 'Thank you'); }

    var name        = clean(body.name, 100);
    var phone       = clean(body.phone, 20);
    var email       = clean(body.email, 150);
    var destination = clean(body.destination, 50);
    var level       = clean(body.level, 50);
    var city        = clean(body.city, 80);

    var phoneValid = /^[0-9+\s\-]{10,15}$/.test(phone);
    var emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!name || !phoneValid || !emailValid) {
      return respond(res, false, 'Please check your name, phone and email.', 422);
    }

    var emailBody = [
      'New enquiry from the Global Path Education website',
      '',
      'Name:        ' + name,
      'Phone:       ' + phone,
      'Email:       ' + email,
      'Destination: ' + (destination || '-'),
      'Study level: ' + (level || '-'),
      'City:        ' + (city || '-'),
      '',
      'Submitted:   ' + new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST'
    ].join('\n');

    postToResend(apiKey, {
      from: FROM_EMAIL,
      to: [TO_EMAIL],
      reply_to: email,
      subject: 'New counselling enquiry: ' + name,
      text: emailBody,
      html: '<pre style="font-family:sans-serif;font-size:14px">' + emailBody.replace(/\n/g, '<br>') + '</pre>'
    }).then(function (r) {
      if (r.status >= 200 && r.status < 300) {
        respond(res, true, 'Thank you');
      } else {
        console.error('Resend error:', r.body);
        respond(res, false, 'Mail could not be sent', 500);
      }
    }).catch(function (err) {
      console.error('HTTPS error:', err);
      respond(res, false, 'Mail could not be sent', 500);
    });
  });
};

