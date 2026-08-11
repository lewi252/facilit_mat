<?php
require_once "config.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!$data || empty($data['video_id']) || empty($data['title']) || empty($data['preacher'])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Dados insuficientes para atualização."]);
    exit();
}

$video_id = intval($data['video_id']);
$title = trim($data['title']);
$preacher = trim($data['preacher']);
$church = isset($data['church']) ? trim($data['church']) : 'Igreja Local';
$category = isset($data['category']) ? trim($data['category']) : 'Pregações';
$description = isset($data['description']) ? trim($data['description']) : '';
$thumb_url = isset($data['thumb_url']) ? trim($data['thumb_url']) : '';
$avatar_url = isset($data['avatar_url']) ? trim($data['avatar_url']) : '';
$video_url = isset($data['video_url']) ? trim($data['video_url']) : '';

$stmt = $pdo->prepare("UPDATE videos SET title = ?, preacher = ?, church = ?, category = ?, description = ?, thumb_url = ?, avatar_url = ?, video_url = COALESCE(NULLIF(?, ''), video_url) WHERE id = ?");
if ($stmt->execute([$title, $preacher, $church, $category, $description, $thumb_url, $avatar_url, $video_url, $video_id])) {
    echo json_encode(["success" => true, "message" => "Pregação atualizada com sucesso!"]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro ao atualizar vídeo no banco de dados."]);
}
?>
