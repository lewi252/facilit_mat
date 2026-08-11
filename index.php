<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Se for requisição para a API (ex: /api/get_videos.php)
if (!empty($path) && (strpos($path, '/api/') !== false || strpos($path, 'api/') !== false)) {
    $relativePath = ltrim($path, '/');
    $filePath = __DIR__ . '/' . $relativePath;
    if (file_exists($filePath) && is_file($filePath)) {
        require_once $filePath;
        exit();
    }
}

// Resposta na raiz do servidor
echo json_encode([
    "success" => true,
    "service" => "API Time Com Jesus",
    "status" => "Online",
    "database" => "Neon PostgreSQL Cloud",
    "timestamp" => date("c")
]);
?>
