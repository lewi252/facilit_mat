<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$database_url = getenv('DATABASE_URL');

if (!$database_url) {
    http_response_code(500);
    die(json_encode(["success" => false, "message" => "Erro: variável DATABASE_URL não encontrada."]));
}

$p = parse_url($database_url);
$db_host = $p['host'];
$db_port = isset($p['port']) ? $p['port'] : 5432;
$db_name = ltrim($p['path'], '/');
$db_user = $p['user'];
$db_pass = $p['pass'];

try {
    $dsn = "pgsql:host=$db_host;port=$db_port;dbname=$db_name;sslmode=require";
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro de conexão: " . $e->getMessage()]);
    exit();
}
?>
