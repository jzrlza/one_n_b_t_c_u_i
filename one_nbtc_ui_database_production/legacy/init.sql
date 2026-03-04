SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for dept
-- ----------------------------
DROP TABLE IF EXISTS `dept`;
CREATE TABLE `dept`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `dept_name` varchar(80) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `div_id` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 76 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of dept
-- ----------------------------
INSERT INTO `dept` VALUES (1, 'ประจำสำนักงาน', 1);
INSERT INTO `dept` VALUES (2, 'กบ.', 2);
INSERT INTO `dept` VALUES (3, 'คบ.', 2);
INSERT INTO `dept` VALUES (4, 'ดบ.', 2);
INSERT INTO `dept` VALUES (5, 'ตบ.', 2);
INSERT INTO `dept` VALUES (6, 'ทบ.', 2);
INSERT INTO `dept` VALUES (7, 'นบ.', 2);
INSERT INTO `dept` VALUES (8, 'บบ.', 2);
INSERT INTO `dept` VALUES (9, 'ปบ.', 2);
INSERT INTO `dept` VALUES (10, 'สบ.', 2);
INSERT INTO `dept` VALUES (11, 'อบ.', 2);
INSERT INTO `dept` VALUES (12, 'บย.', 3);
INSERT INTO `dept` VALUES (13, 'นย.', 3);
INSERT INTO `dept` VALUES (14, 'พย.', 3);
INSERT INTO `dept` VALUES (15, 'ลย.', 3);
INSERT INTO `dept` VALUES (16, 'ตย.', 3);
INSERT INTO `dept` VALUES (17, 'ดย.', 3);
INSERT INTO `dept` VALUES (18, 'วย.', 3);
INSERT INTO `dept` VALUES (19, 'ยย.', 3);
INSERT INTO `dept` VALUES (20, 'กภ.', 4);
INSERT INTO `dept` VALUES (21, 'ภาค 1', 4);
INSERT INTO `dept` VALUES (22, 'เขต 11 (สมุทรปราการ)', 4);
INSERT INTO `dept` VALUES (23, 'เขต 12 (จันทบุรี)', 4);
INSERT INTO `dept` VALUES (24, 'เขต 13 (สุพรรณบุรี)', 4);
INSERT INTO `dept` VALUES (25, 'เขต 14 (ปราจีนบุรี)', 4);
INSERT INTO `dept` VALUES (26, 'เขต 15 (อยุธยา)', 4);
INSERT INTO `dept` VALUES (27, 'เขต 16 (ราชบุรี)', 4);
INSERT INTO `dept` VALUES (28, 'ภาค 2', 4);
INSERT INTO `dept` VALUES (29, 'เขต 21 (ร้อยเอ็ด)', 4);
INSERT INTO `dept` VALUES (30, 'เขต 22 (อุบลราชธานี)', 4);
INSERT INTO `dept` VALUES (31, 'เขต 23 (นครราชสีมา)', 4);
INSERT INTO `dept` VALUES (32, 'เขต 24 (อุดรธานี)', 4);
INSERT INTO `dept` VALUES (33, 'เขต 25 (นครพนม)', 4);
INSERT INTO `dept` VALUES (34, 'ภาค 3', 4);
INSERT INTO `dept` VALUES (35, 'เขต 31 (ลำปาง)', 4);
INSERT INTO `dept` VALUES (36, 'เขต 32 (ลำพูน)', 4);
INSERT INTO `dept` VALUES (37, 'เขต 33 (พิษณุโลก)', 4);
INSERT INTO `dept` VALUES (38, 'เขต 34 (เชียงราย)', 4);
INSERT INTO `dept` VALUES (39, 'เขต 35 (นครสวรรค์)', 4);
INSERT INTO `dept` VALUES (40, 'ภาค 4', 4);
INSERT INTO `dept` VALUES (41, 'เขต 41 (ยะลา)', 4);
INSERT INTO `dept` VALUES (42, 'เขต 42 (ภูเก็ต)', 4);
INSERT INTO `dept` VALUES (43, 'เขต 43 (นครศรีธรรมราช)', 4);
INSERT INTO `dept` VALUES (44, 'เขต 44 (สุราษฎร์ธานี)', 4);
INSERT INTO `dept` VALUES (45, 'เขต 45 (ชุมพร)', 4);
INSERT INTO `dept` VALUES (46, 'ขส.', 5);
INSERT INTO `dept` VALUES (47, 'คส.', 5);
INSERT INTO `dept` VALUES (48, 'ชส.', 5);
INSERT INTO `dept` VALUES (49, 'ทส.', 5);
INSERT INTO `dept` VALUES (50, 'นส.', 5);
INSERT INTO `dept` VALUES (51, 'บส.', 5);
INSERT INTO `dept` VALUES (52, 'ปส.', 5);
INSERT INTO `dept` VALUES (53, 'ผส.', 5);
INSERT INTO `dept` VALUES (54, 'มส.', 5);
INSERT INTO `dept` VALUES (55, 'รส.', 5);
INSERT INTO `dept` VALUES (56, 'วส.', 5);
INSERT INTO `dept` VALUES (57, 'สส.', 5);
INSERT INTO `dept` VALUES (58, 'คท. 1', 6);
INSERT INTO `dept` VALUES (59, 'คท. 2', 6);
INSERT INTO `dept` VALUES (60, 'จท.', 6);
INSERT INTO `dept` VALUES (61, 'ชท.', 6);
INSERT INTO `dept` VALUES (62, 'ดท.', 6);
INSERT INTO `dept` VALUES (63, 'ถท.', 6);
INSERT INTO `dept` VALUES (64, 'ทท.', 6);
INSERT INTO `dept` VALUES (65, 'นท.', 6);
INSERT INTO `dept` VALUES (66, 'ปท. 1', 6);
INSERT INTO `dept` VALUES (67, 'ปท. 2', 6);
INSERT INTO `dept` VALUES (68, 'มท.', 6);
INSERT INTO `dept` VALUES (69, 'รท.', 6);
INSERT INTO `dept` VALUES (70, 'วท.', 6);
INSERT INTO `dept` VALUES (71, 'ตว.', 7);
INSERT INTO `dept` VALUES (72, 'ปว.', 7);
INSERT INTO `dept` VALUES (73, 'พว.', 7);
INSERT INTO `dept` VALUES (74, 'วว.', 7);
INSERT INTO `dept` VALUES (75, 'ศว.', 7);

