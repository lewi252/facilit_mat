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

// Tenta primeiro DATABASE_URL (mais simples e menos sujeito a erro)
// Se não tiver, monta a partir das variáveis separadas PGHOST, PGUSER, etc.
$database_url = getenv('DATABASE_URL');

if ($database_url) {
    // Usa a URL completa diretamente
    $dsn_parts = parse_url($database_url);
    $db_host = $dsn_parts['host'];
    $db_port = isset($dsn_parts['port']) ? $dsn_parts['port'] : 5432;
    $db_name = ltrim($dsn_parts['path'], '/');
    $db_user = $dsn_parts['user'];
    $db_pass = $dsn_parts['pass'];

    // Extrai query params (ex: sslmode=require)
    $query = isset($dsn_parts['query']) ? $dsn_parts['query'] : 'sslmode=require';
    parse_str($query, $query_params);
    $sslmode = isset($query_params['sslmode']) ? $query_params['sslmode'] : 'require';

    $dsn = "pgsql:host=$db_host;port=$db_port;dbname=$db_name;sslmode=$sslmode";
} else {
    // Fallback: variáveis separadas
    $db_host = getenv('PGHOST');
    $db_port = getenv('PGPORT') ?: '5432';
    $db_name = getenv('PGDATABASE');
    $db_user = getenv('PGUSER');
    $db_pass = getenv('PGPASSWORD');

    if (!$db_host || !$db_name || !$db_user || !$db_pass) {
        http_response_code(500);
        die(json_encode(["success" => false, "message" => "Erro de configuração: variáveis de ambiente do banco não encontradas."]));
    }

    $dsn = "pgsql:host=$db_host;port=$db_port;dbname=$db_name;sslmode=require";
}

try {
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    $pdo = new PDO($dsn, $db_user, $db_pass, $options);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Erro de conexão com o banco de dados: " . $e->getMessage()
    ]);
    exit();
}
?>
