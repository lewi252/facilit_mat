<?php
require_once "config.php";

$video_dir = "../uploads/videos/";
$thumb_dir = "../uploads/thumbs/";
$avatar_dir = "../uploads/avatars/";

if (!file_exists($video_dir)) mkdir($video_dir, 0777, true);
if (!file_exists($thumb_dir)) mkdir($thumb_dir, 0777, true);
if (!file_exists($avatar_dir)) mkdir($avatar_dir, 0777, true);

$title = isset($_POST['title']) ? trim($_POST['title']) : '';
$preacher = isset($_POST['preacher']) ? trim($_POST['preacher']) : '';
$church = isset($_POST['church']) ? trim($_POST['church']) : 'Igreja Local';
$category = isset($_POST['category']) ? trim($_POST['category']) : 'Pregações';
$description = isset($_POST['description']) ? trim($_POST['description']) : '';
$thumb_url = isset($_POST['thumb_url']) ? trim($_POST['thumb_url']) : '';
$avatar_url = isset($_POST['avatar_url']) ? trim($_POST['avatar_url']) : '';
$video_link = isset($_POST['video_link']) ? trim($_POST['video_link']) : '';
$user_id = isset($_POST['user_id']) ? intval($_POST['user_id']) : null;

$final_video_url = '';

// 1. Upload do Arquivo de Vídeo
if (isset($_FILES['video_file']) && $_FILES['video_file']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['video_file']['tmp_name'];
    $fileName = $_FILES['video_file']['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

    $allowedExtensions = ['mp4', 'webm', 'ogg', 'mov', 'avi'];
    if (in_array($fileExtension, $allowedExtensions)) {
        $newFileName = "vid_" . time() . '_' . md5($fileName) . '.' . $fileExtension;
        $destPath = $video_dir . $newFileName;

        if (move_uploaded_file($fileTmpPath, $destPath)) {
            $final_video_url = "uploads/videos/" . $newFileName;
        }
    }
} elseif (!empty($video_link)) {
    $final_video_url = $video_link;
}

// 2. Upload do Arquivo de Capa (Thumb)
if (isset($_FILES['thumb_file']) && $_FILES['thumb_file']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['thumb_file']['tmp_name'];
    $fileName = $_FILES['thumb_file']['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (in_array($fileExtension, $allowed)) {
        $newName = "thumb_" . time() . '.' . $fileExtension;
        if (move_uploaded_file($fileTmpPath, $thumb_dir . $newName)) {
            $thumb_url = "uploads/thumbs/" . $newName;
        }
    }
}

// 3. Upload do Arquivo de Foto do Pregador (Avatar)
if (isset($_FILES['avatar_file']) && $_FILES['avatar_file']['error'] === UPLOAD_ERR_OK) {
    $fileTmpPath = $_FILES['avatar_file']['tmp_name'];
    $fileName = $_FILES['avatar_file']['name'];
    $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if (in_array($fileExtension, $allowed)) {
        $newName = "avatar_" . time() . '.' . $fileExtension;
        if (move_uploaded_file($fileTmpPath, $avatar_dir . $newName)) {
            $avatar_url = "uploads/avatars/" . $newName;
        }
    }
}

if (empty($title) || empty($preacher) || empty($final_video_url)) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Por favor, preencha o Título, o Nome do Pregador e selecione/informe o vídeo."]);
    exit();
}

if (empty($thumb_url)) {
    $thumb_url = "https://images.unsplash.com/photo-1509021436468-d510074671b4?q=80&w=800";
}

if (empty($avatar_url)) {
    $avatar_url = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150";
}

$stmt = $pdo->prepare("INSERT INTO videos (title, preacher, church, category, thumb_url, avatar_url, video_url, description, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
if ($stmt->execute([$title, $preacher, $church, $category, $thumb_url, $avatar_url, $final_video_url, $description, $user_id])) {
    $newId = $pdo->lastInsertId();
    echo json_encode([
        "success" => true,
        "message" => "Pregação publicada com sucesso!",
        "video_id" => $newId
    ]);
} else {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Erro ao salvar no banco de dados."]);
}
?>
