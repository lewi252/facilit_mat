-- ===================================================
-- DATABASE SCRIPT PARA XAMPP (phpMyAdmin)
-- PLATAFORMA TIME COM JESUS
-- ===================================================

CREATE DATABASE IF NOT EXISTS `timecomjesus` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `timecomjesus`;

-- 1. Tabela de Usuários
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `church` VARCHAR(150) DEFAULT 'Comunidade Cristã',
  `avatar_url` TEXT,
  `role` ENUM('user', 'admin') DEFAULT 'user',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Tabela de Pregações / Vídeos
CREATE TABLE IF NOT EXISTS `videos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `preacher` VARCHAR(150) NOT NULL,
  `church` VARCHAR(150) DEFAULT 'Igreja Local',
  `category` VARCHAR(50) DEFAULT 'Pregações',
  `duration` VARCHAR(20) DEFAULT 'Vídeo',
  `views` INT DEFAULT 0,
  `likes` INT DEFAULT 0,
  `thumb_url` TEXT,
  `avatar_url` TEXT,
  `video_url` TEXT NOT NULL,
  `description` TEXT,
  `is_featured` TINYINT(1) DEFAULT 0,
  `user_id` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Tabela de Comentários
CREATE TABLE IF NOT EXISTS `comments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `video_id` INT NOT NULL,
  `user_name` VARCHAR(150) NOT NULL,
  `comment_text` TEXT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Tabela de Favoritos
CREATE TABLE IF NOT EXISTS `favorites` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `video_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `user_video_unique` (`user_id`, `video_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`video_id`) REFERENCES `videos`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
