<?php
require_once "config.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || empty($data['name']) || empty($data['email']) || empty($data['password'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Preencha todos os campos obrigatórios."]);
    exit();
}

$name = trim($data['name']);
$email = trim($data['email']);
$password = trim($data['password']);
$church = isset($data['church']) ? trim($data['church']) : "Comunidade Cristã";

// Verificar se e-mail já existe
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Este e-mail já está cadastrado."]);
    exit();
}

$password_hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, church) VALUES (?, ?, ?, ?)");
if ($stmt->execute([$name, $email, $password_hash, $church])) {
    $userId = $pdo->lastInsertId();
    echo json_encode([
        "success" => true,
        "message" => "Usuário registrado com sucesso!",
        "user" => [
            "id" => $userId,
            "name" => $name,
            "email" => $email,
            "church" => $church
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro ao registrar usuário."]);
}
?>
