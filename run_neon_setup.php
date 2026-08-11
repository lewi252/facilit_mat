<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "1. Conectando ao Banco de Dados Neon (PostgreSQL Cloud)...";

$db_host = "ep-spring-bonus-acruuu8p.sa-east-1.aws.neon.tech";
$db_port = "5432";
$db_name = "neondb";
$db_user = "neondb_owner";
$db_pass = "npg_DwPG6d4Znval";
$endpoint_id = "ep-spring-bonus-acruuu8p";

try {
    // Tenta primeiro conexão direta
    $dsn = "pgsql:host=$db_host;port=$db_port;dbname=$db_name;sslmode=require;options='endpoint=$endpoint_id'";
    $pdo = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    echo "2. Conexão com Neon PostgreSQL estabelecida com SUCESSO!\n";

    // 1. Tabela Users
    $sql1 = "CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      church VARCHAR(150) DEFAULT 'Comunidade Cristã',
      avatar_url TEXT,
      role VARCHAR(20) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );";
    $pdo->exec($sql1);
    echo "3. Tabela 'users' criada/verificada!\n";

    // 2. Tabela Videos
    $sql2 = "CREATE TABLE IF NOT EXISTS videos (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      preacher VARCHAR(150) NOT NULL,
      church VARCHAR(150) DEFAULT 'Igreja Local',
      category VARCHAR(50) DEFAULT 'Pregações',
      duration VARCHAR(20) DEFAULT 'Vídeo',
      views INT DEFAULT 0,
      likes INT DEFAULT 0,
      thumb_url TEXT,
      avatar_url TEXT,
      video_url TEXT NOT NULL,
      description TEXT,
      is_featured SMALLINT DEFAULT 0,
      user_id INT DEFAULT NULL REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );";
    $pdo->exec($sql2);
    echo "4. Tabela 'videos' criada/verificada!\n";

    // 3. Tabela Comments
    $sql3 = "CREATE TABLE IF NOT EXISTS comments (
      id SERIAL PRIMARY KEY,
      video_id INT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      user_name VARCHAR(150) NOT NULL,
      comment_text TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );";
    $pdo->exec($sql3);
    echo "5. Tabela 'comments' criada/verificada!\n";

    // 4. Tabela Favorites
    $sql4 = "CREATE TABLE IF NOT EXISTS favorites (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      video_id INT NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT user_video_unique UNIQUE (user_id, video_id)
    );";
    $pdo->exec($sql4);
    echo "6. Tabela 'favorites' criada/verificada!\n";

    $count = $pdo->query("SELECT COUNT(*) FROM videos")->fetchColumn();
    echo "7. Total de vídeos no banco Neon: $count\n";

    echo "\nGLÓRIA A DEUS! SEU BANCO DE DADOS NEON (POSTGRESQL) ESTÁ 100% CONFIGURADO E OPERACIONAL!\n";

} catch (Exception $e) {
    echo "ERRO DE CONEXÃO OU SQL NEON: " . $e->getMessage() . "\n";
}
?>
