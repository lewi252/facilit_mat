<?php
require_once "config.php";

// Pegar dados (aceita tanto POST quanto JSON)
$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';
$church = isset($_POST['church']) ? trim($_POST['church']) : 'Comunidade Cristã';

// Se vier como JSON (raw input)
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

// Validar campos obrigatórios
if (empty($name) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Preencha todos os campos obrigatórios (Nome, E-mail e Senha)."]);
    exit();
}

$email = strtolower($email);

try {
    // Verificar se e-mail já existe
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Este e-mail já está cadastrado. Tente fazer login!"]);
        exit();
    }

    // Criptografar senha
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // ✅ INSERIR CORRIGIDO (coluna "password" e sem avatar_url)
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, church, role, created_at) VALUES (?, ?, ?, ?, 'user', NOW())");
    $stmt->execute([$name, $email, $password_hash, $church]);

    $userId = $pdo->lastInsertId();

    // SUCESSO
    echo json_encode([
        "success" => true,
        "message" => "Conta criada com sucesso!",
        "user" => [
            "id" => $userId,
            "name" => $name,
            "email" => $email,
            "church" => $church
        ]
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Erro ao registrar: " . $e->getMessage()
    ]);
}