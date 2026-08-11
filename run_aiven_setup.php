<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "1. Conectando a Aiven...\n";

try {
    $db_host = "timecomjesus-lewidedeus.l.aivencloud.com";
    $db_port = "10938";
    $db_name = "defaultdb";
    $db_user = "avnadmin";
    $db_pass = "AVNS_pIy2Tk3LqiICVgrAKsf";

    $dsn = "mysql:host=$db_host;port=$db_port;dbname=$db_name;charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::MYSQL_ATTR_SSL_CA => true,
        PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT => false
    ];

    $pdo = new PDO($dsn, $db_user, $db_pass, $options);
    echo "2. Conexao com Aiven estabelecida com sucesso!\n";

    $sql1 = "CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(150) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      church VARCHAR(150) DEFAULT 'Comunidade Crista',
      avatar_url TEXT,
      role ENUM('user', 'admin') DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $pdo->exec($sql1);
    echo "3. Tabela users criada!\n";

    $sql2 = "CREATE TABLE IF NOT EXISTS videos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      preacher VARCHAR(150) NOT NULL,
      church VARCHAR(150) DEFAULT 'Igreja Local',
      category VARCHAR(50) DEFAULT 'Pregacoes',
      duration VARCHAR(20) DEFAULT 'Video',
      views INT DEFAULT 0,
      likes INT DEFAULT 0,
      thumb_url TEXT,
      avatar_url TEXT,
      video_url TEXT NOT NULL,
      description TEXT,
      is_featured TINYINT(1) DEFAULT 0,
      user_id INT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $pdo->exec($sql2);
    echo "4. Tabela videos criada!\n";

    $sql3 = "CREATE TABLE IF NOT EXISTS comments (
      id INT AUTO_INCREMENT PRIMARY KEY,
      video_id INT NOT NULL,
      user_name VARCHAR(150) NOT NULL,
      comment_text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $pdo->exec($sql3);
    echo "5. Tabela comments criada!\n";

    $sql4 = "CREATE TABLE IF NOT EXISTS favorites (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      video_id INT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY user_video_unique (user_id, video_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
    $pdo->exec($sql4);
    echo "6. Tabela favorites criada!\n";



    echo "GLORIA A DEUS! SEU BANCO DE DADOS NA AIVEN ESTA 100% CONFIGURADO E PRONTO!\n";

} catch (Exception $e) {
    echo "ERRO DE CONEXAO OU SQL: " . $e->getMessage() . "\n";
}
?>
