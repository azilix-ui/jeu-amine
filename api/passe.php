<?php
/*
 * Famille Missaoui — créer un laissez-passer de partie depuis un jeu (21/11/2026, la Chkobba en ligne).
 * POST action=cree jeu nom [table] → { lien, nom, jeu, expire }. Seulement Anis (ga_passe_autorise). Voir acces/garde.php.
 */
declare(strict_types=1);
require __DIR__ . '/../acces/garde.php'; ga_garde_api();
header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
function sortie(int $c, array $d): void { http_response_code($c); echo json_encode($d, JSON_UNESCAPED_UNICODE); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') sortie(405, ['error' => 'POST seulement.']);
if (ga_passe()) sortie(403, ['error' => 'Réservé à Anis.']);
if (($_POST['action'] ?? '') === 'peut') sortie(200, ['peut' => ga_passe_autorise()]);
if (($_POST['action'] ?? '') !== 'cree') sortie(400, ['error' => 'Action inconnue.']);
if (!ga_passe_autorise()) sortie(403, ['error' => 'Seul Anis peut inviter un ami à une partie.']);
try { sortie(200, ga_passe_cree((string)($_POST['jeu'] ?? ''), mb_substr((string)($_POST['nom'] ?? ''), 0, 30), strtoupper((string)($_POST['table'] ?? '')))); }
catch (RuntimeException $e) { sortie(400, ['error' => $e->getMessage()]); }
catch (Throwable $e) { error_log('passe : ' . $e->getMessage()); sortie(500, ['error' => 'Le serveur n\'a pas pu créer le lien.']); }