-- ----------------------------
-- Table structure for division
-- ----------------------------
DROP TABLE IF EXISTS `division`;
CREATE TABLE `division`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `div_name` varchar(80) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 8 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of division
-- ----------------------------
INSERT INTO `division` VALUES (1, 'ประจำสำนักงาน');
INSERT INTO `division` VALUES (2, 'สาย บก.');
INSERT INTO `division` VALUES (3, 'สาย ยก.');
INSERT INTO `division` VALUES (4, 'สาย ภค.');
INSERT INTO `division` VALUES (5, 'สาย สท.');
INSERT INTO `division` VALUES (6, 'สาย ทค.');
INSERT INTO `division` VALUES (7, 'สาย วก.');

-- ----------------------------
-- Table structure for employee
-- ----------------------------
DROP TABLE IF EXISTS `employee`;
CREATE TABLE `employee`  (
  `id` smallint NOT NULL AUTO_INCREMENT,
  `emp_name` varchar(80) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `position_id` smallint NULL DEFAULT NULL,
  `dept_id` smallint NULL DEFAULT NULL,
  `is_register` tinyint(1) NULL DEFAULT 0 COMMENT '0=Not Reister , 1=Register',
  `is_deleted` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for position
-- ----------------------------
DROP TABLE IF EXISTS `position`;
CREATE TABLE `position`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `position_name` varchar(80) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 79 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of position
-- ----------------------------
INSERT INTO `position` VALUES (1, 'ผู้อำนวยการสำนักประจำสำนักงาน');
INSERT INTO `position` VALUES (2, 'ผู้อำนวยการส่วนประจำสำนักงาน');
INSERT INTO `position` VALUES (3, 'ผู้อำนวยการส่วนประจำสำนักงาน รก. อกบ.');
INSERT INTO `position` VALUES (4, 'ผู้อำนวยการส่วน');
INSERT INTO `position` VALUES (5, 'นนผ. ก1 รก. ผกบ.');
INSERT INTO `position` VALUES (6, 'ผู้อำนวยการสำนัก');
INSERT INTO `position` VALUES (7, 'นสม. ก1 รก. ผนบ.');
INSERT INTO `position` VALUES (8, 'นนผ. ก1 รก. ผบบ.');
INSERT INTO `position` VALUES (9, 'ผู้อำนวยการส่วนประจำสำนักงาน รก. อปบ.');
INSERT INTO `position` VALUES (10, 'นก. ก1 รก. ผบย.');
INSERT INTO `position` VALUES (11, 'นก. ช3 รก. ผนย.');
INSERT INTO `position` VALUES (12, 'นก. ก1 รก. ผนย.');
INSERT INTO `position` VALUES (13, 'นตป.อาวุโส ช2');
INSERT INTO `position` VALUES (14, 'นนผ. ก1 รก. ผกภ.');
INSERT INTO `position` VALUES (15, 'ผู้อำนวยการสำนักงาน กสทช. ภาค');
INSERT INTO `position` VALUES (16, 'นตป. ก1 รก. ผภภ. 1');
INSERT INTO `position` VALUES (17, 'ผู้อำนวยการสำนักงาน กสทช. เขต');
INSERT INTO `position` VALUES (18, 'วก. ก1 รก. ผภภ. เขต 24');
INSERT INTO `position` VALUES (19, 'นนผ.อาวุโส ช2');
INSERT INTO `position` VALUES (20, 'นนผ.อาวุโส ช3');
INSERT INTO `position` VALUES (21, 'นก. ก1 รก. ผภภ. 4');
INSERT INTO `position` VALUES (22, 'นจท.อาวุโส ช3');
INSERT INTO `position` VALUES (23, 'นบช. ก1 รก. ผนส.');
INSERT INTO `position` VALUES (24, 'ศก. ก1 รก. ผนส.');
INSERT INTO `position` VALUES (25, 'นกง. ก1 รก. ผปส.');
INSERT INTO `position` VALUES (26, 'นก. ก1 รก. ผผส.');
INSERT INTO `position` VALUES (27, 'นนผ. ก1 รก. ผสส.');
INSERT INTO `position` VALUES (28, 'ศก. ก1 รก. ผสส.');
INSERT INTO `position` VALUES (29, 'นก. ก1 รก. ผคท. 1');
INSERT INTO `position` VALUES (30, 'วก. ก1 รก. ผคท. 2');
INSERT INTO `position` VALUES (31, 'วก. ก1 รก. ผชท.');
INSERT INTO `position` VALUES (32, 'นนผ. ก1 รก. ผถท.');
INSERT INTO `position` VALUES (33, 'ผู้อำนวยการส่วนประจำสำนักงาน รก. อมท.');
INSERT INTO `position` VALUES (34, 'นก. ก1 รก. ผมท.');
INSERT INTO `position` VALUES (35, 'นนผ. ก1 รก. ผตว.');
INSERT INTO `position` VALUES (36, 'นนผ. ก1 รก. ผปว.');
INSERT INTO `position` VALUES (37, 'ผู้อำนวยการส่วน รก. อพว.');
INSERT INTO `position` VALUES (38, 'ผู้อำนวยการส่วน รก. อวว.');
INSERT INTO `position` VALUES (39, 'นก. ช1 รก. รสทช. (ภค.)');
INSERT INTO `position` VALUES (40, 'วก. ช1');
INSERT INTO `position` VALUES (41, 'นนผ. ช1 รก. รสทช. (สท.)');
INSERT INTO `position` VALUES (42, 'ศก. ช1');
INSERT INTO `position` VALUES (43, 'นนผ. ช1');
INSERT INTO `position` VALUES (44, 'นก. ช1');
INSERT INTO `position` VALUES (45, 'นก. ช1 รก. รสทช. (วก.)');
INSERT INTO `position` VALUES (46, 'นก. ช2');
INSERT INTO `position` VALUES (47, 'ผู้ทรงคุณวุฒิด้านการบริหารงานภายใน');
INSERT INTO `position` VALUES (48, 'ผู้ทรงคุณวุฒิด้านกฎหมาย');
INSERT INTO `position` VALUES (49, 'ผู้ทรงคุณวุฒิด้านวิศวกรรมโทรคมนาคม');
INSERT INTO `position` VALUES (50, 'ผู้ทรงคุณวุฒิในด้านยุทธศาสตร์และการงบประมาณ');
INSERT INTO `position` VALUES (51, 'นนผ. ก1');
INSERT INTO `position` VALUES (52, 'นจท. ก1');
INSERT INTO `position` VALUES (53, 'นสม. ก1');
INSERT INTO `position` VALUES (54, 'นก. ก1');
INSERT INTO `position` VALUES (55, 'จสท. ก2');
INSERT INTO `position` VALUES (56, 'นนผ. ก2');
INSERT INTO `position` VALUES (57, 'นนผ. ก3');
INSERT INTO `position` VALUES (58, 'เจ้าหน้าที่ธุรการ');
INSERT INTO `position` VALUES (59, 'นตภ. ก1');
INSERT INTO `position` VALUES (60, 'นบค. ก2');
INSERT INTO `position` VALUES (61, 'นจท. ก2');
INSERT INTO `position` VALUES (62, 'นจท. ก3');
INSERT INTO `position` VALUES (63, 'นก. ก3');
INSERT INTO `position` VALUES (64, 'เจ้าหน้าที่จัดการงานทั่วไป');
INSERT INTO `position` VALUES (65, 'เจ้าหน้าที่นโยบายและแผน');
INSERT INTO `position` VALUES (66, 'เจ้าหน้าที่ธุรการ');
INSERT INTO `position` VALUES (67, 'พนักงานขับรถยนต์');
INSERT INTO `position` VALUES (68, 'นพส. ก1');
INSERT INTO `position` VALUES (69, 'นนผ. ก1 รก. ผอบ.');
INSERT INTO `position` VALUES (70, 'ผู้อำนวยการส่วน รก. อสบ.');
INSERT INTO `position` VALUES (71, 'นสม. ก1');
INSERT INTO `position` VALUES (72, 'นสม. ก2');
INSERT INTO `position` VALUES (73, 'นสม. ก3');
INSERT INTO `position` VALUES (74, 'เจ้าหน้าที่สื่อสารมวลชน');
INSERT INTO `position` VALUES (75, 'ผู้อำนวยการส่วน รก. อตบ.');
INSERT INTO `position` VALUES (76, 'นตภ. ก1');
INSERT INTO `position` VALUES (77, 'นทส. ก1');
INSERT INTO `position` VALUES (78, 'นบช. ก2');

-- ----------------------------
-- Table structure for register
-- ----------------------------
DROP TABLE IF EXISTS `register`;
CREATE TABLE `register`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `emp_id` smallint NULL DEFAULT NULL,
  `table_number` varchar(20) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `sys_datetime` datetime NULL DEFAULT current_timestamp(),
  `is_deleted` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;


DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(80) CHARACTER SET utf8 COLLATE utf8_general_ci NULL DEFAULT NULL,
  `password` varchar(255) NULL DEFAULT NULL,
  `type` int NOT NULL DEFAULT 1,
  `two_factor_secret` varchar(255) NULL DEFAULT NULL,
  `is_2fa_enabled` tinyint(1) DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `is_deleted` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8 COLLATE = utf8_general_ci ROW_FORMAT = Dynamic;

# password = nbtctest
INSERT INTO `users` VALUES (1, 'one_admin', '$2a$12$2XXyaujvn6FBac/zLLib0OavSp8yGCtpxbNFcORzvzIm0UKYQq5o.', 1, NULL, 0, NOW(), 0);