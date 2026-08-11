<?php
require_once "config.php";

$action = isset($_GET['action']) ? $_GET['action'] : '';
$data = json_decode(file_get_contents("php://input"), true);

if ($action === 'get_users') {
    $stmt = $pdo->query("SELECT id, name, email, church, role, created_at FROM users ORDER BY id DESC");
    $users = $stmt->fetchAll();
    echo json_encode(["success" => true, "users" => $users]);
    exit();
}

if ($action === 'delete') {
    $video_id = isset($data['video_id']) ? $data['video_id'] : '';
    if (!empty($video_id)) {
        // Tentar apagar por ID numérico ou por ID string
        $stmt = $pdo->prepare("DELETE FROM videos WHERE id = ?");
        $stmt->execute([$video_id]);
        echo json_encode(["success" => true, "message" => "Vídeo removido com sucesso."]);
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID de vídeo inválido."]);
    }
    exit();
}

if ($action === 'delete_user') {
    $user_id = isset($data['user_id']) ? $data['user_id'] : '';
    if (!empty($user_id)) {
        // 1. Remover todas as pregações/louvores publicadas por este usuário
        $stmtVid = $pdo->prepare("DELETE FROM videos WHERE user_id = ?");
        $stmtVid->execute([$user_id]);

        // 2. Remover o usuário da tabela de usuários
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$user_id]);

        echo json_encode(["success" => true, "message" => "Usuário e todas as suas pregações foram removidos com sucesso."]);
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID de usuário inválido."]);
    }
    exit();
}

if ($action === 'set_featured') {
    $video_id = isset($data['video_id']) ? $data['video_id'] : '';
    if (!empty($video_id)) {
        $pdo->query("UPDATE videos SET is_featured = 0");
        $stmt = $pdo->prepare("UPDATE videos SET is_featured = 1 WHERE id = ?");
        $stmt->execute([$video_id]);
        echo json_encode(["success" => true, "message" => "Vídeo definido como Destaque."]);
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "ID de vídeo inválido."]);
    }
    exit();
}

if ($action === 'view') {
    $video_id = isset($data['video_id']) ? $data['video_id'] : '';
    if (!empty($video_id)) {
        $stmt = $pdo->prepare("UPDATE videos SET views = views + 1 WHERE id = ?");
        $stmt->execute([$video_id]);
        echo json_encode(["success" => true]);
    }
    exit();
}

http_response_code(400);
echo json_encode(["success" => false, "message" => "Ação inválida."]);
?>
