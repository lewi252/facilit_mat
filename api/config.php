<?php
// Configurações de Conexão com o Banco de Dados Neon (PostgreSQL Cloud)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ✅ FORÇA o uso das variáveis de ambiente do Render
$db_host = getenv('PGHOST');
$db_port = getenv('PGPORT') ?: "5432";
$db_name = getenv('PGDATABASE');
$db_user = getenv('PGUSER');
$db_pass = getenv('PGPASSWORD');
$endpoint_id = getenv('PGENDPOINTID');

// ⚠️ Se NÃO encontrar variável → MOSTRA O ERRO!
if (!$db_host || !$db_name || !$db_user || !$db_pass) {
    die("❌ ERRO: Variáveis de ambiente não encontradas!");
}

try {
    $dsn = "pgsql:host=$db_host;port=$db_port;dbname=$db_name;sslmode=require;options='endpoint=$endpoint_id'";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ];

    $pdo = new PDO($dsn, $db_user, $db_pass, $options);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Erro de Conexão com o Banco Neon (PostgreSQL): " . $e->getMessage()
    ]);
    exit();
}
?>
