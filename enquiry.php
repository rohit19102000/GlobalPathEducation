<?php
/**
 * Global Path Education – enquiry form handler.
 * Works on standard PHP hosting (cPanel, Hostinger, etc.).
 * Emails each enquiry to $to.
 */
header('Content-Type: application/json; charset=utf-8');

$to   = 'info@globalpatheducation.com';
$from = 'no-reply@globalpatheducation.com'; // Must be an address on your own domain.

function respond($ok, $message, $code = 200) {
    http_response_code($code);
    echo json_encode(['ok' => $ok, 'message' => $message]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Method not allowed', 405);
}

// Honeypot: bots fill this hidden field.
if (!empty($_POST['website'])) {
    respond(true, 'Thank you');
}

function clean($key, $max = 200) {
    $v = isset($_POST[$key]) ? trim((string) $_POST[$key]) : '';
    $v = str_replace(["\r", "\n"], ' ', $v);
    return mb_substr(strip_tags($v), 0, $max);
}

$name        = clean('name', 100);
$phone       = clean('phone', 20);
$email       = clean('email', 150);
$destination = clean('destination', 50);
$level       = clean('level', 50);
$city        = clean('city', 80);

if ($name === '' || !preg_match('/^[0-9+\s\-]{10,15}$/', $phone) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(false, 'Please check your name, phone and email.', 422);
}

$subject = 'New counselling enquiry: ' . $name;
$body  = "New enquiry from the Global Path Education website\n\n";
$body .= "Name:        $name\n";
$body .= "Phone:       $phone\n";
$body .= "Email:       $email\n";
$body .= "Destination: " . ($destination ?: '-') . "\n";
$body .= "Study level: " . ($level ?: '-') . "\n";
$body .= "City:        " . ($city ?: '-') . "\n\n";
$body .= "Submitted:   " . date('d M Y, H:i') . "\n";

$headers  = "From: Global Path Education <$from>\r\n";
$headers .= "Reply-To: $email\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

if (@mail($to, $subject, $body, $headers)) {
    respond(true, 'Thank you');
}
respond(false, 'Mail could not be sent', 500);
