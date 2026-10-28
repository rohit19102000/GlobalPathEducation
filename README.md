# Global Path Education website

A one-page static website. It needs no build step and no database.

## Files

| File | Purpose |
|------|---------|
| `index.html` | All page content |
| `css/style.css` | Design and layout |
| `js/main.js` | Mobile menu, animations, and the enquiry form |
| `enquiry.php` | Emails form enquiries to info@globalpatheducation.com |
| `assets/logo-horizontal.webp` | Header logo |
| `assets/logo.webp` / `logo.png` | Round logo (About section, footer, social share) |
| `assets/favicon.png`, `apple-touch-icon.png` | Browser tab and phone home-screen icons |

## Before you go live

1. Create the mailbox `info@globalpatheducation.com` on your hosting.
2. Create `no-reply@globalpatheducation.com`, or change `$from` in `enquiry.php` to an address on your domain.

## Upload to hosting

1. Buy hosting that supports PHP (for example Hostinger or any cPanel host).
2. Open the File Manager and go to `public_html`.
3. Upload all files and folders from this folder. Keep the folder structure.
4. Point the domain to the hosting. Turn on the free SSL certificate (HTTPS).
5. Open the site and send a test enquiry.

If the email does not arrive, check the spam folder. If the server cannot send mail, the form shows a WhatsApp link instead.

## Edit content

Open `index.html` in any text editor. Each section starts with a comment, for example `<!-- About -->`.
