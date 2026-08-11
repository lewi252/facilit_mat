<?php
require_once "config.php";

// Pegar dados (POST multipart/form-data ou JSON)
$name     = isset($_POST['name'])     ? trim($_POST['name'])     : '';
$email    = isset($_POST['email'])    ? trim($_POST['email'])    : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';
$church   = isset($_POST['church'])   ? trim($_POST['church'])   : null;

// Ler JSON se vier por raw input
if (empty($name) || empty($email)) {
    $rawInput = file_get_contents('php://input');
    $data = json_decode($rawInput, true);
    if ($data) {
        $name     = isset($data['name'])     ? trim($data['name'])     : '';
        $email    = isset($data['email'])    ? trim($data['email'])    : '';
        $password = isset($data['password']) ? trim($data['password']) : '';
        $church   = isset($data['church'])   ? trim($data['church'])   : null;
    }
}

// Validar campos obrigatórios
if (empty($name) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Preencha Nome, E-mail e Senha!"]);
    exit;
}

$email  = strtolower($email);
$church = (!$church || $church === '') ? 'Comunidade Cristã' : $church;

try {
    // Verificar se e-mail já existe
    $stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = LOWER(?)");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(["success" => false, "message" => "Este e-mail já está cadastrado!"]);
        exit;
    }

    // Criptografar senha
    $password_hash = password_hash($password, PASSWORD_DEFAULT);

    // Inserir usuário
    $stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, church) VALUES (?, ?, ?, ?)");
    $stmt->execute([$name, $email, $password_hash, $church]);

    $userId = $pdo->lastInsertId();

    // Buscar o usuário recém-criado para retornar completo
    $stmt = $pdo->prepare("SELECT id, name, email, church, avatar_url, role FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $newUser = $stmt->fetch();

    echo json_encode([
        "success" => true,
        "message" => "Cadastro realizado com sucesso!",
        "user"    => $newUser
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Erro ao cadastrar: " . $e->getMessage()
    ]);
}
