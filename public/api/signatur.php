<?php
/**
 * Logobildet i kundens e-postsignatur, for Apache-webhotellet:
 *   GET /api/signatur/<designId>?bilde=logo|merke
 * (.htaccess skriver adressen om til denne fila.)
 *
 * Gjør det samme som api/signatur/[id].ts gjør på Vercel: henter bildet fra
 * Firestore (samlingen `signaturbilder`, se src/lib/signaturbilder.ts) med
 * det åpne REST-API-et – reglene lar hvem som helst lese ett dokument – og
 * sender det som PNG.
 *
 * Svaret mellomlagres lenge, både hos mottakeren og her på disken:
 * adressen i signaturen har `v=…`, som endres når logoen endres.
 */

const PROSJEKT = 'vimzo-73890';
const LAGER_SEKUNDER = 86400;

$id = isset($_GET['id']) ? (string) $_GET['id'] : '';
$bilde = (isset($_GET['bilde']) && $_GET['bilde'] === 'merke') ? 'merke' : 'logo';
$v = isset($_GET['v']) ? preg_replace('/[^A-Za-z0-9_-]/', '', (string) $_GET['v']) : '';

if (!preg_match('/^[A-Za-z0-9_-]{1,64}$/', $id)) {
  http_response_code(400);
  exit('Ugyldig id');
}

function send_png(string $png): void {
  header('Content-Type: image/png');
  header('Cache-Control: public, max-age=86400, stale-while-revalidate=86400');
  header('Content-Length: ' . strlen($png));
  echo $png;
  exit;
}

// Lager på disken, så hver e-post som åpnes ikke blir et kall til Firestore.
$mappe = sys_get_temp_dir() . '/vimzo-signatur';
$fil = $mappe . '/' . $id . '-' . $bilde . '-' . substr($v, 0, 32) . '.png';
if (is_file($fil) && filemtime($fil) > time() - LAGER_SEKUNDER) {
  send_png((string) file_get_contents($fil));
}

$url = 'https://firestore.googleapis.com/v1/projects/' . PROSJEKT
  . '/databases/(default)/documents/signaturbilder/' . rawurlencode($id)
  . '?mask.fieldPaths=' . $bilde;

$svar = false;
$status = 0;
if (function_exists('curl_init')) {
  $c = curl_init($url);
  curl_setopt_array($c, [CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8, CURLOPT_FOLLOWLOCATION => false]);
  $svar = curl_exec($c);
  $status = (int) curl_getinfo($c, CURLINFO_HTTP_CODE);
  curl_close($c);
} else {
  $svar = @file_get_contents($url, false, stream_context_create(['http' => ['timeout' => 8, 'ignore_errors' => true]]));
  if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) $status = (int) $m[1];
}

if ($svar === false || $status !== 200) {
  http_response_code(404);
  header('Cache-Control: public, max-age=60');
  exit('Fant ikke bildet');
}

$dok = json_decode($svar, true);
$b64 = $dok['fields'][$bilde]['bytesValue'] ?? null;
$png = $b64 ? base64_decode($b64, true) : false;
if ($png === false || substr($png, 0, 8) !== "\x89PNG\r\n\x1a\n") {
  http_response_code(404);
  exit('Fant ikke bildet');
}

if (!is_dir($mappe)) @mkdir($mappe, 0700, true);
@file_put_contents($fil, $png);
send_png($png);
