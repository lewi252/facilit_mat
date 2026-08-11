<?php
require_once "config.php";

$user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : 0;
$name    = isset($_POST['name'])    ? trim($_POST['name'])    : '';
$church  = isset($_POST['church'])  ? trim($_POST['church'])  : 'Comunidade Cristã';

// Avatar: aceita base64 direto (preferido) ou URL
$avatar_url = null;
if (!empty($_POST['avatar_base64'])) {
    $avatar_url = trim($_POST['avatar_base64']); // data:image/jpeg;base64,...
} elseif (!empty($_POST['avatar_url'])) {
    $avatar_url = trim($_POST['avatar_url']);
}

// Fallback JSON input
if ($user_id === 0) {
    $data = json_decode(file_get_contents("php://input"), true);
    if ($data) {
        $user_id    = isset($data['user_id'])      ? intval($data['user_id'])      : 0;
        $name       = isset($data['name'])         ? trim($data['name'])           : '';
        $church     = isset($data['church'])       ? trim($data['church'])         : '';
        $avatar_url = isset($data['avatar_base64']) ? trim($data['avatar_base64']) :
                     (isset($data['avatar_url'])   ? trim($data['avatar_url'])     : null);
    }
}

if ($user_id === 0 || empty($name)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Dados insuficientes para atualizar perfil."]);
    exit();
}

// Atualiza no banco — se não veio avatar novo, mantém o existente
if ($avatar_url) {
    $stmt = $pdo->prepare("UPDATE users SET name = ?, church = ?, avatar_url = ? WHERE id = ?");
    $stmt->execute([$name, $church, $avatar_url, $user_id]);
} else {
    $stmt = $pdo->prepare("UPDATE users SET name = ?, church = ? WHERE id = ?");
    $stmt->execute([$name, $church, $user_id]);
}

// Busca avatar atual para retornar
$stmt2 = $pdo->prepare("SELECT avatar_url FROM users WHERE id = ?");
$stmt2->execute([$user_id]);
$row = $stmt2->fetch();
$saved_avatar = $row ? $row['avatar_url'] : $avatar_url;

echo json_encode([
    "success" => true,
    "message" => "Perfil atualizado com sucesso!",
    "user"    => [
        "id"         => $user_id,
        "name"       => $name,
        "church"     => $church,
        "avatar_url" => $saved_avatar
    ]
]);
?>
