-- Migracion para bases creadas con la version anterior de nido.sql.
-- Las instalaciones nuevas no la necesitan: nido.sql ya incluye estos cambios.
-- Agrega: publicaciones de solo texto, fecha de creacion, perfil (biografia, foto, cuenta privada),
-- seguidores con solicitudes e historias de 24 horas.
-- Si hay emails o nombres de usuario repetidos, corregilos antes de correrla (se vuelven unicos).

-- Un me gusta por persona y publicacion (primero se eliminan duplicados)
DELETE l1 FROM `user_likes` l1
  JOIN `user_likes` l2 ON l1.user_id = l2.user_id AND l1.post_id = l2.post_id AND l1.id > l2.id;
ALTER TABLE `user_likes` ADD UNIQUE KEY `user_post` (`user_id`, `post_id`);

-- Publicaciones: tipo (image o text), imagen opcional y fecha
ALTER TABLE `post`
  MODIFY `title` varchar(255) NOT NULL DEFAULT '',
  MODIFY `source` longtext DEFAULT NULL,
  ADD COLUMN `kind` varchar(10) NOT NULL DEFAULT 'image' AFTER `type`,
  ADD COLUMN `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  ADD KEY `created_at` (`created_at`);

ALTER TABLE `comments` ADD COLUMN `created_at` timestamp NOT NULL DEFAULT current_timestamp();

ALTER TABLE `users`
  ADD COLUMN `bio` varchar(160) NOT NULL DEFAULT '',
  ADD COLUMN `avatar` varchar(255) DEFAULT NULL,
  ADD COLUMN `is_private` tinyint(1) NOT NULL DEFAULT 0,
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

CREATE TABLE `follows` (
  `follower_id` int(11) NOT NULL,
  `followed_id` int(11) NOT NULL,
  `status` varchar(10) NOT NULL DEFAULT 'accepted',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`follower_id`, `followed_id`),
  KEY `followed_id` (`followed_id`),
  CONSTRAINT `follows_ibfk_1` FOREIGN KEY (`follower_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `follows_ibfk_2` FOREIGN KEY (`followed_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Historias: se borran a las 24 horas (lo hace el servidor)
CREATE TABLE `stories` (
  `story_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `source` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`story_id`),
  KEY `user_id` (`user_id`),
  KEY `created_at` (`created_at`),
  CONSTRAINT `stories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
