<?php
require_once "config.php";

$category = isset($_GET['category']) ? trim($_GET['category']) : "Todos";
$search = isset($_GET['search']) ? trim($_GET['search']) : "";

$query = "SELECT * FROM videos WHERE 1=1";
$params = [];

if ($category !== "Todos" && !empty($category)) {
    $query .= " AND category = ?";
    $params[] = $category;
}

if (!empty($search)) {
    $query .= " AND (title LIKE ? OR preacher LIKE ? OR church LIKE ?)";
    $searchTerm = "%" . $search . "%";
    $params[] = $searchTerm;
    $params[] = $searchTerm;
    $params[] = $searchTerm;
}

$query .= " ORDER BY created_at DESC";

$stmt = $pdo->prepare($query);
$stmt->execute($params);
$videos = $stmt->fetchAll();

echo json_encode([
    "success" => true,
    "videos" => $videos
]);
?>
