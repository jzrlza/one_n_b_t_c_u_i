DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(80) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `password` varchar(255) NULL DEFAULT NULL,
  `type` int NOT NULL DEFAULT 1,
  `two_factor_secret` varchar(255) NULL DEFAULT NULL,
  `is_2fa_enabled` tinyint(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 76 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

# password = nbtctest
INSERT INTO `users` VALUES (1, 'one_admin', '$2a$12$2XXyaujvn6FBac/zLLib0OavSp8yGCtpxbNFcORzvzIm0UKYQq5o.', 1, NULL, 0, NOW());