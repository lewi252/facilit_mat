<?php
require_once "config.php";

$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';

if (empty($email) && empty($password)) {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);
    if ($data) {
        $email = isset($data['email']) ? trim($data['email']) : '';
        $password = isset($data['password']) ? trim($data['password']) : '';
    }
}

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Informe o e-mail e a senha."]);
    exit();
}

$email = strtolower($email);

$stmt = $pdo->prepare("SELECT * FROM users WHERE LOWER(email) = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if ($user && password_verify($password, $user['password_hash'])) {
    echo json_encode([
        "success" => true,
        "message" => "Login realizado com sucesso!",
        "user" => [
            "id" => $user['id'],
            "name" => $user['name'],
            "email" => $user['email'],
            "church" => $user['church'],
            "avatar_url" => $user['avatar_url'],
            "role" => $user['role']
        ]
    ]);
} else {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "E-mail ou senha incorretos."]);
}
?>
