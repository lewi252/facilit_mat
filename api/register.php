<?php
require_once "config.php";

header("Content-Type: application/json");

// Pegar dados
$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';
$church = isset($_POST['church']) ? trim($_POST['church']) : 'Comunidade Cristã';

// Aceitar JSON também
if (empty($name) || empty($email)) {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    if ($data) {
        $name = isset($data['name']) ? trim($data['name']) : '';
        $email = isset($data['email']) ? trim($data['email']) : '';
        $password = isset($data['password']) ? trim($data['password']) : '';
        $church = isset($data['church']) ? trim($data['church']) : 'Comunidade Cristã';
    }
}

// Validar
if (empty($name) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Preencha todos os campos!"]);
    exit;
}

$email = strtolower($email);

try {
    // Verificar se e-mail existe
    $stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?)");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "E-mail já cadastrado!"]);
        exit;
    }

    // Criptografar senha
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // ✅ COLUNAS CORRETAS conforme tabela do Neon!
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, church, created_at) VALUES (?, ?, ?, ?, NOW())");
    $stmt->execute([$name, $email, $password_hash, $church]);

    $userId = $pdo->lastInsertId();

    echo json_encode([
        "success" => true,
        "message" => "✅ Cadastro REALIZADO com SUCESSO!",
        "usuario_id" => $userId
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "❌ ERRO DO BANCO: " . $e->getMessage()
    ]);
}