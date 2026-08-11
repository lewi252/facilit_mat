<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Roteamento para API se chamado na raiz ou subpastas
$request_uri = $_SERVER['REQUEST_URI'];

if (strpos($request_uri, '/api/') !== false) {
    $file = __DIR__ . $request_uri;
    if (file_exists($file)) {
        require_once $file;
        exit();
    }
}

echo json_encode([
    "success" => true,
    "service" => "API Time Com Jesus",
    "status" => "Online",
    "database" => "Neon PostgreSQL Cloud",
    "timestamp" => date("c")
]);
?>
