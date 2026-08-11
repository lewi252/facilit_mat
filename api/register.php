<?php
require_once "config.php";

// Trata tanto FormData ($_POST) quanto JSON (php://input)
$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$email = isset($_POST['email']) ? trim($_POST['email']) : '';
$password = isset($_POST['password']) ? trim($_POST['password']) : '';
$church = isset($_POST['church']) ? trim($_POST['church']) : 'Comunidade Cristã';

if (empty($name) && empty($email)) {
    $rawInput = file_get_contents("php://input");
    $data = json_decode($rawInput, true);
    if ($data) {
        $name = isset($data['name']) ? trim($data['name']) : '';
        $email = isset($data['email']) ? trim($data['email']) : '';
        $password = isset($data['password']) ? trim($data['password']) : '';
        $church = isset($data['church']) ? trim($data['church']) : 'Comunidade Cristã';
    }
}

if (empty($name) || empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Preencha todos os campos obrigatórios (Nome, E-mail e Senha)."]);
    exit();
}

$email = strtolower($email);

// Upload de Foto de Perfil se enviada
$avatar_url = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150";
$avatar_dir = "../uploads/avatars/";
if (!file_exists($avatar_dir)) mkdir($avatar_dir, 0777, true);

if (isset($_FILES['avatar_file']) && $_FILES['avatar_file']['error'] === UPLOAD_ERR_OK) {
    $fileName = $_FILES['avatar_file']['name'];
    $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (in_array($ext, $allowed)) {
        $newName = "user_" . time() . '.' . $ext;
        if (move_uploaded_file($_FILES['avatar_file']['tmp_name'], $avatar_dir . $newName)) {
            $avatar_url = "uploads/avatars/" . $newName;
        }
    }
}

// Verificar se e-mail já existe
$stmt = $pdo->prepare("SELECT id FROM users WHERE LOWER(email) = ?");
$stmt->execute([$email]);
if ($stmt->fetch()) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Este e-mail já está cadastrado. Tente fazer login!"]);
    exit();
}

$password_hash = password_hash($password, PASSWORD_BCRYPT);

$stmt = $pdo->prepare("INSERT INTO users (name, email, password_hash, church, avatar_url) VALUES (?, ?, ?, ?, ?)");
if ($stmt->execute([$name, $email, $password_hash, $church, $avatar_url])) {
    $userId = $pdo->lastInsertId('users_id_seq');
    if (!$userId) $userId = $pdo->lastInsertId();

    echo json_encode([
        "success" => true,
        "message" => "Conta criada com sucesso no Neon!",
        "user" => [
            "id" => $userId,
            "name" => $name,
            "email" => $email,
            "church" => $church,
            "avatar_url" => $avatar_url
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro ao registrar usuário no banco de dados."]);
}
?>
