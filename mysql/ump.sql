CREATE DATABASE IF NOT EXISTS `UnifiedMessaging`;
USE `UnifiedMessaging`;

-- users table
CREATE TABLE IF NOT EXISTS `users` (
  `userId` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`userId`)
) ENGINE=InnoDB;

-- activity_log table
CREATE TABLE IF NOT EXISTS `activity_log` (
  `logId` INT NOT NULL AUTO_INCREMENT,
  `userId` INT NULL,
  `action` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `username` VARCHAR(255) NULL,
  PRIMARY KEY (`logId`),
  FOREIGN KEY (`userId`) REFERENCES `users`(`userId`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- products table
CREATE TABLE IF NOT EXISTS `products` (
  `productId` INT NOT NULL AUTO_INCREMENT,
  `productName` VARCHAR(100) NOT NULL UNIQUE,
  PRIMARY KEY (`productId`)
) ENGINE=InnoDB;

-- family table
CREATE TABLE IF NOT EXISTS `family` (
  `familyId` INT NOT NULL AUTO_INCREMENT,
  `familyName` VARCHAR(255) NULL,
  `familyHeadId` INT NULL,
  `totalMembers` INT NULL,
  `familyAddress` VARCHAR(255) NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`familyId`),
  FOREIGN KEY (`familyHeadId`) REFERENCES `clientDetails`(`clientId`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- clientDetails table
CREATE TABLE IF NOT EXISTS `clientDetails` (
  `clientId` INT NOT NULL AUTO_INCREMENT,
  `clientName` VARCHAR(255) NOT NULL,
  `clientEmail` VARCHAR(255) NOT NULL UNIQUE,
  `clientContact` BIGINT NULL,
  `clientDob` DATE NULL,
  `clientProfession` VARCHAR(255) NULL,
  `familyId` INT NULL,
  `familyHead` TINYINT(1) DEFAULT 0,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `clientGender` ENUM('Male', 'Female') NULL,
  PRIMARY KEY (`clientId`),
  FOREIGN KEY (`familyId`) REFERENCES `family`(`familyId`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- clientProducts table
CREATE TABLE IF NOT EXISTS `clientProducts` (
  `clientId` INT NOT NULL,
  `productId` INT NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`clientId`, `productId`),
  FOREIGN KEY (`clientId`) REFERENCES `clientDetails`(`clientId`) ON DELETE CASCADE,
  FOREIGN KEY (`productId`) REFERENCES `products`(`productId`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- templates table (called email_templates in your DB)
CREATE TABLE IF NOT EXISTS `email_templates` (
  `templateId` INT NOT NULL AUTO_INCREMENT,
  `templateName` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `subject` VARCHAR(255) NULL,
  PRIMARY KEY (`templateId`)
) ENGINE=InnoDB;

