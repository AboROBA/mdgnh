-- =====================================================================
-- قاعدة بيانات نظام إدارة ومحاسبة مداجن سورية الكبرى الرقمية
-- متوافق مع سيرفر XAMPP المحلي ومخدمات MySQL / MariaDB
-- الرماز الافتراضي: utf8mb4_general_ci لضمان الدعم الكامل للغة العربية
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `poultry_farm` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `poultry_farm`;

-- ---------------------------------------------------------------------
-- 1. جدول المستخدمين وصلاحياتهم الدقيقة والكاملة (المشرفين والكادر الطبي)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(50) NOT NULL,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `fullName` VARCHAR(100) NOT NULL,
  `password` VARCHAR(100) NOT NULL,
  `role` VARCHAR(20) NOT NULL DEFAULT 'viewer',
  `canManageCycles` BOOLEAN NOT NULL DEFAULT FALSE,
  `canManageExpenses` BOOLEAN NOT NULL DEFAULT FALSE,
  `canManageMortalities` BOOLEAN NOT NULL DEFAULT FALSE,
  `canManageSales` BOOLEAN NOT NULL DEFAULT FALSE,
  `canManageUsers` BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------
-- 2. جدول مستودع الإعدادات العامة وقيمة الصرف اليومي للعملة الثنائية
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `setting_key` VARCHAR(50) NOT NULL,
  `setting_value` TEXT NOT NULL,
  PRIMARY KEY (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------
-- 3. جدول الدورات الفوجية المغلقة والمستمرة (أرشفة الأفواج)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `cycles` (
  `id` VARCHAR(50) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `status` VARCHAR(10) NOT NULL CHECK (`status` IN ('active', 'closed')),
  `startDate` DATE NOT NULL,
  `endDate` DATE DEFAULT NULL,
  `initialChicksCount` INT NOT NULL,
  `chickCostUSD` DECIMAL(10, 2) NOT NULL,
  `exchangeRateAtStart` DECIMAL(10, 2) NOT NULL,
  `feedPricePerTonUSD` DECIMAL(10, 2) NOT NULL,
  `notes` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------
-- 4. جدول النفقات ومصروفات الدورة التفصيلية (الأدوية، الأعلاف والمازوت)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` VARCHAR(50) NOT NULL,
  `cycleId` VARCHAR(50) NOT NULL,
  `category` VARCHAR(20) NOT NULL,
  `description` TEXT NOT NULL,
  `amount` DECIMAL(12, 2) NOT NULL,
  `currency` VARCHAR(3) NOT NULL CHECK (`currency` IN ('USD', 'SYP')),
  `exchangeRate` DECIMAL(10, 2) NOT NULL,
  `date` DATE NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`cycleId`) REFERENCES `cycles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------
-- 5. جدول رصد وفيات الدجاج والنفوق اليومي بالعنبر
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `mortalities` (
  `id` VARCHAR(50) NOT NULL,
  `cycleId` VARCHAR(50) NOT NULL,
  `count` INT NOT NULL CHECK (`count` >= 0),
  `date` DATE NOT NULL,
  `reason` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`cycleId`) REFERENCES `cycles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------
-- 6. جدول تسويق المبيعات وعقود الدجاج مع تجار اللحم والأوزان الكلية
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sales` (
  `id` VARCHAR(50) NOT NULL,
  `cycleId` VARCHAR(50) NOT NULL,
  `buyerName` VARCHAR(150) NOT NULL,
  `chickenCount` INT NOT NULL CHECK (`chickenCount` > 0),
  `totalWeightKg` DECIMAL(10, 2) NOT NULL CHECK (`totalWeightKg` > 0),
  `pricePerKgSYP` DECIMAL(10, 2) NOT NULL,
  `exchangeRate` DECIMAL(10, 2) NOT NULL,
  `date` DATE NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`cycleId`) REFERENCES `cycles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- =====================================================================
-- غرس الحسابات القياسية وحالات الدخول الثلاثة المعطلة لل presets
-- الصلاحيات الدقيقة مدمجة في الأعمدة (canManage) لكل من الحسابات الفرعية
-- =====================================================================

-- 1. المدير العام (أدمن - صلاحية كاملة على كل شيء)
INSERT INTO `users` (`id`, `username`, `fullName`, `password`, `role`, `canManageCycles`, `canManageExpenses`, `canManageMortalities`, `canManageSales`, `canManageUsers`) 
VALUES ('usr-admin', 'admin', 'المدير العام (أدمن)', '123', 'admin', TRUE, TRUE, TRUE, TRUE, TRUE)
ON DUPLICATE KEY UPDATE `password`='123';

-- 2. مشرف مدخل فني (صلاحية إدخال وإيقاف فقط)
INSERT INTO `users` (`id`, `username`, `fullName`, `password`, `role`, `canManageCycles`, `canManageExpenses`, `canManageMortalities`, `canManageSales`, `canManageUsers`) 
VALUES ('usr-manager', 'manager', 'المشرف التقني (فني)', '123', 'manager', TRUE, TRUE, TRUE, TRUE, FALSE)
ON DUPLICATE KEY UPDATE `password`='123';

-- 3. مراقب طبيب العزل (صلاحية رصد وعرض فقط)
INSERT INTO `users` (`id`, `username`, `fullName`, `password`, `role`, `canManageCycles`, `canManageExpenses`, `canManageMortalities`, `canManageSales`, `canManageUsers`) 
VALUES ('usr-viewer', 'viewer', 'طبيب العزل (مراقب)', '123', 'viewer', FALSE, FALSE, TRUE, FALSE, FALSE)
ON DUPLICATE KEY UPDATE `password`='123';

-- غرس قيمة الصرف الافتتاحية الأولية لليوم
INSERT INTO `settings` (`setting_key`, `setting_value`) 
VALUES ('exchangeRate', '15200')
ON DUPLICATE KEY UPDATE `setting_value`='15200';
