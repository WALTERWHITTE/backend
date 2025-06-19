-- MySQL dump 10.13  Distrib 8.0.36, for Win64 (x86_64)
--
-- Host: localhost    Database: unifiedmessaging
-- ------------------------------------------------------
-- Server version	8.0.36

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `activity_log`
--

DROP TABLE IF EXISTS `activity_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_log` (
  `logId` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `action` varchar(100) NOT NULL,
  `description` text,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `username` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`logId`),
  KEY `userId` (`userId`),
  CONSTRAINT `activity_log_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`userId`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_log`
--

LOCK TABLES `activity_log` WRITE;
/*!40000 ALTER TABLE `activity_log` DISABLE KEYS */;
INSERT INTO `activity_log` VALUES (1,NULL,'LOGIN','User Abinav logged in successfully.','2025-05-06 08:55:52','Abinav'),(2,1,'LOGIN','User Abinav logged in successfully.','2025-05-06 09:05:39','Abinav'),(3,2,'LOGIN','User SUganth logged in successfully.','2025-05-06 09:08:20','Suganth'),(4,1,'LOGIN','User Abinav logged in successfully.','2025-05-06 09:08:50','Abinav'),(5,2,'LOGIN','User suganth logged in successfully.','2025-05-06 09:10:42','Suganth'),(6,2,'ACTION','User Suganth performed Update Client on the clientDetails table.','2025-05-06 09:11:20','Suganth'),(7,2,'UPDATE','Updated client \"John wick smith\" (ID: 101)','2025-05-06 09:11:28','Suganth'),(8,2,'ACTION','User Suganth performed Update Family on the family table.','2025-05-06 09:11:43','Suganth'),(9,2,'UPDATE','Assigned client \"John wick smith\" (ID: 101) to updated family (ID: 1)','2025-05-06 09:11:57','Suganth'),(10,2,'UPDATE','Assigned client \"Mary Smith\" (ID: 102) to updated family (ID: 1)','2025-05-06 09:11:57','Suganth'),(11,2,'UPDATE','Assigned client \"Anna Smith\" (ID: 103) to updated family (ID: 1)','2025-05-06 09:11:57','Suganth'),(12,2,'UPDATE','Updated family \"wick family\" (ID: 1) with new head (ID: 101)','2025-05-06 09:11:57','Suganth'),(13,2,'NAVIGATION','User Suganth navigated back to the Main Menu.','2025-05-06 09:12:09','Suganth'),(14,2,'LOGOUT','User Suganth logged out.','2025-05-06 09:12:11','Suganth'),(15,4,'CREATE','New user registered: Mirdul','2025-05-06 09:20:28','Mirdul'),(16,4,'LOGIN','User Mirdul logged in successfully.','2025-05-06 09:20:50','Mirdul'),(17,4,'FILTER','Applied filter: Clients using Loan products','2025-05-06 09:21:09','Mirdul'),(18,4,'SEND','Sent 3 emails using filter \"Clients using Loan products\"','2025-05-06 09:21:18','Mirdul'),(19,4,'ACTION','User Mirdul accessed the Mail Messaging system.','2025-05-06 09:21:18','Mirdul'),(20,4,'LOGOUT','User Mirdul logged out.','2025-05-06 09:21:26','Mirdul'),(21,1,'LOGIN','User Abinav logged in successfully.','2025-05-06 11:56:00','Abinav'),(22,1,'ACTION','User Abinav performed Create Client-Product on the clientProducts table.','2025-05-06 11:56:24','Abinav'),(23,1,'ERROR','Failed to link products to client. Error: Duplicate entry \'113-4\' for key \'clientproducts.PRIMARY\'','2025-05-06 11:56:39','Abinav'),(24,1,'ACTION','User Abinav performed View Client-Products on the clientProducts table.','2025-05-06 11:57:08','Abinav'),(25,1,'READ','Viewed all client-product associations','2025-05-06 11:57:08','Abinav'),(26,1,'ACTION','User Abinav performed Create Client-Product on the clientProducts table.','2025-05-06 11:57:36','Abinav'),(27,1,'CREATE','Linked product \"Mortgage\" (ID: 5) to client \"Ags2\" (ID: 113)','2025-05-06 11:57:47','Abinav'),(28,1,'ACTION','User Abinav performed View Filtered Clients on the clientDetails table.','2025-05-06 11:57:57','Abinav'),(29,1,'READ','Viewed clients with filter: \"All Clients\"','2025-05-06 11:57:59','Abinav'),(30,1,'ACTION','User Abinav performed Update Family on the family table.','2025-05-06 11:58:11','Abinav'),(31,1,'NAVIGATION','User Abinav navigated back to the database operations menu.','2025-05-06 12:00:08','Abinav'),(32,1,'ACTION','User Abinav performed View Families on the family table.','2025-05-06 12:00:10','Abinav'),(33,1,'READ','Viewed all families','2025-05-06 12:00:10','Abinav'),(34,1,'ACTION','User Abinav performed Update Family on the family table.','2025-05-06 12:00:19','Abinav'),(35,1,'LOGIN','User Abinav logged in successfully.','2025-05-06 12:08:36','Abinav'),(36,1,'ACTION','User Abinav performed Update Family on the family table.','2025-05-06 12:08:40','Abinav'),(37,1,'UPDATE','Assigned client \"Ags2\" (ID: 113) to updated family (ID: 7)','2025-05-06 12:08:47','Abinav'),(38,1,'UPDATE','Assigned client \"Pakya Priyaa\" (ID: 114) to updated family (ID: 7)','2025-05-06 12:08:47','Abinav'),(39,1,'UPDATE','Assigned client \"Priyadharshini\" (ID: 115) to updated family (ID: 7)','2025-05-06 12:08:47','Abinav'),(40,1,'UPDATE','Updated family \"The Priyaas\" (ID: 7) with new head (ID: 115)','2025-05-06 12:08:47','Abinav'),(41,1,'ACTION','User Abinav performed Delete Family on the family table.','2025-05-06 12:08:54','Abinav'),(42,1,'DELETE','Deleted family (ID: 8)','2025-05-06 12:08:56','Abinav'),(43,1,'NAVIGATION','User Abinav navigated back to the Main Menu.','2025-05-06 12:09:00','Abinav'),(44,1,'LOGOUT','User Abinav logged out.','2025-05-06 12:09:01','Abinav'),(45,5,'CREATE','New user registered: vivek','2025-05-06 13:05:08','vivek'),(46,5,'LOGIN','User vivek logged in successfully.','2025-05-06 13:05:20','vivek'),(47,5,'FILTER','Applied filter: Clients older than 40','2025-05-06 13:07:14','vivek'),(48,5,'SEND','Sent 7 emails using filter \"Clients older than 40\"','2025-05-06 13:07:44','vivek'),(49,5,'ACTION','User vivek accessed the Mail Messaging system.','2025-05-06 13:07:44','vivek'),(50,5,'ACTION','User vivek performed Create Client on the clientDetails table.','2025-05-06 13:08:36','vivek'),(51,5,'CREATE','Created client \"Balan\" (ID: 117)','2025-05-06 13:10:05','vivek'),(52,5,'ACTION','User vivek performed View Filtered Clients on the clientDetails table.','2025-05-06 13:10:22','vivek'),(53,5,'READ','Viewed clients with filter: \"All Clients\"','2025-05-06 13:10:23','vivek'),(54,5,'NAVIGATION','User vivek navigated back to the database operations menu.','2025-05-06 13:10:39','vivek'),(55,5,'ACTION','User vivek performed Create Family on the family table.','2025-05-06 13:10:45','vivek'),(56,5,'UPDATE','Assigned client \"Balan\" (ID: 117) to new family (ID: 9)','2025-05-06 13:11:59','vivek'),(57,5,'CREATE','Created family \"vb\" (ID: 9) with head (ID: 117)','2025-05-06 13:11:59','vivek'),(58,5,'ACTION','User vivek performed View Families on the family table.','2025-05-06 13:12:08','vivek'),(59,5,'READ','Viewed all families','2025-05-06 13:12:08','vivek'),(60,5,'NAVIGATION','User vivek navigated back to the Main Menu.','2025-05-06 13:12:21','vivek'),(61,5,'LOGOUT','User vivek logged out.','2025-05-06 13:12:23','vivek');
/*!40000 ALTER TABLE `activity_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientdetails`
--

DROP TABLE IF EXISTS `clientdetails`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientdetails` (
  `clientId` int NOT NULL AUTO_INCREMENT,
  `clientName` varchar(255) NOT NULL,
  `clientEmail` varchar(255) NOT NULL,
  `clientContact` bigint DEFAULT NULL,
  `clientDob` date DEFAULT NULL,
  `clientProfession` varchar(255) DEFAULT NULL,
  `familyId` int DEFAULT NULL,
  `familyHead` tinyint(1) DEFAULT '0',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `clientGender` enum('Male','Female') DEFAULT NULL,
  PRIMARY KEY (`clientId`),
  UNIQUE KEY `clientEmail` (`clientEmail`),
  KEY `fk_family_id` (`familyId`),
  CONSTRAINT `fk_family_id` FOREIGN KEY (`familyId`) REFERENCES `family` (`familyId`)
) ENGINE=InnoDB AUTO_INCREMENT=118 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientdetails`
--

LOCK TABLES `clientdetails` WRITE;
/*!40000 ALTER TABLE `clientdetails` DISABLE KEYS */;
INSERT INTO `clientdetails` VALUES (101,'John wick smith','abinavgs27@gmail.com',9876543210,'1980-06-12','Engineer',1,1,'2025-04-29 07:26:41','2025-05-06 09:11:57','Male'),(102,'Mary Smith','ironmanonlineminecraft@gmail.com',9876543211,'1982-08-20','Teacher',1,0,'2025-04-29 07:26:58','2025-05-06 09:11:57','Female'),(103,'Anna Smith','abinavg@proton.me',9876543212,'2007-01-05','Student',1,0,'2025-04-29 07:26:58','2025-05-06 09:11:57','Female'),(104,'Robert Johnson','majjagaming@gmail.com',9876543213,'1975-02-10','Contractor',2,1,'2025-04-29 07:26:41','2025-04-29 07:39:14','Male'),(105,'Emily Johnson','mailtoaceclowngamer@gmail.com',9876543214,'1977-09-12','Nurse',2,0,'2025-04-29 07:26:58','2025-04-29 07:39:14','Female'),(106,'Ravi Patel','sachinvivekananddan@gmail.com',9876543215,'1980-04-30','Doctor',3,1,'2025-04-29 07:26:41','2025-04-30 07:32:10','Male'),(107,'Asha Patel','shona.gs29@gmail.com',9876543218,'1975-07-11','Homemaker',3,0,'2025-04-29 07:26:58','2025-04-29 07:39:14','Female'),(108,'Kiran Patel','727823tuio002@skct.edu.in',9876543219,'2005-09-18','Student',3,0,'2025-04-29 07:26:58','2025-04-29 07:39:14','Female'),(109,'Linh Nguyen','727823tuio027@skct.edu.in',9876543216,'1987-03-22','Designer',4,1,'2025-04-29 07:26:41','2025-04-29 07:39:14','Male'),(111,'Carlos Garcia','727823tuio048@skct.edu.in',9876543217,'1978-12-30','Manager',5,1,'2025-04-29 07:26:41','2025-04-29 07:39:14','Male'),(113,'Ags2','727823tuio019@skct.edu.in',123456789,'2006-02-27','Student',7,0,'2025-05-05 07:26:13','2025-05-06 12:08:47','Male'),(114,'Pakya Priyaa','727823tuio033@skct.edu.in',987654321,'2005-10-10','Student',7,0,'2025-05-05 10:51:56','2025-05-06 12:08:47','Female'),(115,'Priyadharshini','727823tuio040@skct.edu.in',234567890,'2003-05-24','Student',7,1,'2025-05-05 10:53:47','2025-05-06 12:08:47','Female'),(117,'Balan','viveklee@yahoo.com',98765432,'1977-10-30','sales',9,1,'2025-05-06 13:10:05','2025-05-06 13:11:59','Male');
/*!40000 ALTER TABLE `clientdetails` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientproducts`
--

DROP TABLE IF EXISTS `clientproducts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientproducts` (
  `clientId` int NOT NULL,
  `productId` int NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`clientId`,`productId`),
  KEY `productId` (`productId`),
  CONSTRAINT `clientproducts_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `clientdetails` (`clientId`) ON DELETE CASCADE,
  CONSTRAINT `clientproducts_ibfk_2` FOREIGN KEY (`productId`) REFERENCES `products` (`productId`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientproducts`
--

LOCK TABLES `clientproducts` WRITE;
/*!40000 ALTER TABLE `clientproducts` DISABLE KEYS */;
INSERT INTO `clientproducts` VALUES (101,1,'2025-05-05 07:59:49','2025-05-05 07:59:49'),(101,2,'2025-05-05 07:59:49','2025-05-05 07:59:49'),(102,2,'2025-05-05 07:59:49','2025-05-05 07:59:49'),(103,3,'2025-05-05 07:59:49','2025-05-05 07:59:49'),(104,1,'2025-05-05 09:04:41','2025-05-05 09:04:41'),(105,2,'2025-05-05 07:59:49','2025-05-05 07:59:49'),(106,2,'2025-05-05 07:59:49','2025-05-05 07:59:49'),(106,4,'2025-05-05 07:59:49','2025-05-05 07:59:49'),(107,2,'2025-05-05 07:59:49','2025-05-05 07:59:49'),(108,3,'2025-05-05 07:59:49','2025-05-05 07:59:49'),(109,2,'2025-05-05 07:59:49','2025-05-05 07:59:49'),(111,1,'2025-05-05 07:59:49','2025-05-05 07:59:49'),(111,5,'2025-05-05 07:59:49','2025-05-05 07:59:49'),(113,4,'2025-05-05 09:04:23','2025-05-05 09:04:23'),(113,5,'2025-05-06 11:57:47','2025-05-06 11:57:47'),(114,2,'2025-05-05 10:58:43','2025-05-05 10:58:43'),(114,4,'2025-05-05 10:58:43','2025-05-05 10:58:43'),(114,8,'2025-05-05 10:58:43','2025-05-05 10:58:43');
/*!40000 ALTER TABLE `clientproducts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `family`
--

DROP TABLE IF EXISTS `family`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `family` (
  `familyId` int NOT NULL AUTO_INCREMENT,
  `familyName` varchar(255) DEFAULT NULL,
  `familyHeadId` int DEFAULT NULL,
  `totalMembers` int DEFAULT NULL,
  `familyAddress` varchar(255) DEFAULT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`familyId`),
  KEY `family_ibfk_1` (`familyHeadId`),
  CONSTRAINT `family_ibfk_1` FOREIGN KEY (`familyHeadId`) REFERENCES `clientdetails` (`clientId`) ON DELETE CASCADE,
  CONSTRAINT `family_chk_1` CHECK ((`totalMembers` >= 1))
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `family`
--

LOCK TABLES `family` WRITE;
/*!40000 ALTER TABLE `family` DISABLE KEYS */;
INSERT INTO `family` VALUES (1,'wick family',101,3,'123 Maple Street','2025-04-29 07:26:52','2025-05-06 09:11:57'),(2,'Johnson Family',104,2,'456 Oak Avenue','2025-04-29 07:26:52','2025-04-29 07:26:52'),(3,'Patel Family',106,4,'789 Pine Road','2025-04-29 07:26:52','2025-04-29 07:26:52'),(4,'Nguyen Family',109,1,'321 Elm Boulevard','2025-04-29 07:26:52','2025-04-29 07:26:52'),(5,'Garcia Family',111,2,'654 Cedar Lane','2025-04-29 07:26:52','2025-04-29 07:26:52'),(7,'The Priyaas',115,3,'Skct kovaipudur','2025-05-05 10:55:27','2025-05-06 12:08:47'),(9,'vb',117,1,'123,nn street,sb colony,cbe','2025-05-06 13:11:59','2025-05-06 13:11:59');
/*!40000 ALTER TABLE `family` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `productId` int NOT NULL AUTO_INCREMENT,
  `productName` varchar(100) NOT NULL,
  PRIMARY KEY (`productId`),
  UNIQUE KEY `productName` (`productName`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (3,'Child Savings'),(8,'Health Insurance'),(4,'Investment'),(1,'Loan'),(5,'Mortgage'),(2,'Savings');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `userId` int NOT NULL AUTO_INCREMENT,
  `username` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`userId`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Abinav','$2b$10$CNzvrYnkixS33AelSn7a/uLd9Se522Q3zYEtrOGxjT5vdw5buT/AG','2025-05-06 08:02:40'),(2,'Suganth','$2b$10$3iFrKQejpTTn0zFkeTHxaOXl55EWJG9W8X1FNO61kuWmrSO807Rke','2025-05-06 08:04:39'),(4,'Mirdul','$2b$10$8M7NiZzwkX217AXtkylAiu78Hi47ZIaTBl3szU5jdi8SZRD4.I0ni','2025-05-06 09:20:28'),(5,'vivek','$2b$10$zkSPbZpBNabdAhkFqA593erRaNWVaGa0qplc3y0es6zcwwaa3LnVW','2025-05-06 13:05:08');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-07 19:01:14
