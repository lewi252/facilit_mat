<?php
require_once "config.php";

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $video_id = isset($_GET['video_id']) ? intval($_GET['video_id']) : 0;
    if ($video_id > 0) {
        $stmt = $pdo->prepare("SELECT id, video_id, user_name, comment_text, DATE_FORMAT(created_at, '%d/%m/%Y %H:%i') as created_at FROM comments WHERE video_id = ? ORDER BY id DESC");
        $stmt->execute([$video_id]);
        $comments = $stmt->fetchAll();
        echo json_encode(["success" => true, "comments" => $comments]);
    } else {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "video_id inválido."]);
    }
    exit();
}

if ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    $action = isset($_GET['action']) ? $_GET['action'] : '';

    if ($action === 'delete') {
        $comment_id = isset($data['comment_id']) ? intval($data['comment_id']) : 0;
        if ($comment_id > 0) {
            $stmt = $pdo->prepare("DELETE FROM comments WHERE id = ?");
            $stmt->execute([$comment_id]);
            echo json_encode(["success" => true, "message" => "Comentário apagado com sucesso."]);
        } else {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "ID de comentário inválido."]);
        }
        exit();
    }

    if (empty($data['video_id']) || empty($data['comment_text'])) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Dados incompletos para publicar comentário."]);
        exit();
    }

    $video_id = intval($data['video_id']);
    $user_name = !empty($data['user_name']) ? trim($data['user_name']) : 'Irmão(ã) Visitante';
    $comment_text = trim($data['comment_text']);

    $stmt = $pdo->prepare("INSERT INTO comments (video_id, user_name, comment_text) VALUES (?, ?, ?)");
    if ($stmt->execute([$video_id, $user_name, $comment_text])) {
        echo json_encode(["success" => true, "message" => "Comentário publicado com sucesso."]);
    } else {
        http_response_code(500);
        echo json_encode(["success" => false, "message" => "Erro ao salvar comentário."]);
    }
    exit();
}
?>
