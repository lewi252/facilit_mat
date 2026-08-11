<?php
require_once "config.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || empty($data['email']) || empty($data['new_password'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Informe o e-mail e a nova senha."]);
    exit();
}

$email = trim($data['email']);
$new_password = trim($data['new_password']);

$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(["success" => false, "message" => "E-mail não encontrado no sistema."]);
    exit();
}

$password_hash = password_hash($new_password, PASSWORD_BCRYPT);
$stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE email = ?");
if ($stmt->execute([$password_hash, $email])) {
    echo json_encode(["success" => true, "message" => "Senha redefinida com sucesso! Você já pode entrar com a nova senha."]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro ao redefinir a senha."]);
}
?>
