<?php
require_once "config.php";

$upload_dir = "../uploads/avatars/";
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

$user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
$name = isset($_POST['name']) ? trim($_POST['name']) : '';
$church = isset($_POST['church']) ? trim($_POST['church']) : 'Comunidade Cristã';
$avatar_url = isset($_POST['avatar_url']) ? trim($_POST['avatar_url']) : '';

// Se os dados vieram via JSON em vez de Form-Data
if ($user_id === 0) {
    $data = json_decode(file_get_contents("php://input"), true);
    if ($data) {
        $user_id = isset($data['user_id']) ? intval($data['user_id']) : 0;
        $name = isset($data['name']) ? trim($data['name']) : '';
        $church = isset($data['church']) ? trim($data['church']) : '';
        $avatar_url = isset($data['avatar_url']) ? trim($data['avatar_url']) : '';
    }
}

if ($user_id === 0 || empty($name)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Dados insuficientes para atualizar perfil."]);
    exit();
}

// Processar upload de arquivo de imagem se enviado
if (isset($_FILES['avatar_file']) && $_FILES['avatar_file']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['avatar_file']['tmp_name'];
    $fileName = $_FILES['avatar_file']['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

    $allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (in_array($fileExtension, $allowedExtensions)) {
        $newFileName = "avatar_" . $user_id . "_" . time() . '.' . $fileExtension;
        $destPath = $upload_dir . $newFileName;

        if (move_uploaded_file($fileTmpPath, $destPath)) {
            $avatar_url = "uploads/avatars/" . $newFileName;
        }
    }
}

$stmt = $pdo->prepare("UPDATE users SET name = ?, church = ?, avatar_url = COALESCE(NULLIF(?, ''), avatar_url) WHERE id = ?");
if ($stmt->execute([$name, $church, $avatar_url, $user_id])) {
    echo json_encode([
        "success" => true,
        "message" => "Perfil atualizado com sucesso!",
        "user" => [
            "id" => $user_id,
            "name" => $name,
            "church" => $church,
            "avatar_url" => $avatar_url
        ]
    ]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro ao atualizar perfil no banco de dados."]);
}
?>
