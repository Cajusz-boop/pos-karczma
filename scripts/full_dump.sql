-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: pos_karczma
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_banqueteventtoroom`
--

DROP TABLE IF EXISTS `_banqueteventtoroom`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_banqueteventtoroom` (
  `A` varchar(191) NOT NULL,
  `B` varchar(191) NOT NULL,
  UNIQUE KEY `_BanquetEventToRoom_AB_unique` (`A`,`B`),
  KEY `_BanquetEventToRoom_B_index` (`B`),
  CONSTRAINT `_BanquetEventToRoom_A_fkey` FOREIGN KEY (`A`) REFERENCES `banquetevent` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `_BanquetEventToRoom_B_fkey` FOREIGN KEY (`B`) REFERENCES `room` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_banqueteventtoroom`
--

LOCK TABLES `_banqueteventtoroom` WRITE;
/*!40000 ALTER TABLE `_banqueteventtoroom` DISABLE KEYS */;
/*!40000 ALTER TABLE `_banqueteventtoroom` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('3fe0fea7-2e67-4aa9-9e76-295f4cb37cc2','0bad610e974c49afbc857ea6520d1d4c0286a4d7f74dc0c0081b7a10c1d83f96','2026-03-02 09:42:07.845','20260302120000_add_order_type_values',NULL,NULL,'2026-03-02 09:42:07.790',1),('657120d6-0f06-4cb9-9220-f935c800c2d1','442feba34d4ea0cb281e2ad8b51ae2dd3cebfd6fc1403610b71112e249daaf68','2026-03-02 09:42:00.178','20260213100148_init','',NULL,'2026-03-02 09:42:00.178',0);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `allergen`
--

DROP TABLE IF EXISTS `allergen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `allergen` (
  `id` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `icon` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Allergen_code_key` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `allergen`
--

LOCK TABLES `allergen` WRITE;
/*!40000 ALTER TABLE `allergen` DISABLE KEYS */;
INSERT INTO `allergen` VALUES ('cmlw9tk1c000cv8vz65m58ipx','GLUTEN','Gluten','🌾'),('cmlw9tk1g000dv8vzflo8dlyj','SKORUPIAKI','Skorupiaki','🦐'),('cmlw9tk1k000ev8vzk86gbz10','JAJA','Jaja','🥚'),('cmlw9tk1o000fv8vzeouwsrik','RYBY','Ryby','🐟'),('cmlw9tk1r000gv8vzy3cmt36q','ORZECHY','Orzechy','🥜'),('cmlw9tk1u000hv8vzbc2p17sx','SOJA','Soja','🫘'),('cmlw9tk1y000iv8vzvo99l4t2','MLEKO','Mleko','🥛'),('cmlw9tk22000jv8vzks6101yl','SELER','Seler','🥬'),('cmlw9tk26000kv8vzon5viow1','GORCZYCA','Gorczyca','🟡'),('cmlw9tk29000lv8vz9jcbulj9','SEZAM','Nasiona sezamu','⚪'),('cmlw9tk2d000mv8vzdsxmxz08','DWUTLENEK_SIARKI','Dwutlenek siarki i siarczyny','🍷'),('cmlw9tk2i000nv8vzalre2qzm','LUBIN','Łubin','🫘'),('cmlw9tk2m000ov8vzkcjbcbea','MIECZAKI','Mięczaki','🦪'),('cmlw9tk2p000pv8vzh5to3pvk','ORZECHY_ZIEMNE','Orzechy ziemne','🥜');
/*!40000 ALTER TABLE `allergen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `announcement`
--

DROP TABLE IF EXISTS `announcement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `announcement` (
  `id` varchar(191) NOT NULL,
  `authorId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `content` text NOT NULL,
  `priority` enum('LOW','NORMAL','HIGH') NOT NULL DEFAULT 'NORMAL',
  `pinned` tinyint(1) NOT NULL DEFAULT 0,
  `expiresAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `Announcement_authorId_fkey` (`authorId`),
  CONSTRAINT `Announcement_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcement`
--

LOCK TABLES `announcement` WRITE;
/*!40000 ALTER TABLE `announcement` DISABLE KEYS */;
/*!40000 ALTER TABLE `announcement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auditlog`
--

DROP TABLE IF EXISTS `auditlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auditlog` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `action` varchar(191) NOT NULL,
  `entityType` varchar(191) NOT NULL,
  `entityId` varchar(191) DEFAULT NULL,
  `oldValue` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`oldValue`)),
  `newValue` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`newValue`)),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `timestamp` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `AuditLog_userId_fkey` (`userId`),
  CONSTRAINT `AuditLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditlog`
--

LOCK TABLES `auditlog` WRITE;
/*!40000 ALTER TABLE `auditlog` DISABLE KEYS */;
INSERT INTO `auditlog` VALUES ('cmlwld6vy0008d4vzapfdx9jb',NULL,'DISCOUNT_APPLIED','Order','cmlwld6ug0007d4vztebwy3xh',NULL,'{\"type\":\"PERCENT\",\"value\":10}',NULL,'2026-02-21 17:27:24.189'),('cmlwld6x50009d4vzefkaojh8',NULL,'DISCOUNT_APPLIED','Order','cmlwld6ug0007d4vztebwy3xh','{\"type\":\"PERCENT\",\"value\":10}','{\"type\":\"AMOUNT\",\"value\":20}',NULL,'2026-02-21 17:27:24.232'),('cmlwldld3000jd4vzhil11pos',NULL,'DISCOUNT_APPLIED','Order','cmlwldlbo000id4vzdg6wywbu',NULL,'{\"type\":\"PERCENT\",\"value\":10}',NULL,'2026-02-21 17:27:42.950'),('cmlwldle5000kd4vzujc4srxu',NULL,'DISCOUNT_APPLIED','Order','cmlwldlbo000id4vzdg6wywbu','{\"type\":\"PERCENT\",\"value\":10}','{\"type\":\"AMOUNT\",\"value\":20}',NULL,'2026-02-21 17:27:42.989'),('cmlwlemc0000sd4vzvpsybekh',NULL,'DISCOUNT_APPLIED','Order','cmlwlemaj000rd4vzu99x7sxs',NULL,'{\"type\":\"PERCENT\",\"value\":10}',NULL,'2026-02-21 17:28:30.864'),('cmlwlemdi000td4vzg6swg75b',NULL,'DISCOUNT_APPLIED','Order','cmlwlemaj000rd4vzu99x7sxs','{\"type\":\"PERCENT\",\"value\":10}','{\"type\":\"AMOUNT\",\"value\":20}',NULL,'2026-02-21 17:28:30.918'),('cmlwlf99r0015d4vzhsflvtiq',NULL,'DISCOUNT_APPLIED','Order','cmlwlf98o0014d4vzo133paba',NULL,'{\"type\":\"PERCENT\",\"value\":10}',NULL,'2026-02-21 17:29:00.590'),('cmlwlf9aq0016d4vzrcgo6zcl',NULL,'DISCOUNT_APPLIED','Order','cmlwlf98o0014d4vzo133paba','{\"type\":\"PERCENT\",\"value\":10}','{\"type\":\"AMOUNT\",\"value\":20}',NULL,'2026-02-21 17:29:00.625'),('cmlwlfl8m001ed4vzra30blyx',NULL,'DISCOUNT_APPLIED','Order','cmlwlfl7f001dd4vzco7rcyg0',NULL,'{\"type\":\"PERCENT\",\"value\":10}',NULL,'2026-02-21 17:29:16.101'),('cmlwlfl9l001fd4vzsdx5knz5',NULL,'DISCOUNT_APPLIED','Order','cmlwlfl7f001dd4vzco7rcyg0','{\"type\":\"PERCENT\",\"value\":10}','{\"type\":\"AMOUNT\",\"value\":20}',NULL,'2026-02-21 17:29:16.137'),('cmlwlgl22001pd4vzc3ppu39t',NULL,'DISCOUNT_APPLIED','Order','cmlwlgl0q001od4vzx5mzzqwt',NULL,'{\"type\":\"PERCENT\",\"value\":10}',NULL,'2026-02-21 17:30:02.522'),('cmlwlgl3e001qd4vzckja5c84',NULL,'DISCOUNT_APPLIED','Order','cmlwlgl0q001od4vzx5mzzqwt','{\"type\":\"PERCENT\",\"value\":10}','{\"type\":\"AMOUNT\",\"value\":20}',NULL,'2026-02-21 17:30:02.570'),('cmlxt9ulc0009qwvztgl6i9nl',NULL,'ORDER_CANCELLED','Order','cmlxt9tq30008qwvz363iou6g','{\"status\":\"OPEN\"}','{\"status\":\"CANCELLED\"}',NULL,'2026-02-22 13:56:31.391'),('cmlxt9uog000bqwvzfhdg5ief',NULL,'ORDER_CANCELLED','Order','cmlxt9un3000aqwvzlgbkxz9p','{\"status\":\"OPEN\"}','{\"status\":\"CANCELLED\"}',NULL,'2026-02-22 13:56:31.504'),('cmlxt9vse000gqwvzh80g58yn',NULL,'ORDER_CLOSED','Order','cmlxt9upg000cqwvznaxzwznl','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:56:32.942'),('cmlxt9ya4000oqwvzsmhmgj36',NULL,'ORDER_CLOSED','Order','cmlxt9y4l000kqwvzb02uej1n','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:56:36.172'),('cmlxt9yel000tqwvz8skg7qma',NULL,'ORDER_CLOSED','Order','cmlxt9ybk000pqwvz36nezg4p','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:56:36.333'),('cmlxt9yvr0011qwvzs2146idq',NULL,'ORDER_CLOSED','Order','cmlxt9yti000zqwvzekhp17wg','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:56:36.950'),('cmlxta20i0017qwvzdvt634cx',NULL,'DISCOUNT_APPLIED','Order','cmlxta1yu0016qwvz5kppynv3',NULL,'{\"type\":\"PERCENT\",\"value\":10}',NULL,'2026-02-22 13:56:41.009'),('cmlxta21y0018qwvz7m8nhkj8',NULL,'DISCOUNT_APPLIED','Order','cmlxta1yu0016qwvz5kppynv3','{\"type\":\"PERCENT\",\"value\":10}','{\"type\":\"AMOUNT\",\"value\":20}',NULL,'2026-02-22 13:56:41.062'),('cmlxtadh2001kqwvzl5xcd5uc',NULL,'ORDER_CANCELLED','Order','cmlxtadf0001jqwvzb30mn4ij','{\"status\":\"OPEN\"}','{\"status\":\"CANCELLED\"}',NULL,'2026-02-22 13:56:55.861'),('cmlxtadj8001mqwvzzcysila3',NULL,'ORDER_CANCELLED','Order','cmlxtadi3001lqwvzbvr1rzgh','{\"status\":\"OPEN\"}','{\"status\":\"CANCELLED\"}',NULL,'2026-02-22 13:56:55.940'),('cmlxtadnd001rqwvz3rqffwmi',NULL,'ORDER_CLOSED','Order','cmlxtadk7001nqwvz3ern6ppf','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:56:56.088'),('cmlxtae97001zqwvzyrmxo81p',NULL,'ORDER_CLOSED','Order','cmlxtae6a001vqwvz4k6rxx5t','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:56:56.874'),('cmlxtaeer0024qwvzrqle8p9n',NULL,'ORDER_CLOSED','Order','cmlxtaeaj0020qwvzranagmk0','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:56:57.074'),('cmlxtaevy002cqwvz6jlvt71a',NULL,'ORDER_CLOSED','Order','cmlxtaetp002aqwvz8jjewen2','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:56:57.694'),('cmlxtaldg002hqwvzs6ve1zkn',NULL,'DISCOUNT_APPLIED','Order','cmlxtalbp002gqwvzt8rmtb55',NULL,'{\"type\":\"PERCENT\",\"value\":10}',NULL,'2026-02-22 13:57:06.100'),('cmlxtaleo002iqwvz1kk6n73p',NULL,'DISCOUNT_APPLIED','Order','cmlxtalbp002gqwvzt8rmtb55','{\"type\":\"PERCENT\",\"value\":10}','{\"type\":\"AMOUNT\",\"value\":20}',NULL,'2026-02-22 13:57:06.143'),('cmlxtc32m002vqwvz392wq5pz',NULL,'ORDER_CANCELLED','Order','cmlxtc319002uqwvzwdj24rcg','{\"status\":\"OPEN\"}','{\"status\":\"CANCELLED\"}',NULL,'2026-02-22 13:58:15.694'),('cmlxtc34v002xqwvzcv055vor',NULL,'ORDER_CANCELLED','Order','cmlxtc33l002wqwvzkfbkkm07','{\"status\":\"OPEN\"}','{\"status\":\"CANCELLED\"}',NULL,'2026-02-22 13:58:15.774'),('cmlxtc39g0032qwvzfbzi321c',NULL,'ORDER_CLOSED','Order','cmlxtc35z002yqwvzi3f6erzv','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:58:15.939'),('cmlxtc3tz003aqwvz7btlv276',NULL,'ORDER_CLOSED','Order','cmlxtc3qq0036qwvzbtbd9wut','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:58:16.678'),('cmlxtc3yh003fqwvzde4gliyj',NULL,'ORDER_CLOSED','Order','cmlxtc3v7003bqwvz4u2ihdng','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:58:16.840'),('cmlxtc4e2003nqwvztqbep32m',NULL,'ORDER_CLOSED','Order','cmlxtc4bj003lqwvz6m5mi0m6','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:58:17.402'),('cmlxtc7bo003qqwvzpyrlnqo2',NULL,'DISCOUNT_APPLIED','Order','cmlxtc7ab003pqwvz2f2z52b7',NULL,'{\"type\":\"PERCENT\",\"value\":10}',NULL,'2026-02-22 13:58:21.204'),('cmlxtc7cs003rqwvz6ta07bm5',NULL,'DISCOUNT_APPLIED','Order','cmlxtc7ab003pqwvz2f2z52b7','{\"type\":\"PERCENT\",\"value\":10}','{\"type\":\"AMOUNT\",\"value\":20}',NULL,'2026-02-22 13:58:21.244'),('cmlxtcr220043qwvz73unoqug',NULL,'ORDER_CLOSED','Order','cmlxtcqzq003zqwvzdxyk2gbn','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:58:46.778'),('cmlxtcrbt004aqwvzbw50wpxc',NULL,'ORDER_CANCELLED','Order','cmlxtcrac0049qwvzx6tmbzta','{\"status\":\"OPEN\"}','{\"status\":\"CANCELLED\"}',NULL,'2026-02-22 13:58:47.129'),('cmlxtcre6004cqwvzrmej26uu',NULL,'ORDER_CANCELLED','Order','cmlxtcrct004bqwvzsfmb2gyo','{\"status\":\"OPEN\"}','{\"status\":\"CANCELLED\"}',NULL,'2026-02-22 13:58:47.213'),('cmlxtcrhz004hqwvzzvunsk05',NULL,'ORDER_CLOSED','Order','cmlxtcrf8004dqwvzxqxts1ke','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:58:47.351'),('cmlxtcs13004pqwvz4ao47q47',NULL,'ORDER_CLOSED','Order','cmlxtcrxk004lqwvzwpv0gebr','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:58:48.039'),('cmlxtcs50004uqwvzdu1i1cy7',NULL,'ORDER_CLOSED','Order','cmlxtcs2c004qqwvzwz0abjw0','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:58:48.180'),('cmlxtcsii0052qwvzv7xsvz0g',NULL,'ORDER_CLOSED','Order','cmlxtcsgn0050qwvzjgqi0bcl','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:58:48.665'),('cmlxtcuom0055qwvzleg1zjnr',NULL,'DISCOUNT_APPLIED','Order','cmlxtcund0054qwvzlghsq3o3',NULL,'{\"type\":\"PERCENT\",\"value\":10}',NULL,'2026-02-22 13:58:51.478'),('cmlxtcupq0056qwvz9ja0ufxz',NULL,'DISCOUNT_APPLIED','Order','cmlxtcund0054qwvzlghsq3o3','{\"type\":\"PERCENT\",\"value\":10}','{\"type\":\"AMOUNT\",\"value\":20}',NULL,'2026-02-22 13:58:51.517'),('cmlxtdxrk005iqwvzyxo5p7k0',NULL,'ORDER_CLOSED','Order','cmlxtdxp8005eqwvzjapr9s6q','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:59:42.127'),('cmlxtdy1g005pqwvzz3ci8dnv',NULL,'ORDER_CANCELLED','Order','cmlxtdxzk005oqwvz6qm21epz','{\"status\":\"OPEN\"}','{\"status\":\"CANCELLED\"}',NULL,'2026-02-22 13:59:42.484'),('cmlxtdy4o005rqwvz1dk30wh3',NULL,'ORDER_CANCELLED','Order','cmlxtdy2o005qqwvzp2nf4hom','{\"status\":\"OPEN\"}','{\"status\":\"CANCELLED\"}',NULL,'2026-02-22 13:59:42.600'),('cmlxtdy9p005wqwvz7u5sw2ao',NULL,'ORDER_CLOSED','Order','cmlxtdy5u005sqwvzx2874vu5','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:59:42.781'),('cmlxtdyry0064qwvzm0tztjud',NULL,'ORDER_CLOSED','Order','cmlxtdyoz0060qwvzjiq68fqc','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:59:43.437'),('cmlxtdyvw0069qwvz8hxwzt81',NULL,'ORDER_CLOSED','Order','cmlxtdyte0065qwvz0pugrolt','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:59:43.580'),('cmlxtdz9e006hqwvzof0izkxo',NULL,'ORDER_CLOSED','Order','cmlxtdz7i006fqwvz9fwncpzh','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 13:59:44.066'),('cmlxte1gx006kqwvzls05i2hw',NULL,'DISCOUNT_APPLIED','Order','cmlxte1fl006jqwvzo0ks909v',NULL,'{\"type\":\"PERCENT\",\"value\":10}',NULL,'2026-02-22 13:59:46.929'),('cmlxte1hz006lqwvzsjel462o',NULL,'DISCOUNT_APPLIED','Order','cmlxte1fl006jqwvzo0ks909v','{\"type\":\"PERCENT\",\"value\":10}','{\"type\":\"AMOUNT\",\"value\":20}',NULL,'2026-02-22 13:59:46.967'),('cmlxujbxc0003hovzebev5lbj',NULL,'ORDER_CLOSED','Order','cmlwksytl001p50vzrnio0dlt','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 14:31:53.375'),('cmlxv0z2c0005rovzzh9omc1p',NULL,'ORDER_CLOSED','Order','cmlxujen40004hovz9tl3pieo','{\"status\":\"SENT_TO_KITCHEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 14:45:36.516'),('cmlxvc51x0007rovzejmafoap',NULL,'ORDER_CLOSED','Order','cmlxka8i9001d74vzs90ua4hj','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 14:54:17.493'),('cmlxvc8rv0008rovzz0venu40',NULL,'ORDER_CLOSED','Order','cmlxt9z930012qwvzgx5oi67c','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 14:54:22.315'),('cmlxvcat40009rovzaq4cbs18',NULL,'ORDER_CLOSED','Order','cmlxi76q4000074vz5mbaq9em','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 14:54:24.952'),('cmlxvccre000arovza3m1xlgc',NULL,'ORDER_CLOSED','Order','cmlwlgom7001ud4vz1s8u6gav','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 14:54:27.481'),('cmlxvce3j000brovzc7qwohwm',NULL,'ORDER_CLOSED','Order','cmlxde7wm0000u0vz2obsxlob','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 14:54:29.215'),('cmlxvcffd000crovzlp9bi1z6',NULL,'ORDER_CLOSED','Order','cmlxev9nk0000ckvzf8du0h6o','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 14:54:30.937'),('cmlxwpny2000frovz3nqb2n0k',NULL,'ORDER_CLOSED','Order','cmlwld93s000dd4vzs3at1tuk','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 15:32:48.121'),('cmlxwpqn0000grovz8id7t4tq',NULL,'ORDER_CLOSED','Order','cmlxv11pd0006rovzyqa4lc6l','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 15:32:51.612'),('cmlxwpsex000hrovzxbcm416d',NULL,'ORDER_CLOSED','Order','cmlwldn61000md4vz5pq8qpu7','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 15:32:53.912'),('cmlxwpu04000irovzecqxxnvm',NULL,'ORDER_CLOSED','Order','cmlwleodn000wd4vz2ikv0jg0','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 15:32:55.971'),('cmlxwpvnw000jrovzt9b3fi4o',NULL,'ORDER_CLOSED','Order','cmlwlfavu0018d4vzzg13ngaq','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 15:32:58.124'),('cmlxwpx10000krovzhis5db7x',NULL,'ORDER_CLOSED','Order','cmlwlfo8b001ld4vzbbw3uq0w','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 15:32:59.892'),('cmlxwpytr000lrovzxtlrhk9s',NULL,'ORDER_CLOSED','Order','cmlxt9tdr0001qwvzez5o9xn9','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 15:33:02.223'),('cmlxwq0i4000mrovzv1ayb481',NULL,'ORDER_CLOSED','Order','cmlxgnje8000124vz4kuwg2sp','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 15:33:04.396'),('cmlxwq24g000nrovzthjvwx58',NULL,'ORDER_CLOSED','Order','cmlxgc5ni000024vzvvq2h5j2','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 15:33:06.496'),('cmlxwq7gy000orovz3vte34bp',NULL,'ORDER_CLOSED','Order','cmlxw9h1a000drovzxc2wo1ud','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 15:33:13.425'),('cmlxwq9kg000provzzm5n5z2i',NULL,'ORDER_CLOSED','Order','cmlxwolze000erovziw6nu7bm','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-02-22 15:33:16.143'),('cmm95avmg0003s4vzh3o8pg0y',NULL,'ORDER_CANCELLED','Order','cmm959aj90000s4vzl9t8ubk6','{\"status\":\"SENT_TO_KITCHEN\"}','{\"status\":\"CANCELLED\"}',NULL,'2026-03-02 12:18:42.711'),('cmm95zsa40004s4vzgcj1c1bc',NULL,'ORDER_CANCELLED','Order','cmm94v84q0002xcvztl5gd0d3','{\"status\":\"OPEN\"}','{\"status\":\"CANCELLED\"}',NULL,'2026-03-02 12:38:04.780'),('cmm95zzo20005s4vzy1cfyu3e',NULL,'ORDER_CANCELLED','Order','cmm91c3dx0002v4vz5db1lgs9','{\"status\":\"OPEN\"}','{\"status\":\"CANCELLED\"}',NULL,'2026-03-02 12:38:14.353'),('cmm9603m30006s4vzz6mr4o3o',NULL,'ORDER_CANCELLED','Order','cmm91kft7000048vzdjym1ccn','{\"status\":\"SENT_TO_KITCHEN\"}','{\"status\":\"CANCELLED\"}',NULL,'2026-03-02 12:38:19.466'),('cmm960ae60007s4vzbxt7bpjg',NULL,'ORDER_CLOSED','Order','cmm91c3dx0002v4vz5db1lgs9','{\"status\":\"CANCELLED\"}','{\"status\":\"CLOSED\"}',NULL,'2026-03-02 12:38:28.253'),('cmm961b8q0008s4vz7d5t7dli',NULL,'ORDER_CLOSED','Order','cmm94v84q0002xcvztl5gd0d3','{\"status\":\"CANCELLED\"}','{\"status\":\"CLOSED\"}',NULL,'2026-03-02 12:39:16.010'),('cmm96k7jt000as4vz0yasxeh9',NULL,'ORDER_CLOSED','Order','cmm96k2470009s4vz8gu1r69r','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-03-02 12:53:57.689'),('cmm9728c4000cs4vznn47vna2',NULL,'ORDER_CLOSED','Order','cmm9721in000bs4vzjqr7kg7x','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-03-02 13:07:58.515'),('cmm976kg0000es4vzknbk4a4m',NULL,'ORDER_CLOSED','Order','cmm976il4000ds4vz8fpap94k','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-03-02 13:11:20.831'),('cmm9cbuhb000hs4vzvx13000y','cmlw9tjuk0003v8vzm90mbgpw','HOTEL_ROOM_CHARGE','Order','cmm9cboxd000fs4vzpscabt73',NULL,'{\"roomNumber\":\"003\",\"guestName\":\"AMBROZIAK ROBERT\",\"amount\":22,\"status\":\"POSTED\"}',NULL,'2026-03-02 15:35:25.199'),('cmm9cjuf4000ms4vzp1dw00q3','cmlw9tjuk0003v8vzm90mbgpw','HOTEL_ROOM_CHARGE','Order','cmm9cji7z000js4vzy38oj392',NULL,'{\"roomNumber\":\"003\",\"guestName\":\"AMBROZIAK ROBERT\",\"amount\":44,\"status\":\"POSTED\"}',NULL,'2026-03-02 15:41:38.367'),('cmm9cjuwg000ps4vzr7ijxadv',NULL,'ORDER_CLOSED','Order','cmm9cji7z000js4vzy38oj392','{\"status\":\"SENT_TO_KITCHEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-03-02 15:41:38.992'),('cmm9cnt7e000ts4vz0ee165rb','cmlw9tjuk0003v8vzm90mbgpw','HOTEL_ROOM_CHARGE','Order','cmm9cnpef000rs4vz969bta9r',NULL,'{\"roomNumber\":\"010\",\"guestName\":\"fffffff\",\"amount\":22,\"status\":\"POSTED\"}',NULL,'2026-03-02 15:44:43.417'),('cmm9cntag000ws4vzbh1vn3kn',NULL,'ORDER_CLOSED','Order','cmm9cnpef000rs4vz969bta9r','{\"status\":\"SENT_TO_KITCHEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-03-02 15:44:43.527'),('cmm9cob6e0012s4vz7s0lcm00','cmlw9tjuk0003v8vzm90mbgpw','HOTEL_ROOM_CHARGE','Order','cmm9co63g000xs4vzivarzqfn',NULL,'{\"roomNumber\":\"010\",\"guestName\":\"fffffff\",\"amount\":76,\"status\":\"POSTED\"}',NULL,'2026-03-02 15:45:06.709'),('cmm9cob8i0015s4vziekktgzh',NULL,'ORDER_CLOSED','Order','cmm9co63g000xs4vzivarzqfn','{\"status\":\"SENT_TO_KITCHEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-03-02 15:45:06.785'),('cmm9cp6t30018s4vzhgloawil','cmlw9tjuk0003v8vzm90mbgpw','HOTEL_ROOM_CHARGE','Order','cmm9cp1b60016s4vzyvm2ts15',NULL,'{\"roomNumber\":\"010\",\"guestName\":\"fffffff\",\"amount\":22,\"status\":\"POSTED\"}',NULL,'2026-03-02 15:45:47.703'),('cmm9cp6v4001bs4vzqt8bc4w4',NULL,'ORDER_CLOSED','Order','cmm9cp1b60016s4vzyvm2ts15','{\"status\":\"SENT_TO_KITCHEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-03-02 15:45:47.776'),('cmm9cpfr0001es4vzs24qhexb','cmlw9tjuk0003v8vzm90mbgpw','HOTEL_ROOM_CHARGE','Order','cmm9cpd7n001cs4vzuvpy58op',NULL,'{\"roomNumber\":\"010\",\"guestName\":\"fffffff\",\"amount\":22,\"status\":\"POSTED\"}',NULL,'2026-03-02 15:45:59.291'),('cmm9cpft0001hs4vzmh5lkeoz',NULL,'ORDER_CLOSED','Order','cmm9cpd7n001cs4vzuvpy58op','{\"status\":\"SENT_TO_KITCHEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-03-02 15:45:59.364'),('cmm9culcc001ks4vz1nb5tn7z','cmlw9tjuk0003v8vzm90mbgpw','HOTEL_ROOM_CHARGE','Order','cmm9cuede001is4vz5d8d2d95',NULL,'{\"roomNumber\":\"010\",\"guestName\":\"fffffff\",\"amount\":22,\"status\":\"POSTED\"}',NULL,'2026-03-02 15:49:59.820'),('cmm9culed001ns4vzstz1fx43',NULL,'ORDER_CLOSED','Order','cmm9cuede001is4vz5d8d2d95','{\"status\":\"SENT_TO_KITCHEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-03-02 15:49:59.892'),('cmm9czshi001qs4vzafiuuoh9','cmlw9tjuk0003v8vzm90mbgpw','HOTEL_ROOM_CHARGE','Order','cmm9cznra001os4vzymn6jcz8',NULL,'{\"roomNumber\":\"010\",\"guestName\":\"fffffff\",\"amount\":22,\"status\":\"POSTED\"}',NULL,'2026-03-02 15:54:02.357'),('cmm9czsjs001ts4vzmuc6q56q',NULL,'ORDER_CLOSED','Order','cmm9cznra001os4vzymn6jcz8','{\"status\":\"SENT_TO_KITCHEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-03-02 15:54:02.439'),('cmmb326mo000210vz58te4xdj',NULL,'DISCOUNT_APPLIED','Order','cmmb2ze4u000010vzv0c1prvy',NULL,'{\"type\":\"PERCENT\",\"value\":10,\"reason\":\"Rabat ręczny\"}',NULL,'2026-03-03 20:51:30.189'),('cmmb3owft000910vzsbkqvs0v',NULL,'DISCOUNT_APPLIED','Order','cmm9gkiz20000novzbdghrp9e',NULL,'{\"type\":\"PERCENT\",\"value\":10,\"reason\":\"Rabat ręczny\"}',NULL,'2026-03-03 21:09:10.073'),('cmmb3v1y8000c10vzl1ov4x0e',NULL,'ORDER_CLOSED','Order','cmm9gkiz20000novzbdghrp9e','{\"status\":\"SENT_TO_KITCHEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-03-03 21:13:57.151'),('cmmb426pn000m10vzchsn5dgn','cmlw9tjse0002v8vzu0cr8wlr','ORDER_SPLIT_BILL','Order','cmmb3zd9x000d10vzpbb5bluf',NULL,'{\"numberOfPeople\":3,\"totalAmount\":61,\"perPerson\":20.33,\"splitOrderIds\":[\"cmmb3zd9x000d10vzpbb5bluf\",\"cmmb426ol000g10vzbaueyr9u\",\"cmmb426p5000j10vzi6q0nxr2\"]}',NULL,'2026-03-03 21:19:29.914'),('cmmb6pr71000u10vz9i0fnw2f',NULL,'DISCOUNT_APPLIED','Order','cmmb68sqb000t10vzn9pg299a',NULL,'{\"type\":\"PERCENT\",\"value\":10,\"reason\":\"Rabat ręczny\"}',NULL,'2026-03-03 22:33:48.781'),('cmmb6sinw000v10vz3r2phruq',NULL,'DISCOUNT_APPLIED','Order','cmmb68sqb000t10vzn9pg299a','{\"type\":\"PERCENT\",\"value\":10,\"reason\":\"Rabat ręczny\"}','{\"type\":\"AMOUNT\",\"value\":30,\"reason\":\"Rabat ręczny\"}',NULL,'2026-03-03 22:35:57.692'),('cmmb6tq78000w10vzi5e18o9k',NULL,'DISCOUNT_APPLIED','Order','cmmb68sqb000t10vzn9pg299a','{\"type\":\"AMOUNT\",\"value\":30,\"reason\":\"Rabat ręczny\"}','{\"type\":\"PERCENT\",\"value\":100,\"reason\":\"Rabat ręczny\"}',NULL,'2026-03-03 22:36:54.115'),('cmmb6uvxa000x10vz5az541hb',NULL,'DISCOUNT_APPLIED','Order','cmmb68sqb000t10vzn9pg299a','{\"type\":\"PERCENT\",\"value\":100,\"reason\":\"Rabat ręczny\"}','{\"type\":\"PERCENT\",\"value\":150,\"reason\":\"Rabat ręczny\"}',NULL,'2026-03-03 22:37:48.190'),('cmmc8thbf0000d0vz52lw74iq',NULL,'ORDER_CLOSED','Order','cmmb6xxan000y10vzfiqtuyzt','{\"status\":\"OPEN\"}','{\"status\":\"CLOSED\"}',NULL,'2026-03-04 16:20:28.011');
/*!40000 ALTER TABLE `auditlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banquetevent`
--

DROP TABLE IF EXISTS `banquetevent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `banquetevent` (
  `id` varchar(191) NOT NULL,
  `reservationId` varchar(191) NOT NULL,
  `eventType` enum('WEDDING','EIGHTEENTH','CORPORATE','COMMUNION','CHRISTENING','FUNERAL','OTHER') NOT NULL,
  `guestCount` int(11) NOT NULL,
  `menuId` varchar(191) DEFAULT NULL,
  `pricePerPerson` decimal(10,2) NOT NULL,
  `extrasJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`extrasJson`)),
  `depositRequired` decimal(10,2) NOT NULL DEFAULT 0.00,
  `depositPaid` decimal(10,2) NOT NULL DEFAULT 0.00,
  `depositMethod` varchar(191) DEFAULT NULL,
  `contactPerson` varchar(191) NOT NULL,
  `contactPhone` varchar(191) NOT NULL,
  `contactEmail` varchar(191) DEFAULT NULL,
  `notes` varchar(191) DEFAULT NULL,
  `status` enum('INQUIRY','CONFIRMED','DEPOSIT_PAID','IN_PROGRESS','COMPLETED','CANCELLED') NOT NULL DEFAULT 'INQUIRY',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `BanquetEvent_reservationId_key` (`reservationId`),
  KEY `BanquetEvent_menuId_fkey` (`menuId`),
  CONSTRAINT `BanquetEvent_menuId_fkey` FOREIGN KEY (`menuId`) REFERENCES `banquetmenu` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `BanquetEvent_reservationId_fkey` FOREIGN KEY (`reservationId`) REFERENCES `reservation` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banquetevent`
--

LOCK TABLES `banquetevent` WRITE;
/*!40000 ALTER TABLE `banquetevent` DISABLE KEYS */;
/*!40000 ALTER TABLE `banquetevent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banquetmenu`
--

DROP TABLE IF EXISTS `banquetmenu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `banquetmenu` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `eventType` varchar(191) DEFAULT NULL,
  `itemsJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`itemsJson`)),
  `pricePerPerson` decimal(10,2) NOT NULL,
  `isTemplate` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banquetmenu`
--

LOCK TABLES `banquetmenu` WRITE;
/*!40000 ALTER TABLE `banquetmenu` DISABLE KEYS */;
/*!40000 ALTER TABLE `banquetmenu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banquetmenumodification`
--

DROP TABLE IF EXISTS `banquetmenumodification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `banquetmenumodification` (
  `id` varchar(191) NOT NULL,
  `banquetEventId` varchar(191) NOT NULL,
  `changesJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`changesJson`)),
  `priceAdjustment` decimal(10,2) NOT NULL DEFAULT 0.00,
  `note` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `BanquetMenuModification_banquetEventId_fkey` (`banquetEventId`),
  CONSTRAINT `BanquetMenuModification_banquetEventId_fkey` FOREIGN KEY (`banquetEventId`) REFERENCES `banquetevent` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banquetmenumodification`
--

LOCK TABLES `banquetmenumodification` WRITE;
/*!40000 ALTER TABLE `banquetmenumodification` DISABLE KEYS */;
/*!40000 ALTER TABLE `banquetmenumodification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calendar_config`
--

DROP TABLE IF EXISTS `calendar_config`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `calendar_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `calendarId` varchar(200) NOT NULL,
  `calendarName` varchar(100) NOT NULL,
  `eventType` enum('WESELE','POPRAWINY','CHRZCINY','KOMUNIA','URODZINY_ROCZNICA','STYPA','IMPREZA_FIRMOWA','CATERING','SPOTKANIE','SYLWESTER','INNE') NOT NULL,
  `roomName` varchar(100) DEFAULT NULL,
  `defaultPackageId` int(11) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `calendar_config_calendarId_key` (`calendarId`),
  KEY `calendar_config_defaultPackageId_fkey` (`defaultPackageId`),
  CONSTRAINT `calendar_config_defaultPackageId_fkey` FOREIGN KEY (`defaultPackageId`) REFERENCES `event_packages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calendar_config`
--

LOCK TABLES `calendar_config` WRITE;
/*!40000 ALTER TABLE `calendar_config` DISABLE KEYS */;
/*!40000 ALTER TABLE `calendar_config` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calendar_sync_log`
--

DROP TABLE IF EXISTS `calendar_sync_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `calendar_sync_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `syncedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `eventsAdded` int(11) NOT NULL DEFAULT 0,
  `eventsUpdated` int(11) NOT NULL DEFAULT 0,
  `eventsCancelled` int(11) NOT NULL DEFAULT 0,
  `error` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calendar_sync_log`
--

LOCK TABLES `calendar_sync_log` WRITE;
/*!40000 ALTER TABLE `calendar_sync_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `calendar_sync_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cardreaderconfig`
--

DROP TABLE IF EXISTS `cardreaderconfig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cardreaderconfig` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `type` enum('NFC','BARCODE','CARD','MAGNETIC_COM','MAGNETIC_USB','RFID_CLAMSHELL','DALLAS_DATAPROCESS','DALLAS_DEMIURG','DALLAS_JARLTECH','DALLAS_MP00202','FILE_READER') NOT NULL,
  `comPort` varchar(191) DEFAULT NULL,
  `baudRate` int(11) DEFAULT NULL,
  `dataBits` int(11) DEFAULT NULL,
  `stopBits` int(11) DEFAULT NULL,
  `parity` varchar(191) DEFAULT NULL,
  `filePath` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `workstationId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cardreaderconfig`
--

LOCK TABLES `cardreaderconfig` WRITE;
/*!40000 ALTER TABLE `cardreaderconfig` DISABLE KEYS */;
/*!40000 ALTER TABLE `cardreaderconfig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cashdrawer`
--

DROP TABLE IF EXISTS `cashdrawer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cashdrawer` (
  `id` varchar(191) NOT NULL,
  `currentAmount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `lastOpenedAt` datetime(3) DEFAULT NULL,
  `lastCountedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cashdrawer`
--

LOCK TABLES `cashdrawer` WRITE;
/*!40000 ALTER TABLE `cashdrawer` DISABLE KEYS */;
/*!40000 ALTER TABLE `cashdrawer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cashoperation`
--

DROP TABLE IF EXISTS `cashoperation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cashoperation` (
  `id` varchar(191) NOT NULL,
  `type` enum('DEPOSIT','WITHDRAWAL') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `reason` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `CashOperation_userId_fkey` (`userId`),
  CONSTRAINT `CashOperation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cashoperation`
--

LOCK TABLES `cashoperation` WRITE;
/*!40000 ALTER TABLE `cashoperation` DISABLE KEYS */;
/*!40000 ALTER TABLE `cashoperation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `parentId` varchar(191) DEFAULT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `color` varchar(191) DEFAULT NULL,
  `icon` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `isSeasonal` tinyint(1) NOT NULL DEFAULT 0,
  `seasonStart` datetime(3) DEFAULT NULL,
  `seasonEnd` datetime(3) DEFAULT NULL,
  `imageUrl` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Category_parentId_sortOrder_idx` (`parentId`,`sortOrder`),
  KEY `Category_isActive_idx` (`isActive`),
  CONSTRAINT `Category_parentId_fkey` FOREIGN KEY (`parentId`) REFERENCES `category` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES ('cmlw9tk7c001sv8vz0zfudvlx','Przystawki',NULL,1,'#f97316','🥗',1,0,NULL,NULL,'/menu/zupy-przystawki.png'),('cmlw9tk7g001tv8vzugmgx7dk','Zupy',NULL,2,'#22c55e','🍲',1,0,NULL,NULL,'/menu/zupy-przystawki.png'),('cmlw9tk7k001uv8vzdjjvb2aj','Dania główne',NULL,3,'#3b82f6','🍽️',1,0,NULL,NULL,'/menu/dania-glowne.png'),('cmlw9tk7o001vv8vz35zzqk08','Mięsne','cmlw9tk7k001uv8vzdjjvb2aj',4,'#ef4444',NULL,1,0,NULL,NULL,NULL),('cmlw9tk7s001wv8vzv5y52kk5','Rybne','cmlw9tk7k001uv8vzdjjvb2aj',5,'#06b6d4',NULL,1,0,NULL,NULL,NULL),('cmlw9tk7w001xv8vzbv4hyg7a','Wege','cmlw9tk7k001uv8vzdjjvb2aj',6,'#84cc16',NULL,1,0,NULL,NULL,NULL),('cmlw9tk80001yv8vznb7pt8oj','Desery',NULL,6,'#ec4899','🍰',1,0,NULL,NULL,'/menu/desery-dzieci.png'),('cmlxk8yc9000174vztxvbjip2','Wege & Gluten Free',NULL,4,NULL,'🥬',1,0,NULL,NULL,'/menu/wege.png'),('cmlxk8yce000274vzl9z9or4b','Dla dzieci',NULL,5,NULL,'👶',1,0,NULL,NULL,'/menu/desery-dzieci.png'),('cmlxk8ycq000374vzjs8hdqsc','Dodatki',NULL,7,NULL,'🥔',1,0,NULL,NULL,'/menu/desery-dzieci.png'),('cmlxmkndl000000vz5q9gno6v','Karta sezonowa',NULL,9,NULL,'🍂',1,0,NULL,NULL,'/menu/sezonowe.png'),('cmm9g85wt0001ckvzkullwb85','Piwo',NULL,9,'#eab308',NULL,1,0,NULL,NULL,NULL),('cmm9gc37v00009kvzywt4v2zz','Napoje',NULL,8,'#0ea5e9',NULL,1,0,NULL,NULL,NULL),('cmm9gc38r00019kvz7knfwydq','Alkohol',NULL,10,'#a855f7',NULL,1,0,NULL,NULL,NULL);
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer` (
  `id` varchar(191) NOT NULL,
  `phone` varchar(191) NOT NULL,
  `name` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `notes` varchar(191) DEFAULT NULL,
  `hotelGuestId` varchar(191) DEFAULT NULL,
  `loyaltyPoints` int(11) NOT NULL DEFAULT 0,
  `totalSpent` decimal(10,2) NOT NULL DEFAULT 0.00,
  `visitCount` int(11) NOT NULL DEFAULT 0,
  `lastVisit` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Customer_phone_key` (`phone`),
  UNIQUE KEY `Customer_hotelGuestId_key` (`hotelGuestId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer`
--

LOCK TABLES `customer` WRITE;
/*!40000 ALTER TABLE `customer` DISABLE KEYS */;
INSERT INTO `customer` VALUES ('cmm9cbuhl000is4vzc7e31eus','hotel-room-003-1772465725204','AMBROZIAK ROBERT',NULL,'Gość hotelowy, pokój 003','room-003-1772465725204',0,0.00,1,'2026-03-02 15:35:25.208','2026-03-02 15:35:25.208'),('cmm9cjufi000os4vzzu0f5kb5','hotel-room-003-1772466098377','AMBROZIAK ROBERT',NULL,'Gość hotelowy, pokój 003','room-003-1772466098377',0,0.00,1,'2026-03-02 15:41:38.381','2026-03-02 15:41:38.381'),('cmm9cnt7v000vs4vz6qlueaof','hotel-room-010-1772466283429','fffffff',NULL,'Gość hotelowy, pokój 010','room-010-1772466283429',0,0.00,1,'2026-03-02 15:44:43.434','2026-03-02 15:44:43.434'),('cmm9cob6p0014s4vz3114scdu','hotel-room-010-1772466306719','fffffff',NULL,'Gość hotelowy, pokój 010','room-010-1772466306719',0,0.00,1,'2026-03-02 15:45:06.720','2026-03-02 15:45:06.721'),('cmm9cp6tg001as4vz9gh3ni6v','hotel-room-010-1772466347713','fffffff',NULL,'Gość hotelowy, pokój 010','room-010-1772466347713',0,0.00,1,'2026-03-02 15:45:47.716','2026-03-02 15:45:47.716'),('cmm9cpfrb001gs4vzvmxf76cw','hotel-room-010-1772466359300','fffffff',NULL,'Gość hotelowy, pokój 010','room-010-1772466359300',0,0.00,1,'2026-03-02 15:45:59.303','2026-03-02 15:45:59.303'),('cmm9culcp001ms4vznd5uxitg','hotel-room-010-1772466599828','fffffff',NULL,'Gość hotelowy, pokój 010','room-010-1772466599828',0,0.00,1,'2026-03-02 15:49:59.832','2026-03-02 15:49:59.832'),('cmm9czshx001ss4vzm1zpre0m','hotel-room-010-1772466842368','fffffff',NULL,'Gość hotelowy, pokój 010','room-010-1772466842368',0,0.00,1,'2026-03-02 15:54:02.372','2026-03-02 15:54:02.372');
/*!40000 ALTER TABLE `customer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customerdisplay`
--

DROP TABLE IF EXISTS `customerdisplay`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customerdisplay` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `showLogo` tinyint(1) NOT NULL DEFAULT 1,
  `logoUrl` varchar(191) DEFAULT NULL,
  `backgroundColor` varchar(191) NOT NULL DEFAULT '#1a1a2e',
  `textColor` varchar(191) NOT NULL DEFAULT '#ffffff',
  `accentColor` varchar(191) NOT NULL DEFAULT '#e94560',
  `fontSize` int(11) NOT NULL DEFAULT 48,
  `maxOrders` int(11) NOT NULL DEFAULT 10,
  `showPreparingSection` tinyint(1) NOT NULL DEFAULT 1,
  `showReadySection` tinyint(1) NOT NULL DEFAULT 1,
  `readyTimeoutSec` int(11) NOT NULL DEFAULT 120,
  `soundOnReady` tinyint(1) NOT NULL DEFAULT 1,
  `soundUrl` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customerdisplay`
--

LOCK TABLES `customerdisplay` WRITE;
/*!40000 ALTER TABLE `customerdisplay` DISABLE KEYS */;
/*!40000 ALTER TABLE `customerdisplay` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dailyreport`
--

DROP TABLE IF EXISTS `dailyreport`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dailyreport` (
  `id` varchar(191) NOT NULL,
  `date` date NOT NULL,
  `totalGross` decimal(10,2) NOT NULL,
  `totalNet` decimal(10,2) NOT NULL,
  `vatBreakdownJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`vatBreakdownJson`)),
  `paymentBreakdownJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`paymentBreakdownJson`)),
  `receiptCount` int(11) NOT NULL,
  `invoiceCount` int(11) NOT NULL,
  `guestCount` int(11) NOT NULL,
  `avgTicket` decimal(10,2) NOT NULL,
  `cancelCount` int(11) NOT NULL DEFAULT 0,
  `cancelAmount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `generatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `DailyReport_date_key` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dailyreport`
--

LOCK TABLES `dailyreport` WRITE;
/*!40000 ALTER TABLE `dailyreport` DISABLE KEYS */;
/*!40000 ALTER TABLE `dailyreport` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deliverydriver`
--

DROP TABLE IF EXISTS `deliverydriver`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deliverydriver` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `vehicleType` varchar(191) DEFAULT NULL,
  `vehiclePlate` varchar(191) DEFAULT NULL,
  `phoneNumber` varchar(191) DEFAULT NULL,
  `isAvailable` tinyint(1) NOT NULL DEFAULT 1,
  `currentOrderId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `DeliveryDriver_userId_key` (`userId`),
  CONSTRAINT `DeliveryDriver_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deliverydriver`
--

LOCK TABLES `deliverydriver` WRITE;
/*!40000 ALTER TABLE `deliverydriver` DISABLE KEYS */;
INSERT INTO `deliverydriver` VALUES ('cmlwksypc001k50vzc516772m','cmlwksyp7001j50vzrihlng38','car',NULL,'500100200',1,NULL,'2026-02-21 17:11:40.464'),('cmlwksyra001m50vz3vy4d0k3','cmlwksyr6001l50vz4iqx25kb','scooter',NULL,'500200300',1,NULL,'2026-02-21 17:11:40.534'),('cmlwksyt7001o50vz4iesyhg3','cmlwksyt3001n50vzdcjkr1rk','bike',NULL,'500300400',0,NULL,'2026-02-21 17:11:40.602');
/*!40000 ALTER TABLE `deliverydriver` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deliverystreet`
--

DROP TABLE IF EXISTS `deliverystreet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deliverystreet` (
  `id` varchar(191) NOT NULL,
  `zoneId` varchar(191) NOT NULL,
  `streetName` varchar(191) NOT NULL,
  `numberFrom` int(11) DEFAULT NULL,
  `numberTo` int(11) DEFAULT NULL,
  `postalCode` varchar(191) DEFAULT NULL,
  `city` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `DeliveryStreet_streetName_idx` (`streetName`),
  KEY `DeliveryStreet_zoneId_idx` (`zoneId`),
  CONSTRAINT `DeliveryStreet_zoneId_fkey` FOREIGN KEY (`zoneId`) REFERENCES `deliveryzone` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deliverystreet`
--

LOCK TABLES `deliverystreet` WRITE;
/*!40000 ALTER TABLE `deliverystreet` DISABLE KEYS */;
/*!40000 ALTER TABLE `deliverystreet` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deliveryzone`
--

DROP TABLE IF EXISTS `deliveryzone`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deliveryzone` (
  `id` varchar(191) NOT NULL,
  `number` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `driverCommission` decimal(10,2) NOT NULL DEFAULT 0.00,
  `deliveryCost` decimal(10,2) NOT NULL DEFAULT 0.00,
  `minOrderForFreeDelivery` decimal(10,2) DEFAULT NULL,
  `estimatedMinutes` int(11) NOT NULL DEFAULT 30,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `DeliveryZone_number_key` (`number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deliveryzone`
--

LOCK TABLES `deliveryzone` WRITE;
/*!40000 ALTER TABLE `deliveryzone` DISABLE KEYS */;
INSERT INTO `deliveryzone` VALUES ('cmlwksymh001e50vz4gepax3c',1,'Centrum',0.00,0.00,50.00,20,1,1,'2026-02-21 17:11:40.361'),('cmlwksymm001f50vzssk6v8z7',2,'Obrzeża miasta',5.00,10.00,100.00,35,1,2,'2026-02-21 17:11:40.365'),('cmlwksymr001g50vzkop33kkt',3,'Przedmieścia',7.50,15.00,150.00,45,1,3,'2026-02-21 17:11:40.371'),('cmlwksymv001h50vzq2rvemc4',4,'Okolice (daleko)',12.50,25.00,200.00,60,1,4,'2026-02-21 17:11:40.375');
/*!40000 ALTER TABLE `deliveryzone` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `discount`
--

DROP TABLE IF EXISTS `discount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `discount` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `type` enum('PERCENT','AMOUNT','PROMO') NOT NULL,
  `value` decimal(10,2) NOT NULL,
  `maxPercent` decimal(5,2) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `validFrom` datetime(3) DEFAULT NULL,
  `validTo` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discount`
--

LOCK TABLES `discount` WRITE;
/*!40000 ALTER TABLE `discount` DISABLE KEYS */;
INSERT INTO `discount` VALUES ('cmlwksyky001450vz0blpamwh','Rabat 10%','PERCENT',10.00,NULL,1,NULL,NULL,'2026-02-21 17:11:40.306'),('cmlwksyl4001550vz04zrqw34','Rabat 20%','PERCENT',20.00,NULL,1,NULL,NULL,'2026-02-21 17:11:40.312'),('cmlwksyla001650vzmashwew3','Rabat 50 zł','AMOUNT',50.00,NULL,1,NULL,NULL,'2026-02-21 17:11:40.318'),('cmlwksylf001750vzw1mfh3y3','Rabat VIP','PERCENT',15.00,NULL,1,NULL,NULL,'2026-02-21 17:11:40.322'),('cmlwksylk001850vzvgkgb1g3','Kod promocyjny','PROMO',25.00,NULL,1,NULL,NULL,'2026-02-21 17:11:40.327');
/*!40000 ALTER TABLE `discount` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `driversettlement`
--

DROP TABLE IF EXISTS `driversettlement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `driversettlement` (
  `id` varchar(191) NOT NULL,
  `driverId` varchar(191) NOT NULL,
  `shiftDate` date NOT NULL,
  `totalDeliveries` int(11) NOT NULL DEFAULT 0,
  `totalValue` decimal(10,2) NOT NULL DEFAULT 0.00,
  `totalCommission` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cashCollected` decimal(10,2) NOT NULL DEFAULT 0.00,
  `status` enum('PENDING','SETTLED','DISPUTED') NOT NULL DEFAULT 'PENDING',
  `settledAt` datetime(3) DEFAULT NULL,
  `settledByUserId` varchar(191) DEFAULT NULL,
  `note` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `DriverSettlement_driverId_shiftDate_key` (`driverId`,`shiftDate`),
  KEY `DriverSettlement_shiftDate_idx` (`shiftDate`),
  CONSTRAINT `DriverSettlement_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `deliverydriver` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `driversettlement`
--

LOCK TABLES `driversettlement` WRITE;
/*!40000 ALTER TABLE `driversettlement` DISABLE KEYS */;
/*!40000 ALTER TABLE `driversettlement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_package_items`
--

DROP TABLE IF EXISTS `event_package_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `event_package_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `packageId` int(11) NOT NULL,
  `recipeDishId` int(11) NOT NULL,
  `portionsPerPerson` double NOT NULL DEFAULT 1,
  `notes` varchar(200) DEFAULT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `event_package_items_packageId_fkey` (`packageId`),
  KEY `event_package_items_recipeDishId_fkey` (`recipeDishId`),
  CONSTRAINT `event_package_items_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `event_packages` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `event_package_items_recipeDishId_fkey` FOREIGN KEY (`recipeDishId`) REFERENCES `recipes` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_package_items`
--

LOCK TABLES `event_package_items` WRITE;
/*!40000 ALTER TABLE `event_package_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_package_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `event_packages`
--

DROP TABLE IF EXISTS `event_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `event_packages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `eventType` enum('WESELE','CHRZCINY','KOMUNIA','URODZINY','KONFERENCJA','INNE') NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `notes` text DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `eventTypes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`eventTypes`)),
  `pricePerPerson` double DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `event_packages_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `event_packages`
--

LOCK TABLES `event_packages` WRITE;
/*!40000 ALTER TABLE `event_packages` DISABLE KEYS */;
/*!40000 ALTER TABLE `event_packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `events`
--

DROP TABLE IF EXISTS `events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `googleEventId` varchar(200) NOT NULL,
  `googleCalendarId` varchar(200) NOT NULL,
  `calendarName` varchar(100) NOT NULL,
  `eventType` enum('WESELE','POPRAWINY','CHRZCINY','KOMUNIA','URODZINY_ROCZNICA','STYPA','IMPREZA_FIRMOWA','CATERING','SPOTKANIE','SYLWESTER','INNE') NOT NULL,
  `title` varchar(500) NOT NULL,
  `description` text DEFAULT NULL,
  `googleEventUrl` varchar(500) DEFAULT NULL,
  `startDate` datetime(3) NOT NULL,
  `endDate` datetime(3) NOT NULL,
  `roomName` varchar(100) DEFAULT NULL,
  `guestCount` int(11) DEFAULT NULL,
  `guestCountSource` enum('PARSED','MANUAL') NOT NULL DEFAULT 'MANUAL',
  `packageId` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('DRAFT','CONFIRMED','CANCELLED') NOT NULL DEFAULT 'DRAFT',
  `syncedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `events_googleEventId_key` (`googleEventId`),
  KEY `events_startDate_idx` (`startDate`),
  KEY `events_eventType_idx` (`eventType`),
  KEY `events_status_idx` (`status`),
  KEY `events_packageId_fkey` (`packageId`),
  CONSTRAINT `events_packageId_fkey` FOREIGN KEY (`packageId`) REFERENCES `event_packages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `events`
--

LOCK TABLES `events` WRITE;
/*!40000 ALTER TABLE `events` DISABLE KEYS */;
/*!40000 ALTER TABLE `events` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `exportbatch`
--

DROP TABLE IF EXISTS `exportbatch`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `exportbatch` (
  `id` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `dateFrom` datetime(3) NOT NULL,
  `dateTo` datetime(3) NOT NULL,
  `filePath` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `exportbatch`
--

LOCK TABLES `exportbatch` WRITE;
/*!40000 ALTER TABLE `exportbatch` DISABLE KEYS */;
/*!40000 ALTER TABLE `exportbatch` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fiscalevent`
--

DROP TABLE IF EXISTS `fiscalevent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `fiscalevent` (
  `id` varchar(191) NOT NULL,
  `orderId` varchar(191) DEFAULT NULL,
  `paymentId` varchar(191) DEFAULT NULL,
  `type` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `payloadJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`payloadJson`)),
  `fiscalNumber` varchar(191) DEFAULT NULL,
  `errorMessage` varchar(191) DEFAULT NULL,
  `retryCount` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FiscalEvent_orderId_createdAt_idx` (`orderId`,`createdAt`),
  KEY `FiscalEvent_status_createdAt_idx` (`status`,`createdAt`),
  KEY `FiscalEvent_type_status_idx` (`type`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fiscalevent`
--

LOCK TABLES `fiscalevent` WRITE;
/*!40000 ALTER TABLE `fiscalevent` DISABLE KEYS */;
/*!40000 ALTER TABLE `fiscalevent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `giftvoucher`
--

DROP TABLE IF EXISTS `giftvoucher`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `giftvoucher` (
  `id` varchar(191) NOT NULL,
  `code` varchar(191) NOT NULL,
  `initialValue` decimal(10,2) NOT NULL,
  `balance` decimal(10,2) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `expiresAt` datetime(3) DEFAULT NULL,
  `soldByUserId` varchar(191) DEFAULT NULL,
  `customerName` varchar(191) DEFAULT NULL,
  `note` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `GiftVoucher_code_key` (`code`),
  KEY `GiftVoucher_soldByUserId_fkey` (`soldByUserId`),
  CONSTRAINT `GiftVoucher_soldByUserId_fkey` FOREIGN KEY (`soldByUserId`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `giftvoucher`
--

LOCK TABLES `giftvoucher` WRITE;
/*!40000 ALTER TABLE `giftvoucher` DISABLE KEYS */;
INSERT INTO `giftvoucher` VALUES ('cmlwksylr001950vz5jv4k5hc','BON100',100.00,100.00,1,'2027-02-21 17:11:40.334',NULL,NULL,NULL,'2026-02-21 17:11:40.334'),('cmlwksylx001a50vz1z3fs593','BON200',200.00,200.00,1,'2027-02-21 17:11:40.340',NULL,NULL,NULL,'2026-02-21 17:11:40.341'),('cmlwksym2001b50vzn1ijn2h7','BON500',500.00,500.00,1,'2027-02-21 17:11:40.345',NULL,NULL,NULL,'2026-02-21 17:11:40.346'),('cmlwksym6001c50vzbth64f25','TESTBON50',50.00,50.00,1,'2027-02-21 17:11:40.349',NULL,NULL,NULL,'2026-02-21 17:11:40.350'),('cmlwksyma001d50vzw6119jp4','ZEROSALDO',100.00,0.00,1,'2027-02-21 17:11:40.353',NULL,NULL,NULL,'2026-02-21 17:11:40.354');
/*!40000 ALTER TABLE `giftvoucher` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ingredient`
--

DROP TABLE IF EXISTS `ingredient`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ingredient` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `unit` varchar(191) NOT NULL,
  `category` varchar(191) DEFAULT NULL,
  `defaultSupplier` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ingredient`
--

LOCK TABLES `ingredient` WRITE;
/*!40000 ALTER TABLE `ingredient` DISABLE KEYS */;
INSERT INTO `ingredient` VALUES ('cmlw9tkei002sv8vzmkikstoj','Schab wieprzowy','kg','Mięso','Dostawca ABC'),('cmlw9tkem002tv8vzrrkwu7gp','Ziemniaki','kg','Warzywa','Dostawca ABC'),('cmlw9tkep002uv8vzwowu4iy6','Bułka tarta','kg','Suche',NULL),('cmlw9tkes002vv8vz0ar0so3h','Olej','l','Tłuszcze',NULL),('cmlw9tkew002wv8vzl3sndxbo','Piwo jasne','szt','Napoje','Browar X');
/*!40000 ALTER TABLE `ingredient` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice`
--

DROP TABLE IF EXISTS `invoice`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invoice` (
  `id` varchar(191) NOT NULL,
  `invoiceNumber` varchar(191) NOT NULL,
  `type` enum('STANDARD','ADVANCE','FINAL','CORRECTION') NOT NULL,
  `orderId` varchar(191) DEFAULT NULL,
  `banquetEventId` varchar(191) DEFAULT NULL,
  `buyerNip` varchar(191) DEFAULT NULL,
  `buyerName` varchar(191) DEFAULT NULL,
  `buyerAddress` varchar(191) DEFAULT NULL,
  `itemsJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`itemsJson`)),
  `netTotal` decimal(10,2) NOT NULL,
  `vatTotal` decimal(10,2) NOT NULL,
  `grossTotal` decimal(10,2) NOT NULL,
  `paymentMethod` varchar(191) DEFAULT NULL,
  `saleDate` datetime(3) NOT NULL,
  `issueDate` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `dueDate` datetime(3) DEFAULT NULL,
  `ksefRefNumber` varchar(191) DEFAULT NULL,
  `ksefStatus` enum('PENDING','SENT','ACCEPTED','REJECTED','OFFLINE_QUEUED') NOT NULL DEFAULT 'PENDING',
  `ksefErrorMessage` varchar(191) DEFAULT NULL,
  `relatedInvoiceId` varchar(191) DEFAULT NULL,
  `correctionReason` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Invoice_invoiceNumber_key` (`invoiceNumber`),
  KEY `Invoice_orderId_fkey` (`orderId`),
  KEY `Invoice_banquetEventId_fkey` (`banquetEventId`),
  CONSTRAINT `Invoice_banquetEventId_fkey` FOREIGN KEY (`banquetEventId`) REFERENCES `banquetevent` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Invoice_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice`
--

LOCK TABLES `invoice` WRITE;
/*!40000 ALTER TABLE `invoice` DISABLE KEYS */;
INSERT INTO `invoice` VALUES ('cmmb3v102000b10vzdog4oz13','FV/2026/03/0001','STANDARD','cmm9gkiz20000novzbdghrp9e',NULL,'5213000458','Test Sp. z o.o.','ul. Testowa 1, 00-001 Warszawa','[]',0.00,0.00,0.00,NULL,'2026-03-03 21:13:55.916','2026-03-03 21:13:55.916','2026-03-17 21:13:55.916',NULL,'PENDING',NULL,NULL,NULL,'2026-03-03 21:13:55.921');
/*!40000 ALTER TABLE `invoice` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kdsloadsnapshot`
--

DROP TABLE IF EXISTS `kdsloadsnapshot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kdsloadsnapshot` (
  `id` varchar(191) NOT NULL,
  `stationId` varchar(191) DEFAULT NULL,
  `pendingCount` int(11) NOT NULL DEFAULT 0,
  `inProgressCount` int(11) NOT NULL DEFAULT 0,
  `readyCount` int(11) NOT NULL DEFAULT 0,
  `totalActive` int(11) NOT NULL DEFAULT 0,
  `timestamp` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `KDSLoadSnapshot_timestamp_idx` (`timestamp`),
  KEY `KDSLoadSnapshot_stationId_timestamp_idx` (`stationId`,`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kdsloadsnapshot`
--

LOCK TABLES `kdsloadsnapshot` WRITE;
/*!40000 ALTER TABLE `kdsloadsnapshot` DISABLE KEYS */;
/*!40000 ALTER TABLE `kdsloadsnapshot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kdsorderarchive`
--

DROP TABLE IF EXISTS `kdsorderarchive`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kdsorderarchive` (
  `id` varchar(191) NOT NULL,
  `stationId` varchar(191) NOT NULL,
  `orderId` varchar(191) NOT NULL,
  `orderNumber` int(11) NOT NULL,
  `tableNumber` int(11) DEFAULT NULL,
  `waiterName` varchar(191) DEFAULT NULL,
  `itemsJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`itemsJson`)),
  `receivedAt` datetime(3) NOT NULL,
  `completedAt` datetime(3) NOT NULL,
  `totalPrepTime` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `KDSOrderArchive_stationId_createdAt_idx` (`stationId`,`createdAt`),
  KEY `KDSOrderArchive_orderId_idx` (`orderId`),
  CONSTRAINT `KDSOrderArchive_stationId_fkey` FOREIGN KEY (`stationId`) REFERENCES `kdsstation` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kdsorderarchive`
--

LOCK TABLES `kdsorderarchive` WRITE;
/*!40000 ALTER TABLE `kdsorderarchive` DISABLE KEYS */;
/*!40000 ALTER TABLE `kdsorderarchive` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kdsstation`
--

DROP TABLE IF EXISTS `kdsstation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kdsstation` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `displayOrder` int(11) NOT NULL DEFAULT 0,
  `autoScrollNew` tinyint(1) NOT NULL DEFAULT 1,
  `confirmBeforeStatus` tinyint(1) NOT NULL DEFAULT 0,
  `removeOnConfirm` tinyint(1) NOT NULL DEFAULT 1,
  `requireAllConfirm` tinyint(1) NOT NULL DEFAULT 0,
  `showDescription` tinyint(1) NOT NULL DEFAULT 0,
  `showOrderNumber` tinyint(1) NOT NULL DEFAULT 1,
  `showTableNumber` tinyint(1) NOT NULL DEFAULT 1,
  `showWaiterName` tinyint(1) NOT NULL DEFAULT 1,
  `udpBroadcast` tinyint(1) NOT NULL DEFAULT 0,
  `udpHost` varchar(191) DEFAULT NULL,
  `udpPort` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kdsstation`
--

LOCK TABLES `kdsstation` WRITE;
/*!40000 ALTER TABLE `kdsstation` DISABLE KEYS */;
INSERT INTO `kdsstation` VALUES ('cmlw9tkfs0032v8vz39jbcxtw','Kuchnia Ciepła',1,1,0,1,0,0,1,1,1,0,NULL,NULL),('cmlw9tkge0033v8vzfiada6yu','Kuchnia Zimna',2,1,0,1,0,0,1,1,1,0,NULL,NULL),('cmlw9tkgp0034v8vzb1n40nb7','Bar',3,1,0,1,0,0,1,1,1,0,NULL,NULL);
/*!40000 ALTER TABLE `kdsstation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kdsstationcategory`
--

DROP TABLE IF EXISTS `kdsstationcategory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kdsstationcategory` (
  `stationId` varchar(191) NOT NULL,
  `categoryId` varchar(191) NOT NULL,
  PRIMARY KEY (`stationId`,`categoryId`),
  KEY `KDSStationCategory_categoryId_fkey` (`categoryId`),
  CONSTRAINT `KDSStationCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `KDSStationCategory_stationId_fkey` FOREIGN KEY (`stationId`) REFERENCES `kdsstation` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kdsstationcategory`
--

LOCK TABLES `kdsstationcategory` WRITE;
/*!40000 ALTER TABLE `kdsstationcategory` DISABLE KEYS */;
INSERT INTO `kdsstationcategory` VALUES ('cmlw9tkfs0032v8vz39jbcxtw','cmlw9tk7g001tv8vzugmgx7dk'),('cmlw9tkfs0032v8vz39jbcxtw','cmlw9tk7o001vv8vz35zzqk08'),('cmlw9tkfs0032v8vz39jbcxtw','cmlw9tk7s001wv8vzv5y52kk5'),('cmlw9tkfs0032v8vz39jbcxtw','cmlw9tk7w001xv8vzbv4hyg7a'),('cmlw9tkge0033v8vzfiada6yu','cmlw9tk7c001sv8vz0zfudvlx'),('cmlw9tkge0033v8vzfiada6yu','cmlw9tk80001yv8vznb7pt8oj'),('cmlw9tkgp0034v8vzb1n40nb7','cmm9g85wt0001ckvzkullwb85'),('cmlw9tkgp0034v8vzb1n40nb7','cmm9gc37v00009kvzywt4v2zz'),('cmlw9tkgp0034v8vzb1n40nb7','cmm9gc38r00019kvz7knfwydq');
/*!40000 ALTER TABLE `kdsstationcategory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kitchenmessage`
--

DROP TABLE IF EXISTS `kitchenmessage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `kitchenmessage` (
  `id` varchar(191) NOT NULL,
  `orderId` varchar(191) DEFAULT NULL,
  `tableId` varchar(191) DEFAULT NULL,
  `message` varchar(191) NOT NULL,
  `readAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kitchenmessage`
--

LOCK TABLES `kitchenmessage` WRITE;
/*!40000 ALTER TABLE `kitchenmessage` DISABLE KEYS */;
/*!40000 ALTER TABLE `kitchenmessage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loyaltyreward`
--

DROP TABLE IF EXISTS `loyaltyreward`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `loyaltyreward` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `pointsCost` int(11) NOT NULL,
  `rewardType` varchar(191) NOT NULL,
  `rewardValue` decimal(10,2) NOT NULL DEFAULT 0.00,
  `productId` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loyaltyreward`
--

LOCK TABLES `loyaltyreward` WRITE;
/*!40000 ALTER TABLE `loyaltyreward` DISABLE KEYS */;
/*!40000 ALTER TABLE `loyaltyreward` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `loyaltytransaction`
--

DROP TABLE IF EXISTS `loyaltytransaction`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `loyaltytransaction` (
  `id` varchar(191) NOT NULL,
  `customerId` varchar(191) NOT NULL,
  `points` int(11) NOT NULL,
  `type` enum('EARNED','REDEEMED','ADJUSTMENT','EXPIRED') NOT NULL,
  `orderId` varchar(191) DEFAULT NULL,
  `description` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `LoyaltyTransaction_customerId_fkey` (`customerId`),
  CONSTRAINT `LoyaltyTransaction_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `loyaltytransaction`
--

LOCK TABLES `loyaltytransaction` WRITE;
/*!40000 ALTER TABLE `loyaltytransaction` DISABLE KEYS */;
/*!40000 ALTER TABLE `loyaltytransaction` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modifier`
--

DROP TABLE IF EXISTS `modifier`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `modifier` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `priceDelta` decimal(10,2) NOT NULL DEFAULT 0.00,
  `groupId` varchar(191) NOT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `Modifier_groupId_fkey` (`groupId`),
  CONSTRAINT `Modifier_groupId_fkey` FOREIGN KEY (`groupId`) REFERENCES `modifiergroup` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modifier`
--

LOCK TABLES `modifier` WRITE;
/*!40000 ALTER TABLE `modifier` DISABLE KEYS */;
INSERT INTO `modifier` VALUES ('cmlwablvg003rm0vz0hd4vms9','Rare (krwisty)',0.00,'cmlwablvb003qm0vzhup401mr',1),('cmlwablvj003sm0vzn3wtin6t','Medium rare',0.00,'cmlwablvb003qm0vzhup401mr',2),('cmlwablvn003tm0vzc0k4jtn3','Medium',0.00,'cmlwablvb003qm0vzhup401mr',3),('cmlwablvs003um0vz9xznqpdm','Medium well',0.00,'cmlwablvb003qm0vzhup401mr',4),('cmlwablvv003vm0vzhd5b3nm9','Well done (wysmażony)',0.00,'cmlwablvb003qm0vzhup401mr',5),('cmlwablw1003xm0vz3oqkdho7','Frytki',8.00,'cmlwablvy003wm0vz6dex47o6',1),('cmlwablw6003ym0vzb6oyvbat','Ziemniaki opiekane',8.00,'cmlwablvy003wm0vz6dex47o6',2),('cmlwablwa003zm0vzncombrfs','Ziemniaki puree',8.00,'cmlwablvy003wm0vz6dex47o6',3),('cmlwablwe0040m0vzwi9xt07d','Ryż',6.00,'cmlwablvy003wm0vz6dex47o6',4),('cmlwablwh0041m0vz0wwttgwf','Kasza gryczana',6.00,'cmlwablvy003wm0vz6dex47o6',5),('cmlwablwm0042m0vzh34y3l36','Warzywa grillowane',10.00,'cmlwablvy003wm0vz6dex47o6',6),('cmlwablwr0043m0vzfwxzcib3','Surówka z kapusty',5.00,'cmlwablvy003wm0vz6dex47o6',7),('cmlwablwv0044m0vzo3zu397b','Surówka z marchewki',5.00,'cmlwablvy003wm0vz6dex47o6',8),('cmlwablwz0045m0vzyape534d','Mix sałat',8.00,'cmlwablvy003wm0vz6dex47o6',9),('cmlwablx50046m0vzh7jc4k9y','Buraki',5.00,'cmlwablvy003wm0vz6dex47o6',10),('cmlwablxc0048m0vzlkc1k0wo','Sos pieprzowy',6.00,'cmlwablx90047m0vzi0f2uwh4',1),('cmlwablxf0049m0vz5u6fthh6','Sos grzybowy',6.00,'cmlwablx90047m0vzi0f2uwh4',2),('cmlwablxl004am0vz07aplytm','Sos czosnkowy',4.00,'cmlwablx90047m0vzi0f2uwh4',3),('cmlwablxp004bm0vzso0kzbjs','Sos tatarski',4.00,'cmlwablx90047m0vzi0f2uwh4',4),('cmlwablxt004cm0vzka1kzftm','Sos BBQ',4.00,'cmlwablx90047m0vzi0f2uwh4',5),('cmlwablxw004dm0vzxqwp3eve','Sos miodowo-musztardowy',5.00,'cmlwablx90047m0vzi0f2uwh4',6),('cmlwably1004em0vzg3bdqhck','Masło czosnkowe',5.00,'cmlwablx90047m0vzi0f2uwh4',7),('cmlwably7004gm0vz4ti4tfhw','Ze skwarkami',4.00,'cmlwably4004fm0vz1vsuj0xi',1),('cmlwablyb004hm0vzed5tbysl','Ze śmietaną',3.00,'cmlwably4004fm0vz1vsuj0xi',2),('cmlwablyg004im0vzzuka3whs','Z cebulką',3.00,'cmlwably4004fm0vz1vsuj0xi',3),('cmlwablyn004km0vzjbzfvrcy','Mleko krowie',0.00,'cmlwablyk004jm0vzm4ba67kj',1),('cmlwablyr004lm0vz7s2ymy99','Mleko owsiane',3.00,'cmlwablyk004jm0vzm4ba67kj',2),('cmlwablyu004mm0vz8nkgg7pd','Mleko sojowe',3.00,'cmlwablyk004jm0vzm4ba67kj',3),('cmlwablyy004nm0vz49zoi9sn','Mleko migdałowe',4.00,'cmlwablyk004jm0vzm4ba67kj',4);
/*!40000 ALTER TABLE `modifier` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modifiergroup`
--

DROP TABLE IF EXISTS `modifiergroup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `modifiergroup` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `minSelect` int(11) NOT NULL DEFAULT 0,
  `maxSelect` int(11) NOT NULL DEFAULT 1,
  `isRequired` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modifiergroup`
--

LOCK TABLES `modifiergroup` WRITE;
/*!40000 ALTER TABLE `modifiergroup` DISABLE KEYS */;
INSERT INTO `modifiergroup` VALUES ('cmlwablvb003qm0vzhup401mr','Stopień wysmażenia',0,1,0),('cmlwablvy003wm0vz6dex47o6','Dodatki',0,3,0),('cmlwablx90047m0vzi0f2uwh4','Sosy',0,2,0),('cmlwably4004fm0vz1vsuj0xi','Opcje pierogów',0,1,0),('cmlwablyk004jm0vzm4ba67kj','Rodzaj mleka',0,1,0);
/*!40000 ALTER TABLE `modifiergroup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `title` varchar(191) NOT NULL,
  `body` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `entityId` varchar(191) DEFAULT NULL,
  `readAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `Notification_userId_readAt_idx` (`userId`,`readAt`),
  KEY `Notification_userId_createdAt_idx` (`userId`,`createdAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `onlinepayment`
--

DROP TABLE IF EXISTS `onlinepayment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `onlinepayment` (
  `id` varchar(191) NOT NULL,
  `orderId` varchar(191) NOT NULL,
  `provider` varchar(191) NOT NULL,
  `transactionId` varchar(191) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `tipAmount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `totalCharged` decimal(10,2) NOT NULL,
  `currency` varchar(191) NOT NULL DEFAULT 'PLN',
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `itemsJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`itemsJson`)),
  `customerEmail` varchar(191) DEFAULT NULL,
  `customerPhone` varchar(191) DEFAULT NULL,
  `receiptToken` varchar(191) DEFAULT NULL,
  `providerResponse` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`providerResponse`)),
  `errorMessage` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `completedAt` datetime(3) DEFAULT NULL,
  `expiresAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `OnlinePayment_transactionId_key` (`transactionId`),
  UNIQUE KEY `OnlinePayment_receiptToken_key` (`receiptToken`),
  KEY `OnlinePayment_orderId_idx` (`orderId`),
  KEY `OnlinePayment_status_createdAt_idx` (`status`,`createdAt`),
  CONSTRAINT `OnlinePayment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `onlinepayment`
--

LOCK TABLES `onlinepayment` WRITE;
/*!40000 ALTER TABLE `onlinepayment` DISABLE KEYS */;
/*!40000 ALTER TABLE `onlinepayment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order`
--

DROP TABLE IF EXISTS `order`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order` (
  `id` varchar(191) NOT NULL,
  `orderNumber` int(11) NOT NULL DEFAULT 1,
  `tableId` varchar(191) DEFAULT NULL,
  `roomId` varchar(191) DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `customerId` varchar(191) DEFAULT NULL,
  `status` enum('OPEN','SENT_TO_KITCHEN','IN_PROGRESS','READY','SERVED','BILL_REQUESTED','CLOSED','CANCELLED') NOT NULL DEFAULT 'OPEN',
  `type` enum('DINE_IN','TAKEAWAY','BANQUET','PHONE','DELIVERY','HOTEL_ROOM') NOT NULL DEFAULT 'DINE_IN',
  `guestCount` int(11) NOT NULL DEFAULT 1,
  `banquetEventId` varchar(191) DEFAULT NULL,
  `discountJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`discountJson`)),
  `note` varchar(191) DEFAULT NULL,
  `courseReleasedUpTo` int(11) NOT NULL DEFAULT 1,
  `deliveryPhone` varchar(191) DEFAULT NULL,
  `deliveryAddress` varchar(191) DEFAULT NULL,
  `deliveryStatus` enum('PENDING','PREPARING','READY_FOR_PICKUP','OUT_FOR_DELIVERY','DELIVERED','CANCELLED') DEFAULT NULL,
  `deliveryNote` varchar(191) DEFAULT NULL,
  `estimatedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `closedAt` datetime(3) DEFAULT NULL,
  `itemCount` int(11) NOT NULL DEFAULT 0,
  `lastInteractionAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `totalGross` decimal(10,2) NOT NULL DEFAULT 0.00,
  `assignedDriverId` varchar(191) DEFAULT NULL,
  `closedButVisible` tinyint(1) NOT NULL DEFAULT 0,
  `copiedFromId` varchar(191) DEFAULT NULL,
  `deliveredAt` datetime(3) DEFAULT NULL,
  `deliveryCost` decimal(10,2) DEFAULT NULL,
  `deliveryZoneId` varchar(191) DEFAULT NULL,
  `driverCommission` decimal(10,2) DEFAULT NULL,
  `maxTotal` decimal(10,2) DEFAULT NULL,
  `onlinePaymentStatus` enum('UNPAID','PARTIAL','PENDING','PAID') NOT NULL DEFAULT 'UNPAID',
  PRIMARY KEY (`id`),
  KEY `Order_roomId_fkey` (`roomId`),
  KEY `Order_userId_fkey` (`userId`),
  KEY `Order_customerId_fkey` (`customerId`),
  KEY `Order_banquetEventId_fkey` (`banquetEventId`),
  KEY `Order_tableId_status_idx` (`tableId`,`status`),
  KEY `Order_status_createdAt_idx` (`status`,`createdAt`),
  KEY `Order_deliveryZoneId_fkey` (`deliveryZoneId`),
  CONSTRAINT `Order_banquetEventId_fkey` FOREIGN KEY (`banquetEventId`) REFERENCES `banquetevent` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Order_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Order_deliveryZoneId_fkey` FOREIGN KEY (`deliveryZoneId`) REFERENCES `deliveryzone` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Order_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Order_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `table` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Order_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order`
--

LOCK TABLES `order` WRITE;
/*!40000 ALTER TABLE `order` DISABLE KEYS */;
INSERT INTO `order` VALUES ('cmlwa6u1700009ovz8d8rjcgk',1,'cmlw9tk3z000wv8vzip00173d',NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 12:14:31.819','2026-03-02 09:00:53.000',0,'2026-02-21 14:04:00.027',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwaeajc00019ovzm028fkmj',2,'cmlw9tk43000xv8vz9202i9vd',NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 12:20:19.800','2026-03-02 09:00:53.000',0,'2026-02-21 14:04:00.027',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwdctxl0000awvzgzcvjvzc',3,'cmlw9tk3u000vv8vzogr5966a',NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 13:43:10.473','2026-03-02 09:00:53.000',2,'2026-02-21 13:43:22.990',66.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwksytl001p50vzrnio0dlt',1,'cmlwksy3v000550vzzhvbyjey','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:11:40.617','2026-02-22 14:31:53.352',0,'2026-02-21 17:11:40.617',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwl7ok10000d4vz3zbgbkmy',4,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:23:07.151','2026-03-01 20:39:36.729',0,'2026-02-21 17:23:07.151',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwl8ar50001d4vze8b0xzsu',5,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:23:35.920','2026-03-01 20:39:36.729',0,'2026-02-21 17:23:35.920',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwl8med0002d4vzmlidm57w',6,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:23:51.013','2026-03-01 20:39:36.729',0,'2026-02-21 17:23:51.013',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwl9k4h0003d4vzdsa47p8x',7,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:24:34.720','2026-03-01 20:39:36.729',0,'2026-02-21 17:24:34.720',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwl9vjd0004d4vzoy9lkuwd',8,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:24:49.512','2026-03-01 20:39:36.729',0,'2026-02-21 17:24:49.512',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwld2b70005d4vz0h1pe1km',9,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:27:18.258','2026-03-01 20:39:36.729',0,'2026-02-21 17:27:18.258',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwld4ow0006d4vzr2kfquuw',10,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:27:21.343','2026-03-01 20:39:36.729',0,'2026-02-21 17:27:21.343',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwld6ug0007d4vztebwy3xh',11,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,'{\"type\":\"AMOUNT\",\"value\":20}',NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:27:24.136','2026-03-01 20:39:36.729',0,'2026-02-21 17:27:24.136',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwld7g8000ad4vzmpl1elpj',12,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:27:24.920','2026-03-01 20:39:36.729',0,'2026-02-21 17:27:24.920',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwld7tn000cd4vzsr6rjldy',13,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:27:25.403','2026-03-01 20:39:36.729',0,'2026-02-21 17:27:25.403',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwld93s000dd4vzs3at1tuk',14,'cmlwksy40000650vzb3qzfrb8','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:27:27.064','2026-02-22 15:32:48.113',0,'2026-02-21 17:27:27.064',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwld958000ed4vzsz1jjyi7',15,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:27:27.115','2026-03-01 20:39:36.729',0,'2026-02-21 17:27:27.115',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwld9ko000fd4vzkna5rbfx',16,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:27:27.671','2026-03-01 20:39:36.729',0,'2026-02-21 17:27:27.671',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwldk95000gd4vzepzqlbp9',17,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:27:41.512','2026-03-01 20:39:36.729',0,'2026-02-21 17:27:41.512',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwldksp000hd4vzfzqr3zo5',18,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:27:42.216','2026-03-01 20:39:36.729',0,'2026-02-21 17:27:42.216',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwldlbo000id4vzdg6wywbu',19,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,'{\"type\":\"AMOUNT\",\"value\":20}',NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:27:42.898','2026-03-01 20:39:36.729',0,'2026-02-21 17:27:42.898',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwldlwa000ld4vz9u3m55r7',20,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:27:43.642','2026-03-01 20:39:36.729',0,'2026-02-21 17:27:43.642',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwldn61000md4vz5pq8qpu7',21,'cmlwksy44000750vzoutnwolj','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:27:45.289','2026-02-22 15:32:53.905',0,'2026-02-21 17:27:45.289',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwldn7x000nd4vzow0ai8u7',22,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:27:45.356','2026-03-01 20:39:36.729',0,'2026-02-21 17:27:45.356',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwldnye000od4vzx0q1qvou',23,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:27:46.310','2026-03-01 20:39:36.729',0,'2026-02-21 17:27:46.310',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwldqgx000pd4vz4xkhf9zn',24,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:27:49.568','2026-03-01 20:39:36.729',0,'2026-02-21 17:27:49.568',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlemaj000rd4vzu99x7sxs',25,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,'{\"type\":\"AMOUNT\",\"value\":20}',NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:28:30.810','2026-03-01 20:39:36.729',0,'2026-02-21 17:28:30.810',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlemxk000ud4vz0cvxtirj',26,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:28:31.640','2026-03-01 20:39:36.729',0,'2026-02-21 17:28:31.640',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwleneq000vd4vzatz0jdtc',27,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:28:32.258','2026-03-01 20:39:36.729',0,'2026-02-21 17:28:32.258',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwleodn000wd4vz2ikv0jg0',28,'cmlwksy4a000850vzrolh31dr','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:28:33.515','2026-02-22 15:32:55.963',0,'2026-02-21 17:28:33.515',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwleofe000xd4vzfbazybt1',29,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:28:33.578','2026-03-01 20:39:36.729',0,'2026-02-21 17:28:33.578',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwleotk000yd4vzovej17r7',30,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:28:34.087','2026-03-01 20:39:36.729',0,'2026-02-21 17:28:34.087',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwleqt4000zd4vz6khpi8w8',31,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:28:36.664','2026-03-01 20:39:36.729',0,'2026-02-21 17:28:36.664',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwler6t0011d4vzwicm1v04',32,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:28:37.157','2026-03-01 20:39:36.729',0,'2026-02-21 17:28:37.157',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlf7vl0012d4vz0deym5m6',33,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:28:58.785','2026-03-01 20:39:36.729',0,'2026-02-21 17:28:58.785',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlf8tj0013d4vz9tsbzxny',34,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:29:00.006','2026-03-01 20:39:36.729',0,'2026-02-21 17:29:00.006',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlf98o0014d4vzo133paba',35,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,'{\"type\":\"AMOUNT\",\"value\":20}',NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:29:00.551','2026-03-01 20:39:36.729',0,'2026-02-21 17:29:00.551',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlfabf0017d4vzvi6u6tdc',36,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:29:01.947','2026-03-01 20:39:36.729',0,'2026-02-21 17:29:01.947',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlfavu0018d4vzzg13ngaq',37,'cmlwksy4f000950vziw227q0y','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:29:02.682','2026-02-22 15:32:58.112',0,'2026-02-21 17:29:02.682',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlfax90019d4vz7nzjt4zt',38,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:29:02.732','2026-03-01 20:39:36.729',0,'2026-02-21 17:29:02.732',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlfbva001ad4vzp076e1kc',39,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:29:03.958','2026-03-01 20:39:36.729',0,'2026-02-21 17:29:03.958',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlfdgu001cd4vz0swpox1z',40,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:29:06.029','2026-03-01 20:39:36.729',0,'2026-02-21 17:29:06.029',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlfl7f001dd4vzco7rcyg0',41,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,'{\"type\":\"AMOUNT\",\"value\":20}',NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:29:16.059','2026-03-01 20:39:36.729',0,'2026-02-21 17:29:16.059',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlfls1001gd4vzviem1iec',42,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:29:16.800','2026-03-01 20:39:36.729',0,'2026-02-21 17:29:16.800',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlfmbx001hd4vz8pv9v9dl',43,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:29:17.517','2026-03-01 20:39:36.729',0,'2026-02-21 17:29:17.517',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlfmyc001id4vz94eg9ny5',44,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:29:18.323','2026-03-01 20:39:36.729',0,'2026-02-21 17:29:18.323',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlfnt1001jd4vzjq6o5g9y',45,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:29:19.429','2026-03-01 20:39:36.729',0,'2026-02-21 17:29:19.429',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlfo8b001ld4vzbbw3uq0w',46,'cmlwksy4k000a50vzajzwbrwl','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:29:19.979','2026-02-22 15:32:59.884',0,'2026-02-21 17:29:19.979',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlfo9p001md4vzo8fugnzo',47,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:29:20.028','2026-03-01 20:39:36.729',0,'2026-02-21 17:29:20.028',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlfor9001nd4vzdff63ld2',48,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:29:20.661','2026-03-01 20:39:36.729',0,'2026-02-21 17:29:20.661',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlgl0q001od4vzx5mzzqwt',49,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,'{\"type\":\"AMOUNT\",\"value\":20}',NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:30:02.474','2026-03-01 20:39:36.729',0,'2026-02-21 17:30:02.474',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlgljg001rd4vz7wfq1c16',50,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:30:03.148','2026-03-01 20:39:36.729',0,'2026-02-21 17:30:03.148',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlgm47001sd4vz4fuawejc',51,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:30:03.895','2026-03-01 20:39:36.729',0,'2026-02-21 17:30:03.895',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlgnfa001td4vz1f1wkc82',52,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:30:05.589','2026-03-01 20:39:36.729',0,'2026-02-21 17:30:05.589',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlgom7001ud4vz1s8u6gav',53,'cmlwksy4q000b50vzbs71mhow','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:30:07.135','2026-02-22 14:54:27.473',0,'2026-02-21 17:30:07.135',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlgop8001vd4vzgosyehh7',54,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:30:07.243','2026-03-01 20:39:36.729',0,'2026-02-21 17:30:07.243',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlgpt9001wd4vzzshkeboj',55,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:30:08.684','2026-03-01 20:39:36.729',0,'2026-02-21 17:30:08.684',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlwlgqts001yd4vz7gh5l3p8',56,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-21 17:30:10.000','2026-03-01 20:39:36.729',0,'2026-02-21 17:30:10.000',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxde7wm0000u0vz2obsxlob',57,'cmlwksy4v000c50vzwsjiy9cc','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 06:32:01.414','2026-02-22 14:54:29.206',0,'2026-02-22 06:32:01.414',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxev9nk0000ckvzf8du0h6o',58,'cmlwksy4z000d50vzwoffibas','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 07:13:16.448','2026-02-22 14:54:30.930',0,'2026-02-22 07:13:16.448',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxgc5ni000024vzvvq2h5j2',59,'cmlwksy54000e50vz4nhozsph','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 07:54:24.030','2026-02-22 15:33:06.488',0,'2026-02-22 07:54:24.030',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxgnje8000124vz4kuwg2sp',60,'cmlwksy57000f50vzv6q63fyb','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 08:03:15.056','2026-02-22 15:33:04.387',0,'2026-02-22 08:03:15.056',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxi76q4000074vz5mbaq9em',61,'cmlwksy5f000h50vzej2bj1h8','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',3,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 08:46:31.372','2026-02-22 14:54:24.941',0,'2026-02-22 08:46:31.372',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxka8i9001d74vzs90ua4hj',62,'cmlwksy5j000i50vz7czosrdp','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 09:44:52.881','2026-02-22 14:54:17.481',0,'2026-02-22 09:44:52.881',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9qvs0000qwvzas2jsja6',63,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:26.583','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:26.583',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9tdr0001qwvzez5o9xn9',64,'cmlwksy5b000g50vzbq244ms6','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:29.823','2026-02-22 15:33:02.215',0,'2026-02-22 13:56:29.823',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9thk0002qwvz7m1kdsm7',65,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:29.960','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:29.960',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9tih0003qwvzaed9zqgq',66,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:29.992','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:29.992',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9tkj0004qwvznnpyy6wk',67,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:30.066','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:30.066',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9tp40007qwvzxqqbdfp8',68,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:30.232','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:30.232',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9tq30008qwvz363iou6g',69,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:30.266',NULL,0,'2026-02-22 13:56:30.266',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9un3000aqwvzlgbkxz9p',70,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:31.454',NULL,0,'2026-02-22 13:56:31.454',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9upg000cqwvznaxzwznl',71,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:31.539','2026-02-22 13:56:32.926',0,'2026-02-22 13:56:31.539',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9xws000hqwvzulg4uonm',72,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:35.691','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:35.691',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9y4l000kqwvzb02uej1n',73,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:35.970','2026-02-22 13:56:36.137',0,'2026-02-22 13:56:35.970',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9ybk000pqwvz36nezg4p',74,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:36.224','2026-02-22 13:56:36.322',0,'2026-02-22 13:56:36.224',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9yks000uqwvz6fzyfz92',75,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:36.556','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:36.556',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9ymq000vqwvzjd8rg1cn',76,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:36.626','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:36.626',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9yoz000wqwvzj9elo89x',77,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:36.707','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:36.707',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9yrg000yqwvzpnntyn59',78,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:36.794','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:36.794',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9yti000zqwvzekhp17wg',79,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:36.870','2026-02-22 13:56:36.941',0,'2026-02-22 13:56:36.870',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9z930012qwvzgx5oi67c',80,'cmlwksy5n000j50vzaobvcfv9','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:37.431','2026-02-22 14:54:22.307',0,'2026-02-22 13:56:37.431',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9zar0013qwvzg1h8ig8b',81,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:37.491','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:37.491',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxt9zvo0014qwvzs2vtbwub',82,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:38.243','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:38.243',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxta11y0015qwvzfzev53cg',83,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:39.766','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:39.766',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxta1yu0016qwvz5kppynv3',84,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,'{\"type\":\"AMOUNT\",\"value\":20}',NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:40.950','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:40.950',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxta3230019qwvzwiidd4r1',85,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:42.362','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:42.362',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxta3iv001bqwvznpxh2c5g',86,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:42.966','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:42.966',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxta3xj001cqwvz0dhv0b3u',87,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:43.495','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:43.495',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtad77001dqwvz02v8j89w',88,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:55.507','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:55.507',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtad82001eqwvz6q1qu7i4',89,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:55.538','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:55.538',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtad9v001fqwvzxa4fhfpo',90,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:55.603','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:55.603',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtaddz001iqwvz7x5842g3',91,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:55.751','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:55.751',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtadf0001jqwvzb30mn4ij',92,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:55.787',NULL,0,'2026-02-22 13:56:55.787',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtadi3001lqwvzbvr1rzgh',93,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:55.898',NULL,0,'2026-02-22 13:56:55.898',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtadk7001nqwvz3ern6ppf',94,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:55.974','2026-02-22 13:56:56.078',0,'2026-02-22 13:56:55.974',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtae0m001sqwvzw23fxjhu',95,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:56.566','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:56.566',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtae6a001vqwvz4k6rxx5t',96,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:56.770','2026-02-22 13:56:56.863',0,'2026-02-22 13:56:56.770',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtaeaj0020qwvzranagmk0',97,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:56.923','2026-02-22 13:56:57.061',0,'2026-02-22 13:56:56.923',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtaekw0025qwvzgnhfsbwi',98,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:57.296','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:57.296',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtaemy0026qwvz2br4rmxt',99,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:57.370','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:57.370',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtaepj0027qwvzcoltg8c8',100,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:57.462','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:57.462',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtaero0029qwvzq7dha8hb',101,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:57.539','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:57.539',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtaetp002aqwvz8jjewen2',102,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:57.613','2026-02-22 13:56:57.688',0,'2026-02-22 13:56:57.613',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtafed002dqwvz7k7eoebc',103,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:56:58.356','2026-03-01 20:39:36.729',0,'2026-02-22 13:56:58.356',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtaicm002eqwvz9qkd8uqj',104,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:57:02.181','2026-03-01 20:39:36.729',0,'2026-02-22 13:57:02.181',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtakcx002fqwvzxldmiuji',105,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:57:04.784','2026-03-01 20:39:36.729',0,'2026-02-22 13:57:04.784',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtalbp002gqwvzt8rmtb55',106,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,'{\"type\":\"AMOUNT\",\"value\":20}',NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:57:06.036','2026-03-01 20:39:36.729',0,'2026-02-22 13:57:06.036',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtamer002jqwvz4xuf26b4',107,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:57:07.443','2026-03-01 20:39:36.729',0,'2026-02-22 13:57:07.443',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtanee002kqwvzv6wi012a',108,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:57:08.726','2026-03-01 20:39:36.729',0,'2026-02-22 13:57:08.726',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtanti002lqwvzl79ty7io',109,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:57:09.270','2026-03-01 20:39:36.729',0,'2026-02-22 13:57:09.270',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtaoam002nqwvz1t6hugte',110,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:57:09.885','2026-03-01 20:39:36.729',0,'2026-02-22 13:57:09.885',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc2u4002oqwvzr7229dw3',111,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:15.388','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:15.388',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc2v7002pqwvz9litjy03',112,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:15.426','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:15.426',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc2wq002qqwvzo3spcnzs',113,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:15.482','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:15.482',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc30e002tqwvzlantk2p2',114,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:15.614','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:15.614',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc319002uqwvzwdj24rcg',115,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:15.645',NULL,0,'2026-02-22 13:58:15.645',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc33l002wqwvzkfbkkm07',116,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:15.729',NULL,0,'2026-02-22 13:58:15.729',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc35z002yqwvzi3f6erzv',117,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:15.815','2026-02-22 13:58:15.926',0,'2026-02-22 13:58:15.815',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc3lm0033qwvzxm4a2pnh',118,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:16.377','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:16.377',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc3qq0036qwvzbtbd9wut',119,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:16.558','2026-02-22 13:58:16.667',0,'2026-02-22 13:58:16.558',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc3v7003bqwvz4u2ihdng',120,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:16.723','2026-02-22 13:58:16.824',0,'2026-02-22 13:58:16.723',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc43e003gqwvzt6hngqc8',121,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:17.017','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:17.017',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc45d003hqwvzibkdbtpz',122,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:17.089','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:17.089',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc47q003iqwvz2marx2ml',123,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:17.173','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:17.173',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc49y003kqwvz74rsf3ds',124,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:17.253','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:17.253',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc4bj003lqwvz6m5mi0m6',125,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:17.311','2026-02-22 13:58:17.395',0,'2026-02-22 13:58:17.311',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc4vu003oqwvz6uoipceg',126,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:18.041','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:18.041',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc7ab003pqwvz2f2z52b7',127,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,'{\"type\":\"AMOUNT\",\"value\":20}',NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:21.155','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:21.155',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc7wz003sqwvzhobgoe21',128,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:21.971','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:21.971',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc8jn003tqwvz5jp46js5',129,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:22.787','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:22.787',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtc9t9003uqwvzwl85uur8',130,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:24.429','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:24.429',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcacx003vqwvzsqpj3jvv',131,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:25.137','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:25.137',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcar4003wqwvzpyzf9hal',132,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:25.648','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:25.648',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcb7y003yqwvz0s255v34',133,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:26.254','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:26.254',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcqzq003zqwvzdxyk2gbn',134,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:46.693','2026-02-22 13:58:46.770',0,'2026-02-22 13:58:46.693',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcr330044qwvzuzmnaj0o',135,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:46.814','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:46.814',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcr4v0045qwvz2mlzirm8',136,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:46.879','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:46.879',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcr9a0048qwvzdi5zidzq',137,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:47.037','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:47.037',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcrac0049qwvzx6tmbzta',138,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:47.075',NULL,0,'2026-02-22 13:58:47.075',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcrct004bqwvzsfmb2gyo',139,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:47.164',NULL,0,'2026-02-22 13:58:47.164',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcrf8004dqwvzxqxts1ke',140,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:47.252','2026-02-22 13:58:47.338',0,'2026-02-22 13:58:47.252',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcrsv004iqwvzxpz13szu',141,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:47.739','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:47.739',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcrxk004lqwvzwpv0gebr',142,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:47.911','2026-02-22 13:58:48.021',0,'2026-02-22 13:58:47.911',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcs2c004qqwvzwz0abjw0',143,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:48.083','2026-02-22 13:58:48.171',0,'2026-02-22 13:58:48.083',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcs92004vqwvzvcyg2lq7',144,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:48.325','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:48.325',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcsau004wqwvzg1b4o6x2',145,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:48.390','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:48.390',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcscx004xqwvz6iunagez',146,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:48.464','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:48.464',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcsf3004zqwvzowo1c3jh',147,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:48.542','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:48.542',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcsgn0050qwvzjgqi0bcl',148,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:48.598','2026-02-22 13:58:48.661',0,'2026-02-22 13:58:48.598',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtctkl0053qwvzpb1ul4un',149,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:50.036','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:50.036',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcund0054qwvzlghsq3o3',150,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,'{\"type\":\"AMOUNT\",\"value\":20}',NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:51.433','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:51.433',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcvmw0057qwvzynj46m83',151,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:52.712','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:52.712',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcwaf0058qwvz31a4cut4',152,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:53.558','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:53.558',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcwzz0059qwvz4i02synz',153,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:54.479','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:54.479',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcyo9005aqwvzou3p30ox',154,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:56.649','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:56.649',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtcz25005bqwvztr14ctid',155,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:57.148','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:57.148',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtd0am005dqwvzi7cdqy9f',156,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:58:58.749','2026-03-01 20:39:36.729',0,'2026-02-22 13:58:58.749',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtdxp8005eqwvzjapr9s6q',157,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:42.044','2026-02-22 13:59:42.121',0,'2026-02-22 13:59:42.044',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtdxsl005jqwvzhsx6ov40',158,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:42.164','2026-03-01 20:39:36.729',0,'2026-02-22 13:59:42.164',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtdxug005kqwvzj7uy3vxl',159,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:42.232','2026-03-01 20:39:36.729',0,'2026-02-22 13:59:42.232',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtdxyk005nqwvzf3flueqm',160,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:42.380','2026-03-01 20:39:36.729',0,'2026-02-22 13:59:42.380',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtdxzk005oqwvz6qm21epz',161,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:42.416',NULL,0,'2026-02-22 13:59:42.416',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtdy2o005qqwvzp2nf4hom',162,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:42.525',NULL,0,'2026-02-22 13:59:42.525',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtdy5u005sqwvzx2874vu5',163,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:42.641','2026-02-22 13:59:42.767',0,'2026-02-22 13:59:42.641',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtdykb005xqwvz7ddx09gg',164,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:43.161','2026-03-01 20:39:36.729',0,'2026-02-22 13:59:43.161',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtdyoz0060qwvzjiq68fqc',165,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:43.331','2026-02-22 13:59:43.417',0,'2026-02-22 13:59:43.331',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtdyte0065qwvz0pugrolt',166,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:43.489','2026-02-22 13:59:43.572',0,'2026-02-22 13:59:43.489',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtdyzy006aqwvzeomk1bil',167,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:43.726','2026-03-01 20:39:36.729',0,'2026-02-22 13:59:43.726',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtdz1m006bqwvzdu6munjx',168,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:43.786','2026-03-01 20:39:36.729',0,'2026-02-22 13:59:43.786',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtdz3n006cqwvzuxu9s1w9',169,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:43.858','2026-03-01 20:39:36.729',0,'2026-02-22 13:59:43.858',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtdz5n006eqwvzgavnylyp',170,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:43.931','2026-03-01 20:39:36.729',0,'2026-02-22 13:59:43.931',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtdz7i006fqwvz9fwncpzh',171,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:43.997','2026-02-22 13:59:44.060',0,'2026-02-22 13:59:43.997',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxtdzq7006iqwvzpt7msvc6',172,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:44.670','2026-03-01 20:39:36.729',0,'2026-02-22 13:59:44.670',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxte1fl006jqwvzo0ks909v',173,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,'{\"type\":\"AMOUNT\",\"value\":20}',NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:46.880','2026-03-01 20:39:36.729',0,'2026-02-22 13:59:46.880',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxte20s006mqwvzs4nob08e',174,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:47.644','2026-03-01 20:39:36.729',0,'2026-02-22 13:59:47.644',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxte389006nqwvz64n954kh',175,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:49.209','2026-03-01 20:39:36.729',0,'2026-02-22 13:59:49.209',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxte3vo006oqwvz2svmpf4b',176,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:50.051','2026-03-01 20:39:36.729',0,'2026-02-22 13:59:50.051',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxte4fk006pqwvzqi1wgdr7',177,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:50.767','2026-03-01 20:39:36.729',0,'2026-02-22 13:59:50.767',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxte4tw006qqwvzixgmgcgz',178,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:51.284','2026-03-01 20:39:36.729',0,'2026-02-22 13:59:51.284',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxte642006sqwvzauh5qf16',179,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 13:59:52.945','2026-03-01 20:39:36.729',0,'2026-02-22 13:59:52.945',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxujen40004hovz9tl3pieo',180,'cmlwksy3v000550vzzhvbyjey','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 14:31:56.896','2026-02-22 14:45:36.495',2,'2026-02-22 14:45:28.350',44.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxv11pd0006rovzyqa4lc6l',181,'cmlwksy3v000550vzzhvbyjey','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 14:45:39.937','2026-02-22 15:32:51.604',0,'2026-02-22 14:45:39.937',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxw9h1a000drovzxc2wo1ud',182,'cmlwksy4q000b50vzbs71mhow','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 15:20:12.669','2026-02-22 15:33:13.417',0,'2026-02-22 15:20:12.669',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxwolze000erovziw6nu7bm',183,'cmlwksy4v000c50vzwsjiy9cc','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 15:31:58.922','2026-02-22 15:33:16.135',0,'2026-02-22 15:31:58.922',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlxwqb5l000qrovz7g5yoqji',184,'cmlwksy4z000d50vzwoffibas','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-22 15:33:18.201','2026-03-02 09:00:53.000',1,'2026-02-22 15:33:24.003',22.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmlyqlvnx0000x0vz8uyaq1q3',185,'cmlwksy3v000550vzzhvbyjey','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-02-23 05:29:39.981','2026-03-02 09:00:53.000',0,'2026-02-23 05:29:39.981',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm7kwl6j00005gvz6il5epp9',186,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-01 09:59:57.492','2026-03-01 20:39:36.729',0,'2026-03-01 09:59:57.492',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm7ln7m80000bkvzmnn366jf',187,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','TAKEAWAY',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-01 10:20:39.630','2026-03-01 20:39:36.729',0,'2026-03-01 10:20:39.630',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm7m0csi00003ovzdn9o1k9p',188,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','HOTEL_ROOM',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-01 10:30:52.863','2026-03-01 20:39:36.729',0,'2026-03-01 10:30:52.863',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm8yaqoe00000cvz0zbctm26',189,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','HOTEL_ROOM',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 09:02:38.988','2026-03-02 09:46:33.493',0,'2026-03-02 09:02:38.988',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm8yxfn400010cvzt4q02ajt',190,'cmlwksy3v000550vzzhvbyjey','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 09:20:17.776','2026-03-02 09:46:33.493',0,'2026-03-02 09:20:17.776',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm8zoaot0000okvzhdrb4fuc',191,'cmlwksy40000650vzb3qzfrb8','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 09:41:11.069','2026-03-02 09:46:33.493',0,'2026-03-02 09:41:11.069',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm9023j50000v4vzgy2x036e',192,'cmlwksy3v000550vzzhvbyjey','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 09:51:54.977','2026-03-02 11:24:51.927',0,'2026-03-02 09:51:54.977',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm902cus0001v4vze8tlb4mz',193,'cmlwksy40000650vzb3qzfrb8','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 09:52:07.059','2026-03-02 11:24:51.988',0,'2026-03-02 09:52:07.059',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm91c3dx0002v4vz5db1lgs9',194,'cmlwksy44000750vzoutnwolj','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 10:27:40.965','2026-03-02 12:38:28.237',0,'2026-03-02 10:27:40.965',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm91kft7000048vzdjym1ccn',195,'cmlwksy4a000850vzrolh31dr','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 10:34:10.315',NULL,3,'2026-03-02 10:34:33.105',73.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm91lfu0000448vzw4rlexek',196,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'OPEN','HOTEL_ROOM',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 10:34:56.999',NULL,0,'2026-03-02 10:34:56.999',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm91pkm50000xcvzc4iv48ee',197,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'OPEN','HOTEL_ROOM',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 10:38:09.818',NULL,0,'2026-03-02 10:38:09.818',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm93n5qj0001xcvzdx2f7bf5',198,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'OPEN','HOTEL_ROOM',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 11:32:16.458',NULL,0,'2026-03-02 11:32:16.458',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm94v84q0002xcvztl5gd0d3',199,'cmlwksy40000650vzb3qzfrb8','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 12:06:32.426','2026-03-02 12:39:16.001',0,'2026-03-02 12:06:32.426',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm959aj90000s4vzl9t8ubk6',200,'cmlwksy5n000j50vzaobvcfv9','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CANCELLED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 12:17:28.724',NULL,2,'2026-03-02 12:17:42.340',38.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm96k2470009s4vz8gu1r69r',201,'cmlwksy40000650vzb3qzfrb8','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 12:53:50.647','2026-03-02 12:53:57.680',0,'2026-03-02 12:53:50.647',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm9721in000bs4vzjqr7kg7x',202,'cmlwksy40000650vzb3qzfrb8','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 13:07:49.679','2026-03-02 13:07:58.502',0,'2026-03-02 13:07:49.679',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm976il4000ds4vz8fpap94k',203,'cmlwksy40000650vzb3qzfrb8','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 13:11:18.424','2026-03-02 13:11:20.822',0,'2026-03-02 13:11:18.424',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm9cboxd000fs4vzpscabt73',204,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw','cmm9cbuhl000is4vzc7e31eus','SENT_TO_KITCHEN','HOTEL_ROOM',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 15:35:17.998',NULL,1,'2026-03-02 15:35:23.348',22.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm9cji7z000js4vzy38oj392',205,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw','cmm9cjufi000os4vzzu0f5kb5','CLOSED','HOTEL_ROOM',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 15:41:22.557','2026-03-02 15:41:38.984',2,'2026-03-02 15:41:37.709',44.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm9ckm4y000qs4vzhf1dzr7u',206,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw',NULL,'OPEN','HOTEL_ROOM',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 15:42:14.289',NULL,0,'2026-03-02 15:42:14.289',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm9cnpef000rs4vz969bta9r',207,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw','cmm9cnt7v000vs4vz6qlueaof','CLOSED','HOTEL_ROOM',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 15:44:38.487','2026-03-02 15:44:43.518',1,'2026-03-02 15:44:43.143',22.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm9co63g000xs4vzivarzqfn',208,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw','cmm9cob6p0014s4vz3114scdu','CLOSED','HOTEL_ROOM',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 15:45:00.124','2026-03-02 15:45:06.778',4,'2026-03-02 15:45:06.453',76.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm9cp1b60016s4vzyvm2ts15',209,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw','cmm9cp6tg001as4vz9gh3ni6v','CLOSED','HOTEL_ROOM',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 15:45:40.577','2026-03-02 15:45:47.767',1,'2026-03-02 15:45:47.459',22.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm9cpd7n001cs4vzuvpy58op',210,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw','cmm9cpfrb001gs4vzvmxf76cw','CLOSED','HOTEL_ROOM',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 15:45:56.003','2026-03-02 15:45:59.356',1,'2026-03-02 15:45:59.056',22.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm9cuede001is4vz5d8d2d95',211,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw','cmm9culcp001ms4vznd5uxitg','CLOSED','HOTEL_ROOM',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 15:49:50.785','2026-03-02 15:49:59.885',1,'2026-03-02 15:49:59.533',22.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm9cznra001os4vzymn6jcz8',212,NULL,NULL,'cmlw9tjuk0003v8vzm90mbgpw','cmm9czshx001ss4vzm1zpre0m','CLOSED','HOTEL_ROOM',1,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 15:53:56.229','2026-03-02 15:54:02.431',1,'2026-03-02 15:54:01.396',22.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmm9gkiz20000novzbdghrp9e',1,'cmlwksy3v000550vzzhvbyjey','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'CLOSED','DINE_IN',2,NULL,'{\"type\":\"PERCENT\",\"value\":10,\"reason\":\"Rabat ręczny\"}',NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-02 17:34:08.653','2026-03-03 21:13:57.131',0,'2026-03-03 21:11:17.121',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmma9wqpv00003svz2ebkz2q3',213,'cmlwksy44000750vzoutnwolj','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'OPEN','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-03 07:15:27.427',NULL,0,'2026-03-03 07:15:27.427',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmmajms0900005ovzib3atoeo',214,'cmlwksy4f000950vziw227q0y','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'OPEN','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-03 11:47:38.697',NULL,0,'2026-03-03 11:47:38.697',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmmarb0cb0000oovzzfgu7xo6',215,'cmlwksy4k000a50vzajzwbrwl','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'OPEN','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-03 15:22:26.555',NULL,0,'2026-03-03 15:22:26.555',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmmb2ze4u000010vzv0c1prvy',216,'cmlwksy40000650vzb3qzfrb8','cmlwksy2x000050vzltc00c8s','cmlw9tjse0002v8vzu0cr8wlr',NULL,'SENT_TO_KITCHEN','DINE_IN',2,NULL,'{\"type\":\"PERCENT\",\"value\":10,\"reason\":\"Rabat ręczny\"}',NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-03 20:49:19.950',NULL,6,'2026-03-03 20:58:54.580',338.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmmb3zd9x000d10vzpbb5bluf',217,'cmlwksy4q000b50vzbs71mhow','cmlwksy2x000050vzltc00c8s','cmlw9tjse0002v8vzu0cr8wlr',NULL,'SENT_TO_KITCHEN','DINE_IN',2,NULL,NULL,'Podział na 3 osób',1,NULL,NULL,NULL,NULL,NULL,'2026-03-03 21:17:18.453',NULL,2,'2026-03-03 21:18:15.674',61.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmmb426ol000g10vzbaueyr9u',218,'cmlwksy4q000b50vzbs71mhow','cmlwksy2x000050vzltc00c8s','cmlw9tjse0002v8vzu0cr8wlr',NULL,'OPEN','DINE_IN',1,NULL,NULL,'Podział rachunku #217 — osoba 2/3',1,NULL,NULL,NULL,NULL,NULL,'2026-03-03 21:19:29.877',NULL,0,'2026-03-03 21:19:29.877',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmmb426p5000j10vzi6q0nxr2',219,'cmlwksy4q000b50vzbs71mhow','cmlwksy2x000050vzltc00c8s','cmlw9tjse0002v8vzu0cr8wlr',NULL,'OPEN','DINE_IN',1,NULL,NULL,'Podział rachunku #217 — osoba 3/3',1,NULL,NULL,NULL,NULL,NULL,'2026-03-03 21:19:29.897',NULL,0,'2026-03-03 21:19:29.897',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmmb51u8w000n10vzkvo4harh',220,'cmlwksy4v000c50vzwsjiy9cc','cmlwksy2x000050vzltc00c8s','cmlw9tjse0002v8vzu0cr8wlr',NULL,'OPEN','DINE_IN',4,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-03 21:47:13.376',NULL,0,'2026-03-03 21:47:13.376',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmmb5lnoa000o10vzlpiytob5',221,'cmlwksy3v000550vzzhvbyjey','cmlwksy2x000050vzltc00c8s','cmlw9tjse0002v8vzu0cr8wlr',NULL,'SENT_TO_KITCHEN','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-03 22:02:37.978',NULL,13,'2026-03-03 23:08:38.117',341.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmmb68sqb000t10vzn9pg299a',222,'cmlwksy4a000850vzrolh31dr','cmlwksy2x000050vzltc00c8s','cmlw9tjse0002v8vzu0cr8wlr',NULL,'OPEN','DINE_IN',4,NULL,'{\"type\":\"PERCENT\",\"value\":150,\"reason\":\"Rabat ręczny\"}',NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-03 22:20:37.619',NULL,0,'2026-03-03 22:20:37.619',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmmb6xxan000y10vzfiqtuyzt',223,'cmlwksy4z000d50vzwoffibas','cmlwksy2x000050vzltc00c8s','cmlw9tjse0002v8vzu0cr8wlr',NULL,'CLOSED','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-03 22:40:09.935','2026-03-04 16:20:27.974',0,'2026-03-03 22:40:09.935',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmmb77h9b000z10vz227kqw8u',224,'cmlwksy54000e50vz4nhozsph','cmlwksy2x000050vzltc00c8s','cmlw9tjse0002v8vzu0cr8wlr',NULL,'OPEN','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-03 22:47:35.711',NULL,0,'2026-03-03 22:47:35.711',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID'),('cmmc5lops0002vcvzytgg7a84',1,'cmlwksy3v000550vzzhvbyjey','cmlwksy2x000050vzltc00c8s','cmlw9tjuk0003v8vzm90mbgpw',NULL,'OPEN','DINE_IN',2,NULL,NULL,NULL,1,NULL,NULL,NULL,NULL,NULL,'2026-03-04 14:50:25.503',NULL,0,'2026-03-04 14:50:25.503',0.00,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,'UNPAID');
/*!40000 ALTER TABLE `order` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orderitem`
--

DROP TABLE IF EXISTS `orderitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orderitem` (
  `id` varchar(191) NOT NULL,
  `orderId` varchar(191) NOT NULL,
  `productId` varchar(191) NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `unitPrice` decimal(10,2) NOT NULL,
  `taxRateId` varchar(191) NOT NULL,
  `discountAmount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `modifiersJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`modifiersJson`)),
  `note` varchar(191) DEFAULT NULL,
  `courseNumber` int(11) NOT NULL DEFAULT 1,
  `status` enum('ORDERED','SENT','IN_PROGRESS','READY','SERVED','CANCELLED') NOT NULL DEFAULT 'ORDERED',
  `sentToKitchenAt` datetime(3) DEFAULT NULL,
  `startedAt` datetime(3) DEFAULT NULL,
  `preparedByUserId` varchar(191) DEFAULT NULL,
  `kdsStationId` varchar(191) DEFAULT NULL,
  `readyAt` datetime(3) DEFAULT NULL,
  `servedAt` datetime(3) DEFAULT NULL,
  `cancelledAt` datetime(3) DEFAULT NULL,
  `cancelReason` varchar(191) DEFAULT NULL,
  `isBanquetExtra` tinyint(1) NOT NULL DEFAULT 0,
  `isModifiedAfterSend` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `addedComponentsJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`addedComponentsJson`)),
  `componentPriceDelta` decimal(10,2) DEFAULT NULL,
  `confirmedWeight` decimal(10,3) DEFAULT NULL,
  `delayMinutes` int(11) DEFAULT NULL,
  `fireAt` datetime(3) DEFAULT NULL,
  `firedAt` datetime(3) DEFAULT NULL,
  `isFire` tinyint(1) NOT NULL DEFAULT 0,
  `isPriority` tinyint(1) NOT NULL DEFAULT 0,
  `isRush` tinyint(1) NOT NULL DEFAULT 0,
  `isSetComponent` tinyint(1) NOT NULL DEFAULT 0,
  `isTakeaway` tinyint(1) NOT NULL DEFAULT 0,
  `noteType` enum('STANDARD','ALLERGY','MODIFICATION','RUSH') DEFAULT NULL,
  `parentItemId` varchar(191) DEFAULT NULL,
  `printBold` tinyint(1) NOT NULL DEFAULT 0,
  `removedComponentsJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`removedComponentsJson`)),
  `requiresWeightConfirm` tinyint(1) NOT NULL DEFAULT 0,
  `weightBarcodeScanned` varchar(191) DEFAULT NULL,
  `weightConfirmed` tinyint(1) NOT NULL DEFAULT 0,
  `weightConfirmedAt` datetime(3) DEFAULT NULL,
  `weightConfirmedBy` varchar(191) DEFAULT NULL,
  `lockedQuantity` decimal(10,3) NOT NULL DEFAULT 0.000,
  `paidQuantity` decimal(10,3) NOT NULL DEFAULT 0.000,
  PRIMARY KEY (`id`),
  KEY `OrderItem_productId_fkey` (`productId`),
  KEY `OrderItem_taxRateId_fkey` (`taxRateId`),
  KEY `OrderItem_orderId_status_idx` (`orderId`,`status`),
  KEY `OrderItem_parentItemId_idx` (`parentItemId`),
  CONSTRAINT `OrderItem_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `OrderItem_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `OrderItem_taxRateId_fkey` FOREIGN KEY (`taxRateId`) REFERENCES `taxrate` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orderitem`
--

LOCK TABLES `orderitem` WRITE;
/*!40000 ALTER TABLE `orderitem` DISABLE KEYS */;
INSERT INTO `orderitem` VALUES ('cmlwdd3ky0001awvz8cfte741','cmlwdctxl0000awvzgzcvjvzc','cmlwabkwm0002m0vzspea5dcl',1.000,42.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'IN_PROGRESS','2026-02-21 13:43:22.973','2026-02-22 08:18:56.136','cmlw9tjuk0003v8vzm90mbgpw',NULL,NULL,NULL,NULL,NULL,0,0,'2026-02-21 13:43:22.978',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmlwdd3l20002awvzklet95fr','cmlwdctxl0000awvzgzcvjvzc','cmlwabkwu0003m0vz8a8n2l9b',1.000,24.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'IN_PROGRESS','2026-02-21 13:43:22.973','2026-02-22 08:18:56.241','cmlw9tjuk0003v8vzm90mbgpw',NULL,NULL,NULL,NULL,NULL,0,0,'2026-02-21 13:43:22.982',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmlwksytq001q50vzfq22bswc','cmlwksytl001p50vzrnio0dlt','cmlw9tkaj0028v8vz73ap7rzi',2.000,42.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,2,'ORDERED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-02-21 17:11:40.622',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmlwksyty001r50vzhg7qgwiz','cmlwksytl001p50vzrnio0dlt','cmlw9tk9t0026v8vzh6gn7t27',2.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'ORDERED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-02-21 17:11:40.630',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmlxv0r3i0000rovzzeqrikem','cmlxujen40004hovz9tl3pieo','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-02-22 14:45:26.179',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-02-22 14:45:26.190',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmlxv0sqz0001rovzieopmemg','cmlxujen40004hovz9tl3pieo','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-02-22 14:45:28.325',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-02-22 14:45:28.331',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmlxwqfmm000rrovz89otqncp','cmlxwqb5l000qrovz7g5yoqji','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-02-22 15:33:23.997',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-02-22 15:33:23.998',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm91kpvk000148vztynhyqev','cmm91kft7000048vzdjym1ccn','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-02 10:34:23.357',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-02 10:34:23.360',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm91kxdy000248vzdcaja2vr','cmm91kft7000048vzdjym1ccn','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-02 10:34:33.093',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-02 10:34:33.094',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm91kxe2000348vz5h31e4ho','cmm91kft7000048vzdjym1ccn','cmlxk8yde000674vz1ovsth3v',1.000,29.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-02 10:34:33.093',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-02 10:34:33.098',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm959l0z0001s4vzl4q39cmb','cmm959aj90000s4vzl9t8ubk6','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-02 12:17:42.315',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-02 12:17:42.322',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm959l170002s4vz6zcrk5is','cmm959aj90000s4vzl9t8ubk6','cmlxk8ydt000874vz7oqa9gsw',1.000,16.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-02 12:17:42.315',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-02 12:17:42.331',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm9cbt1m000gs4vz9pikf0rx','cmm9cboxd000fs4vzpscabt73','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-02 15:35:23.336',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-02 15:35:23.338',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm9cjqgj000ks4vzdsnwxcmi','cmm9cji7z000js4vzy38oj392','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-02 15:41:33.233',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-02 15:41:33.235',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm9cjtwo000ls4vzj0wqebf6','cmm9cji7z000js4vzy38oj392','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-02 15:41:37.702',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-02 15:41:37.704',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm9cnszm000ss4vz1ab21z7r','cmm9cnpef000rs4vz969bta9r','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-02 15:44:43.137',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-02 15:44:43.137',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm9co912000ys4vz66sgv1fv','cmm9co63g000xs4vzivarzqfn','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-02 15:45:03.925',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-02 15:45:03.926',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm9co915000zs4vzzyjb3hj7','cmm9co63g000xs4vzivarzqfn','cmlxk8ydt000874vz7oqa9gsw',1.000,16.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-02 15:45:03.925',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-02 15:45:03.929',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm9coayx0010s4vz8napqxra','cmm9co63g000xs4vzivarzqfn','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-02 15:45:06.438',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-02 15:45:06.441',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm9coaz30011s4vzhh3njgic','cmm9co63g000xs4vzivarzqfn','cmlxk8ydt000874vz7oqa9gsw',1.000,16.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-02 15:45:06.438',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-02 15:45:06.447',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm9cp6m40017s4vzqkn33fzb','cmm9cp1b60016s4vzyvm2ts15','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-02 15:45:47.450',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-02 15:45:47.452',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm9cpfk6001ds4vzqby11e7o','cmm9cpd7n001cs4vzuvpy58op','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-02 15:45:59.045',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-02 15:45:59.046',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm9cul46001js4vztfctfu87','cmm9cuede001is4vz5d8d2d95','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-02 15:49:59.525',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-02 15:49:59.526',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm9czrqk001ps4vzfu5zezpl','cmm9cznra001os4vzymn6jcz8','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-02 15:54:01.386',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-02 15:54:01.388',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm9gkiza0001novzrhchfx2z','cmm9gkiz20000novzbdghrp9e','cmlw9tkaj0028v8vz73ap7rzi',2.000,42.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,2,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-03 21:11:17.112',NULL,0,0,'2026-03-02 17:34:08.661',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmm9gkizg0002novzf3kdn5ly','cmm9gkiz20000novzbdghrp9e','cmlw9tk9t0026v8vzh6gn7t27',2.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'CANCELLED',NULL,NULL,NULL,NULL,NULL,NULL,'2026-03-03 21:11:17.112',NULL,0,0,'2026-03-02 17:34:08.668',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb32jib000310vzdcji5yaj','cmmb2ze4u000010vzv0c1prvy','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 20:51:46.876',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 20:51:46.883',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb32jne000410vzr05qsmys','cmmb2ze4u000010vzv0c1prvy','cmlxk8yd7000574vzjow44y94',1.000,39.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 20:51:46.876',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 20:51:47.066',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb32jnl000510vzpt7ao2p0','cmmb2ze4u000010vzv0c1prvy','cmlxk8yih000q74vzji1f6bu6',3.000,36.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 20:51:46.876',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 20:51:47.073',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb3bpig000610vz9wo0hqc8','cmmb2ze4u000010vzv0c1prvy','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 20:58:54.565',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 20:58:54.568',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb3bpij000710vzzm4wba1j','cmmb2ze4u000010vzv0c1prvy','cmlxk8yd7000574vzjow44y94',1.000,39.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 20:58:54.565',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 20:58:54.571',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb3bpim000810vznptd72op','cmmb2ze4u000010vzv0c1prvy','cmlxk8yih000q74vzji1f6bu6',3.000,36.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 20:58:54.565',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 20:58:54.574',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb40lf8000e10vz0e41s9of','cmmb3zd9x000d10vzpbb5bluf','cmlxk8ydm000774vz8e4nfdho',0.333,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 21:18:15.666',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 21:18:15.668',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb40lfa000f10vz2eenlgj7','cmmb3zd9x000d10vzpbb5bluf','cmlxk8yd7000574vzjow44y94',0.333,39.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 21:18:15.666',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 21:18:15.670',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb426ou000h10vzcir5r8m3','cmmb426ol000g10vzbaueyr9u','cmlxk8ydm000774vz8e4nfdho',0.333,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SERVED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 21:19:29.885',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb426p0000i10vz3vcreu9m','cmmb426ol000g10vzbaueyr9u','cmlxk8yd7000574vzjow44y94',0.333,39.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SERVED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 21:19:29.892',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb426p6000k10vz3sts4xzr','cmmb426p5000j10vzi6q0nxr2','cmlxk8ydm000774vz8e4nfdho',0.333,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SERVED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 21:19:29.898',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb426p8000l10vz0tnwfcju','cmmb426p5000j10vzi6q0nxr2','cmlxk8yd7000574vzjow44y94',0.333,39.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SERVED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 21:19:29.900',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb5t0p0000p10vz7vqdq9t3','cmmb5lnoa000o10vzlpiytob5','cmlxk8ye8000974vzo42iypvl',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 22:08:21.442',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 22:08:21.444',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb5t0p5000q10vzcroj335b','cmmb5lnoa000o10vzlpiytob5','cmlxk8yfi000d74vz2ksg7gyu',1.000,43.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 22:08:21.442',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 22:08:21.449',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb5t0p8000r10vzo80yb9g9','cmmb5lnoa000o10vzlpiytob5','cmlxk8yln001274vzh56rzfkn',1.000,23.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 22:08:21.442',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 22:08:21.452',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb5vnsq000s10vzpxwxpbf3','cmmb5lnoa000o10vzlpiytob5','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 22:10:24.696',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 22:10:24.698',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb7wvls001010vz1guzbz1b','cmmb5lnoa000o10vzlpiytob5','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 23:07:20.701',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 23:07:20.704',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb7wvlw001110vzydki1c5a','cmmb5lnoa000o10vzlpiytob5','cmlxk8ydt000874vz7oqa9gsw',1.000,16.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 23:07:20.701',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 23:07:20.708',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb7wvly001210vzeurqnrlh','cmmb5lnoa000o10vzlpiytob5','cmlxk8yd7000574vzjow44y94',1.000,39.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 23:07:20.701',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 23:07:20.710',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb7xwfz001310vzdoht6ff2','cmmb5lnoa000o10vzlpiytob5','cmlxk8ydt000874vz7oqa9gsw',1.000,16.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 23:08:08.445',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 23:08:08.447',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb7xwg1001410vz392tw8fs','cmmb5lnoa000o10vzlpiytob5','cmlxk8yd7000574vzjow44y94',1.000,39.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 23:08:08.445',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 23:08:08.449',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb7xwg2001510vz5osseekx','cmmb5lnoa000o10vzlpiytob5','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 23:08:08.445',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 23:08:08.450',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb7yjbw001610vz50eunds5','cmmb5lnoa000o10vzlpiytob5','cmlxk8ydt000874vz7oqa9gsw',1.000,16.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 23:08:38.106',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 23:08:38.108',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb7yjby001710vzeitelwa9','cmmb5lnoa000o10vzlpiytob5','cmlxk8yd7000574vzjow44y94',1.000,39.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 23:08:38.106',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 23:08:38.110',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmb7yjc1001810vz1jwrspfm','cmmb5lnoa000o10vzlpiytob5','cmlxk8ydm000774vz8e4nfdho',1.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'SENT','2026-03-03 23:08:38.106',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-03 23:08:38.113',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmc5loq40003vcvz6d931ipo','cmmc5lops0002vcvzytgg7a84','cmlw9tkaj0028v8vz73ap7rzi',2.000,42.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,2,'ORDERED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-04 14:50:25.516',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000),('cmmc5loqd0004vcvzbbbhyorx','cmmc5lops0002vcvzytgg7a84','cmlw9tk9t0026v8vzh6gn7t27',2.000,22.00,'cmlw9tk0s0008v8vzb6x32a65',0.00,NULL,NULL,1,'ORDERED',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,0,'2026-03-04 14:50:25.524',NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,0,0,NULL,NULL,0,NULL,0,NULL,0,NULL,NULL,0.000,0.000);
/*!40000 ALTER TABLE `orderitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment`
--

DROP TABLE IF EXISTS `payment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment` (
  `id` varchar(191) NOT NULL,
  `orderId` varchar(191) NOT NULL,
  `method` enum('CASH','CARD','BLIK','TRANSFER','VOUCHER','ROOM_CHARGE') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `tipAmount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `transactionRef` varchar(191) DEFAULT NULL,
  `voucherId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `Payment_voucherId_fkey` (`voucherId`),
  KEY `Payment_createdAt_idx` (`createdAt`),
  KEY `Payment_orderId_idx` (`orderId`),
  CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `Payment_voucherId_fkey` FOREIGN KEY (`voucherId`) REFERENCES `giftvoucher` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment`
--

LOCK TABLES `payment` WRITE;
/*!40000 ALTER TABLE `payment` DISABLE KEYS */;
INSERT INTO `payment` VALUES ('cmlwld7h7000bd4vzpqljp7wh','cmlwld7g8000ad4vzmpl1elpj','CASH',50.00,0.00,NULL,NULL,'2026-02-21 17:27:24.955'),('cmlwldqm6000qd4vz6brn10a4','cmlwldqgx000pd4vz4xkhf9zn','CASH',50.00,0.00,NULL,NULL,'2026-02-21 17:27:49.758'),('cmlwlequ40010d4vz1d9sjzjj','cmlwleqt4000zd4vz6khpi8w8','CASH',50.00,0.00,NULL,NULL,'2026-02-21 17:28:36.700'),('cmlwlfbwa001bd4vzj9six323','cmlwlfbva001ad4vzp076e1kc','CASH',50.00,0.00,NULL,NULL,'2026-02-21 17:29:03.994'),('cmlwlfnty001kd4vzoql0hnzn','cmlwlfnt1001jd4vzjq6o5g9y','CASH',50.00,0.00,NULL,NULL,'2026-02-21 17:29:19.462'),('cmlwlgpui001xd4vzrzg4z0h1','cmlwlgpt9001wd4vzzshkeboj','CASH',50.00,0.00,NULL,NULL,'2026-02-21 17:30:08.730'),('cmlxt9tn10005qwvz3q9tfsl7','cmlxt9tkj0004qwvznnpyy6wk','CASH',22.00,0.00,NULL,NULL,'2026-02-22 13:56:30.156'),('cmlxt9tn50006qwvz6kjjwkaw','cmlxt9tkj0004qwvznnpyy6wk','CARD',23.00,0.00,NULL,NULL,'2026-02-22 13:56:30.161'),('cmlxt9uqr000dqwvzuvis3s9s','cmlxt9upg000cqwvznaxzwznl','CASH',100.00,0.00,NULL,NULL,'2026-02-22 13:56:31.587'),('cmlxt9y0p000iqwvz0sovqrob','cmlxt9xws000hqwvzulg4uonm','CASH',40.00,0.00,NULL,NULL,'2026-02-22 13:56:35.833'),('cmlxt9y67000lqwvzf8ndofl2','cmlxt9y4l000kqwvzb02uej1n','CASH',100.00,0.00,NULL,NULL,'2026-02-22 13:56:36.030'),('cmlxt9ycv000qqwvzf1gq6wwy','cmlxt9ybk000pqwvz36nezg4p','CASH',100.00,0.00,NULL,NULL,'2026-02-22 13:56:36.271'),('cmlxt9yq8000xqwvz2opnirg8','cmlxt9yoz000wqwvzj9elo89x','CASH',0.01,0.00,NULL,NULL,'2026-02-22 13:56:36.752'),('cmlxt9yuh0010qwvzae0ahiqy','cmlxt9yti000zqwvzekhp17wg','CASH',1.00,0.00,NULL,NULL,'2026-02-22 13:56:36.905'),('cmlxta33b001aqwvzfxr918b9','cmlxta3230019qwvzwiidd4r1','CASH',50.00,0.00,NULL,NULL,'2026-02-22 13:56:42.407'),('cmlxtadc4001gqwvz9k3367hr','cmlxtad9v001fqwvzxa4fhfpo','CASH',22.00,0.00,NULL,NULL,'2026-02-22 13:56:55.684'),('cmlxtadc6001hqwvziqnfftuz','cmlxtad9v001fqwvzxa4fhfpo','CARD',23.00,0.00,NULL,NULL,'2026-02-22 13:56:55.686'),('cmlxtadl9001oqwvzk7s0cqkm','cmlxtadk7001nqwvz3ern6ppf','CASH',100.00,0.00,NULL,NULL,'2026-02-22 13:56:56.013'),('cmlxtae3k001tqwvzck3ozifb','cmlxtae0m001sqwvzw23fxjhu','CASH',40.00,0.00,NULL,NULL,'2026-02-22 13:56:56.672'),('cmlxtae7h001wqwvzwlzwfbi6','cmlxtae6a001vqwvz4k6rxx5t','CASH',100.00,0.00,NULL,NULL,'2026-02-22 13:56:56.813'),('cmlxtaecd0021qwvz64u3gdvh','cmlxtaeaj0020qwvzranagmk0','CASH',100.00,0.00,NULL,NULL,'2026-02-22 13:56:56.989'),('cmlxtaeqo0028qwvz80avxnac','cmlxtaepj0027qwvzcoltg8c8','CASH',0.01,0.00,NULL,NULL,'2026-02-22 13:56:57.504'),('cmlxtaeut002bqwvzhldaknwj','cmlxtaetp002aqwvz8jjewen2','CASH',1.00,0.00,NULL,NULL,'2026-02-22 13:56:57.653'),('cmlxtanuk002mqwvz9f44n6d6','cmlxtanti002lqwvzl79ty7io','CASH',50.00,0.00,NULL,NULL,'2026-02-22 13:57:09.308'),('cmlxtc2yk002rqwvzrdsn6cdy','cmlxtc2wq002qqwvzo3spcnzs','CASH',22.00,0.00,NULL,NULL,'2026-02-22 13:58:15.548'),('cmlxtc2ym002sqwvz3kjmean0','cmlxtc2wq002qqwvzo3spcnzs','CARD',23.00,0.00,NULL,NULL,'2026-02-22 13:58:15.550'),('cmlxtc37b002zqwvzn208gp2a','cmlxtc35z002yqwvzi3f6erzv','CASH',100.00,0.00,NULL,NULL,'2026-02-22 13:58:15.863'),('cmlxtc3oe0034qwvzup7s1o0s','cmlxtc3lm0033qwvzxm4a2pnh','CASH',40.00,0.00,NULL,NULL,'2026-02-22 13:58:16.478'),('cmlxtc3s30037qwvzpfiv75a1','cmlxtc3qq0036qwvzbtbd9wut','CASH',100.00,0.00,NULL,NULL,'2026-02-22 13:58:16.611'),('cmlxtc3wf003cqwvz5drab2v2','cmlxtc3v7003bqwvz4u2ihdng','CASH',100.00,0.00,NULL,NULL,'2026-02-22 13:58:16.767'),('cmlxtc48s003jqwvza3b2pz8j','cmlxtc47q003iqwvz2marx2ml','CASH',0.01,0.00,NULL,NULL,'2026-02-22 13:58:17.212'),('cmlxtc4cj003mqwvztr5bi4uo','cmlxtc4bj003lqwvz6m5mi0m6','CASH',1.00,0.00,NULL,NULL,'2026-02-22 13:58:17.347'),('cmlxtcas4003xqwvzzl4rf8o5','cmlxtcar4003wqwvzpyzf9hal','CASH',50.00,0.00,NULL,NULL,'2026-02-22 13:58:25.684'),('cmlxtcr0n0040qwvzplc0fknv','cmlxtcqzq003zqwvzdxyk2gbn','CASH',100.00,0.00,NULL,NULL,'2026-02-22 13:58:46.727'),('cmlxtcr780046qwvztfut86bo','cmlxtcr4v0045qwvz2mlzirm8','CASH',22.00,0.00,NULL,NULL,'2026-02-22 13:58:46.964'),('cmlxtcr7d0047qwvzdzdpo3xg','cmlxtcr4v0045qwvz2mlzirm8','CARD',23.00,0.00,NULL,NULL,'2026-02-22 13:58:46.969'),('cmlxtcrga004eqwvzd2yqaoic','cmlxtcrf8004dqwvzxqxts1ke','CASH',100.00,0.00,NULL,NULL,'2026-02-22 13:58:47.290'),('cmlxtcrvl004jqwvzias0zb6f','cmlxtcrsv004iqwvzxpz13szu','CASH',40.00,0.00,NULL,NULL,'2026-02-22 13:58:47.841'),('cmlxtcryq004mqwvzwk3zl2kf','cmlxtcrxk004lqwvzwpv0gebr','CASH',100.00,0.00,NULL,NULL,'2026-02-22 13:58:47.954'),('cmlxtcs3g004rqwvz8378frjl','cmlxtcs2c004qqwvzwz0abjw0','CASH',100.00,0.00,NULL,NULL,'2026-02-22 13:58:48.124'),('cmlxtcsdy004yqwvzfa7j0328','cmlxtcscx004xqwvz6iunagez','CASH',0.01,0.00,NULL,NULL,'2026-02-22 13:58:48.502'),('cmlxtcshh0051qwvzmd5pyd3q','cmlxtcsgn0050qwvzjgqi0bcl','CASH',1.00,0.00,NULL,NULL,'2026-02-22 13:58:48.629'),('cmlxtcz35005cqwvzuwhg37ef','cmlxtcz25005bqwvztr14ctid','CASH',50.00,0.00,NULL,NULL,'2026-02-22 13:58:57.185'),('cmlxtdxq6005fqwvz1t4m32ry','cmlxtdxp8005eqwvzjapr9s6q','CASH',100.00,0.00,NULL,NULL,'2026-02-22 13:59:42.078'),('cmlxtdxwn005lqwvznbu5w8ac','cmlxtdxug005kqwvzj7uy3vxl','CASH',22.00,0.00,NULL,NULL,'2026-02-22 13:59:42.311'),('cmlxtdxwp005mqwvzd5w5jzs0','cmlxtdxug005kqwvzj7uy3vxl','CARD',23.00,0.00,NULL,NULL,'2026-02-22 13:59:42.313'),('cmlxtdy7h005tqwvz2v5rcmth','cmlxtdy5u005sqwvzx2874vu5','CASH',100.00,0.00,NULL,NULL,'2026-02-22 13:59:42.701'),('cmlxtdyn1005yqwvzn4onq5wt','cmlxtdykb005xqwvz7ddx09gg','CASH',40.00,0.00,NULL,NULL,'2026-02-22 13:59:43.261'),('cmlxtdypy0061qwvzmqjy1ydu','cmlxtdyoz0060qwvzjiq68fqc','CASH',100.00,0.00,NULL,NULL,'2026-02-22 13:59:43.366'),('cmlxtdyui0066qwvzf8iuqr4v','cmlxtdyte0065qwvz0pugrolt','CASH',100.00,0.00,NULL,NULL,'2026-02-22 13:59:43.530'),('cmlxtdz4m006dqwvzs581kksh','cmlxtdz3n006cqwvzuxu9s1w9','CASH',0.01,0.00,NULL,NULL,'2026-02-22 13:59:43.894'),('cmlxtdz8c006gqwvz365rwyjy','cmlxtdz7i006fqwvz9fwncpzh','CASH',1.00,0.00,NULL,NULL,'2026-02-22 13:59:44.028'),('cmlxte4ux006rqwvzv18ijh4u','cmlxte4tw006qqwvzixgmgcgz','CASH',50.00,0.00,NULL,NULL,'2026-02-22 13:59:51.321'),('cmlxujb9l0000hovz7ysljxfo','cmlwksytl001p50vzrnio0dlt','CASH',128.00,0.00,NULL,NULL,'2026-02-22 14:31:52.521'),('cmlxv0ycl0002rovzttx151ow','cmlxujen40004hovz9tl3pieo','CASH',44.00,0.00,NULL,NULL,'2026-02-22 14:45:35.589'),('cmm9cjuf9000ns4vzrh2l1ew1','cmm9cji7z000js4vzy38oj392','ROOM_CHARGE',44.00,0.00,'ROOM-003',NULL,'2026-03-02 15:41:38.372'),('cmm9cnt7k000us4vzo9fj77vl','cmm9cnpef000rs4vz969bta9r','ROOM_CHARGE',22.00,0.00,'ROOM-010',NULL,'2026-03-02 15:44:43.423'),('cmm9cob6i0013s4vz9ttchesj','cmm9co63g000xs4vzivarzqfn','ROOM_CHARGE',76.00,0.00,'ROOM-010',NULL,'2026-03-02 15:45:06.714'),('cmm9cp6ta0019s4vzsa9nrumc','cmm9cp1b60016s4vzyvm2ts15','ROOM_CHARGE',22.00,0.00,'ROOM-010',NULL,'2026-03-02 15:45:47.709'),('cmm9cpfr5001fs4vz2c5tlbr4','cmm9cpd7n001cs4vzuvpy58op','ROOM_CHARGE',22.00,0.00,'ROOM-010',NULL,'2026-03-02 15:45:59.297'),('cmm9culcg001ls4vzw77cbn44','cmm9cuede001is4vz5d8d2d95','ROOM_CHARGE',22.00,0.00,'ROOM-010',NULL,'2026-03-02 15:49:59.824'),('cmm9czshn001rs4vzht5oxjhl','cmm9cznra001os4vzymn6jcz8','ROOM_CHARGE',22.00,0.00,'ROOM-010',NULL,'2026-03-02 15:54:02.363'),('cmmb3uxc1000a10vzqariwphd','cmm9gkiz20000novzbdghrp9e','CASH',128.00,0.00,NULL,NULL,'2026-03-03 21:13:51.169');
/*!40000 ALTER TABLE `payment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pendingpayment`
--

DROP TABLE IF EXISTS `pendingpayment`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pendingpayment` (
  `id` varchar(191) NOT NULL,
  `orderId` varchar(191) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(191) NOT NULL DEFAULT 'PLN',
  `provider` varchar(191) NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'PENDING',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `response` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`response`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `completedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `PendingPayment_orderId_idx` (`orderId`),
  KEY `PendingPayment_status_idx` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pendingpayment`
--

LOCK TABLES `pendingpayment` WRITE;
/*!40000 ALTER TABLE `pendingpayment` DISABLE KEYS */;
/*!40000 ALTER TABLE `pendingpayment` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `printer`
--

DROP TABLE IF EXISTS `printer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `printer` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `type` enum('FISCAL','KITCHEN','BAR','SYSTEM') NOT NULL,
  `connectionType` varchar(191) NOT NULL,
  `address` varchar(191) DEFAULT NULL,
  `port` int(11) DEFAULT NULL,
  `model` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `charsPerLine` int(11) NOT NULL DEFAULT 42,
  `codePage` varchar(191) DEFAULT NULL,
  `cutAfterPrint` tinyint(1) NOT NULL DEFAULT 1,
  `openDrawer` tinyint(1) NOT NULL DEFAULT 0,
  `remoteServer` varchar(191) DEFAULT NULL,
  `templatesJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`templatesJson`)),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `printer`
--

LOCK TABLES `printer` WRITE;
/*!40000 ALTER TABLE `printer` DISABLE KEYS */;
/*!40000 ALTER TABLE `printer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `printercategory`
--

DROP TABLE IF EXISTS `printercategory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `printercategory` (
  `printerId` varchar(191) NOT NULL,
  `categoryId` varchar(191) NOT NULL,
  PRIMARY KEY (`printerId`,`categoryId`),
  KEY `PrinterCategory_categoryId_fkey` (`categoryId`),
  CONSTRAINT `PrinterCategory_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `PrinterCategory_printerId_fkey` FOREIGN KEY (`printerId`) REFERENCES `printer` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `printercategory`
--

LOCK TABLES `printercategory` WRITE;
/*!40000 ALTER TABLE `printercategory` DISABLE KEYS */;
/*!40000 ALTER TABLE `printercategory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `printlog`
--

DROP TABLE IF EXISTS `printlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `printlog` (
  `id` varchar(191) NOT NULL,
  `printerId` varchar(191) NOT NULL,
  `printType` enum('KITCHEN_ORDER','KITCHEN_STORNO','KITCHEN_CHANGE','RECEIPT','INVOICE','REPORT','TEST') NOT NULL,
  `orderId` varchar(191) DEFAULT NULL,
  `orderNumber` int(11) DEFAULT NULL,
  `contentJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`contentJson`)),
  `status` enum('PENDING','PRINTING','PRINTED','FAILED') NOT NULL DEFAULT 'PENDING',
  `errorMessage` varchar(191) DEFAULT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `printedAt` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `PrintLog_printerId_createdAt_idx` (`printerId`,`createdAt`),
  KEY `PrintLog_orderId_idx` (`orderId`),
  CONSTRAINT `PrintLog_printerId_fkey` FOREIGN KEY (`printerId`) REFERENCES `printer` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `printlog`
--

LOCK TABLES `printlog` WRITE;
/*!40000 ALTER TABLE `printlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `printlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `procurement_calculations`
--

DROP TABLE IF EXISTS `procurement_calculations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `procurement_calculations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `weekStart` datetime(3) NOT NULL,
  `weekEnd` datetime(3) NOT NULL,
  `calculatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `calculatedBy` varchar(100) NOT NULL,
  `result` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`result`)),
  `emailSentAt` datetime(3) DEFAULT NULL,
  `emailSentTo` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `procurement_calculations`
--

LOCK TABLES `procurement_calculations` WRITE;
/*!40000 ALTER TABLE `procurement_calculations` DISABLE KEYS */;
/*!40000 ALTER TABLE `procurement_calculations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `nameShort` varchar(191) DEFAULT NULL,
  `categoryId` varchar(191) NOT NULL,
  `priceGross` decimal(10,2) NOT NULL,
  `costPrice` decimal(10,2) DEFAULT NULL,
  `taxRateId` varchar(191) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `isAvailable` tinyint(1) NOT NULL DEFAULT 1,
  `estimatedPrepMinutes` int(11) DEFAULT NULL,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `color` varchar(191) DEFAULT NULL,
  `imageUrl` varchar(191) DEFAULT NULL,
  `afterSelectAction` varchar(191) DEFAULT NULL,
  `afterSelectGoTo` varchar(191) DEFAULT NULL,
  `alwaysOnePortion` tinyint(1) NOT NULL DEFAULT 0,
  `askForComponents` tinyint(1) NOT NULL DEFAULT 0,
  `canRepeat` tinyint(1) NOT NULL DEFAULT 1,
  `freeComponents` int(11) DEFAULT NULL,
  `isAddonOnly` tinyint(1) NOT NULL DEFAULT 0,
  `isDefaultTemplate` tinyint(1) NOT NULL DEFAULT 0,
  `isHidden` tinyint(1) NOT NULL DEFAULT 0,
  `isSet` tinyint(1) NOT NULL DEFAULT 0,
  `isWeightBased` tinyint(1) NOT NULL DEFAULT 0,
  `maxComponents` int(11) DEFAULT NULL,
  `maxPerOrder` int(11) DEFAULT NULL,
  `noGeneralDesc` tinyint(1) NOT NULL DEFAULT 0,
  `noPrintKitchen` tinyint(1) NOT NULL DEFAULT 0,
  `noQuantityChange` tinyint(1) NOT NULL DEFAULT 0,
  `printWithMinus` tinyint(1) NOT NULL DEFAULT 0,
  `productType` enum('REGULAR','SET','HELPER_SET','ADDON','ADDON_GLOBAL') NOT NULL DEFAULT 'REGULAR',
  `requiresWeightConfirm` tinyint(1) NOT NULL DEFAULT 0,
  `setPriceMode` enum('OWN_PRICE','CALCULATED','CALCULATED_SINGLE') DEFAULT NULL,
  `superGroupId` varchar(191) DEFAULT NULL,
  `tareWeight` decimal(10,3) DEFAULT NULL,
  `unit` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `Product_taxRateId_fkey` (`taxRateId`),
  KEY `Product_superGroupId_fkey` (`superGroupId`),
  KEY `Product_categoryId_isActive_isAvailable_idx` (`categoryId`,`isActive`,`isAvailable`),
  KEY `Product_isActive_sortOrder_idx` (`isActive`,`sortOrder`),
  CONSTRAINT `Product_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `category` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `Product_superGroupId_fkey` FOREIGN KEY (`superGroupId`) REFERENCES `supergroup` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `Product_taxRateId_fkey` FOREIGN KEY (`taxRateId`) REFERENCES `taxrate` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES ('cmlw9tk8v0024v8vzrohei4f1','Tatar z wołowiny','Tatar z wołowiny','cmlw9tk7c001sv8vz0zfudvlx',32.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,NULL,1,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tk9e0025v8vz67i5j08i','Sałatka Cezar','Sałatka Cezar','cmlw9tk7c001sv8vz0zfudvlx',28.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,NULL,2,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tk9t0026v8vzh6gn7t27','Żurek w chlebie','Żurek w chlebie','cmlw9tk7g001tv8vzugmgx7dk',22.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,NULL,3,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tka70027v8vze8qelzug','Rosół z makaronem','Rosół z makaronem','cmlw9tk7g001tv8vzugmgx7dk',21.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,5,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tkaj0028v8vz73ap7rzi','Kotlet schabowy','Kotlet schabowy','cmlw9tk7o001vv8vz35zzqk08',42.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,NULL,5,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tkav0029v8vzxtyx6jvh','Żeberka BBQ','Żeberka BBQ','cmlw9tk7o001vv8vz35zzqk08',48.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,NULL,6,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tkb6002av8vzgvyxibon','Filet z łososia','Filet z łososia','cmlw9tk7s001wv8vzv5y52kk5',52.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,NULL,7,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tkbe002bv8vzxgin1tb8','Placek po zbójnicku','Placek po zbójnicku','cmlw9tk7o001vv8vz35zzqk08',38.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,NULL,8,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tkbp002cv8vzn5jp7y9z','Burger wegetariański','Burger wegetariański','cmlw9tk7w001xv8vzbv4hyg7a',35.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,NULL,9,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tkc1002dv8vzwc8bsk4j','Szarlotka','Szarlotka','cmlw9tk80001yv8vznb7pt8oj',18.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,NULL,10,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tkcf002ev8vzn1k1qr0n','Lody 3 gałki','Lody 3 gałki','cmlw9tk80001yv8vznb7pt8oj',14.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,NULL,11,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tkco002fv8vzwyt28gxb','Kawa espresso','Kawa espresso','cmm9gc37v00009kvzywt4v2zz',8.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,NULL,12,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tkcs002gv8vzck2rfbm5','Herbata','Herbata','cmm9gc37v00009kvzywt4v2zz',7.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,NULL,13,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tkcw002hv8vzvtfn89tw','Cola 0.33l','Cola 0.33l','cmm9gc37v00009kvzywt4v2zz',10.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,NULL,14,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tkd1002iv8vzz1v65ekg','Woda mineralna 0.5l','Woda mineralna 0.5l','cmm9gc37v00009kvzywt4v2zz',8.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,NULL,15,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tkd5002jv8vzatfuih88','Piwo jasne 0.5l','Piwo jasne 0.5l','cmm9g85wt0001ckvzkullwb85',14.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,NULL,16,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tkdc002kv8vzmom1gaoy','Piwo ciemne 0.5l','Piwo ciemne 0.5l','cmm9g85wt0001ckvzkullwb85',15.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,NULL,17,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tkdi002lv8vzxjc11h74','Wino czerwone lampka','Wino czerwone lampka','cmm9gc38r00019kvz7knfwydq',18.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,NULL,18,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tkdp002mv8vzi9wxklkt','Wino białe lampka','Wino białe lampka','cmm9gc38r00019kvz7knfwydq',16.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,NULL,19,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlw9tkdv002nv8vzjq0poytt','Whisky 50ml','Whisky 50ml','cmm9gc38r00019kvz7knfwydq',22.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,NULL,20,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabkw30000m0vz1mim4yki','Sałatka grecka','Sałatka grecka','cmlw9tk7c001sv8vz0zfudvlx',28.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,8,3,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabkwb0001m0vzknijm2vf','Bruschetta pomidorowa','Bruschetta pomidorowa','cmlw9tk7c001sv8vz0zfudvlx',22.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,6,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabkwm0002m0vzspea5dcl','Carpaccio z polędwicy','Carpaccio z polędwicy','cmlw9tk7c001sv8vz0zfudvlx',42.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,8,5,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabkwu0003m0vz8a8n2l9b','Śledzik w oleju','Śledzik w oleju','cmlw9tk7c001sv8vz0zfudvlx',24.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,5,6,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabkx80004m0vz053n9gy9','Śledzik w śmietanie','Śledzik w śmietanie','cmlw9tk7c001sv8vz0zfudvlx',26.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,5,7,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabkxp0005m0vz25sz493p','Krewetki w czosnku','Krewetki w czosnku','cmlw9tk7c001sv8vz0zfudvlx',46.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,12,8,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabky50006m0vzrejqpklq','Deska serów','Deska serów','cmlw9tk7c001sv8vz0zfudvlx',48.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,8,9,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabkyi0007m0vz21tawqg5','Deska wędlin','Deska wędlin','cmlw9tk7c001sv8vz0zfudvlx',44.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,8,10,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabkys0008m0vzzrzvoz39','Krokiety z kapustą','Krokiety z kapustą','cmlw9tk7c001sv8vz0zfudvlx',18.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,10,11,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabkz70009m0vz9s8fivnz','Krokiety z mięsem','Krokiety z mięsem','cmlw9tk7c001sv8vz0zfudvlx',20.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,10,12,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabkzr000am0vz1vaijdbg','Żurek tradycyjny','Żurek tradycyjny','cmlw9tk7g001tv8vzugmgx7dk',18.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,5,2,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl0c000bm0vzups9dh87','Barszcz czerwony','Barszcz czerwony','cmlw9tk7g001tv8vzugmgx7dk',14.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,5,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl0j000cm0vztquckhey','Barszcz z uszkami','Barszcz z uszkami','cmlw9tk7g001tv8vzugmgx7dk',22.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,6,5,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl0y000dm0vz3girfdk5','Krem z pomidorów','Krem z pomidorów','cmlw9tk7g001tv8vzugmgx7dk',16.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,5,6,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl1d000em0vzq41ve6zq','Krem z pieczarek','Krem z pieczarek','cmlw9tk7g001tv8vzugmgx7dk',18.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,5,7,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl1o000fm0vzk9ifzgwp','Flaki po warszawsku','Flaki po warszawsku','cmlw9tk7g001tv8vzugmgx7dk',24.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,6,8,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl1y000gm0vzvxoeqi2l','Zupa ogórkowa','Zupa ogórkowa','cmlw9tk7g001tv8vzugmgx7dk',16.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,5,9,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl2b000hm0vze6kuppga','Kapuśniak','Kapuśniak','cmlw9tk7g001tv8vzugmgx7dk',16.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,5,10,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl2j000im0vzf8dhkn89','Zupa dnia','Zupa dnia','cmlw9tk7g001tv8vzugmgx7dk',14.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,5,11,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl2z000jm0vzkb1y065a','Kotlet de volaille','Kotlet de volaille','cmlw9tk7o001vv8vz35zzqk08',44.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,18,2,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl3n000km0vzzwherx0y','Żeberka w miodzie','Żeberka w miodzie','cmlw9tk7o001vv8vz35zzqk08',54.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,25,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl43000lm0vzxkmckd0g','Golonka pieczona','Golonka pieczona','cmlw9tk7o001vv8vz35zzqk08',58.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,30,6,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl4f000mm0vzq80ondth','Kaczka z jabłkami','Kaczka z jabłkami','cmlw9tk7o001vv8vz35zzqk08',68.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,35,7,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl4p000nm0vz43nc7tr7','Polędwica wołowa','Polędwica wołowa','cmlw9tk7o001vv8vz35zzqk08',78.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,25,8,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl4z000om0vzf3qc6qos','Stek z antrykotu','Stek z antrykotu','cmlw9tk7o001vv8vz35zzqk08',72.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,20,9,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl53000pm0vzx707pouv','Bitki wołowe','Bitki wołowe','cmlw9tk7o001vv8vz35zzqk08',48.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,22,10,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl5g000qm0vz5y3kiq2y','Rolada wołowa','Rolada wołowa','cmlw9tk7o001vv8vz35zzqk08',52.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,25,11,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl5t000rm0vzd55z10mw','Gulasz wieprzowy','Gulasz wieprzowy','cmlw9tk7o001vv8vz35zzqk08',38.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,18,12,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl67000sm0vzlo89onrt','Gulasz wołowy','Gulasz wołowy','cmlw9tk7o001vv8vz35zzqk08',44.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,18,13,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl6i000tm0vzq48zqies','Pierogi z mięsem (12szt)','Pierogi z mięsem (12szt)','cmlw9tk7o001vv8vz35zzqk08',32.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,15,14,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl6v000um0vzw1tv8sdj','Schabowy po cygańsku','Schabowy po cygańsku','cmlw9tk7o001vv8vz35zzqk08',48.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,20,15,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl7b000vm0vzsb3tcatf','Filet z kurczaka','Filet z kurczaka','cmlw9tk7o001vv8vz35zzqk08',36.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,15,16,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl7f000wm0vzgv4wiju2','Kurczak w sosie grzybowym','Kurczak w sosie grzybowym','cmlw9tk7o001vv8vz35zzqk08',42.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,18,17,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl7n000xm0vz3dpeewni','Schab pieczony','Schab pieczony','cmlw9tk7o001vv8vz35zzqk08',44.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,22,18,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl7q000ym0vz7f9q1l2b','Kiełbasa z grilla','Kiełbasa z grilla','cmlw9tk7o001vv8vz35zzqk08',28.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,12,19,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl81000zm0vzvtukg2gq','Łosoś w sosie koperkowym','Łosoś w sosie koperkowym','cmlw9tk7s001wv8vzv5y52kk5',62.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,20,2,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl8b0010m0vz2zspnyeh','Pstrąg pieczony','Pstrąg pieczony','cmlw9tk7s001wv8vzv5y52kk5',52.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,22,3,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl8j0011m0vzqyq1pv3l','Dorsz w panierce','Dorsz w panierce','cmlw9tk7s001wv8vzv5y52kk5',48.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,18,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl8w0012m0vz3lzuoa1z','Sandacz smażony','Sandacz smażony','cmlw9tk7s001wv8vzv5y52kk5',56.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,18,5,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl9g0013m0vzjto6846j','Ryba dnia','Ryba dnia','cmlw9tk7s001wv8vzv5y52kk5',54.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,20,6,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabl9n0014m0vzsjs3suzn','Fish & Chips','Fish & Chips','cmlw9tk7s001wv8vzv5y52kk5',44.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,18,7,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabla00015m0vzlpjby7b9','Karp smażony','Karp smażony','cmlw9tk7s001wv8vzv5y52kk5',46.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,18,8,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablad0016m0vzu0dx7tt8','Pierogi ruskie (12szt)','Pierogi ruskie (12szt)','cmlw9tk7w001xv8vzbv4hyg7a',28.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,15,1,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablau0017m0vzzhsieapk','Pierogi z kapustą (12szt)','Pierogi z kapustą (12szt)','cmlw9tk7w001xv8vzbv4hyg7a',26.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,15,2,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablbj0018m0vzuxdrxr76','Pierogi z jagodami (12szt)','Pierogi z jagodami (12szt)','cmlw9tk7w001xv8vzbv4hyg7a',26.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,15,3,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablbx0019m0vzmna5sn2i','Naleśniki z serem','Naleśniki z serem','cmlw9tk7w001xv8vzbv4hyg7a',24.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,12,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablcb001am0vzd689gren','Naleśniki ze szpinakiem','Naleśniki ze szpinakiem','cmlw9tk7w001xv8vzbv4hyg7a',26.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,12,5,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablcq001bm0vzp831afol','Placki ziemniaczane','Placki ziemniaczane','cmlw9tk7w001xv8vzbv4hyg7a',24.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,15,6,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabld1001cm0vzwadgxhym','Kopytka ze szpinakiem','Kopytka ze szpinakiem','cmlw9tk7w001xv8vzbv4hyg7a',28.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,12,7,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabldp001dm0vzh6jiu2ac','Risotto grzybowe','Risotto grzybowe','cmlw9tk7w001xv8vzbv4hyg7a',38.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,20,9,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabldx001em0vz7b212lzl','Makaron z warzywami','Makaron z warzywami','cmlw9tk7w001xv8vzbv4hyg7a',32.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,15,10,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwable8001fm0vzymbwt1g5','Sałatka z halloumi','Sałatka z halloumi','cmlw9tk7w001xv8vzbv4hyg7a',34.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,12,11,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablei001gm0vz068et8ki','Szarlotka z lodami','Szarlotka z lodami','cmlw9tk80001yv8vznb7pt8oj',22.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,8,1,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablf1001hm0vznuhrift3','Sernik','Sernik','cmlw9tk80001yv8vznb7pt8oj',18.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,5,3,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablfh001im0vz8d74lldh','Brownie z lodami','Brownie z lodami','cmlw9tk80001yv8vznb7pt8oj',24.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,8,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablg4001jm0vz2f4x5knr','Lody gałka','Lody gałka','cmlw9tk80001yv8vznb7pt8oj',6.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,2,6,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablgc001km0vzrbewrhss','Panna cotta','Panna cotta','cmlw9tk80001yv8vznb7pt8oj',18.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,5,7,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablgl001lm0vzerlcpsah','Tiramisu','Tiramisu','cmlw9tk80001yv8vznb7pt8oj',22.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,5,8,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablh2001mm0vz3s6hhpo5','Crème brûlée','Crème brûlée','cmlw9tk80001yv8vznb7pt8oj',20.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,8,9,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablhc001nm0vzlie0rxhx','Racuchy z jabłkami','Racuchy z jabłkami','cmlw9tk80001yv8vznb7pt8oj',18.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,12,10,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablhp001om0vzclmpj4id','Makowiec','Makowiec','cmlw9tk80001yv8vznb7pt8oj',14.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,5,11,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabli5001pm0vzyirksaa2','Deser lodowy','Deser lodowy','cmlw9tk80001yv8vznb7pt8oj',26.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,6,12,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablih001qm0vzbt3e542q','Kawa espresso podwójne','Kawa espresso podwójne','cmm9gc37v00009kvzywt4v2zz',12.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,3,2,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablim001rm0vzcs7qinih','Kawa americano','Kawa americano','cmm9gc37v00009kvzywt4v2zz',10.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,3,3,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablir001sm0vzxjvxo9g9','Kawa latte','Latte','cmm9gc37v00009kvzywt4v2zz',14.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,4,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabliy001tm0vzkzrucqu2','Cappuccino','Cappuccino','cmm9gc37v00009kvzywt4v2zz',14.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,4,5,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablja001um0vzrh6amplv','Flat white','Flat white','cmm9gc37v00009kvzywt4v2zz',14.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,4,6,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablji001vm0vzh72dtiou','Kawa po irlandzku','Kawa po irlandzku','cmm9gc37v00009kvzywt4v2zz',22.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,5,7,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabljr001wm0vz8ec19ove','Herbata czarna','Herbata czarna','cmm9gc37v00009kvzywt4v2zz',8.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,3,8,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablju001xm0vz6l68byy2','Herbata zielona','Herbata zielona','cmm9gc37v00009kvzywt4v2zz',8.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,3,9,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabljy001ym0vzn4m28pgd','Herbata owocowa','Herbata owocowa','cmm9gc37v00009kvzywt4v2zz',8.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,3,10,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablk3001zm0vzxq4hadst','Herbata z miodem','Herbata z miodem','cmm9gc37v00009kvzywt4v2zz',10.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,3,11,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablk80020m0vz3rq74w23','Gorąca czekolada','Gorąca czekolada','cmm9gc37v00009kvzywt4v2zz',14.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,4,12,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablkg0021m0vzhfufgh8o','Grzaniec galicyjski','Grzaniec galicyjski','cmm9gc37v00009kvzywt4v2zz',18.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,5,13,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablkp0022m0vzq8r8xgc0','Coca-Cola 0.33l','Coca-Cola 0.33l','cmm9gc37v00009kvzywt4v2zz',10.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,1,1,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablkt0023m0vz9e1tgvk4','Coca-Cola Zero 0.33l','Coca-Cola Zero 0.33l','cmm9gc37v00009kvzywt4v2zz',10.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,1,2,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablkx0024m0vzl0lexcjz','Fanta 0.33l','Fanta 0.33l','cmm9gc37v00009kvzywt4v2zz',10.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,1,3,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabll20025m0vzs42zydds','Sprite 0.33l','Sprite 0.33l','cmm9gc37v00009kvzywt4v2zz',10.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,1,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabll60026m0vzkgll6jv1','Woda mineralna 0.33l','Woda mineralna 0.33l','cmm9gc37v00009kvzywt4v2zz',7.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,1,5,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabllb0027m0vzejzi7tnf','Woda gazowana 0.33l','Woda gazowana 0.33l','cmm9gc37v00009kvzywt4v2zz',7.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,1,7,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabllh0028m0vzf2uxtjgq','Woda gazowana 0.5l','Woda gazowana 0.5l','cmm9gc37v00009kvzywt4v2zz',9.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,1,8,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablln0029m0vz95d8cvdx','Sok pomarańczowy 0.3l','Sok pomarańczowy 0.3l','cmm9gc37v00009kvzywt4v2zz',12.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,1,9,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabllr002am0vzq6wamga9','Sok jabłkowy 0.3l','Sok jabłkowy 0.3l','cmm9gc37v00009kvzywt4v2zz',12.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,1,10,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabllv002bm0vzkbx4tt05','Sok grejpfrutowy 0.3l','Sok grejpfrutowy 0.3l','cmm9gc37v00009kvzywt4v2zz',12.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,1,11,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablm0002cm0vzwnp55yz7','Lemoniada domowa','Lemoniada domowa','cmm9gc37v00009kvzywt4v2zz',14.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,3,12,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablm6002dm0vzo84v51jt','Lemoniada malinowa','Lemoniada malinowa','cmm9gc37v00009kvzywt4v2zz',16.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,3,13,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablma002em0vzqb8drhye','Lemoniada ogórkowa','Lemoniada ogórkowa','cmm9gc37v00009kvzywt4v2zz',16.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,3,14,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablmi002fm0vzzau6lp3i','Kompot domowy','Kompot domowy','cmm9gc37v00009kvzywt4v2zz',8.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,1,15,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablmm002gm0vzz7p5ifyl','Red Bull 0.25l','Red Bull 0.25l','cmm9gc37v00009kvzywt4v2zz',14.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,1,16,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablmp002hm0vzehpiouxx','Tyskie 0.5l','Tyskie 0.5l','cmm9g85wt0001ckvzkullwb85',14.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,1,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablmy002im0vzzgv12330','Żywiec 0.5l','Żywiec 0.5l','cmm9g85wt0001ckvzkullwb85',14.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,2,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabln6002jm0vzgyn00yrt','Lech Premium 0.5l','Lech Premium 0.5l','cmm9g85wt0001ckvzkullwb85',14.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,3,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablnf002km0vz0g5318w6','Perła 0.5l','Perła 0.5l','cmm9g85wt0001ckvzkullwb85',13.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablnm002lm0vz3romxj0k','Kozel ciemny 0.5l','Kozel ciemny 0.5l','cmm9g85wt0001ckvzkullwb85',16.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,5,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablnx002mm0vzzhfm3cky','Książęce 0.5l','Książęce 0.5l','cmm9g85wt0001ckvzkullwb85',15.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,6,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablo3002nm0vzi35oaxog','Pilsner Urquell 0.5l','Pilsner Urquell 0.5l','cmm9g85wt0001ckvzkullwb85',18.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,7,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabloc002om0vzro9rcj0u','Heineken 0.5l','Heineken 0.5l','cmm9g85wt0001ckvzkullwb85',16.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,8,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabloj002pm0vztqzkl9ef','Paulaner 0.5l','Paulaner 0.5l','cmm9g85wt0001ckvzkullwb85',18.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,9,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablow002qm0vz5v9iignu','Piwo pszeniczne 0.5l','Piwo pszeniczne 0.5l','cmm9g85wt0001ckvzkullwb85',16.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,10,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablpf002rm0vzo9rg5dr2','Piwo IPA 0.5l','Piwo IPA 0.5l','cmm9g85wt0001ckvzkullwb85',18.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,11,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablpp002sm0vzsm27m1z9','Piwo bezalkoholowe 0.5l','Piwo bezalkoholowe 0.5l','cmm9g85wt0001ckvzkullwb85',12.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',0,1,2,12,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablpy002tm0vzf1moy0z8','Radler cytrynowy 0.5l','Radler cytrynowy 0.5l','cmm9g85wt0001ckvzkullwb85',14.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,13,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablq7002um0vzpfld0o1s','Wino czerwone wytrawne kiel','Wino czerw. wytrawne kiel','cmm9gc38r00019kvz7knfwydq',18.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,1,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablqi002vm0vzcmny9dm4','Wino czerwone półwytrawne kiel','Wino czerw. półwytrawne kiel','cmm9gc38r00019kvz7knfwydq',18.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,2,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablqx002wm0vzgvu96y4r','Wino białe wytrawne kiel','Wino białe wytrawne kiel','cmm9gc38r00019kvz7knfwydq',16.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,3,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablr5002xm0vzp703g30z','Wino białe półwytrawne kiel','Wino białe półwytrawne kiel','cmm9gc38r00019kvz7knfwydq',16.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablrb002ym0vz8mswgewt','Wino różowe kiel','Wino różowe kiel','cmm9gc38r00019kvz7knfwydq',16.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,5,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablri002zm0vzba361w0w','Prosecco kiel','Prosecco kiel','cmm9gc38r00019kvz7knfwydq',22.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,6,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablro0030m0vz4gw4zxtg','Szampan kiel','Szampan kiel','cmm9gc38r00019kvz7knfwydq',38.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,7,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablru0031m0vznallt6st','Wino czerwone but. 0.75l','Wino czerwone butelka','cmm9gc38r00019kvz7knfwydq',75.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,3,8,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabls40032m0vzz65bl4xm','Wino białe but. 0.75l','Wino białe butelka','cmm9gc38r00019kvz7knfwydq',68.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,3,9,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablsa0033m0vzdxm7ebey','Prosecco but. 0.75l','Prosecco butelka','cmm9gc38r00019kvz7knfwydq',95.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,3,10,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablsl0034m0vz2pjbbxnd','Aperol Spritz','Aperol Spritz','cmm9gc38r00019kvz7knfwydq',26.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,4,11,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablsr0035m0vzneitiugw','Wódka Żubrówka 50ml','Żubrówka 50ml','cmm9gc38r00019kvz7knfwydq',12.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,1,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablsz0036m0vzgf3fb2l2','Wódka Wyborowa 50ml','Wyborowa 50ml','cmm9gc38r00019kvz7knfwydq',12.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,2,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablt30037m0vzecpbrame','Wódka Finlandia 50ml','Finlandia 50ml','cmm9gc38r00019kvz7knfwydq',14.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,3,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablt70038m0vz0dc68wm3','Wódka Grey Goose 50ml','Grey Goose 50ml','cmm9gc38r00019kvz7knfwydq',28.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablta0039m0vz3ehe9qah','Whisky Jameson 50ml','Jameson 50ml','cmm9gc38r00019kvz7knfwydq',18.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,5,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabltf003am0vz81gyn0hu','Whisky Jack Daniel\'s 50ml','Jack Daniel\'s 50ml','cmm9gc38r00019kvz7knfwydq',22.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,6,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabltj003bm0vz1cwj52h4','Whisky Johnnie Walker 50ml','J. Walker 50ml','cmm9gc38r00019kvz7knfwydq',24.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,7,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabltm003cm0vziby2yqlw','Whisky Glenfiddich 50ml','Glenfiddich 50ml','cmm9gc38r00019kvz7knfwydq',38.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,8,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabltq003dm0vzljlcbb6p','Rum Bacardi 50ml','Bacardi 50ml','cmm9gc38r00019kvz7knfwydq',16.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,9,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabltu003em0vz0y1j2gcj','Rum Havana Club 50ml','Havana Club 50ml','cmm9gc38r00019kvz7knfwydq',18.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,10,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablty003fm0vzticnneob','Gin Beefeater 50ml','Beefeater 50ml','cmm9gc38r00019kvz7knfwydq',18.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,11,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablu0003gm0vzn93rwkvl','Gin Bombay Sapphire 50ml','Bombay Sapphire 50ml','cmm9gc38r00019kvz7knfwydq',22.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,12,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablu4003hm0vzcyicn5rm','Koniak Hennessy 50ml','Hennessy 50ml','cmm9gc38r00019kvz7knfwydq',32.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,13,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablu7003im0vzjxr174r2','Tequila Sierra 50ml','Sierra 50ml','cmm9gc38r00019kvz7knfwydq',16.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,14,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablub003jm0vzr41247s5','Jägermeister 50ml','Jäger 50ml','cmm9gc38r00019kvz7knfwydq',16.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,15,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabluf003km0vzyleu4sbq','Likier Baileys 50ml','Baileys 50ml','cmm9gc38r00019kvz7knfwydq',16.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,16,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablul003lm0vzo0uyd1f7','Likier Amaretto 50ml','Amaretto 50ml','cmm9gc38r00019kvz7knfwydq',14.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,17,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabluu003mm0vzpyhugo5b','Nalewka wiśniowa 50ml','Nalewka wiśniowa 50ml','cmm9gc38r00019kvz7knfwydq',14.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,18,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwabluy003nm0vzgvqzdt57','Nalewka pigwowa 50ml','Nalewka pigwowa 50ml','cmm9gc38r00019kvz7knfwydq',14.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,19,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablv1003om0vzrddbgr5b','Śliwowica 50ml','Śliwowica 50ml','cmm9gc38r00019kvz7knfwydq',18.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,1,20,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlwablv4003pm0vzlfou9e22','Miód pitny 100ml','Miód pitny 100ml','cmm9gc38r00019kvz7knfwydq',22.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',0,1,2,21,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yd7000574vzjow44y94','Sałatka fit',NULL,'cmlw9tk7c001sv8vz0zfudvlx',39.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,1,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yde000674vz1ovsth3v','Złocista mozzarella na rukoli',NULL,'cmlw9tk7c001sv8vz0zfudvlx',29.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,2,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8ydm000774vz8e4nfdho','Chrupiące placki ziemniaczane',NULL,'cmlw9tk7c001sv8vz0zfudvlx',22.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,3,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8ydt000874vz7oqa9gsw','Kopytka w dwóch odsłonach',NULL,'cmlw9tk7c001sv8vz0zfudvlx',16.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8ye8000974vzo42iypvl','Pomidorowa z makaronem',NULL,'cmlw9tk7g001tv8vzugmgx7dk',22.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,6,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yeg000a74vzsim65xp2','Tradycyjny żur na zakwasie',NULL,'cmlw9tk7g001tv8vzugmgx7dk',25.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,7,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yet000b74vzvq2dyhuo','Zupa grzybowa',NULL,'cmlw9tk7g001tv8vzugmgx7dk',28.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,8,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yf6000c74vz6555qfxj','Zupa klopsowa',NULL,'cmlw9tk7g001tv8vzugmgx7dk',26.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,9,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yfi000d74vz2ksg7gyu','Schabowy chłopski',NULL,'cmlw9tk7k001uv8vzdjjvb2aj',43.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,10,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yfs000e74vz52e4jbsr','Wątróbka w klasycznym duecie',NULL,'cmlw9tk7k001uv8vzdjjvb2aj',42.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,11,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yg0000f74vzej0q4p85','Gołąbki z kaszą w sosie grzybowym',NULL,'cmlw9tk7k001uv8vzdjjvb2aj',45.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,12,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yg7000g74vzbieknb4y','Soczyste polędwiczki',NULL,'cmlw9tk7k001uv8vzdjjvb2aj',56.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,13,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8ygg000h74vzv9pej9jj','Golonka',NULL,'cmlw9tk7k001uv8vzdjjvb2aj',63.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,14,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8ygp000i74vz7odsbrns','Rumiane żeberka',NULL,'cmlw9tk7k001uv8vzdjjvb2aj',65.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,15,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8ygx000j74vzbo0v20ph','Buła swojak',NULL,'cmlw9tk7k001uv8vzdjjvb2aj',46.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,16,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yh6000k74vzjpbjidmq','Placek ziemniaczany z gulaszem',NULL,'cmlw9tk7k001uv8vzdjjvb2aj',59.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,17,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yhk000l74vzrr58humz','Udko kacze',NULL,'cmlw9tk7k001uv8vzdjjvb2aj',58.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,18,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yht000m74vzgjcsszsl','Ręcznie klejone pierogi',NULL,'cmlw9tk7k001uv8vzdjjvb2aj',38.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,19,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yi0000n74vzqv8oskvp','Kieszonka pełna smaku',NULL,'cmlw9tk7k001uv8vzdjjvb2aj',51.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,20,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yi6000o74vzgfttqxic','Łosoś na warzywach',NULL,'cmlw9tk7k001uv8vzdjjvb2aj',59.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,21,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yib000p74vz1qiicyim','Sandacz',NULL,'cmlw9tk7k001uv8vzdjjvb2aj',59.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,22,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yih000q74vzji1f6bu6','Babcine kluski z okrasą',NULL,'cmlw9tk7k001uv8vzdjjvb2aj',36.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,23,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yin000r74vznsas454w','Uczta dla czworga',NULL,'cmlw9tk7k001uv8vzdjjvb2aj',170.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,24,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yiu000s74vzav7g9t0h','Pasta na grzance',NULL,'cmlxk8yc9000174vztxvbjip2',31.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,25,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yj1000t74vza71s7y5o','Smalec z fasoli',NULL,'cmlxk8yc9000174vztxvbjip2',31.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,26,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yj7000u74vz5lu403e0','Krem z pomidorów i papryki',NULL,'cmlxk8yc9000174vztxvbjip2',25.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,27,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yjd000v74vz0r61k8yy','Boczniakowy gulasz z warzywami',NULL,'cmlxk8yc9000174vztxvbjip2',45.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,28,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yjk000w74vzxso5e796','Naleśniki bezglutenowe',NULL,'cmlxk8yc9000174vztxvbjip2',29.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,29,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yjr000x74vz3n2ryjtl','Zupa pomidorowa (dzieci)',NULL,'cmlxk8yce000274vzl9z9or4b',18.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,30,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yjz000y74vzdwevspv4','Chrupiący filecik',NULL,'cmlxk8yce000274vzl9z9or4b',28.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,31,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yk4000z74vz4o77jud5','Mini Swojak',NULL,'cmlxk8yce000274vzl9z9or4b',28.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,32,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8ykb001074vzni42gew3','Malowany naleśnik',NULL,'cmlxk8yce000274vzl9z9or4b',17.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,33,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8ykk001174vzgfzqiz3d','Lody z maszyny',NULL,'cmlw9tk80001yv8vznb7pt8oj',14.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,34,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yln001274vzh56rzfkn','Sernik z nutą pistacji',NULL,'cmlw9tk80001yv8vznb7pt8oj',23.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,35,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8ymt001374vz3rm1q7h0','Torcik bezowy',NULL,'cmlw9tk80001yv8vznb7pt8oj',23.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,36,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8ynv001474vzx3s8vpeo','Purée',NULL,'cmlxk8ycq000374vzjs8hdqsc',12.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,37,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yop001574vzuwqdfmlx','Frytki',NULL,'cmlxk8ycq000374vzjs8hdqsc',12.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,38,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yox001674vz57k929zx','Ziemniaki opiekane',NULL,'cmlxk8ycq000374vzjs8hdqsc',8.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,39,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yp6001774vzcec91nly','Sałata w śmietanie',NULL,'cmlxk8ycq000374vzjs8hdqsc',10.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,40,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8ypc001874vzqr1kobdx','Surówka mix',NULL,'cmlxk8ycq000374vzjs8hdqsc',12.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,41,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8ypm001974vz9gnabp2j','Blue Dream',NULL,'cmm9gc37v00009kvzywt4v2zz',19.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,42,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yqj001a74vzripuxjm0','Iced Coffee',NULL,'cmm9gc37v00009kvzywt4v2zz',21.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,43,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yqp001b74vzptl2p3v9','Hugo Spritz',NULL,'cmm9gc37v00009kvzywt4v2zz',25.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,44,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmlxk8yqy001c74vz06qgkik1','Pinacolada',NULL,'cmm9gc37v00009kvzywt4v2zz',20.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,NULL,45,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g85yt0009ckvzt1aey9ew','Herbata Zimowa','Herbata Zimowa','cmm9gc37v00009kvzywt4v2zz',17.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,1,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g85z3000ackvz72hr33t6','Herbata z Rozmarynem','Herbata z Rozmarynem','cmm9gc37v00009kvzywt4v2zz',17.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,2,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g85zd000bckvzp8fu5tpa','Herbata z Naszej Spiżarni','Herbata z Naszej Spiżarni','cmm9gc37v00009kvzywt4v2zz',15.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,3,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g85zn000cckvz2ablxo3c','Grzaniec Czerwony','Grzaniec Czerwony','cmm9gc37v00009kvzywt4v2zz',14.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g85zu000dckvzdy8atakv','Grzaniec Biały','Grzaniec Biały','cmm9gc37v00009kvzywt4v2zz',14.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,5,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g8602000eckvzpss991dj','Dzbanek Ciepłego Kompotu 1.5L','Dzbanek Ciepłego Kompotu 1.5L','cmm9gc37v00009kvzywt4v2zz',15.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,6,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g860m000fckvzugvsoja7','Herbata Eilles','Herbata Eilles','cmm9gc37v00009kvzywt4v2zz',10.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,14,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g860z000gckvze4tum5k3','Kawa z Ekspresu','Kawa z Ekspresu','cmm9gc37v00009kvzywt4v2zz',12.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,15,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g8616000hckvz6wthb4bo','Kawa Cappuccino','Kawa Cappuccino','cmm9gc37v00009kvzywt4v2zz',14.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,16,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g861c000ickvzbwpbles9','Kawa Latte - Macchiato','Kawa Latte - Macchiato','cmm9gc37v00009kvzywt4v2zz',14.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,17,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g861j000jckvzt7j04acs','Kawa Latte z Syropem','Kawa Latte z Syropem','cmm9gc37v00009kvzywt4v2zz',15.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,18,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g861s000kckvzihp2bfvq','Kawa z Mlekiem','Kawa z Mlekiem','cmm9gc37v00009kvzywt4v2zz',13.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,19,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g8622000lckvzv8smeqxt','Sok 330ml','Sok 330ml','cmm9gc37v00009kvzywt4v2zz',16.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,17,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g862b000mckvzwaq8n178','Woda Wysowianka 0.3L','Woda Wysowianka 0.3L','cmm9gc37v00009kvzywt4v2zz',7.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,18,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g862i000nckvz98irr2r7','Karafka Wody 1L','Karafka Wody 1L','cmm9gc37v00009kvzywt4v2zz',13.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,19,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g862o000ockvzb29alci2','Coca Cola Zero 0.25L','Coca Cola Zero 0.25L','cmm9gc37v00009kvzywt4v2zz',9.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,20,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g862u000pckvz00pxprns','Coca Cola 0.25L','Coca Cola 0.25L','cmm9gc37v00009kvzywt4v2zz',9.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,21,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g862y000qckvziphysgvc','Fanta 0.25L','Fanta 0.25L','cmm9gc37v00009kvzywt4v2zz',9.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,22,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g8633000rckvzlvifmujp','Sprite 0.25L','Sprite 0.25L','cmm9gc37v00009kvzywt4v2zz',9.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,23,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g8638000sckvznnakjb4w','Kinley 0.25L','Kinley 0.25L','cmm9gc37v00009kvzywt4v2zz',9.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,24,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g863d000tckvzpmm8ahuv','Woda Kropla Beskidu 0.33L','Woda Kropla Beskidu 0.33L','cmm9gc37v00009kvzywt4v2zz',7.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,25,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g863h000uckvzbl4rv3eh','Woda Kropla Delice 0.33L','Woda Kropla Delice 0.33L','cmm9gc37v00009kvzywt4v2zz',7.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,26,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g863n000vckvz6ycgze4c','Fuzetea 0.25L','Fuzetea 0.25L','cmm9gc37v00009kvzywt4v2zz',9.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,27,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g863r000wckvz6mey9hcp','Cappy 0.25L','Cappy 0.25L','cmm9gc37v00009kvzywt4v2zz',9.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,28,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g863v000xckvzc36aqyea','Burn 0.25L','Burn 0.25L','cmm9gc37v00009kvzywt4v2zz',9.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,29,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g8640000yckvz8n4set9o','Żywiec z Nalewaka 0.5L','Żywiec z Nalewaka 0.5L','cmm9g85wt0001ckvzkullwb85',10.00,3.00,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,1,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g8645000zckvzigtsv7vy','Żywiec z Nalewaka 0.3L','Żywiec z Nalewaka 0.3L','cmm9g85wt0001ckvzkullwb85',8.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,2,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g864b0010ckvzx08hd23k','Heineken 0% 0.5L','Heineken 0% 0.5L','cmm9g85wt0001ckvzkullwb85',12.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,3,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g864h0011ckvzdv4zo8v7','Żywiec Białe 0.5L','Żywiec Białe 0.5L','cmm9g85wt0001ckvzkullwb85',11.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g864n0012ckvzd5yemeo2','Żywiec 0% Smakowe 0.5L','Żywiec 0% Smakowe 0.5L','cmm9g85wt0001ckvzkullwb85',11.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,5,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g864s0013ckvzk2mzrnxj','Żywiec 0% 0.5L','Żywiec 0% 0.5L','cmm9g85wt0001ckvzkullwb85',10.00,NULL,'cmlw9tk0s0008v8vzb6x32a65',1,1,2,6,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g864w0014ckvzyhp8ms0x','Warka 0.5L','Warka 0.5L','cmm9g85wt0001ckvzkullwb85',11.00,3.00,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,7,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g86510015ckvzh4795e4u','Warka Strong 0.5L','Warka Strong 0.5L','cmm9g85wt0001ckvzkullwb85',11.00,3.00,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,8,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g86560016ckvz2k1gmjhw','Cydr Bursztynowy 330ml','Cydr Bursztynowy 330ml','cmm9g85wt0001ckvzkullwb85',12.00,5.00,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,1,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g865c0017ckvz65s7p3h9','Łabędzie 0.5L','Łabędzie 0.5L','cmm9g85wt0001ckvzkullwb85',13.00,4.00,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,2,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g865h0018ckvzh4m4p03o','Kormoran Jasny 0.5L','Kormoran Jasny 0.5L','cmm9g85wt0001ckvzkullwb85',15.00,5.00,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,3,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g865m0019ckvzg6l7df0o','Kormoran Świeży 0.5L','Kormoran Świeży 0.5L','cmm9g85wt0001ckvzkullwb85',14.00,5.00,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g865q001ackvzhp0qp4p1','Śliwka w Piwie 0.5L','Śliwka w Piwie 0.5L','cmm9g85wt0001ckvzkullwb85',15.00,5.00,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,5,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g865u001bckvzbmba8bxm','Rybak (Piwo Naturalne) 0.5L','Rybak (Piwo Naturalne) 0.5L','cmm9g85wt0001ckvzkullwb85',14.00,5.00,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,6,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g865z001cckvzratg4s5s','Surfer (Piwo Pszeniczne) 0.5L','Surfer (Piwo Pszeniczne) 0.5L','cmm9g85wt0001ckvzkullwb85',14.00,5.00,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,7,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g8669001dckvzsvw2rrth','Grand Marnier 40ml','Grand Marnier 40ml','cmm9gc38r00019kvz7knfwydq',19.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,1,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g866g001eckvz6dyixymc','Nemiroff 40ml','Nemiroff 40ml','cmm9gc38r00019kvz7knfwydq',7.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,1,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g866l001fckvzdzdv3j8q','Gin Bulldog 40ml','Gin Bulldog 40ml','cmm9gc38r00019kvz7knfwydq',15.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,2,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g866p001gckvzzr2irfwg','Tequila Sierra Gold 40ml','Tequila Sierra Gold 40ml','cmm9gc38r00019kvz7knfwydq',15.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,3,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g866v001hckvzh2uejpqo','Sierra Silver 40ml','Sierra Silver 40ml','cmm9gc38r00019kvz7knfwydq',6.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g8670001ickvzn5sjod8v','Krupnik 40ml','Krupnik 40ml','cmm9gc38r00019kvz7knfwydq',7.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,5,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g8674001jckvz4ya8xvfa','Żubrówka 40ml','Żubrówka 40ml','cmm9gc38r00019kvz7knfwydq',9.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,6,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g8679001kckvziifw0ifp','Finlandia Czysta 40ml','Finlandia Czysta 40ml','cmm9gc38r00019kvz7knfwydq',9.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,7,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g867e001lckvzfhbmqq2x','Wyborowa 40ml','Wyborowa 40ml','cmm9gc38r00019kvz7knfwydq',9.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,8,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g867k001mckvzpfvrx4mg','Deska 4 Smaków Nemiroff Inked','Deska 4 Smaków Nemiroff Inked','cmm9gc38r00019kvz7knfwydq',25.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,1,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g867p001nckvz25t0jktw','Glendalough Pot Still 40ml','Glendalough Pot Still 40ml','cmm9gc38r00019kvz7knfwydq',19.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,1,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g867v001ockvzgm71fjab','Bearface 40ml','Bearface 40ml','cmm9gc38r00019kvz7knfwydq',18.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,2,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g8680001pckvzvqta8uny','Chivas Regal 40ml','Chivas Regal 40ml','cmm9gc38r00019kvz7knfwydq',18.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,3,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g8685001qckvz44ieyuvl','Barcelo Gran Anejo 40ml','Barcelo Gran Anejo 40ml','cmm9gc38r00019kvz7knfwydq',15.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g868b001rckvzdd9158ki','Johnnie Walker Black Label 40ml','Johnnie Walker Black Label 40ml','cmm9gc38r00019kvz7knfwydq',18.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,5,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g868f001sckvzn1efjrta','Johnnie Walker Red Label 40ml','Johnnie Walker Red Label 40ml','cmm9gc38r00019kvz7knfwydq',12.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,6,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g868j001tckvzchbcy6eo','Jack Daniels 40ml','Jack Daniels 40ml','cmm9gc38r00019kvz7knfwydq',12.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,7,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g868o001uckvz0m17xhx5','Ballantine\'s 40ml','Ballantine\'s 40ml','cmm9gc38r00019kvz7knfwydq',10.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,8,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g868u001vckvzse8gzpk9','Jagermeister 40ml','Jagermeister 40ml','cmm9gc38r00019kvz7knfwydq',12.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,9,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g8690001wckvz6zmq94mu','Mojito','Mojito','cmm9gc38r00019kvz7knfwydq',21.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,1,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g8697001xckvz6zllr8n5','Bearface Sour','Bearface Sour','cmm9gc38r00019kvz7knfwydq',22.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,2,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g869c001yckvzrhw4hyml','Cuba Libre','Cuba Libre','cmm9gc38r00019kvz7knfwydq',21.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,3,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g869h001zckvzp2xhsdl0','Sex on the Beach 230ml','Sex on the Beach 230ml','cmm9gc38r00019kvz7knfwydq',26.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,4,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g869m0020ckvzajmoaxju','Tequila Sunrise 230ml','Tequila Sunrise 230ml','cmm9gc38r00019kvz7knfwydq',26.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,5,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g869r0021ckvzpfu7rcwu','Wściekły Pies','Wściekły Pies','cmm9gc38r00019kvz7knfwydq',12.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,1,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g869w0022ckvz6gfq94t3','Storks Moscato Rose 250ml','Storks Moscato Rose 250ml','cmm9gc38r00019kvz7knfwydq',19.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,20,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g86a20023ckvz21yk4bqx','Gruner Veltliner 750ml','Gruner Veltliner 750ml','cmm9gc38r00019kvz7knfwydq',94.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,21,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g86a70024ckvz9jv1e6h2','Pinot Grigio 750ml','Pinot Grigio 750ml','cmm9gc38r00019kvz7knfwydq',94.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,22,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g86ac0025ckvz6mx4cw5p','Alice 750ml','Alice 750ml','cmm9gc38r00019kvz7knfwydq',90.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,23,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g86aj0026ckvzg59yft5z','AKA Primitivo Rosato 750ml','AKA Primitivo Rosato 750ml','cmm9gc38r00019kvz7knfwydq',96.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,24,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g86ap0027ckvzs4nsex56','Lirica Primitivo di Manduria 750ml','Lirica Primitivo di Manduria 750ml','cmm9gc38r00019kvz7knfwydq',98.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,25,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g86au0028ckvzs5kv65sv','Wino Polskie 750ml','Wino Polskie 750ml','cmm9gc38r00019kvz7knfwydq',42.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,26,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g86az0029ckvzgy492926','Ozzi Chardonnay Białe 187ml','Ozzi Chardonnay Białe 187ml','cmm9gc38r00019kvz7knfwydq',19.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,27,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g86b4002ackvzt1om7pxl','Ozzi Shiraz Czerwone 187ml','Ozzi Shiraz Czerwone 187ml','cmm9gc38r00019kvz7knfwydq',19.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,28,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g86ba002bckvzzmrcvw93','Prosecco 200ml','Prosecco 200ml','cmm9gc38r00019kvz7knfwydq',29.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,29,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g86bh002cckvz9v98toqa','Pecunia Bianco 750ml','Pecunia Bianco 750ml','cmm9gc38r00019kvz7knfwydq',47.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,30,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g86bo002dckvzf5l9hkbm','Pecunia Moscato 750ml','Pecunia Moscato 750ml','cmm9gc38r00019kvz7knfwydq',57.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,31,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL),('cmm9g86bs002eckvzy38adbq1','Mołdawskie Storks 750ml','Mołdawskie Storks 750ml','cmm9gc38r00019kvz7knfwydq',42.00,NULL,'cmlw9tk0n0007v8vzhe0i4po0',1,1,2,32,NULL,NULL,NULL,NULL,0,0,1,NULL,0,0,0,0,0,NULL,NULL,0,0,0,0,'REGULAR',0,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productallergen`
--

DROP TABLE IF EXISTS `productallergen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productallergen` (
  `productId` varchar(191) NOT NULL,
  `allergenId` varchar(191) NOT NULL,
  PRIMARY KEY (`productId`,`allergenId`),
  KEY `ProductAllergen_allergenId_fkey` (`allergenId`),
  CONSTRAINT `ProductAllergen_allergenId_fkey` FOREIGN KEY (`allergenId`) REFERENCES `allergen` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `ProductAllergen_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productallergen`
--

LOCK TABLES `productallergen` WRITE;
/*!40000 ALTER TABLE `productallergen` DISABLE KEYS */;
INSERT INTO `productallergen` VALUES ('cmlw9tk8v0024v8vzrohei4f1','cmlw9tk1c000cv8vz65m58ipx'),('cmlw9tk8v0024v8vzrohei4f1','cmlw9tk1k000ev8vzk86gbz10'),('cmlw9tk9e0025v8vz67i5j08i','cmlw9tk1c000cv8vz65m58ipx'),('cmlw9tk9e0025v8vz67i5j08i','cmlw9tk1k000ev8vzk86gbz10'),('cmlw9tk9e0025v8vz67i5j08i','cmlw9tk1o000fv8vzeouwsrik'),('cmlw9tk9e0025v8vz67i5j08i','cmlw9tk1y000iv8vzvo99l4t2'),('cmlw9tk9t0026v8vzh6gn7t27','cmlw9tk1c000cv8vz65m58ipx'),('cmlw9tk9t0026v8vzh6gn7t27','cmlw9tk1k000ev8vzk86gbz10'),('cmlw9tk9t0026v8vzh6gn7t27','cmlw9tk22000jv8vzks6101yl'),('cmlw9tka70027v8vze8qelzug','cmlw9tk1c000cv8vz65m58ipx'),('cmlw9tka70027v8vze8qelzug','cmlw9tk22000jv8vzks6101yl'),('cmlw9tkaj0028v8vz73ap7rzi','cmlw9tk1c000cv8vz65m58ipx'),('cmlw9tkaj0028v8vz73ap7rzi','cmlw9tk1k000ev8vzk86gbz10'),('cmlw9tkav0029v8vzxtyx6jvh','cmlw9tk1u000hv8vzbc2p17sx'),('cmlw9tkav0029v8vzxtyx6jvh','cmlw9tk22000jv8vzks6101yl'),('cmlw9tkav0029v8vzxtyx6jvh','cmlw9tk26000kv8vzon5viow1'),('cmlw9tkb6002av8vzgvyxibon','cmlw9tk1o000fv8vzeouwsrik'),('cmlw9tkbe002bv8vzxgin1tb8','cmlw9tk1c000cv8vz65m58ipx'),('cmlw9tkbe002bv8vzxgin1tb8','cmlw9tk1y000iv8vzvo99l4t2'),('cmlw9tkbp002cv8vzn5jp7y9z','cmlw9tk1c000cv8vz65m58ipx'),('cmlw9tkbp002cv8vzn5jp7y9z','cmlw9tk1k000ev8vzk86gbz10'),('cmlw9tkbp002cv8vzn5jp7y9z','cmlw9tk1u000hv8vzbc2p17sx'),('cmlw9tkc1002dv8vzwc8bsk4j','cmlw9tk1c000cv8vz65m58ipx'),('cmlw9tkc1002dv8vzwc8bsk4j','cmlw9tk1k000ev8vzk86gbz10'),('cmlw9tkcf002ev8vzn1k1qr0n','cmlw9tk1y000iv8vzvo99l4t2'),('cmlw9tkd5002jv8vzatfuih88','cmlw9tk1c000cv8vz65m58ipx'),('cmlw9tkdc002kv8vzmom1gaoy','cmlw9tk1c000cv8vz65m58ipx'),('cmlw9tkdi002lv8vzxjc11h74','cmlw9tk2d000mv8vzdsxmxz08'),('cmlw9tkdp002mv8vzi9wxklkt','cmlw9tk2d000mv8vzdsxmxz08'),('cmlwabkw30000m0vz1mim4yki','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwabkwb0001m0vzknijm2vf','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabkwm0002m0vzspea5dcl','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwabkwu0003m0vz8a8n2l9b','cmlw9tk1o000fv8vzeouwsrik'),('cmlwabkx80004m0vz053n9gy9','cmlw9tk1o000fv8vzeouwsrik'),('cmlwabkx80004m0vz053n9gy9','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwabkxp0005m0vz25sz493p','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabkxp0005m0vz25sz493p','cmlw9tk1g000dv8vzflo8dlyj'),('cmlwabky50006m0vzrejqpklq','cmlw9tk1r000gv8vzy3cmt36q'),('cmlwabky50006m0vzrejqpklq','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwabkyi0007m0vz21tawqg5','cmlw9tk26000kv8vzon5viow1'),('cmlwabkys0008m0vzzrzvoz39','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabkys0008m0vzzrzvoz39','cmlw9tk1k000ev8vzk86gbz10'),('cmlwabkz70009m0vz9s8fivnz','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabkz70009m0vz9s8fivnz','cmlw9tk1k000ev8vzk86gbz10'),('cmlwabkzr000am0vz1vaijdbg','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabkzr000am0vz1vaijdbg','cmlw9tk1k000ev8vzk86gbz10'),('cmlwabkzr000am0vz1vaijdbg','cmlw9tk22000jv8vzks6101yl'),('cmlwabl0c000bm0vzups9dh87','cmlw9tk22000jv8vzks6101yl'),('cmlwabl0j000cm0vztquckhey','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabl0j000cm0vztquckhey','cmlw9tk1k000ev8vzk86gbz10'),('cmlwabl0j000cm0vztquckhey','cmlw9tk22000jv8vzks6101yl'),('cmlwabl0y000dm0vz3girfdk5','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwabl0y000dm0vz3girfdk5','cmlw9tk22000jv8vzks6101yl'),('cmlwabl1d000em0vzq41ve6zq','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwabl1d000em0vzq41ve6zq','cmlw9tk22000jv8vzks6101yl'),('cmlwabl1o000fm0vzk9ifzgwp','cmlw9tk22000jv8vzks6101yl'),('cmlwabl1y000gm0vzvxoeqi2l','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwabl1y000gm0vzvxoeqi2l','cmlw9tk22000jv8vzks6101yl'),('cmlwabl2b000hm0vze6kuppga','cmlw9tk22000jv8vzks6101yl'),('cmlwabl2j000im0vzf8dhkn89','cmlw9tk22000jv8vzks6101yl'),('cmlwabl2z000jm0vzkb1y065a','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabl2z000jm0vzkb1y065a','cmlw9tk1k000ev8vzk86gbz10'),('cmlwabl2z000jm0vzkb1y065a','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwabl3n000km0vzzwherx0y','cmlw9tk22000jv8vzks6101yl'),('cmlwabl3n000km0vzzwherx0y','cmlw9tk26000kv8vzon5viow1'),('cmlwabl43000lm0vzxkmckd0g','cmlw9tk22000jv8vzks6101yl'),('cmlwabl43000lm0vzxkmckd0g','cmlw9tk26000kv8vzon5viow1'),('cmlwabl4f000mm0vzq80ondth','cmlw9tk22000jv8vzks6101yl'),('cmlwabl4p000nm0vz43nc7tr7','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwabl53000pm0vzx707pouv','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabl53000pm0vzx707pouv','cmlw9tk22000jv8vzks6101yl'),('cmlwabl5g000qm0vz5y3kiq2y','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabl5g000qm0vz5y3kiq2y','cmlw9tk26000kv8vzon5viow1'),('cmlwabl5t000rm0vzd55z10mw','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabl5t000rm0vzd55z10mw','cmlw9tk22000jv8vzks6101yl'),('cmlwabl67000sm0vzlo89onrt','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabl67000sm0vzlo89onrt','cmlw9tk22000jv8vzks6101yl'),('cmlwabl6i000tm0vzq48zqies','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabl6i000tm0vzq48zqies','cmlw9tk1k000ev8vzk86gbz10'),('cmlwabl6v000um0vzw1tv8sdj','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabl6v000um0vzw1tv8sdj','cmlw9tk1k000ev8vzk86gbz10'),('cmlwabl6v000um0vzw1tv8sdj','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwabl7f000wm0vzgv4wiju2','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwabl7q000ym0vz7f9q1l2b','cmlw9tk26000kv8vzon5viow1'),('cmlwabl81000zm0vzvtukg2gq','cmlw9tk1o000fv8vzeouwsrik'),('cmlwabl81000zm0vzvtukg2gq','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwabl8b0010m0vz2zspnyeh','cmlw9tk1o000fv8vzeouwsrik'),('cmlwabl8j0011m0vzqyq1pv3l','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabl8j0011m0vzqyq1pv3l','cmlw9tk1k000ev8vzk86gbz10'),('cmlwabl8j0011m0vzqyq1pv3l','cmlw9tk1o000fv8vzeouwsrik'),('cmlwabl8w0012m0vz3lzuoa1z','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabl8w0012m0vz3lzuoa1z','cmlw9tk1k000ev8vzk86gbz10'),('cmlwabl8w0012m0vz3lzuoa1z','cmlw9tk1o000fv8vzeouwsrik'),('cmlwabl9g0013m0vzjto6846j','cmlw9tk1o000fv8vzeouwsrik'),('cmlwabl9n0014m0vzsjs3suzn','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabl9n0014m0vzsjs3suzn','cmlw9tk1k000ev8vzk86gbz10'),('cmlwabl9n0014m0vzsjs3suzn','cmlw9tk1o000fv8vzeouwsrik'),('cmlwabla00015m0vzlpjby7b9','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabla00015m0vzlpjby7b9','cmlw9tk1k000ev8vzk86gbz10'),('cmlwabla00015m0vzlpjby7b9','cmlw9tk1o000fv8vzeouwsrik'),('cmlwablad0016m0vzu0dx7tt8','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablad0016m0vzu0dx7tt8','cmlw9tk1k000ev8vzk86gbz10'),('cmlwablad0016m0vzu0dx7tt8','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablau0017m0vzzhsieapk','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablau0017m0vzzhsieapk','cmlw9tk1k000ev8vzk86gbz10'),('cmlwablbj0018m0vzuxdrxr76','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablbj0018m0vzuxdrxr76','cmlw9tk1k000ev8vzk86gbz10'),('cmlwablbx0019m0vzmna5sn2i','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablbx0019m0vzmna5sn2i','cmlw9tk1k000ev8vzk86gbz10'),('cmlwablbx0019m0vzmna5sn2i','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablcb001am0vzd689gren','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablcb001am0vzd689gren','cmlw9tk1k000ev8vzk86gbz10'),('cmlwablcb001am0vzd689gren','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablcq001bm0vzp831afol','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablcq001bm0vzp831afol','cmlw9tk1k000ev8vzk86gbz10'),('cmlwabld1001cm0vzwadgxhym','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabld1001cm0vzwadgxhym','cmlw9tk1k000ev8vzk86gbz10'),('cmlwabld1001cm0vzwadgxhym','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwabldp001dm0vzh6jiu2ac','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwabldx001em0vz7b212lzl','cmlw9tk1c000cv8vz65m58ipx'),('cmlwable8001fm0vzymbwt1g5','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablei001gm0vz068et8ki','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablei001gm0vz068et8ki','cmlw9tk1k000ev8vzk86gbz10'),('cmlwablei001gm0vz068et8ki','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablf1001hm0vznuhrift3','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablf1001hm0vznuhrift3','cmlw9tk1k000ev8vzk86gbz10'),('cmlwablf1001hm0vznuhrift3','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablfh001im0vz8d74lldh','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablfh001im0vz8d74lldh','cmlw9tk1k000ev8vzk86gbz10'),('cmlwablfh001im0vz8d74lldh','cmlw9tk1r000gv8vzy3cmt36q'),('cmlwablfh001im0vz8d74lldh','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablg4001jm0vz2f4x5knr','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablgc001km0vzrbewrhss','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablgl001lm0vzerlcpsah','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablgl001lm0vzerlcpsah','cmlw9tk1k000ev8vzk86gbz10'),('cmlwablgl001lm0vzerlcpsah','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablh2001mm0vz3s6hhpo5','cmlw9tk1k000ev8vzk86gbz10'),('cmlwablh2001mm0vz3s6hhpo5','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablhc001nm0vzlie0rxhx','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablhc001nm0vzlie0rxhx','cmlw9tk1k000ev8vzk86gbz10'),('cmlwablhc001nm0vzlie0rxhx','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablhp001om0vzclmpj4id','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablhp001om0vzclmpj4id','cmlw9tk1k000ev8vzk86gbz10'),('cmlwablhp001om0vzclmpj4id','cmlw9tk1r000gv8vzy3cmt36q'),('cmlwabli5001pm0vzyirksaa2','cmlw9tk1r000gv8vzy3cmt36q'),('cmlwabli5001pm0vzyirksaa2','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablir001sm0vzxjvxo9g9','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwabliy001tm0vzkzrucqu2','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablja001um0vzrh6amplv','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablji001vm0vzh72dtiou','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablk80020m0vz3rq74w23','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablkg0021m0vzhfufgh8o','cmlw9tk2d000mv8vzdsxmxz08'),('cmlwablmp002hm0vzehpiouxx','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablmy002im0vzzgv12330','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabln6002jm0vzgyn00yrt','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablnf002km0vz0g5318w6','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablnm002lm0vz3romxj0k','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablnx002mm0vzzhfm3cky','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablo3002nm0vzi35oaxog','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabloc002om0vzro9rcj0u','cmlw9tk1c000cv8vz65m58ipx'),('cmlwabloj002pm0vztqzkl9ef','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablow002qm0vz5v9iignu','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablpf002rm0vzo9rg5dr2','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablpp002sm0vzsm27m1z9','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablpy002tm0vzf1moy0z8','cmlw9tk1c000cv8vz65m58ipx'),('cmlwablq7002um0vzpfld0o1s','cmlw9tk2d000mv8vzdsxmxz08'),('cmlwablqi002vm0vzcmny9dm4','cmlw9tk2d000mv8vzdsxmxz08'),('cmlwablqx002wm0vzgvu96y4r','cmlw9tk2d000mv8vzdsxmxz08'),('cmlwablr5002xm0vzp703g30z','cmlw9tk2d000mv8vzdsxmxz08'),('cmlwablrb002ym0vz8mswgewt','cmlw9tk2d000mv8vzdsxmxz08'),('cmlwablri002zm0vzba361w0w','cmlw9tk2d000mv8vzdsxmxz08'),('cmlwablro0030m0vz4gw4zxtg','cmlw9tk2d000mv8vzdsxmxz08'),('cmlwablru0031m0vznallt6st','cmlw9tk2d000mv8vzdsxmxz08'),('cmlwabls40032m0vzz65bl4xm','cmlw9tk2d000mv8vzdsxmxz08'),('cmlwablsa0033m0vzdxm7ebey','cmlw9tk2d000mv8vzdsxmxz08'),('cmlwablsl0034m0vz2pjbbxnd','cmlw9tk2d000mv8vzdsxmxz08'),('cmlwabluf003km0vzyleu4sbq','cmlw9tk1y000iv8vzvo99l4t2'),('cmlwablul003lm0vzo0uyd1f7','cmlw9tk1r000gv8vzy3cmt36q'),('cmlxk8yqj001a74vzripuxjm0','cmlw9tk1y000iv8vzvo99l4t2'),('cmm9g85zn000cckvz2ablxo3c','cmlw9tk2d000mv8vzdsxmxz08'),('cmm9g85zu000dckvzdy8atakv','cmlw9tk2d000mv8vzdsxmxz08'),('cmm9g8616000hckvz6wthb4bo','cmlw9tk1y000iv8vzvo99l4t2'),('cmm9g861c000ickvzbwpbles9','cmlw9tk1y000iv8vzvo99l4t2'),('cmm9g861j000jckvzt7j04acs','cmlw9tk1y000iv8vzvo99l4t2'),('cmm9g861s000kckvzihp2bfvq','cmlw9tk1y000iv8vzvo99l4t2'),('cmm9g8640000yckvz8n4set9o','cmlw9tk1c000cv8vz65m58ipx'),('cmm9g8645000zckvzigtsv7vy','cmlw9tk1c000cv8vz65m58ipx'),('cmm9g864b0010ckvzx08hd23k','cmlw9tk1c000cv8vz65m58ipx'),('cmm9g864h0011ckvzdv4zo8v7','cmlw9tk1c000cv8vz65m58ipx'),('cmm9g864n0012ckvzd5yemeo2','cmlw9tk1c000cv8vz65m58ipx'),('cmm9g864s0013ckvzk2mzrnxj','cmlw9tk1c000cv8vz65m58ipx'),('cmm9g864w0014ckvzyhp8ms0x','cmlw9tk1c000cv8vz65m58ipx'),('cmm9g86510015ckvzh4795e4u','cmlw9tk1c000cv8vz65m58ipx'),('cmm9g865c0017ckvz65s7p3h9','cmlw9tk1c000cv8vz65m58ipx'),('cmm9g865h0018ckvzh4m4p03o','cmlw9tk1c000cv8vz65m58ipx'),('cmm9g865m0019ckvzg6l7df0o','cmlw9tk1c000cv8vz65m58ipx'),('cmm9g865q001ackvzhp0qp4p1','cmlw9tk1c000cv8vz65m58ipx'),('cmm9g865u001bckvzbmba8bxm','cmlw9tk1c000cv8vz65m58ipx'),('cmm9g865z001cckvzratg4s5s','cmlw9tk1c000cv8vz65m58ipx'),('cmm9g869w0022ckvz6gfq94t3','cmlw9tk2d000mv8vzdsxmxz08'),('cmm9g86a20023ckvz21yk4bqx','cmlw9tk2d000mv8vzdsxmxz08'),('cmm9g86a70024ckvz9jv1e6h2','cmlw9tk2d000mv8vzdsxmxz08'),('cmm9g86ac0025ckvz6mx4cw5p','cmlw9tk2d000mv8vzdsxmxz08'),('cmm9g86aj0026ckvzg59yft5z','cmlw9tk2d000mv8vzdsxmxz08'),('cmm9g86ap0027ckvzs4nsex56','cmlw9tk2d000mv8vzdsxmxz08'),('cmm9g86au0028ckvzs5kv65sv','cmlw9tk2d000mv8vzdsxmxz08'),('cmm9g86az0029ckvzgy492926','cmlw9tk2d000mv8vzdsxmxz08'),('cmm9g86b4002ackvzt1om7pxl','cmlw9tk2d000mv8vzdsxmxz08'),('cmm9g86ba002bckvzzmrcvw93','cmlw9tk2d000mv8vzdsxmxz08'),('cmm9g86bh002cckvz9v98toqa','cmlw9tk2d000mv8vzdsxmxz08'),('cmm9g86bo002dckvzf5l9hkbm','cmlw9tk2d000mv8vzdsxmxz08'),('cmm9g86bs002eckvzy38adbq1','cmlw9tk2d000mv8vzdsxmxz08');
/*!40000 ALTER TABLE `productallergen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productmodifiergroup`
--

DROP TABLE IF EXISTS `productmodifiergroup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productmodifiergroup` (
  `productId` varchar(191) NOT NULL,
  `modifierGroupId` varchar(191) NOT NULL,
  PRIMARY KEY (`productId`,`modifierGroupId`),
  KEY `ProductModifierGroup_modifierGroupId_fkey` (`modifierGroupId`),
  CONSTRAINT `ProductModifierGroup_modifierGroupId_fkey` FOREIGN KEY (`modifierGroupId`) REFERENCES `modifiergroup` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `ProductModifierGroup_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productmodifiergroup`
--

LOCK TABLES `productmodifiergroup` WRITE;
/*!40000 ALTER TABLE `productmodifiergroup` DISABLE KEYS */;
INSERT INTO `productmodifiergroup` VALUES ('cmlw9tkaj0028v8vz73ap7rzi','cmlwablvy003wm0vz6dex47o6'),('cmlw9tkaj0028v8vz73ap7rzi','cmlwablx90047m0vzi0f2uwh4'),('cmlw9tkav0029v8vzxtyx6jvh','cmlwablvy003wm0vz6dex47o6'),('cmlw9tkav0029v8vzxtyx6jvh','cmlwablx90047m0vzi0f2uwh4'),('cmlw9tkb6002av8vzgvyxibon','cmlwablvy003wm0vz6dex47o6'),('cmlw9tkb6002av8vzgvyxibon','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl2z000jm0vzkb1y065a','cmlwablvy003wm0vz6dex47o6'),('cmlwabl2z000jm0vzkb1y065a','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl3n000km0vzzwherx0y','cmlwablvy003wm0vz6dex47o6'),('cmlwabl3n000km0vzzwherx0y','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl43000lm0vzxkmckd0g','cmlwablvy003wm0vz6dex47o6'),('cmlwabl43000lm0vzxkmckd0g','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl4f000mm0vzq80ondth','cmlwablvy003wm0vz6dex47o6'),('cmlwabl4f000mm0vzq80ondth','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl4p000nm0vz43nc7tr7','cmlwablvb003qm0vzhup401mr'),('cmlwabl4p000nm0vz43nc7tr7','cmlwablvy003wm0vz6dex47o6'),('cmlwabl4p000nm0vz43nc7tr7','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl4z000om0vzf3qc6qos','cmlwablvb003qm0vzhup401mr'),('cmlwabl4z000om0vzf3qc6qos','cmlwablvy003wm0vz6dex47o6'),('cmlwabl4z000om0vzf3qc6qos','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl53000pm0vzx707pouv','cmlwablvy003wm0vz6dex47o6'),('cmlwabl53000pm0vzx707pouv','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl5g000qm0vz5y3kiq2y','cmlwablvy003wm0vz6dex47o6'),('cmlwabl5g000qm0vz5y3kiq2y','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl5t000rm0vzd55z10mw','cmlwablvy003wm0vz6dex47o6'),('cmlwabl5t000rm0vzd55z10mw','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl67000sm0vzlo89onrt','cmlwablvy003wm0vz6dex47o6'),('cmlwabl67000sm0vzlo89onrt','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl6i000tm0vzq48zqies','cmlwably4004fm0vz1vsuj0xi'),('cmlwabl6v000um0vzw1tv8sdj','cmlwablvy003wm0vz6dex47o6'),('cmlwabl6v000um0vzw1tv8sdj','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl7b000vm0vzsb3tcatf','cmlwablvy003wm0vz6dex47o6'),('cmlwabl7b000vm0vzsb3tcatf','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl7f000wm0vzgv4wiju2','cmlwablvy003wm0vz6dex47o6'),('cmlwabl7f000wm0vzgv4wiju2','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl7n000xm0vz3dpeewni','cmlwablvy003wm0vz6dex47o6'),('cmlwabl7n000xm0vz3dpeewni','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl81000zm0vzvtukg2gq','cmlwablvy003wm0vz6dex47o6'),('cmlwabl81000zm0vzvtukg2gq','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl8b0010m0vz2zspnyeh','cmlwablvy003wm0vz6dex47o6'),('cmlwabl8b0010m0vz2zspnyeh','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl8j0011m0vzqyq1pv3l','cmlwablvy003wm0vz6dex47o6'),('cmlwabl8j0011m0vzqyq1pv3l','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl8w0012m0vz3lzuoa1z','cmlwablvy003wm0vz6dex47o6'),('cmlwabl8w0012m0vz3lzuoa1z','cmlwablx90047m0vzi0f2uwh4'),('cmlwabl9n0014m0vzsjs3suzn','cmlwablvy003wm0vz6dex47o6'),('cmlwabl9n0014m0vzsjs3suzn','cmlwablx90047m0vzi0f2uwh4'),('cmlwabla00015m0vzlpjby7b9','cmlwablvy003wm0vz6dex47o6'),('cmlwabla00015m0vzlpjby7b9','cmlwablx90047m0vzi0f2uwh4'),('cmlwablad0016m0vzu0dx7tt8','cmlwably4004fm0vz1vsuj0xi'),('cmlwablau0017m0vzzhsieapk','cmlwably4004fm0vz1vsuj0xi'),('cmlwablir001sm0vzxjvxo9g9','cmlwablyk004jm0vzm4ba67kj'),('cmlwabliy001tm0vzkzrucqu2','cmlwablyk004jm0vzm4ba67kj'),('cmlwablja001um0vzrh6amplv','cmlwablyk004jm0vzm4ba67kj'),('cmm9g8616000hckvz6wthb4bo','cmlwablyk004jm0vzm4ba67kj'),('cmm9g861c000ickvzbwpbles9','cmlwablyk004jm0vzm4ba67kj'),('cmm9g861j000jckvzt7j04acs','cmlwablyk004jm0vzm4ba67kj'),('cmm9g861s000kckvzihp2bfvq','cmlwablyk004jm0vzm4ba67kj');
/*!40000 ALTER TABLE `productmodifiergroup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `unit` varchar(20) NOT NULL DEFAULT 'kg',
  `mergedIntoId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_name_key` (`name`),
  KEY `products_mergedIntoId_fkey` (`mergedIntoId`),
  CONSTRAINT `products_mergedIntoId_fkey` FOREIGN KEY (`mergedIntoId`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1540 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Bagietka','kg',NULL,'2026-03-04 10:59:58.000'),(2,'Beza karczma 2020 - porcja 2g - REC ( 27 | 001-050 | )','porcji',NULL,'2026-03-04 10:59:58.000'),(3,'Buraczki 2020 wesele (200g) - REC ( 137 | 101-150 | )','kg',NULL,'2026-03-04 10:59:58.000'),(4,'Buraczki 2020 wesele - REC ( 137 | 101-150 | )','kg',NULL,'2026-03-04 10:59:58.000'),(5,'Chleb biesiadny - weselny','kg',NULL,'2026-03-04 10:59:58.000'),(6,'Chleb krojony na dwudniową uroczystość','kg',NULL,'2026-03-04 10:59:58.000'),(7,'Chleb krojony na jednodniową uroczystość','kg',NULL,'2026-03-04 10:59:58.000'),(8,'Chleb na wiejski stół blaszkowy 2 kg','kg',NULL,'2026-03-04 10:59:58.000'),(9,'Ciasto francuskie[s]','kg',NULL,'2026-03-04 10:59:58.000'),(10,'Faworki karczma 2020 - REC ( 407 | 401-450 | )','szt',NULL,'2026-03-04 10:59:58.000'),(11,'Flaki - REC ( 22 | 001-050 | )','kg',NULL,'2026-03-04 10:59:58.000'),(12,'Frytki - REC ( 25 | 001-050 | )','kg',NULL,'2026-03-04 10:59:58.000'),(13,'Gałka lodów śmietankowych zielona budka - REC ( 373 | 351-400 | )','kg',NULL,'2026-03-04 10:59:58.000'),(14,'Gulaszowa 2020 wesele','kg',NULL,'2026-03-04 10:59:58.000'),(15,'Karkówka 1 plaster 2022 - REC ( 385 | 351-400 | )','kg',NULL,'2026-03-04 10:59:58.000'),(16,'Klasyczna sałatka jarzynowa  - REC ( 149 | 101-150 | )','kg',NULL,'2026-03-04 10:59:58.000'),(17,'Kopyto wieprzowe[s]','kg',NULL,'2026-03-04 10:59:58.000'),(18,'Makaron Domowy porcja 100g karczma 2020 - REC ( 371 | 351-400 | )','kg',NULL,'2026-03-04 10:59:58.000'),(19,'Mus z malin karczma 2020 1 litr - REC ( 368 | 351-400 | )','kg',NULL,'2026-03-04 10:59:58.000'),(20,'Placki ziemniaczane - REC ( 52 | 051-100 | )','porcja',NULL,'2026-03-04 10:59:58.000'),(21,'Puree pietruszkowe-chrzanowe karczma 2022 (porcja 300g) - REC ( 340 | 301-350 | )','porcja',NULL,'2026-03-04 10:59:58.000'),(22,'Puree ziemniaczane karczma 2020 porcja 110g - REC ( 377 | 351-400 | )','kg',NULL,'2026-03-04 10:59:58.000'),(23,'Rosół podreceptura - wywar bez makaronu (na 1 litr) - REC ( 53 | 051-100 | )','l',NULL,'2026-03-04 10:59:58.000'),(24,'Rosół podreceptura - wywar bez makaronu Porcja 300 ml - REC ( 53 | 051-100 | )','kg',NULL,'2026-03-04 10:59:58.000'),(25,'Sałatka Grecka 2020 karczma - REC ( 196 | 151-200 | )','kg',NULL,'2026-03-04 10:59:58.000'),(26,'Schab ze śliwką 2022 - REC ( 384 | 351-400 | )','kg',NULL,'2026-03-04 10:59:58.000'),(27,'Smalec słoik 100ml - REC ( 960 | 951-1000 | )','kg',NULL,'2026-03-04 10:59:58.000'),(28,'Sos Vinegret 2020 - REC ( 281 | 251-300 | )','kg',NULL,'2026-03-04 10:59:58.000'),(29,'Sos do sałatki z buraka 1l - REC ( 411 | 401-450 | )','l',NULL,'2026-03-04 10:59:58.000'),(30,'Sos koperkowy (porcja 40g) - REC ( 326 | 301-350 | )','porcji',NULL,'2026-03-04 10:59:58.000'),(31,'Sos słodko-kwaśny słoik 0,4 2020 - REC ( 412 | 401-450 | )','kg',NULL,'2026-03-04 10:59:58.000'),(32,'Surówka z kapusty białej 2020 wesele (100g) - REC ( 60 | 051-100 | )','kg',NULL,'2026-03-04 10:59:58.000'),(33,'Szaszłyk 2020 wesele - REC ( 199 | 151-200 | )','kg',NULL,'2026-03-04 10:59:58.000'),(34,'Szczaw[s]','kg',NULL,'2026-03-04 10:59:58.000'),(35,'Szpinak','kg',NULL,'2026-03-04 10:59:58.000'),(36,'Twarożek ziarnisty','kg',NULL,'2026-03-04 10:59:58.000'),(37,'W Farsz szpinakowy - REC ( 427 | 401-450 | )','kg',NULL,'2026-03-04 10:59:58.000'),(38,'W Pieczeń z karkówki w sosie własnym i kaszą pęczak 2023 wesele - REC ( 116 | 101-150 | )','kg',NULL,'2026-03-04 10:59:58.000'),(39,'W Sałatka Grecka 2023  - REC ( 196 | 151-200 | )','kg',NULL,'2026-03-04 10:59:58.000'),(40,'W Surówka z kapusty białej 2023 wesele  - REC ( 60 | 051-100 | )','kg',NULL,'2026-03-04 10:59:58.000'),(41,'W Żeberka na słodko 2023 wesele - REC ( 228 | 201-250 | )','kg',NULL,'2026-03-04 10:59:58.000'),(42,'W Żurek 2023 wesele - REC ( 15 | 001-050 | )','kg',NULL,'2026-03-04 10:59:58.000'),(43,'Winegret klasyczny - REC ( 956 | 951-1000 | )','kg',NULL,'2026-03-04 10:59:58.000'),(44,'Ziemniaki - REC ( 135 | 101-150 | )','porcji',NULL,'2026-03-04 10:59:58.000'),(45,'Ziemniaki zapiekane z rozmarynem Karczma 2020 - porcja 250g - REC ( 417 | 401-450 | )','kg',NULL,'2026-03-04 10:59:58.000'),(46,'Zywiec z nalewaka 0,5l - REC ( 35 | 001-050 | )','kg',NULL,'2026-03-04 10:59:58.000'),(47,'ananas','kg',NULL,'2026-03-04 10:59:58.000'),(48,'ananas kawałki','kg',NULL,'2026-03-04 10:59:58.000'),(49,'ananas konserwowy','kg',NULL,'2026-03-04 10:59:58.000'),(50,'ananas konserwowy plastry','kg',NULL,'2026-03-04 10:59:58.000'),(51,'antipasti papryczki nadziewane serkiem','kg',NULL,'2026-03-04 10:59:58.000'),(52,'bagietka de tradition','kg',NULL,'2026-03-04 10:59:58.000'),(53,'bagietka pszenna','kg',NULL,'2026-03-04 10:59:58.000'),(54,'banany','kg',NULL,'2026-03-04 10:59:58.000'),(55,'baza do deseru panna cotta [kg]','kg',NULL,'2026-03-04 10:59:58.000'),(56,'baza do lemoniady monin [litr]','litr',NULL,'2026-03-04 10:59:58.000'),(57,'bazylia cięta św','kg',NULL,'2026-03-04 10:59:58.000'),(58,'biszkopty','kg',NULL,'2026-03-04 10:59:58.000'),(59,'bita śmietana 26%','litr',NULL,'2026-03-04 10:59:58.000'),(60,'boczek parzony','kg',NULL,'2026-03-04 10:59:58.000'),(61,'boczek plastry','kg',NULL,'2026-03-04 10:59:58.000'),(62,'boczek surowy wędzony plastry','kg',NULL,'2026-03-04 10:59:58.000'),(63,'boczek wędzony','kg',NULL,'2026-03-04 10:59:58.000'),(64,'boczek wędzony parzony','kg',NULL,'2026-03-04 10:59:58.000'),(65,'borówka amerykańska','kg',NULL,'2026-03-04 10:59:58.000'),(66,'brokuły','kg',NULL,'2026-03-04 10:59:58.000'),(67,'brokuły mroż','kg',NULL,'2026-03-04 10:59:58.000'),(68,'bruschetta snack','kg',NULL,'2026-03-04 10:59:58.000'),(69,'brzoskwinia','kg',NULL,'2026-03-04 10:59:58.000'),(70,'brzoskwinia kostka konserwowa','kg',NULL,'2026-03-04 10:59:58.000'),(71,'brzoskwinie konserwowe','kg',NULL,'2026-03-04 10:59:58.000'),(72,'budyń waniliowy','kg',NULL,'2026-03-04 10:59:58.000'),(73,'budyń śmietankowy','kg',NULL,'2026-03-04 10:59:58.000'),(74,'bukiet warzywny mroż','kg',NULL,'2026-03-04 10:59:58.000'),(75,'burak','kg',NULL,'2026-03-04 10:59:58.000'),(76,'bułeczka rustykalna w stylu brioche 30 g','szt',NULL,'2026-03-04 10:59:58.000'),(77,'bułka tarta','kg',NULL,'2026-03-04 10:59:58.000'),(78,'cebula','kg',NULL,'2026-03-04 10:59:58.000'),(79,'cebula czerwona','kg',NULL,'2026-03-04 10:59:58.000'),(80,'chałwa waniliowa','kg',NULL,'2026-03-04 10:59:58.000'),(81,'chleb baltonowski krojony','kg',NULL,'2026-03-04 10:59:58.000'),(82,'chleb do żurku','szt',NULL,'2026-03-04 10:59:58.000'),(83,'chleb krojony','kg',NULL,'2026-03-04 10:59:58.000'),(84,'chleb tostowy','kg',NULL,'2026-03-04 10:59:58.000'),(85,'chleb żytni z ziarnami','kg',NULL,'2026-03-04 10:59:58.000'),(86,'chrzan tarty','kg',NULL,'2026-03-04 10:59:58.000'),(87,'ciastka delicje','kg',NULL,'2026-03-04 10:59:58.000'),(88,'ciastka oreo','kg',NULL,'2026-03-04 10:59:58.000'),(89,'ciastka pianki kolorowe bezy','kg',NULL,'2026-03-04 10:59:58.000'),(90,'ciasto francuskie','kg',NULL,'2026-03-04 10:59:58.000'),(91,'ciasto vol au vent 4,5 cm szt','szt',NULL,'2026-03-04 10:59:58.000'),(92,'cieciorka/ciecierzyca','kg',NULL,'2026-03-04 10:59:58.000'),(93,'ciepłe lody mini','szt',NULL,'2026-03-04 10:59:58.000'),(94,'cukier','kg',NULL,'2026-03-04 10:59:58.000'),(95,'cukier puder','kg',NULL,'2026-03-04 10:59:58.000'),(96,'cukier trzcinowy','kg',NULL,'2026-03-04 10:59:58.000'),(97,'cukier wanilinowy','kg',NULL,'2026-03-04 10:59:58.000'),(98,'cukier waniliowy','kg',NULL,'2026-03-04 10:59:58.000'),(99,'cukinia','kg',NULL,'2026-03-04 10:59:58.000'),(100,'curry[s]','kg',NULL,'2026-03-04 10:59:58.000'),(101,'cytryny','kg',NULL,'2026-03-04 10:59:58.000'),(102,'czekolada biała','kg',NULL,'2026-03-04 10:59:58.000'),(103,'czekolada deserowa','kg',NULL,'2026-03-04 10:59:58.000'),(104,'czekolada gorzka','kg',NULL,'2026-03-04 10:59:58.000'),(105,'czekolada wiadro do rozpuszczania[s]','kg',NULL,'2026-03-04 10:59:58.000'),(106,'czosnek','kg',NULL,'2026-03-04 10:59:58.000'),(107,'dorsz czarny. czarniak filet bs','kg',NULL,'2026-03-04 10:59:58.000'),(108,'dorsz czarny/czarniak filet mr','kg',NULL,'2026-03-04 10:59:58.000'),(109,'drażetki','kg',NULL,'2026-03-04 10:59:58.000'),(110,'drożdże','kg',NULL,'2026-03-04 10:59:58.000'),(111,'dynia','kg',NULL,'2026-03-04 10:59:58.000'),(112,'fasola biała konserwowa','kg',NULL,'2026-03-04 10:59:58.000'),(113,'fasola czerwona konserwowa','kg',NULL,'2026-03-04 10:59:58.000'),(114,'fasola sucha biała','kg',NULL,'2026-03-04 10:59:58.000'),(115,'fasola sucha typu jaś','kg',NULL,'2026-03-04 10:59:58.000'),(116,'fasola szparagowa mr','kg',NULL,'2026-03-04 10:59:58.000'),(117,'fasola szparagowa zielona św','kg',NULL,'2026-03-04 10:59:58.000'),(118,'fasola zielona szparagowa','kg',NULL,'2026-03-04 10:59:58.000'),(119,'filet.pierś z indyka','kg',NULL,'2026-03-04 10:59:58.000'),(120,'filet.pierś z kurczaka','kg',NULL,'2026-03-04 10:59:58.000'),(121,'filet.pierś z kurczaka wędzona','kg',NULL,'2026-03-04 10:59:58.000'),(122,'fix do śmietany','kg',NULL,'2026-03-04 10:59:58.000'),(123,'flaki krojone','kg',NULL,'2026-03-04 10:59:58.000'),(124,'frużelina wiśniowa/wiśnia w żelu b/c','kg',NULL,'2026-03-04 10:59:58.000'),(125,'frytki','kg',NULL,'2026-03-04 10:59:58.000'),(126,'frytki alphabytes','kg',NULL,'2026-03-04 10:59:58.000'),(127,'frytura','litr',NULL,'2026-03-04 10:59:58.000'),(128,'galaretka agrestowa','kg',NULL,'2026-03-04 10:59:58.000'),(129,'galaretka cytrynowa','kg',NULL,'2026-03-04 10:59:58.000'),(130,'galaretka malinowa','kg',NULL,'2026-03-04 10:59:58.000'),(131,'galaretka niebieska wieloowocowa','kg',NULL,'2026-03-04 10:59:58.000'),(132,'galaretka truskawkowa','kg',NULL,'2026-03-04 10:59:58.000'),(133,'galaretka wiśniowa','kg',NULL,'2026-03-04 10:59:58.000'),(134,'golonka','kg',NULL,'2026-03-04 10:59:58.000'),(135,'granat','kg',NULL,'2026-03-04 10:59:58.000'),(136,'groch łuskany','kg',NULL,'2026-03-04 10:59:58.000'),(137,'groszek konserwowy','kg',NULL,'2026-03-04 10:59:58.000'),(138,'gruszka','kg',NULL,'2026-03-04 10:59:58.000'),(139,'grzaniec galicyjski','litr',NULL,'2026-03-04 10:59:58.000'),(140,'herbata eilles assam special czarna szt','szt',NULL,'2026-03-04 10:59:58.000'),(141,'herbata eilles gruentee asia superior zielona','szt',NULL,'2026-03-04 10:59:58.000'),(142,'herbata lipton yellow label szt','szt',NULL,'2026-03-04 10:59:58.000'),(143,'herbata pallavi assam sasz','szt',NULL,'2026-03-04 10:59:58.000'),(144,'herbatniki maślane','kg',NULL,'2026-03-04 10:59:58.000'),(145,'herbatniki maślane choco/czekoladowe','kg',NULL,'2026-03-04 10:59:58.000'),(146,'herbatniki petit beurre','kg',NULL,'2026-03-04 10:59:58.000'),(147,'imbir','kg',NULL,'2026-03-04 10:59:58.000'),(148,'jabłka','kg',NULL,'2026-03-04 10:59:58.000'),(149,'jabłko prażone','kg',NULL,'2026-03-04 10:59:58.000'),(150,'jaja','szt',NULL,'2026-03-04 10:59:58.000'),(151,'jakaś surówka','kg',NULL,'2026-03-04 10:59:58.000'),(152,'jogurt naturalny','kg',NULL,'2026-03-04 10:59:58.000'),(153,'kabanosy','kg',NULL,'2026-03-04 10:59:58.000'),(154,'kaczka','kg',NULL,'2026-03-04 10:59:58.000'),(155,'kakao','kg',NULL,'2026-03-04 10:59:58.000'),(156,'kalafior mroż','kg',NULL,'2026-03-04 10:59:58.000'),(157,'kapary','kg',NULL,'2026-03-04 10:59:58.000'),(158,'kapusta biała','kg',NULL,'2026-03-04 10:59:58.000'),(159,'kapusta czerwona','kg',NULL,'2026-03-04 10:59:58.000'),(160,'kapusta kwaszona.kiszona','kg',NULL,'2026-03-04 10:59:58.000'),(161,'kapusta pekińska','kg',NULL,'2026-03-04 10:59:58.000'),(162,'karczochy grillowane w oleju','kg',NULL,'2026-03-04 10:59:58.000'),(163,'karkówka','kg',NULL,'2026-03-04 10:59:58.000'),(164,'karkówka wieprzowa b/k','kg',NULL,'2026-03-04 10:59:58.000'),(165,'karp płat. filet','kg',NULL,'2026-03-04 10:59:58.000'),(166,'kasza gryczana','kg',NULL,'2026-03-04 10:59:58.000'),(167,'kasza jęczmienna','kg',NULL,'2026-03-04 10:59:58.000'),(168,'kasza pęczak','kg',NULL,'2026-03-04 10:59:58.000'),(169,'kawa cappucino mokate śmietankowe','kg',NULL,'2026-03-04 10:59:58.000'),(170,'kawa instagold rozpuszczalna','kg',NULL,'2026-03-04 10:59:58.000'),(171,'kawa jacobs kronung mielona','kg',NULL,'2026-03-04 10:59:58.000'),(172,'kawa rospuszczalna','kg',NULL,'2026-03-04 10:59:58.000'),(173,'ketchup','kg',NULL,'2026-03-04 10:59:58.000'),(174,'kiełbasa biała parzona','kg',NULL,'2026-03-04 10:59:58.000'),(175,'kiełbasa krakowska','kg',NULL,'2026-03-04 10:59:58.000'),(176,'kiełbasa zwyczajna','kg',NULL,'2026-03-04 10:59:58.000'),(177,'kiwi','kg',NULL,'2026-03-04 10:59:58.000'),(178,'kluski śląskie mroż','kg',NULL,'2026-03-04 10:59:58.000'),(179,'koncentrat','kg',NULL,'2026-03-04 10:59:58.000'),(180,'koncentrat barszcz czerwony','litr',NULL,'2026-03-04 10:59:58.000'),(181,'koncentrat pomidorowy','kg',NULL,'2026-03-04 10:59:58.000'),(182,'koncentrat pomidorowy[s]','kg',NULL,'2026-03-04 10:59:58.000'),(183,'konfitura porzeczkowa','kg',NULL,'2026-03-04 10:59:58.000'),(184,'konfitura wiśnia','kg',NULL,'2026-03-04 10:59:58.000'),(185,'koperek','kg',NULL,'2026-03-04 10:59:58.000'),(186,'kopytka','kg',NULL,'2026-03-04 10:59:58.000'),(187,'kopytka luzem mroż','kg',NULL,'2026-03-04 10:59:58.000'),(188,'korpus kruchy słony','kg',NULL,'2026-03-04 10:59:58.000'),(189,'korpus z kurczaka','kg',NULL,'2026-03-04 10:59:58.000'),(190,'kości wędzone','kg',NULL,'2026-03-04 10:59:58.000'),(191,'krakersy','kg',NULL,'2026-03-04 10:59:58.000'),(192,'krem do karpatki','kg',NULL,'2026-03-04 10:59:58.000'),(193,'krem kakaowo orzechowy','kg',NULL,'2026-03-04 10:59:58.000'),(194,'krewetka koktajlowa 300/500','kg',NULL,'2026-03-04 10:59:58.000'),(195,'kukurydza konserwowa','kg',NULL,'2026-03-04 10:59:58.000'),(196,'kurczak udo/udziec/bioderko trybowane z/s św','kg',NULL,'2026-03-04 10:59:58.000'),(197,'kwasek cytrynowy','kg',NULL,'2026-03-04 10:59:58.000'),(198,'likier advocat dalkowski','litr',NULL,'2026-03-04 10:59:58.000'),(199,'likier amaretto diletto','litr',NULL,'2026-03-04 10:59:58.000'),(200,'likier jajeczny advocaat','litr',NULL,'2026-03-04 10:59:58.000'),(201,'limonka/lemonka św','kg',NULL,'2026-03-04 10:59:58.000'),(202,'lody bracia kuweta śmietankowe','litr',NULL,'2026-03-04 10:59:58.000'),(203,'lody bracia kuweta śmietankowe z wiśnią','litr',NULL,'2026-03-04 10:59:58.000'),(204,'lody budka kuweta śmietanka','litr',NULL,'2026-03-04 10:59:58.000'),(205,'lody grycan kuweta truskawkowe','litr',NULL,'2026-03-04 10:59:58.000'),(206,'lody grycan kuweta waniliowe','litr',NULL,'2026-03-04 10:59:58.000'),(207,'lody grycan pistacja [litr]','litr',NULL,'2026-03-04 10:59:58.000'),(208,'lody koral kuweta śmietanka','litr',NULL,'2026-03-04 10:59:58.000'),(209,'lód w kostkach','kg',NULL,'2026-03-04 10:59:58.000'),(210,'majonez','litr',NULL,'2026-03-04 10:59:58.000'),(211,'majonez [kg]','kg',NULL,'2026-03-04 10:59:58.000'),(212,'mak','kg',NULL,'2026-03-04 10:59:58.000'),(213,'makaron nitka cięta','kg',NULL,'2026-03-04 10:59:58.000'),(214,'makaron penne','kg',NULL,'2026-03-04 10:59:58.000'),(215,'makaron spaghetti','kg',NULL,'2026-03-04 10:59:58.000'),(216,'makaron wiejski krajanka','kg',NULL,'2026-03-04 10:59:58.000'),(217,'makaron łazanka','kg',NULL,'2026-03-04 10:59:58.000'),(218,'makaron świderki 3 kolory','kg',NULL,'2026-03-04 10:59:58.000'),(219,'makrela wędzona','kg',NULL,'2026-03-04 10:59:58.000'),(220,'malina grys mrożona','kg',NULL,'2026-03-04 10:59:58.000'),(221,'maliny','kg',NULL,'2026-03-04 10:59:58.000'),(222,'maliny mroż','kg',NULL,'2026-03-04 10:59:58.000'),(223,'mandarynka','kg',NULL,'2026-03-04 10:59:58.000'),(224,'marchew','kg',NULL,'2026-03-04 10:59:58.000'),(225,'marchew junior mr','kg',NULL,'2026-03-04 10:59:58.000'),(226,'marchew obrana św','kg',NULL,'2026-03-04 10:59:58.000'),(227,'marchew z groszkiem','kg',NULL,'2026-03-04 10:59:58.000'),(228,'margaryna','kg',NULL,'2026-03-04 10:59:58.000'),(229,'margaryna do wypieków','kg',NULL,'2026-03-04 10:59:58.000'),(230,'masa jabłkowa [kg]','kg',NULL,'2026-03-04 10:59:58.000'),(231,'masło','kg',NULL,'2026-03-04 10:59:58.000'),(232,'maślanka','litr',NULL,'2026-03-04 10:59:58.000'),(233,'mielone wp woł','kg',NULL,'2026-03-04 10:59:58.000'),(234,'mieso ze strusia','kg',NULL,'2026-03-04 10:59:58.000'),(235,'migdały płatki','kg',NULL,'2026-03-04 10:59:58.000'),(236,'miruna kostka mr','kg',NULL,'2026-03-04 10:59:58.000'),(237,'mix sałat - REC ( 235 | 201-250 | )','kg',NULL,'2026-03-04 10:59:58.000'),(238,'miód lipowy','kg',NULL,'2026-03-04 10:59:58.000'),(239,'miód wielokwiatowy','kg',NULL,'2026-03-04 10:59:58.000'),(240,'mięso gulaszowe','kg',NULL,'2026-03-04 10:59:58.000'),(241,'mięso mielone wieprzowe','kg',NULL,'2026-03-04 10:59:58.000'),(242,'mięso mielone/nieoznaczone','kg',NULL,'2026-03-04 10:59:58.000'),(243,'mięta cięta','kg',NULL,'2026-03-04 10:59:58.000'),(244,'mięta doniczka','kg',NULL,'2026-03-04 10:59:58.000'),(245,'mleczna masa toffi','kg',NULL,'2026-03-04 10:59:58.000'),(246,'mleko 2%','litr',NULL,'2026-03-04 10:59:58.000'),(247,'mleko 3,2%','litr',NULL,'2026-03-04 10:59:58.000'),(248,'mleko w proszku','kg',NULL,'2026-03-04 10:59:58.000'),(249,'mleko zsiadłe [kg]','kg',NULL,'2026-03-04 10:59:58.000'),(250,'musztarda francuska','kg',NULL,'2026-03-04 10:59:58.000'),(251,'musztarda sarepska','kg',NULL,'2026-03-04 10:59:58.000'),(252,'mąka krupczatka typ 450','kg',NULL,'2026-03-04 10:59:58.000'),(253,'mąka luksusowa typ 550','kg',NULL,'2026-03-04 10:59:58.000'),(254,'mąka pszenna','kg',NULL,'2026-03-04 10:59:58.000'),(255,'mąka pszenna tortowa typ 450','kg',NULL,'2026-03-04 10:59:58.000'),(256,'mąka pszenna typ 480','kg',NULL,'2026-03-04 10:59:58.000'),(257,'mąka tortowa typ 450','kg',NULL,'2026-03-04 10:59:58.000'),(258,'napój coca cola 0,2l','szt',NULL,'2026-03-04 10:59:58.000'),(259,'napój coca cola pet','litr',NULL,'2026-03-04 10:59:58.000'),(260,'napój fanta orange pet','litr',NULL,'2026-03-04 10:59:58.000'),(261,'napój sprite pet','litr',NULL,'2026-03-04 10:59:58.000'),(262,'nektarynka','kg',NULL,'2026-03-04 10:59:58.000'),(263,'noga z gęsi mr','kg',NULL,'2026-03-04 10:59:58.000'),(264,'noga z kurczaka b.k','kg',NULL,'2026-03-04 10:59:58.000'),(265,'ocet','litr',NULL,'2026-03-04 10:59:58.000'),(266,'ocet jabłkowy','litr',NULL,'2026-03-04 10:59:58.000'),(267,'ocet winny biały','litr',NULL,'2026-03-04 10:59:58.000'),(268,'ogórek konserwowy sałatkowy','kg',NULL,'2026-03-04 10:59:58.000'),(269,'ogórek kwaszony.kiszony','kg',NULL,'2026-03-04 10:59:58.000'),(270,'ogórek małosolny','kg',NULL,'2026-03-04 10:59:58.000'),(271,'ogórek św','kg',NULL,'2026-03-04 10:59:58.000'),(272,'ogórki konserwowe','kg',NULL,'2026-03-04 10:59:58.000'),(273,'okrasa do pierogów karczma 2020 porcja 30 g - REC ( 379 | 351-400 | )','kg',NULL,'2026-03-04 10:59:58.000'),(274,'olej uniwersalny','litr',NULL,'2026-03-04 10:59:58.000'),(275,'oliwa extra virgin','litr',NULL,'2026-03-04 10:59:58.000'),(276,'oliwki czarne','kg',NULL,'2026-03-04 10:59:58.000'),(277,'oliwki czarne drylowane','kg',NULL,'2026-03-04 10:59:58.000'),(278,'oliwki z czosnkiem','kg',NULL,'2026-03-04 10:59:58.000'),(279,'oliwki zielone','kg',NULL,'2026-03-04 10:59:58.000'),(280,'orzech laskowy','kg',NULL,'2026-03-04 10:59:58.000'),(281,'orzech włoski','kg',NULL,'2026-03-04 10:59:58.000'),(282,'orzech ziemny prażony','kg',NULL,'2026-03-04 10:59:58.000'),(283,'otręby owsiane','kg',NULL,'2026-03-04 10:59:58.000'),(284,'pachwina','kg',NULL,'2026-03-04 10:59:58.000'),(285,'papryka czerwona','kg',NULL,'2026-03-04 10:59:58.000'),(286,'papryka czerwona św','kg',NULL,'2026-03-04 10:59:58.000'),(287,'papryka konserwowa paski/cięta','kg',NULL,'2026-03-04 10:59:58.000'),(288,'papryka konserwowa ćwiartki','kg',NULL,'2026-03-04 10:59:58.000'),(289,'papryka żółta','kg',NULL,'2026-03-04 10:59:58.000'),(290,'pasztecik 2020 wesele - REC ( 251 | 251-300 | )','porcja',NULL,'2026-03-04 10:59:58.000'),(291,'pałka.podudzie z kurczaka','kg',NULL,'2026-03-04 10:59:58.000'),(292,'pestki dyni','kg',NULL,'2026-03-04 10:59:58.000'),(293,'pestki dyni łuskane','kg',NULL,'2026-03-04 10:59:58.000'),(294,'pieczarka św','kg',NULL,'2026-03-04 10:59:58.000'),(295,'pieczarki','kg',NULL,'2026-03-04 10:59:58.000'),(296,'pieczarki marynowane','kg',NULL,'2026-03-04 10:59:58.000'),(297,'pieprz czarny młotkowany','kg',NULL,'2026-03-04 10:59:58.000'),(298,'pieprz zielony w zalewie','kg',NULL,'2026-03-04 10:59:58.000'),(299,'pierogi ruskie','kg',NULL,'2026-03-04 10:59:58.000'),(300,'pierogi z kapustą i grzybami','kg',NULL,'2026-03-04 10:59:58.000'),(301,'pierogi z mięsem','kg',NULL,'2026-03-04 10:59:58.000'),(302,'pietruszka korzeń','kg',NULL,'2026-03-04 10:59:58.000'),(303,'pietruszka korzeń obrana św','kg',NULL,'2026-03-04 10:59:58.000'),(304,'pietruszka natka','kg',NULL,'2026-03-04 10:59:58.000'),(305,'piwo eb 0,5l','szt',NULL,'2026-03-04 10:59:58.000'),(306,'piwo warka 0,5l','szt',NULL,'2026-03-04 10:59:58.000'),(307,'piwo żywiec 0,5l','szt',NULL,'2026-03-04 10:59:58.000'),(308,'plamiak/łupacz filet','kg',NULL,'2026-03-04 10:59:58.000'),(309,'podgrzybek  kruszony mroż','kg',NULL,'2026-03-04 10:59:58.000'),(310,'podgrzybek cały mroż','kg',NULL,'2026-03-04 10:59:58.000'),(311,'podgrzybek kostka mroż','kg',NULL,'2026-03-04 10:59:58.000'),(312,'podgrzybek suszony krojony','kg',NULL,'2026-03-04 10:59:58.000'),(313,'pogdrzybek suszony krojony','kg',NULL,'2026-03-04 10:59:58.000'),(314,'polewa czekoladowa','kg',NULL,'2026-03-04 10:59:58.000'),(315,'polewa truskawkowa','kg',NULL,'2026-03-04 10:59:58.000'),(316,'polędwica wp','kg',NULL,'2026-03-04 10:59:58.000'),(317,'pomarańcz','kg',NULL,'2026-03-04 10:59:58.000'),(318,'pomidor','kg',NULL,'2026-03-04 10:59:58.000'),(319,'pomidor koktajlowy cherry','kg',NULL,'2026-03-04 10:59:58.000'),(320,'pomidory pelati','kg',NULL,'2026-03-04 10:59:58.000'),(321,'pomidory suszone w oleju','kg',NULL,'2026-03-04 10:59:58.000'),(322,'por','kg',NULL,'2026-03-04 10:59:58.000'),(323,'porzeczka czerwona','kg',NULL,'2026-03-04 10:59:58.000'),(324,'posypka czekoladowa deserowa','kg',NULL,'2026-03-04 10:59:58.000'),(325,'precelki','kg',NULL,'2026-03-04 10:59:58.000'),(326,'primerba grzybowa','kg',NULL,'2026-03-04 10:59:58.000'),(327,'proszek do pieczenia','kg',NULL,'2026-03-04 10:59:58.000'),(328,'przedżołądki wołowe kroj','kg',NULL,'2026-03-04 10:59:58.000'),(329,'przyprawa bazylia','kg',NULL,'2026-03-04 10:59:58.000'),(330,'przyprawa curry','kg',NULL,'2026-03-04 10:59:58.000'),(331,'przyprawa cynamon','kg',NULL,'2026-03-04 10:59:58.000'),(332,'przyprawa czosnek granulowany','kg',NULL,'2026-03-04 10:59:58.000'),(333,'przyprawa do drobiu','kg',NULL,'2026-03-04 10:59:58.000'),(334,'przyprawa do piernika','kg',NULL,'2026-03-04 10:59:58.000'),(335,'przyprawa do potraw','kg',NULL,'2026-03-04 10:59:58.000'),(336,'przyprawa do ziemniaków','kg',NULL,'2026-03-04 10:59:58.000'),(337,'przyprawa do żeberek z miodem','kg',NULL,'2026-03-04 10:59:58.000'),(338,'przyprawa fix do potraw chińskich','kg',NULL,'2026-03-04 10:59:58.000'),(339,'przyprawa gałka muszkatołowa','kg',NULL,'2026-03-04 10:59:58.000'),(340,'przyprawa goździki','kg',NULL,'2026-03-04 10:59:58.000'),(341,'przyprawa kebab gyros','kg',NULL,'2026-03-04 10:59:58.000'),(342,'przyprawa kucharek','kg',NULL,'2026-03-04 10:59:58.000'),(343,'przyprawa liść laurowy','kg',NULL,'2026-03-04 10:59:58.000'),(344,'przyprawa majeranek','kg',NULL,'2026-03-04 10:59:58.000'),(345,'przyprawa papryka ostra','kg',NULL,'2026-03-04 10:59:58.000'),(346,'przyprawa papryka słodka','kg',NULL,'2026-03-04 10:59:58.000'),(347,'przyprawa papryka wędzona słodka','kg',NULL,'2026-03-04 10:59:58.000'),(348,'przyprawa pieprz czarny mielony','kg',NULL,'2026-03-04 10:59:58.000'),(349,'przyprawa pieprz ziołowy','kg',NULL,'2026-03-04 10:59:58.000'),(350,'przyprawa tymianek suszony','kg',NULL,'2026-03-04 10:59:58.000'),(351,'przyprawa uniwersalna do potraw','kg',NULL,'2026-03-04 10:59:58.000'),(352,'przyprawa w płynie','litr',NULL,'2026-03-04 10:59:58.000'),(353,'przyprawa ziele angielskie','kg',NULL,'2026-03-04 10:59:58.000'),(354,'przyprawy piernika','kg',NULL,'2026-03-04 10:59:58.000'),(355,'pstrąg filet św','kg',NULL,'2026-03-04 10:59:58.000'),(356,'pstrąg patroszony z gł','kg',NULL,'2026-03-04 10:59:58.000'),(357,'pstrąg wędzony','kg',NULL,'2026-03-04 10:59:58.000'),(358,'pstrąg św','kg',NULL,'2026-03-04 10:59:58.000'),(359,'puree mango [kg]','kg',NULL,'2026-03-04 10:59:58.000'),(360,'płatki kukurydziane','kg',NULL,'2026-03-04 10:59:58.000'),(361,'rabarbar św','kg',NULL,'2026-03-04 10:59:58.000'),(362,'rama cremefine profi 31% wielofunkcyjna/do ubijania [litr]','litr',NULL,'2026-03-04 10:59:58.000'),(363,'rama culinesse [kg]','kg',NULL,'2026-03-04 10:59:58.000'),(364,'rodzynki','kg',NULL,'2026-03-04 10:59:58.000'),(365,'rolada drobiowa 2020 wesele (cala rolada - 10 porcji) - REC ( 220 | 201-250 | )','porcji',NULL,'2026-03-04 10:59:58.000'),(366,'rolmopsy w occie','kg',NULL,'2026-03-04 10:59:58.000'),(367,'roszponka','kg',NULL,'2026-03-04 10:59:58.000'),(368,'rozmaryn cięty','kg',NULL,'2026-03-04 10:59:58.000'),(369,'rucola.rukola','kg',NULL,'2026-03-04 10:59:58.000'),(370,'rurka pusta','kg',NULL,'2026-03-04 10:59:58.000'),(371,'ryż','kg',NULL,'2026-03-04 10:59:58.000'),(372,'ryż długoziarnisty','kg',NULL,'2026-03-04 10:59:58.000'),(373,'ryż paraboliczny','kg',NULL,'2026-03-04 10:59:58.000'),(374,'rzodkiewka','kg',NULL,'2026-03-04 10:59:58.000'),(375,'sandacz filet','kg',NULL,'2026-03-04 10:59:58.000'),(376,'sandacz filet z/s mr','kg',NULL,'2026-03-04 10:59:58.000'),(377,'sandacz filet zs','kg',NULL,'2026-03-04 10:59:58.000'),(378,'sałata lodowa','kg',NULL,'2026-03-04 10:59:58.000'),(379,'sałata masłowa','kg',NULL,'2026-03-04 10:59:58.000'),(380,'sałata mix św','kg',NULL,'2026-03-04 10:59:58.000'),(381,'sałata ozdobna','kg',NULL,'2026-03-04 10:59:58.000'),(382,'sałata rzymska mini','kg',NULL,'2026-03-04 10:59:58.000'),(383,'sałatka orzeźwiająca 2020 wesele - REC ( 233 | 201-250 | )','kg',NULL,'2026-03-04 10:59:58.000'),(384,'sałatka z ryżem i ananasem - REC ( 286 | 251-300 | )','kg',NULL,'2026-03-04 10:59:58.000'),(385,'schab b.k','kg',NULL,'2026-03-04 10:59:58.000'),(386,'schab z.k','kg',NULL,'2026-03-04 10:59:58.000'),(387,'seler konserwowy','kg',NULL,'2026-03-04 10:59:58.000'),(388,'seler korzeń','kg',NULL,'2026-03-04 10:59:58.000'),(389,'seler korzeń obrany św','kg',NULL,'2026-03-04 10:59:58.000'),(390,'ser brie','kg',NULL,'2026-03-04 10:59:58.000'),(391,'ser camembert','kg',NULL,'2026-03-04 10:59:58.000'),(392,'ser cheddar','kg',NULL,'2026-03-04 10:59:58.000'),(393,'ser corregio','kg',NULL,'2026-03-04 10:59:58.000'),(394,'ser corregio tarty','kg',NULL,'2026-03-04 10:59:58.000'),(395,'ser favita','kg',NULL,'2026-03-04 10:59:58.000'),(396,'ser feta/favita/sałatkowy light','kg',NULL,'2026-03-04 10:59:58.000'),(397,'ser feta/favita/sałatkowy w kostkach','kg',NULL,'2026-03-04 10:59:58.000'),(398,'ser gorgonzola','kg',NULL,'2026-03-04 10:59:58.000'),(399,'ser gouda','kg',NULL,'2026-03-04 10:59:58.000'),(400,'ser gouda zielone pesto','kg',NULL,'2026-03-04 10:59:58.000'),(401,'ser grana padano','kg',NULL,'2026-03-04 10:59:58.000'),(402,'ser kozi','kg',NULL,'2026-03-04 10:59:58.000'),(403,'ser mascarpone','kg',NULL,'2026-03-04 10:59:58.000'),(404,'ser mazdamer','kg',NULL,'2026-03-04 10:59:58.000'),(405,'ser mozzarella blok','kg',NULL,'2026-03-04 10:59:58.000'),(406,'ser mozzarella kulka','kg',NULL,'2026-03-04 10:59:58.000'),(407,'ser mozzarella mini','kg',NULL,'2026-03-04 10:59:58.000'),(408,'ser mozzarella/nieoznaczona','kg',NULL,'2026-03-04 10:59:58.000'),(409,'ser owczy plastry','kg',NULL,'2026-03-04 10:59:58.000'),(410,'ser pecorino chili','kg',NULL,'2026-03-04 10:59:58.000'),(411,'ser pleśniowy','kg',NULL,'2026-03-04 10:59:58.000'),(412,'ser pleśniowy lapolle bleu','kg',NULL,'2026-03-04 10:59:58.000'),(413,'ser rambol orzechowy','kg',NULL,'2026-03-04 10:59:58.000'),(414,'ser salami','kg',NULL,'2026-03-04 10:59:58.000'),(415,'ser sokół','kg',NULL,'2026-03-04 10:59:58.000'),(416,'ser topiony gouda','kg',NULL,'2026-03-04 10:59:58.000'),(417,'ser topiony mix','kg',NULL,'2026-03-04 10:59:58.000'),(418,'ser twarogowy półtłusty','kg',NULL,'2026-03-04 10:59:58.000'),(419,'ser twarogowy.sernikowy','kg',NULL,'2026-03-04 10:59:58.000'),(420,'ser z ziołami','kg',NULL,'2026-03-04 10:59:58.000'),(421,'ser żołty','kg',NULL,'2026-03-04 10:59:58.000'),(422,'serek gazdowski mały','kg',NULL,'2026-03-04 10:59:58.000'),(423,'serek topiony kremowy','kg',NULL,'2026-03-04 10:59:58.000'),(424,'serek topiony śmietankowy','kg',NULL,'2026-03-04 10:59:58.000'),(425,'serek waniliowy','kg',NULL,'2026-03-04 10:59:58.000'),(426,'serek wiejski','kg',NULL,'2026-03-04 10:59:58.000'),(427,'serek śmietankowy almette','kg',NULL,'2026-03-04 10:59:58.000'),(428,'serek śmietanowy do sushi','kg',NULL,'2026-03-04 10:59:58.000'),(429,'sezam','kg',NULL,'2026-03-04 10:59:58.000'),(430,'siemię lniane','kg',NULL,'2026-03-04 10:59:58.000'),(431,'skrobia ziemniaczana','kg',NULL,'2026-03-04 10:59:58.000'),(432,'skórka pomarańczowa','kg',NULL,'2026-03-04 10:59:58.000'),(433,'smalec','kg',NULL,'2026-03-04 10:59:58.000'),(434,'soda oczyszczona','kg',NULL,'2026-03-04 10:59:58.000'),(435,'sok cappy apple 0,25l','szt',NULL,'2026-03-04 10:59:58.000'),(436,'sok mx jabłko','litr',NULL,'2026-03-04 10:59:58.000'),(437,'sok mx pomarańczowy pet','litr',NULL,'2026-03-04 10:59:58.000'),(438,'sos cz','kg',NULL,'2026-03-04 10:59:58.000'),(439,'sos sałatkowy','kg',NULL,'2026-03-04 10:59:58.000'),(440,'sos sojowy ciemny [litr]','litr',NULL,'2026-03-04 10:59:58.000'),(441,'sos tabasco red [litr]','litr',NULL,'2026-03-04 10:59:58.000'),(442,'sos:','kg',NULL,'2026-03-04 10:59:58.000'),(443,'surówka z marchwi i ananasa - REC ( 63 | 051-100 | )','kg',NULL,'2026-03-04 10:59:58.000'),(444,'syrop klonowy [kg]','kg',NULL,'2026-03-04 10:59:58.000'),(445,'syrop pomarańczowy','litr',NULL,'2026-03-04 10:59:58.000'),(446,'szczupak patroszony św','kg',NULL,'2026-03-04 10:59:58.000'),(447,'szczypior','kg',NULL,'2026-03-04 10:59:58.000'),(448,'szpinak baby św','kg',NULL,'2026-03-04 10:59:58.000'),(449,'szpinak liście mr','kg',NULL,'2026-03-04 10:59:58.000'),(450,'szpinak rozdrobniony mroż','kg',NULL,'2026-03-04 10:59:58.000'),(451,'szpinak św','kg',NULL,'2026-03-04 10:59:58.000'),(452,'szponder wołowy','kg',NULL,'2026-03-04 10:59:58.000'),(453,'szynka cygańska','kg',NULL,'2026-03-04 10:59:58.000'),(454,'szynka dojrzewająca','kg',NULL,'2026-03-04 10:59:58.000'),(455,'szynka konserwowa','kg',NULL,'2026-03-04 10:59:58.000'),(456,'szynka liść','kg',NULL,'2026-03-04 10:59:58.000'),(457,'sól','kg',NULL,'2026-03-04 10:59:58.000'),(458,'sól ziołowa','kg',NULL,'2026-03-04 10:59:58.000'),(459,'słonecznik','kg',NULL,'2026-03-04 10:59:58.000'),(460,'słonecznik łuskany','kg',NULL,'2026-03-04 10:59:58.000'),(461,'słonina','kg',NULL,'2026-03-04 10:59:58.000'),(462,'tatar wołowy','kg',NULL,'2026-03-04 10:59:58.000'),(463,'tortellini primo gusto z mięsem','kg',NULL,'2026-03-04 10:59:58.000'),(464,'tortilla pszenna 30cm','szt',NULL,'2026-03-04 10:59:58.000'),(465,'truskawka','kg',NULL,'2026-03-04 10:59:58.000'),(466,'tuńczyk w oleju','kg',NULL,'2026-03-04 10:59:58.000'),(467,'twaróg chudy','kg',NULL,'2026-03-04 10:59:58.000'),(468,'twaróg klinek','kg',NULL,'2026-03-04 10:59:58.000'),(469,'twaróg tłusty','kg',NULL,'2026-03-04 10:59:58.000'),(470,'tymianek cięty','kg',NULL,'2026-03-04 10:59:58.000'),(471,'udko ćwiartka','kg',NULL,'2026-03-04 10:59:58.000'),(472,'udo z kaczki','kg',NULL,'2026-03-04 10:59:58.000'),(473,'udo z kurczaka','kg',NULL,'2026-03-04 10:59:58.000'),(474,'udo z kurczaka b.k','kg',NULL,'2026-03-04 10:59:58.000'),(475,'wino banrock station shiraz mataro','kg',NULL,'2026-03-04 10:59:58.000'),(476,'wino grzejnik biały słodki','litr',NULL,'2026-03-04 10:59:58.000'),(477,'winogrono ciemne','kg',NULL,'2026-03-04 10:59:58.000'),(478,'winogrono jasne','kg',NULL,'2026-03-04 10:59:58.000'),(479,'wiórki kokosowe','kg',NULL,'2026-03-04 10:59:58.000'),(480,'wiśnia w żelu','kg',NULL,'2026-03-04 10:59:58.000'),(481,'woda baniak','litr',NULL,'2026-03-04 10:59:58.000'),(482,'woda kropla beskidu n.gaz 0,33l','szt',NULL,'2026-03-04 10:59:58.000'),(483,'wódka żubrówka biała','kg',NULL,'2026-03-04 10:59:58.000'),(484,'wątroba z kurczaka','kg',NULL,'2026-03-04 10:59:58.000'),(485,'węgorz wędzony','kg',NULL,'2026-03-04 10:59:58.000'),(486,'włoszczyzna paski mroż','kg',NULL,'2026-03-04 10:59:58.000'),(487,'zasmażka ciemna','kg',NULL,'2026-03-04 10:59:58.000'),(488,'zasmażka jasna','kg',NULL,'2026-03-04 10:59:58.000'),(489,'ziemniaki','kg',NULL,'2026-03-04 10:59:58.000'),(490,'ziemniaki opiekane - REC ( 266 | 251-300 | )','kg',NULL,'2026-03-04 10:59:58.000'),(491,'ćwiartka z kurczaka wędzona','kg',NULL,'2026-03-04 10:59:58.000'),(492,'łopatka wp','kg',NULL,'2026-03-04 10:59:58.000'),(493,'łosoś filet św','kg',NULL,'2026-03-04 10:59:58.000'),(494,'łosoś wędzony','kg',NULL,'2026-03-04 10:59:58.000'),(495,'łosoś wędzony plastry','kg',NULL,'2026-03-04 10:59:58.000'),(496,'śledź matjas','kg',NULL,'2026-03-04 10:59:58.000'),(497,'śledź płaty marynowane','kg',NULL,'2026-03-04 10:59:58.000'),(498,'śliwka','kg',NULL,'2026-03-04 10:59:58.000'),(499,'śliwki suszone','kg',NULL,'2026-03-04 10:59:58.000'),(500,'śmietana 18%','kg',NULL,'2026-03-04 10:59:58.000'),(501,'śmietana 34%','litr',NULL,'2026-03-04 10:59:58.000'),(502,'śmietana 36%','litr',NULL,'2026-03-04 10:59:58.000'),(503,'śmietanka 18% [litr]','litr',NULL,'2026-03-04 10:59:58.000'),(504,'śmietanka 36%','litr',NULL,'2026-03-04 10:59:58.000'),(505,'ŻUREK - receptura na 1l - REC ( 51 | 051-100 | )','litr',NULL,'2026-03-04 10:59:58.000'),(506,'żeberka','kg',NULL,'2026-03-04 10:59:58.000'),(507,'żeberka wędzone','kg',NULL,'2026-03-04 10:59:58.000'),(508,'żelatyna','kg',NULL,'2026-03-04 10:59:58.000'),(509,'żur zakwas','kg',NULL,'2026-03-04 10:59:58.000'),(510,'żurawina przetwór','kg',NULL,'2026-03-04 10:59:58.000'),(511,'żurawina suszona','kg',NULL,'2026-03-04 10:59:58.000'),(512,'żurek','litr',NULL,'2026-03-04 10:59:58.000');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productsuggestion`
--

DROP TABLE IF EXISTS `productsuggestion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productsuggestion` (
  `id` varchar(191) NOT NULL,
  `productId` varchar(191) NOT NULL,
  `suggestedId` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `priority` int(11) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `note` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ProductSuggestion_productId_suggestedId_key` (`productId`,`suggestedId`),
  KEY `ProductSuggestion_suggestedId_fkey` (`suggestedId`),
  KEY `ProductSuggestion_productId_isActive_priority_idx` (`productId`,`isActive`,`priority`),
  CONSTRAINT `ProductSuggestion_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `ProductSuggestion_suggestedId_fkey` FOREIGN KEY (`suggestedId`) REFERENCES `product` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productsuggestion`
--

LOCK TABLES `productsuggestion` WRITE;
/*!40000 ALTER TABLE `productsuggestion` DISABLE KEYS */;
INSERT INTO `productsuggestion` VALUES ('cmmaajphd00008wvzp0vj5dpx','cmlw9tka70027v8vze8qelzug','cmlxk8ypm001974vz9gnabp2j','CROSS_SELL',0,1,NULL),('cmmaajphi00018wvz4w36w5at','cmlw9tka70027v8vze8qelzug','cmlxk8yqj001a74vzripuxjm0','CROSS_SELL',0,1,NULL),('cmmaajphn00028wvzd9ui6yf3','cmlw9tka70027v8vze8qelzug','cmlxk8yqp001b74vzptl2p3v9','CROSS_SELL',0,1,NULL),('cmmaajphu00038wvz52nqixu4','cmlw9tka70027v8vze8qelzug','cmlxk8yqy001c74vz06qgkik1','CROSS_SELL',0,1,NULL),('cmmaajpi100048wvzuoggs0tv','cmlw9tka70027v8vze8qelzug','cmm9g85yt0009ckvzt1aey9ew','CROSS_SELL',0,1,NULL),('cmmaajpi800058wvzp7yc7mbw','cmlxk8ye8000974vzo42iypvl','cmlxk8ypm001974vz9gnabp2j','CROSS_SELL',0,1,NULL),('cmmaajpig00068wvz3475ponv','cmlxk8ye8000974vzo42iypvl','cmlxk8yqj001a74vzripuxjm0','CROSS_SELL',0,1,NULL),('cmmaajpik00078wvzpai8xby7','cmlxk8ye8000974vzo42iypvl','cmlxk8yqp001b74vzptl2p3v9','CROSS_SELL',0,1,NULL),('cmmaajpip00088wvzzpv6pnkl','cmlxk8ye8000974vzo42iypvl','cmlxk8yqy001c74vz06qgkik1','CROSS_SELL',0,1,NULL),('cmmaajpit00098wvzmzwf9rbu','cmlxk8ye8000974vzo42iypvl','cmm9g85yt0009ckvzt1aey9ew','CROSS_SELL',0,1,NULL),('cmmaajpix000a8wvz6fovau49','cmlxk8yeg000a74vzsim65xp2','cmlxk8ypm001974vz9gnabp2j','CROSS_SELL',0,1,NULL),('cmmaajpj1000b8wvzdcrfyulh','cmlxk8yeg000a74vzsim65xp2','cmlxk8yqj001a74vzripuxjm0','CROSS_SELL',0,1,NULL),('cmmaajpj5000c8wvzkoz552ta','cmlxk8yeg000a74vzsim65xp2','cmlxk8yqp001b74vzptl2p3v9','CROSS_SELL',0,1,NULL),('cmmaajpj8000d8wvzdjahuy0r','cmlxk8yeg000a74vzsim65xp2','cmlxk8yqy001c74vz06qgkik1','CROSS_SELL',0,1,NULL),('cmmaajpjc000e8wvzcupypnax','cmlxk8yeg000a74vzsim65xp2','cmm9g85yt0009ckvzt1aey9ew','CROSS_SELL',0,1,NULL),('cmmaajpjf000f8wvzd2mixrzf','cmlxk8yet000b74vzvq2dyhuo','cmlxk8ypm001974vz9gnabp2j','CROSS_SELL',0,1,NULL),('cmmaajpji000g8wvznauuwe9y','cmlxk8yet000b74vzvq2dyhuo','cmlxk8yqj001a74vzripuxjm0','CROSS_SELL',0,1,NULL),('cmmaajpjm000h8wvzfoavp1br','cmlxk8yet000b74vzvq2dyhuo','cmlxk8yqp001b74vzptl2p3v9','CROSS_SELL',0,1,NULL),('cmmaajpjp000i8wvzs8v67ycy','cmlxk8yet000b74vzvq2dyhuo','cmlxk8yqy001c74vz06qgkik1','CROSS_SELL',0,1,NULL),('cmmaajpjs000j8wvz6nqjxd8a','cmlxk8yet000b74vzvq2dyhuo','cmm9g85yt0009ckvzt1aey9ew','CROSS_SELL',0,1,NULL),('cmmaajpju000k8wvzk8uzbmac','cmlxk8yf6000c74vz6555qfxj','cmlxk8ypm001974vz9gnabp2j','CROSS_SELL',0,1,NULL),('cmmaajpjx000l8wvzf8fs8zml','cmlxk8yf6000c74vz6555qfxj','cmlxk8yqj001a74vzripuxjm0','CROSS_SELL',0,1,NULL),('cmmaajpk0000m8wvz34ri43fb','cmlxk8yf6000c74vz6555qfxj','cmlxk8yqp001b74vzptl2p3v9','CROSS_SELL',0,1,NULL),('cmmaajpk2000n8wvzd2mjc9so','cmlxk8yf6000c74vz6555qfxj','cmlxk8yqy001c74vz06qgkik1','CROSS_SELL',0,1,NULL),('cmmaajpk5000o8wvz4pbp6u8y','cmlxk8yf6000c74vz6555qfxj','cmm9g85yt0009ckvzt1aey9ew','CROSS_SELL',0,1,NULL),('cmmaajpk8000p8wvzaiz0ry73','cmlxk8yd7000574vzjow44y94','cmlw9tka70027v8vze8qelzug','CROSS_SELL',0,1,NULL),('cmmaajpkb000q8wvz0xao03qj','cmlxk8yd7000574vzjow44y94','cmlxk8ye8000974vzo42iypvl','CROSS_SELL',0,1,NULL),('cmmaajpke000r8wvzmr9ql2f5','cmlxk8yd7000574vzjow44y94','cmlxk8yeg000a74vzsim65xp2','CROSS_SELL',0,1,NULL),('cmmaajpkg000s8wvz0wb2gtpq','cmlxk8yd7000574vzjow44y94','cmlxk8yet000b74vzvq2dyhuo','CROSS_SELL',0,1,NULL),('cmmaajpkj000t8wvzq8jo6nj5','cmlxk8yd7000574vzjow44y94','cmm9g865h0018ckvzh4m4p03o','CROSS_SELL',0,1,NULL),('cmmaajpkm000u8wvz4ytflyue','cmlxk8yd7000574vzjow44y94','cmm9g865q001ackvzhp0qp4p1','CROSS_SELL',0,1,NULL),('cmmaajpkp000v8wvz7gouy22t','cmlxk8yd7000574vzjow44y94','cmm9g865c0017ckvz65s7p3h9','CROSS_SELL',0,1,NULL),('cmmaajpkr000w8wvzdbmhxei9','cmlxk8yd7000574vzjow44y94','cmm9g865m0019ckvzg6l7df0o','CROSS_SELL',0,1,NULL),('cmmaajpku000x8wvzpdy3j3s2','cmlxk8yd7000574vzjow44y94','cmm9g865u001bckvzbmba8bxm','CROSS_SELL',0,1,NULL),('cmmaajpkx000y8wvzxc05hnub','cmlxk8yd7000574vzjow44y94','cmm9g865z001cckvzratg4s5s','CROSS_SELL',0,1,NULL),('cmmaajpl0000z8wvzs7d158qx','cmlxk8yd7000574vzjow44y94','cmm9g8669001dckvzsvw2rrth','CROSS_SELL',0,1,NULL),('cmmaajpl300108wvz9nnsflgw','cmlxk8yd7000574vzjow44y94','cmm9g866g001eckvz6dyixymc','CROSS_SELL',0,1,NULL),('cmmaajpl600118wvzfnj2adr9','cmlxk8yd7000574vzjow44y94','cmm9g867k001mckvzpfvrx4mg','CROSS_SELL',0,1,NULL),('cmmaajpl800128wvzt5mkf5d0','cmlxk8yd7000574vzjow44y94','cmm9g867p001nckvz25t0jktw','CROSS_SELL',0,1,NULL),('cmmaajplb00138wvz3qkm24j1','cmlxk8yd7000574vzjow44y94','cmm9g8690001wckvz6zmq94mu','CROSS_SELL',0,1,NULL),('cmmaajple00148wvzgdnfr280','cmlxk8yde000674vz1ovsth3v','cmlw9tka70027v8vze8qelzug','CROSS_SELL',0,1,NULL),('cmmaajplg00158wvzv4bsztce','cmlxk8yde000674vz1ovsth3v','cmlxk8ye8000974vzo42iypvl','CROSS_SELL',0,1,NULL),('cmmaajplj00168wvzvsvfzysw','cmlxk8yde000674vz1ovsth3v','cmlxk8yeg000a74vzsim65xp2','CROSS_SELL',0,1,NULL),('cmmaajpln00178wvz99xb4374','cmlxk8yde000674vz1ovsth3v','cmlxk8yet000b74vzvq2dyhuo','CROSS_SELL',0,1,NULL),('cmmaajplq00188wvzranrxi1i','cmlxk8yde000674vz1ovsth3v','cmm9g865h0018ckvzh4m4p03o','CROSS_SELL',0,1,NULL),('cmmaajplt00198wvzqt4a9s6x','cmlxk8yde000674vz1ovsth3v','cmm9g865q001ackvzhp0qp4p1','CROSS_SELL',0,1,NULL),('cmmaajplw001a8wvznfzajha3','cmlxk8yde000674vz1ovsth3v','cmm9g865c0017ckvz65s7p3h9','CROSS_SELL',0,1,NULL),('cmmaajplz001b8wvzyr66ng0t','cmlxk8yde000674vz1ovsth3v','cmm9g865m0019ckvzg6l7df0o','CROSS_SELL',0,1,NULL),('cmmaajpm3001c8wvzszicngal','cmlxk8yde000674vz1ovsth3v','cmm9g865u001bckvzbmba8bxm','CROSS_SELL',0,1,NULL),('cmmaajpm6001d8wvz73hr8a1p','cmlxk8yde000674vz1ovsth3v','cmm9g865z001cckvzratg4s5s','CROSS_SELL',0,1,NULL),('cmmaajpm9001e8wvz57sbbl8d','cmlxk8yde000674vz1ovsth3v','cmm9g8669001dckvzsvw2rrth','CROSS_SELL',0,1,NULL),('cmmaajpmc001f8wvz9vmvks5u','cmlxk8yde000674vz1ovsth3v','cmm9g866g001eckvz6dyixymc','CROSS_SELL',0,1,NULL),('cmmaajpmf001g8wvz46nhzij3','cmlxk8yde000674vz1ovsth3v','cmm9g867k001mckvzpfvrx4mg','CROSS_SELL',0,1,NULL),('cmmaajpmj001h8wvzfvehhb2n','cmlxk8yde000674vz1ovsth3v','cmm9g867p001nckvz25t0jktw','CROSS_SELL',0,1,NULL),('cmmaajpmn001i8wvzze058wp9','cmlxk8yde000674vz1ovsth3v','cmm9g8690001wckvz6zmq94mu','CROSS_SELL',0,1,NULL),('cmmaajpmq001j8wvzkgifwfra','cmlxk8ydm000774vz8e4nfdho','cmlw9tka70027v8vze8qelzug','CROSS_SELL',0,1,NULL),('cmmaajpmt001k8wvz1ck2ttwz','cmlxk8ydm000774vz8e4nfdho','cmlxk8ye8000974vzo42iypvl','CROSS_SELL',0,1,NULL),('cmmaajpmx001l8wvzhnfhazzd','cmlxk8ydm000774vz8e4nfdho','cmlxk8yeg000a74vzsim65xp2','CROSS_SELL',0,1,NULL),('cmmaajpn0001m8wvz3xnp4sv4','cmlxk8ydm000774vz8e4nfdho','cmlxk8yet000b74vzvq2dyhuo','CROSS_SELL',0,1,NULL),('cmmaajpn3001n8wvz06dgx42k','cmlxk8ydm000774vz8e4nfdho','cmm9g865h0018ckvzh4m4p03o','CROSS_SELL',0,1,NULL),('cmmaajpn6001o8wvzf2qf9mxy','cmlxk8ydm000774vz8e4nfdho','cmm9g865q001ackvzhp0qp4p1','CROSS_SELL',0,1,NULL),('cmmaajpn9001p8wvzhuwv6mi5','cmlxk8ydm000774vz8e4nfdho','cmm9g865c0017ckvz65s7p3h9','CROSS_SELL',0,1,NULL),('cmmaajpnd001q8wvzqlkcrnb2','cmlxk8ydm000774vz8e4nfdho','cmm9g865m0019ckvzg6l7df0o','CROSS_SELL',0,1,NULL),('cmmaajpnh001r8wvzjgdmqtr7','cmlxk8ydm000774vz8e4nfdho','cmm9g865u001bckvzbmba8bxm','CROSS_SELL',0,1,NULL),('cmmaajpnl001s8wvzl0sycwhw','cmlxk8ydm000774vz8e4nfdho','cmm9g865z001cckvzratg4s5s','CROSS_SELL',0,1,NULL),('cmmaajpnp001t8wvzow9f22xh','cmlxk8ydm000774vz8e4nfdho','cmm9g8669001dckvzsvw2rrth','CROSS_SELL',0,1,NULL),('cmmaajpns001u8wvzrjp1k7eo','cmlxk8ydm000774vz8e4nfdho','cmm9g866g001eckvz6dyixymc','CROSS_SELL',0,1,NULL),('cmmaajpnw001v8wvz3dpo6kj3','cmlxk8ydm000774vz8e4nfdho','cmm9g867k001mckvzpfvrx4mg','CROSS_SELL',0,1,NULL),('cmmaajpo0001w8wvzsnc2221s','cmlxk8ydm000774vz8e4nfdho','cmm9g867p001nckvz25t0jktw','CROSS_SELL',0,1,NULL),('cmmaajpo3001x8wvztaxtr6ar','cmlxk8ydm000774vz8e4nfdho','cmm9g8690001wckvz6zmq94mu','CROSS_SELL',0,1,NULL),('cmmaajpo7001y8wvzpwhzb5nu','cmlxk8ydt000874vz7oqa9gsw','cmlw9tka70027v8vze8qelzug','CROSS_SELL',0,1,NULL),('cmmaajpoa001z8wvz1y8ka6st','cmlxk8ydt000874vz7oqa9gsw','cmlxk8ye8000974vzo42iypvl','CROSS_SELL',0,1,NULL),('cmmaajpoe00208wvzk0aq2v08','cmlxk8ydt000874vz7oqa9gsw','cmlxk8yeg000a74vzsim65xp2','CROSS_SELL',0,1,NULL),('cmmaajpoh00218wvzzzo7bdq0','cmlxk8ydt000874vz7oqa9gsw','cmlxk8yet000b74vzvq2dyhuo','CROSS_SELL',0,1,NULL),('cmmaajpoj00228wvzpzuwskhe','cmlxk8ydt000874vz7oqa9gsw','cmm9g865h0018ckvzh4m4p03o','CROSS_SELL',0,1,NULL),('cmmaajpom00238wvz83er89zz','cmlxk8ydt000874vz7oqa9gsw','cmm9g865q001ackvzhp0qp4p1','CROSS_SELL',0,1,NULL),('cmmaajpop00248wvz54lstwwx','cmlxk8ydt000874vz7oqa9gsw','cmm9g865c0017ckvz65s7p3h9','CROSS_SELL',0,1,NULL),('cmmaajpos00258wvz88q5wfo5','cmlxk8ydt000874vz7oqa9gsw','cmm9g865m0019ckvzg6l7df0o','CROSS_SELL',0,1,NULL),('cmmaajpow00268wvz0szk3ydf','cmlxk8ydt000874vz7oqa9gsw','cmm9g865u001bckvzbmba8bxm','CROSS_SELL',0,1,NULL),('cmmaajpoy00278wvz92181eqp','cmlxk8ydt000874vz7oqa9gsw','cmm9g865z001cckvzratg4s5s','CROSS_SELL',0,1,NULL),('cmmaajpp100288wvzxji7y69n','cmlxk8ydt000874vz7oqa9gsw','cmm9g8669001dckvzsvw2rrth','CROSS_SELL',0,1,NULL),('cmmaajpp400298wvzorvurxjy','cmlxk8ydt000874vz7oqa9gsw','cmm9g866g001eckvz6dyixymc','CROSS_SELL',0,1,NULL),('cmmaajpp7002a8wvzqg9ur1nz','cmlxk8ydt000874vz7oqa9gsw','cmm9g867k001mckvzpfvrx4mg','CROSS_SELL',0,1,NULL),('cmmaajppb002b8wvzukx5zlv0','cmlxk8ydt000874vz7oqa9gsw','cmm9g867p001nckvz25t0jktw','CROSS_SELL',0,1,NULL),('cmmaajppe002c8wvz5m0yapsl','cmlxk8ydt000874vz7oqa9gsw','cmm9g8690001wckvz6zmq94mu','CROSS_SELL',0,1,NULL),('cmmaajpph002d8wvz9ijdz6av','cmlxk8ykk001174vzgfzqiz3d','cmlxk8ypm001974vz9gnabp2j','CROSS_SELL',0,1,NULL),('cmmaajppk002e8wvzyk7wqztn','cmlxk8ykk001174vzgfzqiz3d','cmlxk8yqj001a74vzripuxjm0','CROSS_SELL',0,1,NULL),('cmmaajppn002f8wvzuww8dplk','cmlxk8ykk001174vzgfzqiz3d','cmlxk8yqp001b74vzptl2p3v9','CROSS_SELL',0,1,NULL),('cmmaajppq002g8wvz0xpjjasb','cmlxk8ykk001174vzgfzqiz3d','cmlxk8yqy001c74vz06qgkik1','CROSS_SELL',0,1,NULL),('cmmaajppt002h8wvzug4qtt1i','cmlxk8ykk001174vzgfzqiz3d','cmm9g85yt0009ckvzt1aey9ew','CROSS_SELL',0,1,NULL),('cmmaajppw002i8wvzq3i5tj8f','cmlxk8ykk001174vzgfzqiz3d','cmm9g85z3000ackvz72hr33t6','CROSS_SELL',0,1,NULL),('cmmaajppz002j8wvzabceu8du','cmlxk8yln001274vzh56rzfkn','cmlxk8ypm001974vz9gnabp2j','CROSS_SELL',0,1,NULL),('cmmaajpq2002k8wvzj4jgzi7t','cmlxk8yln001274vzh56rzfkn','cmlxk8yqj001a74vzripuxjm0','CROSS_SELL',0,1,NULL),('cmmaajpq6002l8wvz6fwatml8','cmlxk8yln001274vzh56rzfkn','cmlxk8yqp001b74vzptl2p3v9','CROSS_SELL',0,1,NULL),('cmmaajpq9002m8wvzce614nct','cmlxk8yln001274vzh56rzfkn','cmlxk8yqy001c74vz06qgkik1','CROSS_SELL',0,1,NULL),('cmmaajpqc002n8wvzqnn0m88f','cmlxk8yln001274vzh56rzfkn','cmm9g85yt0009ckvzt1aey9ew','CROSS_SELL',0,1,NULL),('cmmaajpqf002o8wvzlzaq25qv','cmlxk8yln001274vzh56rzfkn','cmm9g85z3000ackvz72hr33t6','CROSS_SELL',800,1,NULL),('cmmaajpqi002p8wvz9pz2szl9','cmlxk8ymt001374vz3rm1q7h0','cmlxk8ypm001974vz9gnabp2j','CROSS_SELL',0,1,NULL),('cmmaajpqo002q8wvzw0e4z99n','cmlxk8ymt001374vz3rm1q7h0','cmlxk8yqj001a74vzripuxjm0','CROSS_SELL',0,1,NULL),('cmmaajpqr002r8wvzov99wwo1','cmlxk8ymt001374vz3rm1q7h0','cmlxk8yqp001b74vzptl2p3v9','CROSS_SELL',0,1,NULL),('cmmaajpqv002s8wvz8wjgspdu','cmlxk8ymt001374vz3rm1q7h0','cmlxk8yqy001c74vz06qgkik1','CROSS_SELL',0,1,NULL),('cmmaajpqz002t8wvz16440dec','cmlxk8ymt001374vz3rm1q7h0','cmm9g85yt0009ckvzt1aey9ew','CROSS_SELL',0,1,NULL),('cmmaajpr3002u8wvzigq4n2od','cmlxk8ymt001374vz3rm1q7h0','cmm9g85z3000ackvz72hr33t6','CROSS_SELL',0,1,NULL),('cmmaajpr6002v8wvz70l2k8hz','cmm9g865h0018ckvzh4m4p03o','cmlxk8yd7000574vzjow44y94','CROSS_SELL',0,1,NULL),('cmmaajpra002w8wvzcvo0tafx','cmm9g865h0018ckvzh4m4p03o','cmlxk8yde000674vz1ovsth3v','CROSS_SELL',0,1,NULL),('cmmaajprd002x8wvz3sprkpe0','cmm9g865h0018ckvzh4m4p03o','cmlxk8ydm000774vz8e4nfdho','CROSS_SELL',0,1,NULL),('cmmaajprg002y8wvzzdrn3wde','cmm9g865h0018ckvzh4m4p03o','cmlxk8ydt000874vz7oqa9gsw','CROSS_SELL',0,1,NULL),('cmmaajprk002z8wvzmkd156ff','cmm9g865q001ackvzhp0qp4p1','cmlxk8yd7000574vzjow44y94','CROSS_SELL',0,1,NULL),('cmmaajprn00308wvz7na0homh','cmm9g865q001ackvzhp0qp4p1','cmlxk8yde000674vz1ovsth3v','CROSS_SELL',0,1,NULL),('cmmaajprq00318wvz43ym3cgi','cmm9g865q001ackvzhp0qp4p1','cmlxk8ydm000774vz8e4nfdho','CROSS_SELL',0,1,NULL),('cmmaajpru00328wvz52em98wf','cmm9g865q001ackvzhp0qp4p1','cmlxk8ydt000874vz7oqa9gsw','CROSS_SELL',0,1,NULL),('cmmaajprx00338wvz25jm1cr7','cmm9g865c0017ckvz65s7p3h9','cmlxk8yd7000574vzjow44y94','CROSS_SELL',0,1,NULL),('cmmaajps000348wvz8hzrdn4a','cmm9g865c0017ckvz65s7p3h9','cmlxk8yde000674vz1ovsth3v','CROSS_SELL',0,1,NULL),('cmmaajps300358wvzh6aehi8b','cmm9g865c0017ckvz65s7p3h9','cmlxk8ydm000774vz8e4nfdho','CROSS_SELL',0,1,NULL),('cmmaajps500368wvzz2e4102l','cmm9g865c0017ckvz65s7p3h9','cmlxk8ydt000874vz7oqa9gsw','CROSS_SELL',0,1,NULL),('cmmaajps800378wvzxyv2vlb3','cmm9g865m0019ckvzg6l7df0o','cmlxk8yd7000574vzjow44y94','CROSS_SELL',0,1,NULL),('cmmaajpsb00388wvzsb17s21z','cmm9g865m0019ckvzg6l7df0o','cmlxk8yde000674vz1ovsth3v','CROSS_SELL',0,1,NULL),('cmmaajpsd00398wvz0z3dekyj','cmm9g865m0019ckvzg6l7df0o','cmlxk8ydm000774vz8e4nfdho','CROSS_SELL',0,1,NULL),('cmmaajpsg003a8wvz5iod7xw3','cmm9g865m0019ckvzg6l7df0o','cmlxk8ydt000874vz7oqa9gsw','CROSS_SELL',0,1,NULL),('cmmaajpsk003b8wvzyvg8qx6u','cmm9g865u001bckvzbmba8bxm','cmlxk8yd7000574vzjow44y94','CROSS_SELL',0,1,NULL),('cmmaajpsn003c8wvzcjyaq1xf','cmm9g865u001bckvzbmba8bxm','cmlxk8yde000674vz1ovsth3v','CROSS_SELL',0,1,NULL),('cmmaajpsr003d8wvzr7uwzzdr','cmm9g865u001bckvzbmba8bxm','cmlxk8ydm000774vz8e4nfdho','CROSS_SELL',0,1,NULL),('cmmaajpst003e8wvz1io2ud9z','cmm9g865u001bckvzbmba8bxm','cmlxk8ydt000874vz7oqa9gsw','CROSS_SELL',0,1,NULL),('cmmaajpsw003f8wvzd5d74cul','cmm9g865z001cckvzratg4s5s','cmlxk8yd7000574vzjow44y94','CROSS_SELL',0,1,NULL),('cmmaajpt0003g8wvzsb4h9mqb','cmm9g865z001cckvzratg4s5s','cmlxk8yde000674vz1ovsth3v','CROSS_SELL',0,1,NULL),('cmmaajpt3003h8wvzwjn8u9jr','cmm9g865z001cckvzratg4s5s','cmlxk8ydm000774vz8e4nfdho','CROSS_SELL',0,1,NULL),('cmmaajpt6003i8wvzkh45agzh','cmm9g865z001cckvzratg4s5s','cmlxk8ydt000874vz7oqa9gsw','CROSS_SELL',0,1,NULL),('cmmaajpt9003j8wvzgp00xtvg','cmm9g8669001dckvzsvw2rrth','cmlxk8yd7000574vzjow44y94','CROSS_SELL',0,1,NULL),('cmmaajptc003k8wvzafoa5xhn','cmm9g8669001dckvzsvw2rrth','cmlxk8yde000674vz1ovsth3v','CROSS_SELL',0,1,NULL),('cmmaajpte003l8wvzcm03n9jt','cmm9g8669001dckvzsvw2rrth','cmlxk8ydm000774vz8e4nfdho','CROSS_SELL',0,1,NULL),('cmmaajpth003m8wvzj65h5266','cmm9g8669001dckvzsvw2rrth','cmlxk8ydt000874vz7oqa9gsw','CROSS_SELL',0,1,NULL),('cmmaajptk003n8wvze9m2bjvp','cmm9g866g001eckvz6dyixymc','cmlxk8yd7000574vzjow44y94','CROSS_SELL',0,1,NULL),('cmmaajpto003o8wvzzbnxuqzi','cmm9g866g001eckvz6dyixymc','cmlxk8yde000674vz1ovsth3v','CROSS_SELL',0,1,NULL),('cmmaajptr003p8wvzv89jl8g8','cmm9g866g001eckvz6dyixymc','cmlxk8ydm000774vz8e4nfdho','CROSS_SELL',0,1,NULL),('cmmaajptu003q8wvzbhjn584a','cmm9g866g001eckvz6dyixymc','cmlxk8ydt000874vz7oqa9gsw','CROSS_SELL',0,1,NULL),('cmmaajptx003r8wvzcbo1nc2p','cmm9g867k001mckvzpfvrx4mg','cmlxk8yd7000574vzjow44y94','CROSS_SELL',0,1,NULL),('cmmaajpu4003s8wvzz2ekzzpm','cmm9g867k001mckvzpfvrx4mg','cmlxk8yde000674vz1ovsth3v','CROSS_SELL',0,1,NULL),('cmmaajpu7003t8wvzpgndtnw4','cmm9g867k001mckvzpfvrx4mg','cmlxk8ydm000774vz8e4nfdho','CROSS_SELL',0,1,NULL),('cmmaajpua003u8wvzo38g5old','cmm9g867k001mckvzpfvrx4mg','cmlxk8ydt000874vz7oqa9gsw','CROSS_SELL',0,1,NULL),('cmmaajpud003v8wvz58l37hhr','cmm9g867p001nckvz25t0jktw','cmlxk8yd7000574vzjow44y94','CROSS_SELL',0,1,NULL),('cmmaajpug003w8wvzszg8o8du','cmm9g867p001nckvz25t0jktw','cmlxk8yde000674vz1ovsth3v','CROSS_SELL',0,1,NULL),('cmmaajpuk003x8wvz0hizkel3','cmm9g867p001nckvz25t0jktw','cmlxk8ydm000774vz8e4nfdho','CROSS_SELL',0,1,NULL),('cmmaajpun003y8wvzn0iivz9w','cmm9g867p001nckvz25t0jktw','cmlxk8ydt000874vz7oqa9gsw','CROSS_SELL',0,1,NULL),('cmmaajpup003z8wvzy15smuid','cmm9g8690001wckvz6zmq94mu','cmlxk8yd7000574vzjow44y94','CROSS_SELL',0,1,NULL),('cmmaajput00408wvzzdz74ddh','cmm9g8690001wckvz6zmq94mu','cmlxk8yde000674vz1ovsth3v','CROSS_SELL',0,1,NULL),('cmmaajpuw00418wvzyzb6qv7a','cmm9g8690001wckvz6zmq94mu','cmlxk8ydm000774vz8e4nfdho','CROSS_SELL',0,1,NULL),('cmmaajpuz00428wvzzzi2q2fb','cmm9g8690001wckvz6zmq94mu','cmlxk8ydt000874vz7oqa9gsw','CROSS_SELL',0,1,NULL),('cmmalonzd0000eovzsp35x8x5','cmm9g8645000zckvzigtsv7vy','cmm9g8640000yckvz8n4set9o','UPSELL',1000,1,NULL),('cmmalonzi0001eovzd7q6pmgf','cmm9g865c0017ckvz65s7p3h9','cmlxk8ygg000h74vzv9pej9jj','CROSS_SELL',600,1,NULL),('cmmalonzm0002eovz74b9r1sz','cmlxk8ydm000774vz8e4nfdho','cmm9g8602000eckvzpss991dj','CROSS_SELL',900,1,NULL),('cmmalonzp0003eovz7erx9t23','cmlxk8ydm000774vz8e4nfdho','cmm9g862i000nckvz98irr2r7','CROSS_SELL',800,1,NULL),('cmmalonzt0004eovz71ca15jy','cmlxk8ydm000774vz8e4nfdho','cmm9g863r000wckvz6mey9hcp','CROSS_SELL',700,1,NULL),('cmmalonzw0005eovzw4yri4qq','cmm9g864b0010ckvzx08hd23k','cmlxk8yqp001b74vzptl2p3v9','UPSELL',800,1,NULL),('cmmaloo000006eovzu16dudu7','cmlw9tka70027v8vze8qelzug','cmm9g8602000eckvzpss991dj','CROSS_SELL',800,1,NULL),('cmmaloo030007eovzm6mpao6a','cmlw9tka70027v8vze8qelzug','cmm9g863r000wckvz6mey9hcp','CROSS_SELL',700,1,NULL),('cmmaloo070008eovzxxv25ulp','cmm9g85zu000dckvzdy8atakv','cmlxk8yln001274vzh56rzfkn','CROSS_SELL',800,1,NULL),('cmmaloo0b0009eovzxmhzpxpl','cmm9g868f001sckvzn1efjrta','cmm9g868b001rckvzdd9158ki','UPSELL',1000,1,NULL),('cmmaloo0g000aeovz3zzp9td9','cmlxk8ygg000h74vzv9pej9jj','cmm9g865h0018ckvzh4m4p03o','CROSS_SELL',1000,1,NULL),('cmmaloo0k000beovzfjalg3nd','cmlxk8ygg000h74vzv9pej9jj','cmm9g862u000pckvz00pxprns','CROSS_SELL',900,1,NULL),('cmmaloo0n000ceovz1sb0izb6','cmlxk8ygg000h74vzv9pej9jj','cmm9g862i000nckvz98irr2r7','CROSS_SELL',800,1,NULL),('cmmaloo0q000deovz8c5vxvll','cmlxk8ygg000h74vzv9pej9jj','cmm9g8622000lckvzv8smeqxt','CROSS_SELL',700,1,NULL),('cmmaloo0t000eeovzeptm0ra3','cmm9g860m000fckvzugvsoja7','cmm9g85yt0009ckvzt1aey9ew','UPSELL',800,1,NULL),('cmmaloo0w000feovzooyzbbvd','cmm9g860z000gckvze4tum5k3','cmm9g861j000jckvzt7j04acs','UPSELL',900,1,NULL),('cmmaloo11000geovzr8djla6d','cmm9g860z000gckvze4tum5k3','cmm9g8616000hckvz6wthb4bo','UPSELL',800,1,NULL),('cmmaloo16000heovzl1aqejkt','cmlxk8yi6000o74vzgfttqxic','cmlxk8yqp001b74vzptl2p3v9','CROSS_SELL',1000,1,NULL),('cmmaloo1a000ieovz4w07gjwu','cmlxk8yi6000o74vzgfttqxic','cmm9g862i000nckvz98irr2r7','CROSS_SELL',900,1,NULL),('cmmaloo1d000jeovzeo7pr23k','cmlxk8yi6000o74vzgfttqxic','cmm9g8622000lckvzv8smeqxt','CROSS_SELL',800,1,NULL),('cmmaloo1g000keovzsda65ydx','cmlxk8yi6000o74vzgfttqxic','cmm9g863r000wckvz6mey9hcp','CROSS_SELL',700,1,NULL),('cmmaloo1k000leovz3hcfcz3o','cmlxk8yib000p74vz1qiicyim','cmm9g865h0018ckvzh4m4p03o','CROSS_SELL',1000,1,NULL),('cmmaloo1n000meovzdc9anb3t','cmlxk8yib000p74vz1qiicyim','cmm9g862i000nckvz98irr2r7','CROSS_SELL',900,1,NULL),('cmmaloo1s000neovzl9ep25mz','cmlxk8yib000p74vz1qiicyim','cmm9g8622000lckvzv8smeqxt','CROSS_SELL',800,1,NULL),('cmmaloo1w000oeovzr7pni89w','cmlxk8yib000p74vz1qiicyim','cmm9g863r000wckvz6mey9hcp','CROSS_SELL',700,1,NULL),('cmmaloo20000peovz4tmwa1je','cmlxk8yj7000u74vz5lu403e0','cmm9g863r000wckvz6mey9hcp','CROSS_SELL',800,1,NULL),('cmmaloo23000qeovz54youfvq','cmlxk8yj7000u74vz5lu403e0','cmm9g863n000vckvz6ycgze4c','CROSS_SELL',700,1,NULL),('cmmaloo27000reovzk1rtbi01','cmlxk8yln001274vzh56rzfkn','cmm9g861c000ickvzbwpbles9','CROSS_SELL',1000,1,NULL),('cmmaloo2a000seovzv8sqhxmb','cmlxk8yln001274vzh56rzfkn','cmm9g8616000hckvz6wthb4bo','CROSS_SELL',900,1,NULL),('cmmaloo2g000teovzq8zoyznf','cmlxk8yln001274vzh56rzfkn','cmm9g860m000fckvzugvsoja7','CROSS_SELL',700,1,NULL);
/*!40000 ALTER TABLE `productsuggestion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promotion`
--

DROP TABLE IF EXISTS `promotion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `promotion` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `type` varchar(191) NOT NULL,
  `rulesJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`rulesJson`)),
  `daysOfWeek` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`daysOfWeek`)),
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `validFrom` datetime(3) NOT NULL,
  `validTo` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promotion`
--

LOCK TABLES `promotion` WRITE;
/*!40000 ALTER TABLE `promotion` DISABLE KEYS */;
INSERT INTO `promotion` VALUES ('cmlwksykl001250vzguuxhr7g','Happy Hour Piwa','happy_hour','{\"categoryId\":\"cmlw9tk8c0021v8vznz20e7h6\",\"discountPercent\":20,\"timeFrom\":\"15:00\",\"timeTo\":\"18:00\"}','[1,2,3,4,5]',1,'2026-02-21 17:11:40.288','2027-02-21 17:11:40.288'),('cmlwksykr001350vz9z9th2s9','Lunch Special','daily_special','{\"categoryId\":\"cmlw9tk7g001tv8vzugmgx7dk\",\"discountPercent\":15,\"timeFrom\":\"11:00\",\"timeTo\":\"14:00\"}','[1,2,3,4,5]',1,'2026-02-21 17:11:40.288','2027-02-21 17:11:40.288');
/*!40000 ALTER TABLE `promotion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pushsubscription`
--

DROP TABLE IF EXISTS `pushsubscription`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pushsubscription` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `endpoint` text NOT NULL,
  `p256dh` text NOT NULL,
  `auth` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `PushSubscription_userId_endpoint_key` (`userId`,`endpoint`(255)),
  KEY `PushSubscription_userId_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pushsubscription`
--

LOCK TABLES `pushsubscription` WRITE;
/*!40000 ALTER TABLE `pushsubscription` DISABLE KEYS */;
/*!40000 ALTER TABLE `pushsubscription` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receipt`
--

DROP TABLE IF EXISTS `receipt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `receipt` (
  `id` varchar(191) NOT NULL,
  `orderId` varchar(191) NOT NULL,
  `fiscalNumber` varchar(191) NOT NULL,
  `printerId` varchar(191) NOT NULL,
  `buyerNip` varchar(191) DEFAULT NULL,
  `token` varchar(191) NOT NULL,
  `customerPhone` varchar(191) DEFAULT NULL,
  `customerEmail` varchar(191) DEFAULT NULL,
  `deliveryMethod` varchar(191) DEFAULT NULL,
  `htmlContent` longtext DEFAULT NULL,
  `viewedAt` datetime(3) DEFAULT NULL,
  `expiresAt` datetime(3) DEFAULT NULL,
  `printedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Receipt_token_key` (`token`),
  KEY `Receipt_orderId_fkey` (`orderId`),
  CONSTRAINT `Receipt_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipt`
--

LOCK TABLES `receipt` WRITE;
/*!40000 ALTER TABLE `receipt` DISABLE KEYS */;
INSERT INTO `receipt` VALUES ('cmlxt9vs1000eqwvz520jf6i8','cmlxt9upg000cqwvznaxzwznl','FP-20260222-145632-5385','default',NULL,'cmlxt9vs1000fqwvza72fv0ef',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #71</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 71</span>\n        <span>22.02.2026 14:56</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">0,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 13:56:32.926','2026-02-22 13:56:32.929'),('cmlxt9y9f000mqwvz7u57f9a2','cmlxt9y4l000kqwvzb02uej1n','FP-20260222-145636-0457','default','1234567890','cmlxt9y9f000nqwvzinm6ofey',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #73</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 73</span>\n        <span>22.02.2026 14:56</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">0,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n      <div style=\"margin-top:8px;font-size:13px;color:#6b7280;\">\n        <strong>NIP nabywcy:</strong> 1234567890\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 13:56:36.137','2026-02-22 13:56:36.147'),('cmlxt9yeb000rqwvzz2i68z5d','cmlxt9ybk000pqwvz36nezg4p','FP-20260222-145636-2771','default','123','cmlxt9yeb000sqwvzzbiibvhu',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #74</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 74</span>\n        <span>22.02.2026 14:56</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">0,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n      <div style=\"margin-top:8px;font-size:13px;color:#6b7280;\">\n        <strong>NIP nabywcy:</strong> 123\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 13:56:36.322','2026-02-22 13:56:36.323'),('cmlxtadn3001pqwvzflzjnz7i','cmlxtadk7001nqwvz3ern6ppf','FP-20260222-145656-2963','default',NULL,'cmlxtadn3001qqwvzfxxmnjws',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #94</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 94</span>\n        <span>22.02.2026 14:56</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">0,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 13:56:56.078','2026-02-22 13:56:56.079'),('cmlxtae8w001xqwvznzryo4yg','cmlxtae6a001vqwvz4k6rxx5t','FP-20260222-145656-7783','default','1234567890','cmlxtae8w001yqwvzrlrp41wt',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #96</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 96</span>\n        <span>22.02.2026 14:56</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">0,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n      <div style=\"margin-top:8px;font-size:13px;color:#6b7280;\">\n        <strong>NIP nabywcy:</strong> 1234567890\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 13:56:56.863','2026-02-22 13:56:56.864'),('cmlxtaeee0022qwvzsycaaia5','cmlxtaeaj0020qwvzranagmk0','FP-20260222-145657-0278','default','123','cmlxtaeee0023qwvzhx8izmda',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #97</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 97</span>\n        <span>22.02.2026 14:56</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">0,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n      <div style=\"margin-top:8px;font-size:13px;color:#6b7280;\">\n        <strong>NIP nabywcy:</strong> 123\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 13:56:57.061','2026-02-22 13:56:57.062'),('cmlxtc3930030qwvzd7vimjv9','cmlxtc35z002yqwvzi3f6erzv','FP-20260222-145815-7971','default',NULL,'cmlxtc3930031qwvziozj96dj',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #117</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 117</span>\n        <span>22.02.2026 14:58</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">0,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 13:58:15.926','2026-02-22 13:58:15.927'),('cmlxtc3to0038qwvz1onugy8f','cmlxtc3qq0036qwvzbtbd9wut','FP-20260222-145816-9803','default','1234567890','cmlxtc3to0039qwvzjnwqaspd',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #119</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 119</span>\n        <span>22.02.2026 14:58</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">0,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n      <div style=\"margin-top:8px;font-size:13px;color:#6b7280;\">\n        <strong>NIP nabywcy:</strong> 1234567890\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 13:58:16.667','2026-02-22 13:58:16.668'),('cmlxtc3y2003dqwvz26x9lgsk','cmlxtc3v7003bqwvz4u2ihdng','FP-20260222-145816-0538','default','123','cmlxtc3y2003eqwvz2a4tohhb',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #120</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 120</span>\n        <span>22.02.2026 14:58</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">0,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n      <div style=\"margin-top:8px;font-size:13px;color:#6b7280;\">\n        <strong>NIP nabywcy:</strong> 123\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 13:58:16.824','2026-02-22 13:58:16.826'),('cmlxtcr1v0041qwvzppgxaa0d','cmlxtcqzq003zqwvzdxyk2gbn','FP-20260222-145846-9010','default',NULL,'cmlxtcr1v0042qwvzzwuservc',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #134</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 134</span>\n        <span>22.02.2026 14:58</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">0,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 13:58:46.770','2026-02-22 13:58:46.771'),('cmlxtcrhn004fqwvzv7z0kydl','cmlxtcrf8004dqwvzxqxts1ke','FP-20260222-145847-4940','default',NULL,'cmlxtcrhn004gqwvz4lvzpgd7',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #140</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 140</span>\n        <span>22.02.2026 14:58</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">0,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 13:58:47.338','2026-02-22 13:58:47.339'),('cmlxtcs0n004nqwvzuanuo28g','cmlxtcrxk004lqwvzwpv0gebr','FP-20260222-145848-9454','default','1234567890','cmlxtcs0n004oqwvzriv2me3k',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #142</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 142</span>\n        <span>22.02.2026 14:58</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">0,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n      <div style=\"margin-top:8px;font-size:13px;color:#6b7280;\">\n        <strong>NIP nabywcy:</strong> 1234567890\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 13:58:48.021','2026-02-22 13:58:48.023'),('cmlxtcs4s004sqwvzwdxlupvw','cmlxtcs2c004qqwvzwz0abjw0','FP-20260222-145848-2478','default','123','cmlxtcs4s004tqwvzki2fddug',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #143</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 143</span>\n        <span>22.02.2026 14:58</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">0,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n      <div style=\"margin-top:8px;font-size:13px;color:#6b7280;\">\n        <strong>NIP nabywcy:</strong> 123\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 13:58:48.171','2026-02-22 13:58:48.172'),('cmlxtdxre005gqwvzcfnzy96h','cmlxtdxp8005eqwvzjapr9s6q','FP-20260222-145942-0463','default',NULL,'cmlxtdxre005hqwvzw844g0w8',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #157</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 157</span>\n        <span>22.02.2026 14:59</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">0,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 13:59:42.121','2026-02-22 13:59:42.122'),('cmlxtdy9d005uqwvz7xuqrtcv','cmlxtdy5u005sqwvzx2874vu5','FP-20260222-145942-7720','default',NULL,'cmlxtdy9d005vqwvzixb4aipz',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #163</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 163</span>\n        <span>22.02.2026 14:59</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">0,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 13:59:42.767','2026-02-22 13:59:42.769'),('cmlxtdyre0062qwvzgv0pz74f','cmlxtdyoz0060qwvzjiq68fqc','FP-20260222-145943-9464','default','1234567890','cmlxtdyre0063qwvzrhf0kntb',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #165</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 165</span>\n        <span>22.02.2026 14:59</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">0,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n      <div style=\"margin-top:8px;font-size:13px;color:#6b7280;\">\n        <strong>NIP nabywcy:</strong> 1234567890\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 13:59:43.417','2026-02-22 13:59:43.418'),('cmlxtdyvp0067qwvzif69t7om','cmlxtdyte0065qwvz0pugrolt','FP-20260222-145943-2587','default','123','cmlxtdyvp0068qwvzgy1rfvw4',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #166</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 166</span>\n        <span>22.02.2026 14:59</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">0,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n      <div style=\"margin-top:8px;font-size:13px;color:#6b7280;\">\n        <strong>NIP nabywcy:</strong> 123\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 13:59:43.572','2026-02-22 13:59:43.573'),('cmlxujbwr0001hovzzk3974pa','cmlwksytl001p50vzrnio0dlt','FP-20260222-153153-7093','default',NULL,'cmlxujbwr0002hovzeyac8m5b',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #1</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 1</span>\n        <span>22.02.2026 15:31</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n    <tr>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;\">Kotlet schabowy</td>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;\">2</td>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;\">42,00 zł</td>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;\">84,00 zł</td>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:11px;\">B</td>\n    </tr>\n    <tr>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;\">Żurek w chlebie</td>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;\">2</td>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;\">22,00 zł</td>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;\">44,00 zł</td>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:11px;\">B</td>\n    </tr>\n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n    <tr>\n      <td style=\"padding:4px 8px;font-size:12px;\">VAT B</td>\n      <td style=\"padding:4px 8px;text-align:right;font-size:12px;\">118,52 zł</td>\n      <td style=\"padding:4px 8px;text-align:right;font-size:12px;\">9,48 zł</td>\n      <td style=\"padding:4px 8px;text-align:right;font-size:12px;\">128,00 zł</td>\n    </tr>\n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">128,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 14:31:53.352','2026-02-22 14:31:53.355'),('cmlxv0z1w0003rovz7uilfu9x','cmlxujen40004hovz9tl3pieo','FP-20260222-154536-3140','default',NULL,'cmlxv0z1w0004rovzmk51c9re',NULL,NULL,NULL,'<!DOCTYPE html>\n<html lang=\"pl\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no\">\n  <title>E-paragon #180</title>\n</head>\n<body style=\"margin:0;padding:16px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',Roboto,sans-serif;font-size:14px;color:#1f2937;background:#fafafa;line-height:1.5;\">\n  <div style=\"max-width:400px;margin:0 auto;background:#fff;border-radius:8px;box-shadow:0 1px 3px rgba(0,0,0,0.08);overflow:hidden;\">\n    <header style=\"padding:20px;background:linear-gradient(135deg,#1e3a5f 0%,#2d5a87 100%);color:#fff;text-align:center;\">\n      <h1 style=\"margin:0 0 8px;font-size:20px;font-weight:700;\">Karczma Łabędź</h1>\n      <p style=\"margin:0;font-size:12px;opacity:0.95;\">NIP: </p>\n      <p style=\"margin:4px 0 0;font-size:11px;opacity:0.9;\"></p>\n    </header>\n    <div style=\"padding:16px;\">\n      <div style=\"display:flex;justify-content:space-between;margin-bottom:16px;font-size:13px;color:#6b7280;\">\n        <span>Paragon nr 180</span>\n        <span>22.02.2026 15:45</span>\n      </div>\n      <table style=\"width:100%;border-collapse:collapse;font-size:13px;\">\n        <thead>\n          <tr style=\"background:#f3f4f6;\">\n            <th style=\"padding:8px;text-align:left;font-weight:600;\">Produkt</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">Ilość</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Cena/jedn.</th>\n            <th style=\"padding:8px;text-align:right;font-weight:600;\">Wartość</th>\n            <th style=\"padding:8px;text-align:center;font-weight:600;\">VAT</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n    <tr>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;\">Chrupiące placki ziemniaczane</td>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;\">1</td>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;\">22,00 zł</td>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;\">22,00 zł</td>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:11px;\">B</td>\n    </tr>\n    <tr>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;\">Chrupiące placki ziemniaczane</td>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;\">1</td>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;\">22,00 zł</td>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:right;\">22,00 zł</td>\n      <td style=\"padding:6px 8px;border-bottom:1px solid #e5e7eb;text-align:center;font-size:11px;\">B</td>\n    </tr>\n        </tbody>\n      </table>\n      \n      <table style=\"width:100%;margin-top:16px;border-collapse:collapse;font-size:12px;color:#6b7280;\">\n        <thead>\n          <tr>\n            <th style=\"padding:6px 8px;text-align:left;\">Stawka</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Netto</th>\n            <th style=\"padding:6px 8px;text-align:right;\">VAT</th>\n            <th style=\"padding:6px 8px;text-align:right;\">Brutto</th>\n          </tr>\n        </thead>\n        <tbody>\n          \n    <tr>\n      <td style=\"padding:4px 8px;font-size:12px;\">VAT B</td>\n      <td style=\"padding:4px 8px;text-align:right;font-size:12px;\">40,74 zł</td>\n      <td style=\"padding:4px 8px;text-align:right;font-size:12px;\">3,26 zł</td>\n      <td style=\"padding:4px 8px;text-align:right;font-size:12px;\">44,00 zł</td>\n    </tr>\n        </tbody>\n      </table>\n      <div style=\"margin-top:20px;padding:16px;background:#1e3a5f;border-radius:8px;color:#fff;text-align:center;\">\n        <div style=\"font-size:12px;opacity:0.9;\">RAZEM DO ZAPŁATY</div>\n        <div style=\"font-size:28px;font-weight:700;margin-top:4px;\">44,00 zł</div>\n      </div>\n      <div style=\"margin-top:12px;font-size:13px;color:#6b7280;\">\n        <strong>Płatność:</strong> Gotówka\n      </div>\n      \n    </div>\n    <footer style=\"padding:16px;text-align:center;font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;\">\n      E-paragon wygenerowany elektronicznie\n    </footer>\n  </div>\n</body>\n</html>',NULL,'2026-03-24 14:45:36.495','2026-02-22 14:45:36.500');
/*!40000 ALTER TABLE `receipt` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `receipterrorlog`
--

DROP TABLE IF EXISTS `receipterrorlog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `receipterrorlog` (
  `id` varchar(191) NOT NULL,
  `orderId` varchar(191) NOT NULL,
  `paymentId` varchar(191) DEFAULT NULL,
  `errorMessage` varchar(191) NOT NULL,
  `retryCount` int(11) NOT NULL DEFAULT 0,
  `resolvedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `ReceiptErrorLog_orderId_idx` (`orderId`),
  KEY `ReceiptErrorLog_createdAt_idx` (`createdAt`),
  KEY `ReceiptErrorLog_resolvedAt_idx` (`resolvedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `receipterrorlog`
--

LOCK TABLES `receipterrorlog` WRITE;
/*!40000 ALTER TABLE `receipterrorlog` DISABLE KEYS */;
/*!40000 ALTER TABLE `receipterrorlog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipe`
--

DROP TABLE IF EXISTS `recipe`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recipe` (
  `id` varchar(191) NOT NULL,
  `productId` varchar(191) NOT NULL,
  `yieldQty` decimal(10,3) NOT NULL DEFAULT 1.000,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Recipe_productId_key` (`productId`),
  CONSTRAINT `Recipe_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `product` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipe`
--

LOCK TABLES `recipe` WRITE;
/*!40000 ALTER TABLE `recipe` DISABLE KEYS */;
/*!40000 ALTER TABLE `recipe` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipe_history`
--

DROP TABLE IF EXISTS `recipe_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recipe_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recipeId` int(11) NOT NULL,
  `changedBy` varchar(100) NOT NULL,
  `changeNote` varchar(500) DEFAULT NULL,
  `snapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`snapshot`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `recipe_history_recipeId_fkey` (`recipeId`),
  CONSTRAINT `recipe_history_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `recipes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipe_history`
--

LOCK TABLES `recipe_history` WRITE;
/*!40000 ALTER TABLE `recipe_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `recipe_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipe_ingredients`
--

DROP TABLE IF EXISTS `recipe_ingredients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recipe_ingredients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recipeId` int(11) NOT NULL,
  `productId` int(11) DEFAULT NULL,
  `subRecipeId` int(11) DEFAULT NULL,
  `quantity` double NOT NULL,
  `unit` varchar(20) NOT NULL DEFAULT 'kg',
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `recipe_ingredients_recipeId_fkey` (`recipeId`),
  KEY `recipe_ingredients_productId_fkey` (`productId`),
  KEY `recipe_ingredients_subRecipeId_fkey` (`subRecipeId`),
  CONSTRAINT `recipe_ingredients_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `recipe_ingredients_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `recipes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `recipe_ingredients_subRecipeId_fkey` FOREIGN KEY (`subRecipeId`) REFERENCES `recipes` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4096 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipe_ingredients`
--

LOCK TABLES `recipe_ingredients` WRITE;
/*!40000 ALTER TABLE `recipe_ingredients` DISABLE KEYS */;
INSERT INTO `recipe_ingredients` VALUES (1,1,316,NULL,0.21,'kg',0),(2,1,311,NULL,0.08,'kg',0),(3,1,399,NULL,0.052,'kg',0),(4,1,457,NULL,0.002,'kg',0),(5,1,348,NULL,0.001,'kg',0),(6,1,150,NULL,1,'szt',0),(7,1,257,NULL,0.006,'kg',0),(8,1,75,NULL,2,'kg',0),(9,1,489,NULL,0.2,'kg',0),(10,1,127,NULL,0.2,'litr',0),(11,1,94,NULL,0.06,'kg',0),(12,1,274,NULL,0.06,'litr',0),(13,1,457,NULL,0.002,'kg',0),(14,1,348,NULL,0.001,'kg',0),(15,1,78,NULL,0.03,'kg',0),(16,2,134,NULL,6,'kg',0),(17,2,127,NULL,0.2,'litr',0),(18,2,86,NULL,0.22,'kg',0),(19,2,251,NULL,0.4,'kg',0),(20,2,106,NULL,0.1,'kg',0),(21,2,335,NULL,0.2,'kg',0),(22,2,457,NULL,0.08,'kg',0),(23,2,353,NULL,0.03,'kg',0),(24,2,343,NULL,0.03,'kg',0),(25,2,274,NULL,3.1,'litr',0),(26,2,160,NULL,1.8,'kg',0),(27,2,348,NULL,0.02,'kg',0),(28,3,489,NULL,0.25,'kg',0),(29,3,78,NULL,0.005,'kg',0),(30,3,150,NULL,0.008,'szt',0),(31,3,274,NULL,0.04,'litr',0),(32,3,254,NULL,0.008,'kg',0),(33,3,348,NULL,0.001,'kg',0),(34,3,457,NULL,0.002,'kg',0),(35,3,163,NULL,0.25,'kg',0),(36,3,286,NULL,0.045,'kg',0),(37,3,295,NULL,0.045,'kg',0),(38,3,106,NULL,0.001,'kg',0),(39,3,181,NULL,0.004,'kg',0),(40,3,94,NULL,0.001,'kg',0),(41,4,385,NULL,0.15,'kg',0),(42,4,457,NULL,0.002,'kg',0),(43,4,348,NULL,0.001,'kg',0),(44,4,77,NULL,0.02,'kg',0),(45,4,150,NULL,0.022,'szt',0),(46,4,274,NULL,0.04,'litr',0),(47,4,125,NULL,0.1,'kg',0),(48,4,3,NULL,0.5,'kg',0),(49,4,32,NULL,1,'kg',0),(50,5,163,NULL,2.5,'kg',0),(51,5,12,NULL,1,'kg',0),(52,5,106,NULL,0.1,'kg',0),(53,5,335,NULL,0.2,'kg',0),(54,5,348,NULL,0.008,'kg',0),(55,5,457,NULL,0.08,'kg',0),(56,5,343,NULL,0.03,'kg',0),(57,5,274,NULL,0.15,'litr',0),(58,5,75,NULL,1.3,'kg',0),(59,5,265,NULL,0.01,'litr',0),(60,5,94,NULL,0.05,'kg',0),(61,5,348,NULL,0.01,'kg',0),(62,5,457,NULL,0.01,'kg',0),(63,5,274,NULL,0.01,'litr',0),(64,5,353,NULL,0.001,'kg',0),(65,6,506,NULL,0.65,'kg',0),(66,6,457,NULL,0.003,'kg',0),(67,6,348,NULL,0.001,'kg',0),(68,6,78,NULL,0.01,'kg',0),(69,6,344,NULL,0.002,'kg',0),(70,6,274,NULL,0.006,'litr',0),(71,6,332,NULL,0.005,'kg',0),(72,7,120,NULL,0.16,'kg',0),(73,7,150,NULL,1,'szt',0),(74,7,253,NULL,0.002,'kg',0),(75,7,429,NULL,0.02,'kg',0),(76,7,360,NULL,0.016,'kg',0),(77,7,77,NULL,0.016,'kg',0),(78,7,457,NULL,0.001,'kg',0),(79,7,348,NULL,0.001,'kg',0),(80,7,274,NULL,0.04,'litr',0),(81,7,489,NULL,0,'kg',0),(82,7,151,NULL,0,'kg',0),(83,8,308,NULL,0.28,'kg',0),(84,8,254,NULL,0.007,'kg',0),(85,8,457,NULL,0.001,'kg',0),(86,8,348,NULL,0.001,'kg',0),(87,8,274,NULL,0.15,'litr',0),(88,8,185,NULL,0.002,'kg',0),(89,8,101,NULL,0.02,'kg',0),(90,9,378,NULL,0.15,'kg',0),(91,9,271,NULL,0.04,'kg',0),(92,9,318,NULL,0.12,'kg',0),(93,9,395,NULL,0.09,'kg',0),(94,9,120,NULL,0.15,'kg',0),(95,9,460,NULL,0.08,'kg',0),(96,9,439,NULL,0.04,'kg',0),(97,9,457,NULL,0.001,'kg',0),(98,9,348,NULL,0.001,'kg',0),(99,10,82,NULL,1,'szt',0),(100,10,505,NULL,0.5,'litr',0),(101,10,150,NULL,1,'szt',0),(102,11,385,NULL,0.16,'kg',0),(103,11,150,NULL,0.5,'szt',0),(104,11,257,NULL,0.01,'kg',0),(105,11,77,NULL,0.02,'kg',0),(106,11,274,NULL,0.04,'litr',0),(107,11,457,NULL,0.001,'kg',0),(108,11,348,NULL,0.001,'kg',0),(109,11,456,NULL,0.003,'kg',0),(110,11,414,NULL,0.003,'kg',0),(111,11,422,NULL,0.04,'kg',0),(112,11,295,NULL,0.0045,'kg',0),(113,12,316,NULL,0.25,'kg',0),(114,12,457,NULL,0.002,'kg',0),(115,12,348,NULL,0.001,'kg',0),(116,12,106,NULL,0.003,'kg',0),(117,12,274,NULL,0.02,'litr',0),(118,12,350,NULL,0.002,'kg',0),(119,12,489,NULL,0.1,'kg',0),(120,12,231,NULL,0.01,'kg',0),(121,12,502,NULL,0.01,'litr',0),(122,12,457,NULL,0.001,'kg',0),(123,12,271,NULL,0.07,'kg',0),(124,12,457,NULL,0.001,'kg',0),(125,12,500,NULL,0.13,'kg',0),(126,12,94,NULL,0.002,'kg',0),(127,12,265,NULL,0.002,'litr',0),(128,12,348,NULL,0.001,'kg',0),(129,13,174,NULL,4,'kg',0),(130,13,353,NULL,0.015,'kg',0),(131,13,343,NULL,0.003,'kg',0),(132,13,502,NULL,1,'litr',0),(133,13,106,NULL,0.07,'kg',0),(134,13,86,NULL,2,'kg',0),(135,13,509,NULL,5,'kg',0),(136,13,344,NULL,0.05,'kg',0),(137,13,352,NULL,0.048,'litr',0),(138,13,348,NULL,0.1,'kg',0),(139,13,190,NULL,0.7,'kg',0),(140,14,160,NULL,5,'kg',0),(141,14,507,NULL,3,'kg',0),(142,14,344,NULL,0.002,'kg',0),(143,14,224,NULL,0.5,'kg',0),(144,14,388,NULL,0.5,'kg',0),(145,14,302,NULL,0.5,'kg',0),(146,14,457,NULL,0.05,'kg',0),(147,14,348,NULL,0.05,'kg',0),(148,14,335,NULL,0.1,'kg',0),(149,14,343,NULL,0.03,'kg',0),(150,14,353,NULL,0.03,'kg',0),(151,15,375,NULL,0.25,'kg',0),(152,15,254,NULL,0.05,'kg',0),(153,15,150,NULL,0.05,'szt',0),(154,15,247,NULL,0.04,'litr',0),(155,15,457,NULL,0.001,'kg',0),(156,15,348,NULL,0.001,'kg',0),(157,16,120,NULL,0.12,'kg',0),(158,16,254,NULL,0.05,'kg',0),(159,16,77,NULL,0.08,'kg',0),(160,16,150,NULL,0.5,'szt',0),(161,16,457,NULL,0.001,'kg',0),(162,16,348,NULL,0.001,'kg',0),(163,17,54,NULL,0.9,'kg',0),(164,17,148,NULL,0.35,'kg',0),(165,17,138,NULL,0.51,'kg',0),(166,17,477,NULL,0.2,'kg',0),(167,17,478,NULL,0.2,'kg',0),(168,17,177,NULL,0.38,'kg',0),(169,18,123,NULL,0.094,'kg',0),(170,18,353,NULL,0.0002,'kg',0),(171,18,343,NULL,0.00013,'kg',0),(172,18,274,NULL,0.0066,'litr',0),(173,18,254,NULL,0.02,'kg',0),(174,18,352,NULL,0.0066,'litr',0),(175,18,335,NULL,0.001,'kg',0),(176,18,346,NULL,0.000066,'kg',0),(177,18,345,NULL,0.000066,'kg',0),(178,18,457,NULL,0.00026,'kg',0),(179,18,348,NULL,0.00013,'kg',0),(180,19,214,NULL,0.09,'kg',0),(181,19,501,NULL,0.08,'litr',0),(182,19,304,NULL,0.006,'kg',0),(183,19,394,NULL,0.01,'kg',0),(184,19,457,NULL,0.002,'kg',0),(185,19,348,NULL,0.001,'kg',0),(186,19,332,NULL,0.005,'kg',0),(187,19,120,NULL,0.12,'kg',0),(188,20,125,NULL,2,'kg',0),(189,20,127,NULL,0.2,'litr',0),(190,21,11,NULL,0.3,'kg',0),(191,22,150,NULL,15,'szt',0),(192,22,94,NULL,1,'kg',0),(193,23,134,NULL,0.6,'kg',0),(194,23,106,NULL,0.005,'kg',0),(195,23,160,NULL,0.18,'kg',0),(196,23,274,NULL,0.004,'litr',0),(197,23,86,NULL,0.023,'kg',0),(198,23,457,NULL,0.002,'kg',0),(199,23,348,NULL,0.001,'kg',0),(200,23,251,NULL,0.025,'kg',0),(201,24,203,NULL,0.05,'litr',0),(202,24,65,NULL,0,'kg',0),(203,24,59,NULL,0.05,'litr',0),(204,24,220,NULL,0.0625,'kg',0),(205,24,94,NULL,0.025,'kg',0),(206,24,243,NULL,0,'kg',0),(207,25,253,NULL,2,'kg',0),(208,25,134,NULL,1.8,'kg',0),(209,25,240,NULL,3,'kg',0),(210,25,78,NULL,0.2,'kg',0),(211,25,274,NULL,0.3,'litr',0),(212,25,247,NULL,1,'litr',0),(213,26,253,NULL,2,'kg',0),(214,26,78,NULL,0.2,'kg',0),(215,26,160,NULL,4,'kg',0),(216,26,312,NULL,0.2,'kg',0),(217,26,274,NULL,0.3,'litr',0),(218,26,247,NULL,1,'litr',0),(219,26,457,NULL,0.05,'kg',0),(220,26,94,NULL,0.05,'kg',0),(221,26,348,NULL,0.05,'kg',0),(222,27,258,NULL,1,'szt',0),(223,28,150,NULL,0.5,'szt',0),(224,28,254,NULL,0.055,'kg',0),(225,28,247,NULL,0.15,'litr',0),(226,28,274,NULL,0.02,'litr',0),(227,28,480,NULL,0.15,'kg',0),(228,29,46,NULL,0,'kg',0),(229,30,305,NULL,1,'szt',0),(230,31,141,NULL,1,'szt',0),(231,32,307,NULL,1,'szt',0),(232,33,483,NULL,0.5,'kg',0),(233,34,505,NULL,0.5,'litr',0),(234,34,150,NULL,1,'szt',0),(235,35,23,NULL,3,'l',0),(236,35,304,NULL,0.001,'kg',0),(237,35,18,NULL,10,'kg',0),(238,36,306,NULL,1,'szt',0),(239,37,482,NULL,1,'szt',0),(240,38,257,NULL,0.25,'kg',0),(241,38,247,NULL,0.25,'litr',0),(242,38,150,NULL,2,'szt',0),(243,38,481,NULL,0.2,'litr',0),(244,38,274,NULL,0.05,'litr',0),(245,38,457,NULL,0.01,'kg',0),(246,38,418,NULL,0.4,'kg',0),(247,38,504,NULL,0.1,'litr',0),(248,38,95,NULL,0.05,'kg',0),(249,38,501,NULL,0.2,'litr',0),(250,38,98,NULL,0.0005,'kg',0),(251,38,435,NULL,5,'szt',0),(252,39,378,NULL,0.05,'kg',0),(253,39,369,NULL,0.01,'kg',0),(254,39,319,NULL,0.05,'kg',0),(255,39,380,NULL,0.05,'kg',0),(256,39,318,NULL,0.05,'kg',0),(257,39,271,NULL,0.05,'kg',0),(258,39,239,NULL,0.02,'kg',0),(259,39,250,NULL,0.02,'kg',0),(260,39,106,NULL,0.01,'kg',0),(261,39,274,NULL,0.015,'litr',0),(262,39,120,NULL,0.12,'kg',0),(263,39,267,NULL,0.002,'litr',0),(264,40,239,NULL,0.68,'kg',0),(265,40,231,NULL,0.8,'kg',0),(266,40,94,NULL,1,'kg',0),(267,40,257,NULL,2.5,'kg',0),(268,40,434,NULL,0.15,'kg',0),(269,40,354,NULL,0,'kg',0),(270,40,155,NULL,0.15,'kg',0),(271,41,150,NULL,0.5,'szt',0),(272,41,253,NULL,0.055,'kg',0),(273,41,247,NULL,0.15,'litr',0),(274,41,274,NULL,0.02,'litr',0),(275,41,149,NULL,0.15,'kg',0),(276,42,174,NULL,6.7,'kg',0),(277,42,63,NULL,1.1,'kg',0),(278,42,78,NULL,0.15,'kg',0),(279,42,302,NULL,0.85,'kg',0),(280,42,106,NULL,0.1,'kg',0),(281,42,86,NULL,1.5,'kg',0),(282,42,512,NULL,3,'litr',0),(283,42,344,NULL,0.02,'kg',0),(284,42,348,NULL,0.01,'kg',0),(285,42,23,NULL,4.5,'l',0),(286,43,489,NULL,0.25,'kg',0),(287,43,150,NULL,0.5,'szt',0),(288,43,257,NULL,0.025,'kg',0),(289,43,457,NULL,0.0001,'kg',0),(290,43,274,NULL,0.1,'litr',0),(291,43,78,NULL,0.04,'kg',0),(292,43,500,NULL,0.02,'kg',0),(293,43,185,NULL,0.002,'kg',0),(294,44,189,NULL,6.1,'kg',0),(295,44,224,NULL,1.4,'kg',0),(296,44,302,NULL,0.8,'kg',0),(297,44,388,NULL,0.9,'kg',0),(298,44,322,NULL,0.5,'kg',0),(299,44,304,NULL,0.15,'kg',0),(300,44,351,NULL,0.01,'kg',0),(301,44,457,NULL,0.001,'kg',0),(302,44,348,NULL,0.05,'kg',0),(303,44,343,NULL,0.04,'kg',0),(304,44,353,NULL,0.02,'kg',0),(305,45,472,NULL,0.3,'kg',0),(306,45,457,NULL,0.001,'kg',0),(307,45,344,NULL,0.002,'kg',0),(308,45,348,NULL,0.001,'kg',0),(309,45,106,NULL,0.003,'kg',0),(310,45,274,NULL,0.003,'litr',0),(311,45,148,NULL,0.02,'kg',0),(312,45,3,NULL,0.5,'kg',0),(313,45,511,NULL,0.005,'kg',0),(314,45,363,NULL,0.003,'kg',0),(315,45,489,NULL,0.66,'kg',0),(316,45,150,NULL,0.13,'szt',0),(317,45,254,NULL,0.013,'kg',0),(318,45,431,NULL,0.013,'kg',0),(319,46,320,NULL,5,'kg',0),(320,46,224,NULL,0.3,'kg',0),(321,46,302,NULL,0.3,'kg',0),(322,46,78,NULL,0.2,'kg',0),(323,46,106,NULL,0.1,'kg',0),(324,46,147,NULL,0.1,'kg',0),(325,46,94,NULL,0.05,'kg',0),(326,46,457,NULL,0.01,'kg',0),(327,46,348,NULL,0.01,'kg',0),(328,46,345,NULL,0.01,'kg',0),(329,46,346,NULL,0.01,'kg',0),(330,47,506,NULL,4,'kg',0),(331,47,78,NULL,0.2,'kg',0),(332,47,499,NULL,0.2,'kg',0),(333,47,337,NULL,0.1,'kg',0),(334,47,457,NULL,0.05,'kg',0),(335,47,348,NULL,0.05,'kg',0),(336,47,335,NULL,0.1,'kg',0),(337,48,253,NULL,0.05,'kg',0),(338,48,231,NULL,0.05,'kg',0),(339,48,95,NULL,0.075,'kg',0),(340,48,235,NULL,0.025,'kg',0),(341,48,148,NULL,0.3,'kg',0),(342,48,208,NULL,0.07,'litr',0),(343,48,331,NULL,0.001,'kg',0),(344,48,150,NULL,1,'szt',0),(345,49,158,NULL,12,'kg',0),(346,49,224,NULL,0.64,'kg',0),(347,49,322,NULL,0.64,'kg',0),(348,49,274,NULL,0.4,'litr',0),(349,49,457,NULL,0.04,'kg',0),(350,49,197,NULL,0.016,'kg',0),(351,49,271,NULL,1.8,'kg',0),(352,49,94,NULL,0.03,'kg',0),(353,49,185,NULL,0.26,'kg',0),(354,49,348,NULL,0.02,'kg',0),(355,50,160,NULL,2.3,'kg',0),(356,50,224,NULL,0.12,'kg',0),(357,50,78,NULL,0.1,'kg',0),(358,50,148,NULL,0.2,'kg',0),(359,50,274,NULL,0.01,'litr',0),(360,50,94,NULL,0.08,'kg',0),(361,50,348,NULL,0.01,'kg',0),(362,51,387,NULL,1.4,'kg',0),(363,51,211,NULL,0.2,'kg',0),(364,51,459,NULL,0.15,'kg',0),(365,51,364,NULL,0.15,'kg',0),(366,51,48,NULL,0.6,'kg',0),(367,52,224,NULL,2,'kg',0),(368,52,148,NULL,0.2,'kg',0),(369,52,49,NULL,0.2,'kg',0),(370,52,445,NULL,0.1,'litr',0),(371,52,94,NULL,0.1,'kg',0),(372,52,197,NULL,0.01,'kg',0),(373,53,452,NULL,2.5,'kg',0),(374,53,224,NULL,2,'kg',0),(375,53,302,NULL,1.5,'kg',0),(376,53,388,NULL,2,'kg',0),(377,53,322,NULL,1,'kg',0),(378,53,304,NULL,0.15,'kg',0),(379,53,351,NULL,0.3,'kg',0),(380,53,457,NULL,0.22,'kg',0),(381,53,348,NULL,0.012,'kg',0),(382,53,343,NULL,0.003,'kg',0),(383,53,353,NULL,0.006,'kg',0),(384,54,378,NULL,0.05,'kg',0),(385,54,318,NULL,0.035,'kg',0),(386,54,271,NULL,0.035,'kg',0),(387,54,79,NULL,0.05,'kg',0),(388,54,285,NULL,0.02,'kg',0),(389,54,274,NULL,0.15,'litr',0),(390,54,251,NULL,0.01,'kg',0),(391,54,106,NULL,0.005,'kg',0),(392,54,239,NULL,0.002,'kg',0),(393,54,380,NULL,0.05,'kg',0),(394,54,120,NULL,0.1,'kg',0),(395,54,333,NULL,0.02,'kg',0),(396,55,376,NULL,0.25,'kg',0),(397,55,74,NULL,0.15,'kg',0),(398,55,125,NULL,0.17,'kg',0),(399,55,502,NULL,0.07,'litr',0),(400,55,78,NULL,0.07,'kg',0),(401,55,424,NULL,0.07,'kg',0),(402,55,457,NULL,0.002,'kg',0),(403,55,348,NULL,0.002,'kg',0),(404,55,101,NULL,0.06,'kg',0),(405,56,377,NULL,0.25,'kg',0),(406,56,424,NULL,0.05,'kg',0),(407,56,74,NULL,0.08,'kg',0),(408,57,53,NULL,0.12,'kg',0),(409,57,162,NULL,0.04,'kg',0),(410,57,409,NULL,0.05,'kg',0),(411,57,321,NULL,0.04,'kg',0),(412,58,415,NULL,0.1,'kg',0),(413,58,420,NULL,0.1,'kg',0),(414,58,392,NULL,0.1,'kg',0),(415,58,390,NULL,0.1,'kg',0),(416,59,456,NULL,0.1,'kg',0),(417,59,453,NULL,0.1,'kg',0),(418,59,175,NULL,0.1,'kg',0),(419,60,391,NULL,0.12,'kg',0),(420,60,510,NULL,0.005,'kg',0),(421,60,369,NULL,0.002,'kg',0),(422,61,150,NULL,6,'szt',0),(423,61,418,NULL,1,'kg',0),(424,61,502,NULL,0.1,'litr',0),(425,61,94,NULL,0.13,'kg',0),(426,61,253,NULL,0.6,'kg',0),(427,61,247,NULL,0.5,'litr',0),(428,61,274,NULL,0.1,'litr',0),(429,62,493,NULL,0.17,'kg',0),(430,62,116,NULL,0.1,'kg',0),(431,63,158,NULL,0.153,'kg',0),(432,63,166,NULL,0.0167,'kg',0),(433,63,224,NULL,0.0115,'kg',0),(434,63,302,NULL,0.0038,'kg',0),(435,63,63,NULL,0.0076,'kg',0),(436,63,78,NULL,0.0115,'kg',0),(437,63,274,NULL,0.003,'litr',0),(438,63,231,NULL,0.0046,'kg',0),(439,63,150,NULL,1,'szt',0),(440,63,351,NULL,0.0011,'kg',0),(441,63,348,NULL,0.00023,'kg',0),(442,63,322,NULL,0.025,'kg',0),(443,63,501,NULL,0.0875,'litr',0),(444,63,311,NULL,0.0725,'kg',0),(445,63,348,NULL,0.00025,'kg',0),(446,63,457,NULL,0.001,'kg',0),(447,64,254,NULL,0.7,'kg',0),(448,64,150,NULL,9,'szt',0),(449,64,94,NULL,0.15,'kg',0),(450,64,500,NULL,0.2,'kg',0),(451,64,148,NULL,1.7,'kg',0),(452,64,327,NULL,0.002,'kg',0),(453,64,331,NULL,0.002,'kg',0),(454,64,231,NULL,0.2,'kg',0),(455,64,202,NULL,0.7,'litr',0),(456,64,502,NULL,0.5,'litr',0),(457,64,65,NULL,0.03,'kg',0),(458,64,95,NULL,0.1,'kg',0),(459,64,403,NULL,0.5,'kg',0),(460,64,221,NULL,0.03,'kg',0),(461,65,120,NULL,0.32,'kg',0),(462,65,449,NULL,0.175,'kg',0),(463,65,396,NULL,0.07,'kg',0),(464,65,322,NULL,0.05,'kg',0),(465,65,106,NULL,0.01,'kg',0),(466,65,458,NULL,0.001,'kg',0),(467,65,371,NULL,0.15,'kg',0),(468,65,285,NULL,0.02,'kg',0),(469,65,99,NULL,0.02,'kg',0),(470,65,231,NULL,0.03,'kg',0),(471,65,348,NULL,0.001,'kg',0),(472,65,333,NULL,0.002,'kg',0),(473,65,363,NULL,0.022,'kg',0),(474,66,253,NULL,2,'kg',0),(475,66,274,NULL,0.3,'litr',0),(476,66,246,NULL,2,'litr',0),(477,66,449,NULL,3,'kg',0),(478,66,396,NULL,0.5,'kg',0),(479,66,231,NULL,0.2,'kg',0),(480,66,457,NULL,0.01,'kg',0),(481,66,348,NULL,0.01,'kg',0),(482,67,489,NULL,1.6,'kg',0),(483,67,253,NULL,0.7,'kg',0),(484,67,150,NULL,2,'szt',0),(485,67,63,NULL,0.2,'kg',0),(486,67,78,NULL,0.1,'kg',0),(487,67,457,NULL,0.008,'kg',0),(488,67,274,NULL,0.1,'litr',0),(489,68,23,NULL,4.5,'l',0),(490,68,224,NULL,0.2,'kg',0),(491,68,302,NULL,0.12,'kg',0),(492,68,388,NULL,0.1,'kg',0),(493,68,322,NULL,0.1,'kg',0),(494,68,489,NULL,2,'kg',0),(495,68,269,NULL,0.5,'kg',0),(496,68,501,NULL,0.8,'litr',0),(497,68,348,NULL,0.02,'kg',0),(498,68,457,NULL,0.02,'kg',0),(499,69,316,NULL,0.25,'kg',0),(500,69,298,NULL,0.005,'kg',0),(501,69,501,NULL,0.02,'litr',0),(502,69,489,NULL,0.1,'kg',0),(503,69,231,NULL,0.05,'kg',0),(504,69,350,NULL,0.001,'kg',0),(505,69,106,NULL,0.001,'kg',0),(506,69,274,NULL,0.005,'litr',0),(507,70,489,NULL,2,'kg',0),(508,70,431,NULL,0.2,'kg',0),(509,70,150,NULL,2,'szt',0),(510,70,457,NULL,0.002,'kg',0),(511,70,94,NULL,0.01,'kg',0),(512,70,503,NULL,0.07,'litr',0),(513,70,94,NULL,0.01,'kg',0),(514,70,331,NULL,0.001,'kg',0),(515,71,189,NULL,4,'kg',0),(516,71,224,NULL,2,'kg',0),(517,71,302,NULL,1.5,'kg',0),(518,71,388,NULL,2,'kg',0),(519,71,457,NULL,0.22,'kg',0),(520,71,353,NULL,0.06,'kg',0),(521,71,343,NULL,0.003,'kg',0),(522,71,297,NULL,0,'kg',0),(523,71,348,NULL,0.012,'kg',0),(524,71,351,NULL,0.3,'kg',0),(525,71,322,NULL,1,'kg',0),(526,71,216,NULL,2.8,'kg',0),(527,72,449,NULL,2.5,'kg',0),(528,72,322,NULL,0.852,'kg',0),(529,72,231,NULL,0.36,'kg',0),(530,72,106,NULL,0.044,'kg',0),(531,72,395,NULL,0.54,'kg',0),(532,72,457,NULL,0.005,'kg',0),(533,72,348,NULL,0.004,'kg',0),(534,73,385,NULL,0.12,'kg',0),(535,73,348,NULL,0.001,'kg',0),(536,73,457,NULL,0.001,'kg',0),(537,73,332,NULL,0.001,'kg',0),(538,73,274,NULL,0.02,'litr',0),(539,73,351,NULL,0.001,'kg',0),(540,74,119,NULL,0.11,'kg',0),(541,74,447,NULL,0.008,'kg',0),(542,74,424,NULL,0.025,'kg',0),(543,74,231,NULL,0.001,'kg',0),(544,74,458,NULL,0.001,'kg',0),(545,74,457,NULL,0.001,'kg',0),(546,74,348,NULL,0.001,'kg',0),(547,74,351,NULL,0.001,'kg',0),(548,74,442,NULL,0,'kg',0),(549,74,501,NULL,0.066,'litr',0),(550,74,416,NULL,0.032,'kg',0),(551,74,488,NULL,0.003,'kg',0),(552,75,264,NULL,0.1,'kg',0),(553,75,457,NULL,0.006,'kg',0),(554,75,348,NULL,0.003,'kg',0),(555,75,351,NULL,0.008,'kg',0),(556,75,486,NULL,0.04,'kg',0),(557,75,333,NULL,0.005,'kg',0),(558,75,274,NULL,0.008,'litr',0),(559,76,90,NULL,0.03,'kg',0),(560,76,28,NULL,0.005,'kg',0),(561,76,448,NULL,0.005,'kg',0),(562,76,138,NULL,0.005,'kg',0),(563,76,477,NULL,0.0025,'kg',0),(564,76,398,NULL,0.0025,'kg',0),(565,76,135,NULL,0.0005,'kg',0),(566,77,120,NULL,0.11,'kg',0),(567,77,457,NULL,0.001,'kg',0),(568,77,348,NULL,0.001,'kg',0),(569,77,421,NULL,0.001,'kg',0),(570,77,67,NULL,0.0025,'kg',0),(571,77,156,NULL,0.0025,'kg',0),(572,78,385,NULL,0.11,'kg',0),(573,78,457,NULL,0.001,'kg',0),(574,78,348,NULL,0.001,'kg',0),(575,78,295,NULL,0.0025,'kg',0),(576,78,78,NULL,0.001,'kg',0),(577,78,405,NULL,0.006,'kg',0),(578,78,150,NULL,0.5,'szt',0),(579,78,257,NULL,0.06,'kg',0),(580,78,127,NULL,0.02,'litr',0),(581,78,77,NULL,0.02,'kg',0),(582,79,120,NULL,0.11,'kg',0),(583,79,77,NULL,0.02,'kg',0),(584,79,127,NULL,0.02,'litr',0),(585,79,231,NULL,0.03,'kg',0),(586,79,457,NULL,0.002,'kg',0),(587,79,348,NULL,0.001,'kg',0),(588,79,405,NULL,0.025,'kg',0),(589,79,304,NULL,0.004,'kg',0),(590,79,150,NULL,0.5,'szt',0),(591,79,257,NULL,0.06,'kg',0),(592,80,120,NULL,0.11,'kg',0),(593,80,77,NULL,0.02,'kg',0),(594,80,127,NULL,0.02,'litr',0),(595,80,231,NULL,0.006,'kg',0),(596,80,457,NULL,0.002,'kg',0),(597,80,348,NULL,0.001,'kg',0),(598,80,78,NULL,0.01,'kg',0),(599,80,295,NULL,0.025,'kg',0),(600,80,150,NULL,0.5,'szt',0),(601,80,257,NULL,0.01,'kg',0),(602,80,414,NULL,0.006,'kg',0),(603,81,120,NULL,0.1,'kg',0),(604,81,77,NULL,0.02,'kg',0),(605,81,274,NULL,0.02,'litr',0),(606,81,231,NULL,0.02,'kg',0),(607,81,457,NULL,0.001,'kg',0),(608,81,348,NULL,0.0015,'kg',0),(609,81,414,NULL,0.0345,'kg',0),(610,81,304,NULL,0.05,'kg',0),(611,81,150,NULL,0.6,'szt',0),(612,81,257,NULL,0.015,'kg',0),(613,82,241,NULL,0.09,'kg',0),(614,82,457,NULL,0.001,'kg',0),(615,82,348,NULL,0.001,'kg',0),(616,82,77,NULL,0.019,'kg',0),(617,82,150,NULL,0.23,'szt',0),(618,82,231,NULL,0.01,'kg',0),(619,82,78,NULL,0.015,'kg',0),(620,82,351,NULL,0.0015,'kg',0),(621,82,127,NULL,0.02,'litr',0),(622,83,385,NULL,0.11,'kg',0),(623,83,274,NULL,0.09,'litr',0),(624,83,150,NULL,0.5,'szt',0),(625,83,77,NULL,0.02,'kg',0),(626,83,457,NULL,0.002,'kg',0),(627,83,348,NULL,0.001,'kg',0),(628,83,257,NULL,0.006,'kg',0),(629,84,385,NULL,0.16,'kg',0),(630,84,274,NULL,0.03,'litr',0),(631,84,150,NULL,0.4,'szt',0),(632,84,77,NULL,0.04,'kg',0),(633,84,457,NULL,0.001,'kg',0),(634,84,348,NULL,0.0016,'kg',0),(635,84,257,NULL,0.016,'kg',0),(636,85,119,NULL,0.12,'kg',0),(637,85,78,NULL,0.025,'kg',0),(638,85,501,NULL,0.1,'litr',0),(639,85,274,NULL,0.015,'litr',0),(640,85,457,NULL,0.001,'kg',0),(641,85,348,NULL,0.001,'kg',0),(642,85,118,NULL,0.07,'kg',0),(643,85,187,NULL,0.056,'kg',0),(644,85,351,NULL,0.04,'kg',0),(645,85,353,NULL,0.0005,'kg',0),(646,85,343,NULL,0.0005,'kg',0),(647,85,488,NULL,0.01,'kg',0),(648,86,163,NULL,0.153,'kg',0),(649,86,457,NULL,0.004,'kg',0),(650,86,348,NULL,0.0005,'kg',0),(651,86,344,NULL,0.00025,'kg',0),(652,86,274,NULL,0.005,'litr',0),(653,86,106,NULL,0.001,'kg',0),(654,86,502,NULL,0.002,'litr',0),(655,86,168,NULL,0.06,'kg',0),(656,87,492,NULL,0.1,'kg',0),(657,87,78,NULL,0.02,'kg',0),(658,87,332,NULL,0.001,'kg',0),(659,87,457,NULL,0.001,'kg',0),(660,87,348,NULL,0.001,'kg',0),(661,87,274,NULL,0.02,'litr',0),(662,87,254,NULL,0.01,'kg',0),(663,88,163,NULL,0.13,'kg',0),(664,88,311,NULL,0.03,'kg',0),(665,88,233,NULL,0.046,'kg',0),(666,88,457,NULL,0.001,'kg',0),(667,88,348,NULL,0.001,'kg',0),(668,89,473,NULL,0.1575,'kg',0),(669,89,457,NULL,0.0005,'kg',0),(670,89,363,NULL,0.02,'kg',0),(671,89,333,NULL,0.015,'kg',0),(672,90,120,NULL,0.11,'kg',0),(673,90,417,NULL,0.05,'kg',0),(674,90,453,NULL,0.05,'kg',0),(675,90,457,NULL,0.001,'kg',0),(676,90,348,NULL,0.001,'kg',0),(677,90,150,NULL,0.5,'szt',0),(678,90,77,NULL,0.02,'kg',0),(679,90,127,NULL,0.03,'litr',0),(680,90,257,NULL,0.01,'kg',0),(681,91,385,NULL,0.13,'kg',0),(682,91,295,NULL,0.07,'kg',0),(683,91,78,NULL,0.02,'kg',0),(684,91,414,NULL,0.025,'kg',0),(685,91,348,NULL,0.001,'kg',0),(686,91,457,NULL,0.001,'kg',0),(687,91,274,NULL,0.02,'litr',0),(688,91,150,NULL,0.3,'szt',0),(689,91,77,NULL,0.03,'kg',0),(690,91,257,NULL,0.02,'kg',0),(691,92,385,NULL,0.12,'kg',0),(692,92,321,NULL,0.016,'kg',0),(693,92,457,NULL,0.001,'kg',0),(694,92,311,NULL,0.03,'kg',0),(695,92,348,NULL,0.001,'kg',0),(696,92,150,NULL,0.2,'szt',0),(697,92,77,NULL,0.02,'kg',0),(698,93,385,NULL,0.11,'kg',0),(699,93,63,NULL,0.03,'kg',0),(700,93,78,NULL,0.01,'kg',0),(701,93,487,NULL,0.04,'kg',0),(702,93,269,NULL,0.01,'kg',0),(703,93,457,NULL,0.002,'kg',0),(704,93,348,NULL,0.001,'kg',0),(705,93,344,NULL,0.001,'kg',0),(706,93,502,NULL,0.002,'litr',0),(707,93,251,NULL,0.005,'kg',0),(708,93,274,NULL,0.003,'litr',0),(709,93,168,NULL,0.05,'kg',0),(710,94,163,NULL,0.13,'kg',0),(711,94,63,NULL,0.03,'kg',0),(712,94,78,NULL,0.03,'kg',0),(713,94,274,NULL,0.019,'litr',0),(714,94,269,NULL,0.03,'kg',0),(715,94,457,NULL,0.0014,'kg',0),(716,94,348,NULL,0.0014,'kg',0),(717,94,344,NULL,0.00015,'kg',0),(718,94,253,NULL,0.0014,'kg',0),(719,94,251,NULL,0.0145,'kg',0),(720,95,506,NULL,20,'kg',0),(721,95,457,NULL,0.02,'kg',0),(722,95,348,NULL,0.003,'kg',0),(723,95,106,NULL,0.09,'kg',0),(724,95,201,NULL,0.5,'kg',0),(725,95,173,NULL,0.25,'kg',0),(726,95,353,NULL,0.02,'kg',0),(727,95,340,NULL,0.001,'kg',0),(728,95,440,NULL,0.01,'litr',0),(729,95,444,NULL,0.01,'kg',0),(730,95,350,NULL,0.006,'kg',0),(731,95,160,NULL,6.65,'kg',0),(732,95,63,NULL,2,'kg',0),(733,95,499,NULL,0.5,'kg',0),(734,95,344,NULL,0.006,'kg',0),(735,95,239,NULL,0.15,'kg',0),(736,96,120,NULL,0.12,'kg',0),(737,96,457,NULL,0.001,'kg',0),(738,96,348,NULL,0.001,'kg',0),(739,96,253,NULL,0.006,'kg',0),(740,96,150,NULL,0.5,'szt',0),(741,96,274,NULL,0.09,'litr',0),(742,96,322,NULL,0.08,'kg',0),(743,96,502,NULL,0.06,'litr',0),(744,96,351,NULL,0.003,'kg',0),(745,96,231,NULL,0.03,'kg',0),(746,96,488,NULL,0.002,'kg',0),(747,96,457,NULL,0.003,'kg',0),(748,96,225,NULL,0.06,'kg',0),(749,97,120,NULL,0.13,'kg',0),(750,97,297,NULL,0.0001,'kg',0),(751,97,253,NULL,0.02,'kg',0),(752,97,150,NULL,0.4,'kg',0),(753,97,274,NULL,0.02,'kg',0),(754,97,231,NULL,0.008,'kg',0),(755,97,106,NULL,0.04,'kg',0),(756,97,395,NULL,0.08,'kg',0),(757,97,35,NULL,0.075,'kg',0),(758,97,36,NULL,0.06,'kg',0),(759,97,120,NULL,0,'kg',0),(760,97,297,NULL,0,'kg',0),(761,97,253,NULL,0,'kg',0),(762,97,150,NULL,0,'kg',0),(763,97,274,NULL,0,'kg',0),(764,97,231,NULL,0,'kg',0),(765,97,106,NULL,0,'kg',0),(766,97,395,NULL,0,'kg',0),(767,97,35,NULL,0,'kg',0),(768,97,36,NULL,0,'kg',0),(769,98,120,NULL,0.13,'kg',0),(770,98,297,NULL,0.0001,'kg',0),(771,98,253,NULL,0.02,'kg',0),(772,98,150,NULL,0.4,'szt',0),(773,98,274,NULL,0.02,'litr',0),(774,98,231,NULL,0.008,'kg',0),(775,98,106,NULL,0.04,'kg',0),(776,98,395,NULL,0.08,'kg',0),(777,98,449,NULL,0.075,'kg',0),(778,98,426,NULL,0.06,'kg',0),(779,99,120,NULL,0.13,'kg',0),(780,99,297,NULL,0.0001,'kg',0),(781,99,457,NULL,0.001,'kg',0),(782,99,253,NULL,0.02,'kg',0),(783,99,150,NULL,0.4,'szt',0),(784,99,274,NULL,0.02,'litr',0),(785,99,321,NULL,0.145,'kg',0),(786,99,406,NULL,0.024,'kg',0),(787,100,386,NULL,0.19,'kg',0),(788,100,274,NULL,0.02,'litr',0),(789,100,150,NULL,0.3,'szt',0),(790,100,77,NULL,0.03,'kg',0),(791,100,457,NULL,0.001,'kg',0),(792,100,348,NULL,0.001,'kg',0),(793,100,253,NULL,0.01,'kg',0),(794,101,291,NULL,0.187,'kg',0),(795,101,457,NULL,0.001,'kg',0),(796,101,348,NULL,0.001,'kg',0),(797,101,150,NULL,0.25,'szt',0),(798,101,332,NULL,0.002,'kg',0),(799,101,429,NULL,0.05,'kg',0),(800,101,274,NULL,0.02,'litr',0),(801,102,472,NULL,0.225,'kg',0),(802,102,344,NULL,0.001,'kg',0),(803,102,457,NULL,0.002,'kg',0),(804,102,348,NULL,0.001,'kg',0),(805,102,274,NULL,0.03,'litr',0),(806,102,106,NULL,0.01,'kg',0),(807,103,233,NULL,0.1,'kg',0),(808,103,150,NULL,0.1,'szt',0),(809,103,457,NULL,0.001,'kg',0),(810,103,348,NULL,0.001,'kg',0),(811,103,274,NULL,0.01,'litr',0),(812,103,78,NULL,0.04,'kg',0),(813,103,173,NULL,0.025,'kg',0),(814,104,489,NULL,0.18,'kg',0),(815,104,185,NULL,0.006,'kg',0),(816,104,457,NULL,0.001,'kg',0),(817,105,161,NULL,0.047,'kg',0),(818,105,195,NULL,0.027,'kg',0),(819,105,285,NULL,0.013,'kg',0),(820,105,289,NULL,0.013,'kg',0),(821,105,210,NULL,0.0047,'litr',0),(822,106,75,NULL,0.195,'kg',0),(823,106,265,NULL,0.0015,'litr',0),(824,106,94,NULL,0.0075,'kg',0),(825,106,348,NULL,0.0015,'kg',0),(826,106,457,NULL,0.0015,'kg',0),(827,107,158,NULL,0.12,'kg',0),(828,107,271,NULL,0.015,'kg',0),(829,107,185,NULL,0.008,'kg',0),(830,107,274,NULL,0.006,'litr',0),(831,107,224,NULL,0.03,'kg',0),(832,107,148,NULL,0.01,'kg',0),(833,107,322,NULL,0.01,'kg',0),(834,107,457,NULL,0.0015,'kg',0),(835,107,265,NULL,0.002,'litr',0),(836,107,94,NULL,0.0045,'kg',0),(837,108,227,NULL,0.08,'kg',0),(838,108,231,NULL,0.01,'kg',0),(839,108,94,NULL,0.01,'kg',0),(840,108,457,NULL,0.001,'kg',0),(841,108,254,NULL,0.001,'kg',0),(842,109,271,NULL,0.1,'kg',0),(843,109,152,NULL,0.01,'kg',0),(844,109,457,NULL,0.002,'kg',0),(845,109,348,NULL,0.001,'kg',0),(846,109,94,NULL,0.002,'kg',0),(847,109,197,NULL,0.003,'kg',0),(848,109,500,NULL,0.02,'kg',0),(849,109,185,NULL,0.001,'kg',0),(850,110,54,NULL,2.4,'kg',0),(851,110,477,NULL,1.5,'kg',0),(852,110,478,NULL,1.5,'kg',0),(853,110,148,NULL,1,'kg',0),(854,110,317,NULL,1.3,'kg',0),(855,110,177,NULL,0.7,'kg',0),(856,110,262,NULL,1.2,'kg',0),(857,111,208,NULL,0.1,'litr',0),(858,111,315,NULL,0.006,'kg',0),(859,111,59,NULL,0.03,'litr',0),(860,111,370,NULL,0.004,'kg',0),(861,112,125,NULL,10,'kg',0),(862,112,127,NULL,10,'litr',0),(863,113,153,NULL,0.023,'kg',0),(864,113,453,NULL,0.019,'kg',0),(865,113,456,NULL,0.019,'kg',0),(866,113,461,NULL,0.03,'kg',0),(867,113,270,NULL,0.033,'kg',0),(868,113,457,NULL,0.001,'kg',0),(869,113,78,NULL,0.01,'kg',0),(870,114,322,NULL,1,'kg',0),(871,114,134,NULL,19,'kg',0),(872,114,508,NULL,0.264,'kg',0),(873,114,224,NULL,2.5,'kg',0),(874,114,302,NULL,1,'kg',0),(875,114,388,NULL,0.68,'kg',0),(876,114,351,NULL,0.04,'kg',0),(877,114,457,NULL,0.01,'kg',0),(878,114,348,NULL,0.008,'kg',0),(879,114,343,NULL,0,'kg',0),(880,114,304,NULL,0.16,'kg',0),(881,115,53,NULL,0.08,'kg',0),(882,115,318,NULL,0.08,'kg',0),(883,115,401,NULL,0.01,'kg',0),(884,116,471,NULL,0.04,'kg',0),(885,116,224,NULL,0.01,'kg',0),(886,116,302,NULL,0.005,'kg',0),(887,116,388,NULL,0.005,'kg',0),(888,116,508,NULL,0.01,'kg',0),(889,116,353,NULL,0.0001,'kg',0),(890,116,343,NULL,0.0001,'kg',0),(891,116,348,NULL,0.0001,'kg',0),(892,116,101,NULL,0.001,'kg',0),(893,117,358,NULL,0.0407,'kg',0),(894,117,481,NULL,0.0187,'kg',0),(895,117,185,NULL,0.00025,'kg',0),(896,117,508,NULL,0.0025,'kg',0),(897,117,101,NULL,0.0087,'kg',0),(898,117,457,NULL,0.00037,'kg',0),(899,117,348,NULL,0.00025,'kg',0),(900,117,351,NULL,0.0025,'kg',0),(901,117,265,NULL,0.00125,'litr',0),(902,118,388,NULL,0.04,'kg',0),(903,118,302,NULL,0.04,'kg',0),(904,118,489,NULL,0.0168,'kg',0),(905,118,269,NULL,0.0135,'kg',0),(906,118,322,NULL,0.0067,'kg',0),(907,118,148,NULL,0.0075,'kg',0),(908,118,150,NULL,0.5,'szt',0),(909,118,457,NULL,0.0002,'kg',0),(910,118,348,NULL,0.0005,'kg',0),(911,118,210,NULL,0.02,'litr',0),(912,118,251,NULL,0.01,'kg',0),(913,118,227,NULL,0.092,'kg',0),(914,119,233,NULL,0.068,'kg',0),(915,119,150,NULL,0.27,'szt',0),(916,119,457,NULL,0.001,'kg',0),(917,119,348,NULL,0.001,'kg',0),(918,119,77,NULL,0.009,'kg',0),(919,119,274,NULL,0.01,'litr',0),(920,119,265,NULL,0.027,'litr',0),(921,119,457,NULL,0.002,'kg',0),(922,119,94,NULL,0.001,'kg',0),(923,119,353,NULL,0.0002,'kg',0),(924,119,343,NULL,0.0005,'kg',0),(925,119,78,NULL,0.02,'kg',0),(926,120,510,NULL,1.2,'kg',0),(927,120,492,NULL,8.5,'kg',0),(928,120,224,NULL,1,'kg',0),(929,120,388,NULL,0.5,'kg',0),(930,120,302,NULL,0.5,'kg',0),(931,120,457,NULL,0.02,'kg',0),(932,120,348,NULL,0.005,'kg',0),(933,120,502,NULL,2,'litr',0),(934,120,351,NULL,0.03,'kg',0),(935,120,484,NULL,1,'kg',0),(936,120,78,NULL,1,'kg',0),(937,120,231,NULL,1.3,'kg',0),(938,120,106,NULL,0.1,'kg',0),(939,120,344,NULL,0.01,'kg',0),(940,120,322,NULL,0.2,'kg',0),(941,121,295,NULL,0.08,'kg',0),(942,121,288,NULL,0.04,'kg',0),(943,121,272,NULL,0.04,'kg',0),(944,122,233,NULL,0.1,'kg',0),(945,122,150,NULL,0.2,'szt',0),(946,122,224,NULL,0.01,'kg',0),(947,122,457,NULL,0.001,'kg',0),(948,122,348,NULL,0.001,'kg',0),(949,122,351,NULL,0.001,'kg',0),(950,123,357,NULL,0.1,'kg',0),(951,124,366,NULL,0.075,'kg',0),(952,125,108,NULL,0.11,'kg',0),(953,125,457,NULL,0.0012,'kg',0),(954,125,253,NULL,0.01,'kg',0),(955,125,150,NULL,0.42,'szt',0),(956,125,274,NULL,0.01,'litr',0),(957,125,348,NULL,0.0004,'kg',0),(958,125,181,NULL,0.0225,'kg',0),(959,125,173,NULL,0.05,'kg',0),(960,125,265,NULL,0.005,'litr',0),(961,125,94,NULL,0.0025,'kg',0),(962,125,272,NULL,0.085,'kg',0),(963,125,287,NULL,0.051,'kg',0),(964,126,271,NULL,0.02,'kg',0),(965,126,318,NULL,0.02,'kg',0),(966,126,447,NULL,0.05,'kg',0),(967,126,161,NULL,0.03,'kg',0),(968,126,210,NULL,0.01,'litr',0),(969,127,194,NULL,0.08,'kg',0),(970,127,319,NULL,0.05,'kg',0),(971,127,455,NULL,0.04,'kg',0),(972,127,414,NULL,0.03,'kg',0),(973,127,79,NULL,0.01,'kg',0),(974,127,271,NULL,0.04,'kg',0),(975,127,106,NULL,0.04,'kg',0),(976,127,210,NULL,0.003,'litr',0),(977,127,173,NULL,0.003,'kg',0),(978,128,466,NULL,0.1,'kg',0),(979,128,414,NULL,0.04,'kg',0),(980,128,195,NULL,0.1,'kg',0),(981,128,457,NULL,0.0001,'kg',0),(982,128,348,NULL,0.0001,'kg',0),(983,128,210,NULL,0.01,'litr',0),(984,128,48,NULL,0.03,'kg',0),(985,128,272,NULL,0.02,'kg',0),(986,129,457,NULL,0.00031,'kg',0),(987,129,194,NULL,0.001,'kg',0),(988,129,455,NULL,0.011,'kg',0),(989,129,210,NULL,0.0062,'litr',0),(990,129,463,NULL,0.0034,'kg',0),(991,129,79,NULL,0.0024,'kg',0),(992,129,414,NULL,0.006,'kg',0),(993,130,372,NULL,0.2,'kg',0),(994,130,48,NULL,0.1,'kg',0),(995,130,121,NULL,0.2,'kg',0),(996,130,271,NULL,0.2,'kg',0),(997,130,210,NULL,0.1,'litr',0),(998,131,385,NULL,0.059,'kg',0),(999,131,348,NULL,0.0001,'kg',0),(1000,131,457,NULL,0.0007,'kg',0),(1001,131,343,NULL,0.000028,'kg',0),(1002,131,344,NULL,0.00022,'kg',0),(1003,132,496,NULL,0.05,'kg',0),(1004,132,246,NULL,0.03,'litr',0),(1005,132,353,NULL,0.0002,'kg',0),(1006,132,343,NULL,0.0002,'kg',0),(1007,132,78,NULL,0.04,'kg',0),(1008,132,364,NULL,0.005,'kg',0),(1009,132,173,NULL,0.025,'kg',0),(1010,132,274,NULL,0.001,'litr',0),(1011,133,497,NULL,0.09,'kg',0),(1012,133,246,NULL,0.1,'litr',0),(1013,133,364,NULL,0.015,'kg',0),(1014,133,274,NULL,0.001,'litr',0),(1015,133,78,NULL,0.025,'kg',0),(1016,133,457,NULL,0.0001,'kg',0),(1017,133,348,NULL,0.0001,'kg',0),(1018,133,173,NULL,0.04,'kg',0),(1019,134,496,NULL,0.075,'kg',0),(1020,134,78,NULL,0.025,'kg',0),(1021,134,148,NULL,0.056,'kg',0),(1022,134,210,NULL,0.035,'litr',0),(1023,134,457,NULL,0.001,'kg',0),(1024,134,348,NULL,0.0004,'kg',0),(1025,134,48,NULL,0.01,'kg',0),(1026,135,491,NULL,0.188,'kg',0),(1027,136,163,NULL,0.06,'kg',0),(1028,136,499,NULL,0.005,'kg',0),(1029,136,457,NULL,0.0001,'kg',0),(1030,136,348,NULL,0.0001,'kg',0),(1031,136,274,NULL,0.01,'litr',0),(1032,137,385,NULL,0.05,'kg',0),(1033,137,321,NULL,0.009,'kg',0),(1034,137,457,NULL,0.0001,'kg',0),(1035,137,348,NULL,0.0001,'kg',0),(1036,137,233,NULL,0.034,'kg',0),(1037,137,455,NULL,0.03,'kg',0),(1038,138,107,NULL,0.1,'kg',0),(1039,138,343,NULL,0.0002,'kg',0),(1040,138,353,NULL,0.0002,'kg',0),(1041,138,94,NULL,0.001,'kg',0),(1042,138,265,NULL,0.02,'litr',0),(1043,138,78,NULL,0.02,'kg',0),(1044,138,253,NULL,0.005,'kg',0),(1045,138,274,NULL,0.02,'litr',0),(1046,138,348,NULL,0.0002,'kg',0),(1047,138,457,NULL,0.005,'kg',0),(1048,139,328,NULL,0.05,'kg',0),(1049,139,508,NULL,0.005,'kg',0),(1050,139,137,NULL,0.05,'kg',0),(1051,139,195,NULL,0.05,'kg',0),(1052,139,224,NULL,0.01,'kg',0),(1053,140,120,NULL,0.06,'kg',0),(1054,140,271,NULL,0.06,'kg',0),(1055,140,79,NULL,0.03,'kg',0),(1056,140,210,NULL,0.008,'litr',0),(1057,140,106,NULL,0.04,'kg',0),(1058,140,152,NULL,0.008,'kg',0),(1059,141,148,NULL,0.046,'kg',0),(1060,141,343,NULL,0.00013,'kg',0),(1061,141,353,NULL,0.00026,'kg',0),(1062,141,348,NULL,0.00026,'kg',0),(1063,141,180,NULL,0.04,'litr',0),(1064,141,344,NULL,0.00026,'kg',0),(1065,141,265,NULL,0.002,'litr',0),(1066,141,75,NULL,0.19,'kg',0),(1067,141,106,NULL,0.005,'kg',0),(1068,141,290,NULL,1,'porcja',0),(1069,142,160,NULL,0.05,'kg',0),(1070,142,295,NULL,0.05,'kg',0),(1071,142,351,NULL,0.001,'kg',0),(1072,142,348,NULL,0.001,'kg',0),(1073,142,78,NULL,0.01,'kg',0),(1074,142,77,NULL,0.03,'kg',0),(1075,142,247,NULL,0.05,'litr',0),(1076,142,150,NULL,0.5,'szt',0),(1077,142,253,NULL,0.03,'kg',0),(1078,142,274,NULL,0.01,'litr',0),(1079,142,457,NULL,0.001,'kg',0),(1080,143,295,NULL,0.05,'kg',0),(1081,143,414,NULL,0.05,'kg',0),(1082,143,173,NULL,0.027,'kg',0),(1083,143,77,NULL,0.05,'kg',0),(1084,143,297,NULL,0.001,'kg',0),(1085,143,457,NULL,0.001,'kg',0),(1086,143,274,NULL,0.047,'litr',0),(1087,143,253,NULL,0.03,'kg',0),(1088,143,247,NULL,0.05,'litr',0),(1089,143,150,NULL,0.5,'szt',0),(1090,143,78,NULL,0.02,'kg',0),(1091,144,119,NULL,0.08,'kg',0),(1092,144,186,NULL,0.1,'kg',0),(1093,144,118,NULL,0.016,'kg',0),(1094,144,501,NULL,0.02,'litr',0),(1095,144,486,NULL,0.03,'kg',0),(1096,144,457,NULL,0.001,'kg',0),(1097,144,348,NULL,0.001,'kg',0),(1098,144,274,NULL,0.01,'litr',0),(1099,144,71,NULL,0.027,'kg',0),(1100,145,123,NULL,0.15,'kg',0),(1101,145,228,NULL,0.005,'kg',0),(1102,145,486,NULL,0.04,'kg',0),(1103,145,253,NULL,0.0012,'kg',0),(1104,145,344,NULL,0.006,'kg',0),(1105,145,457,NULL,0.0018,'kg',0),(1106,145,348,NULL,0.0006,'kg',0),(1107,145,352,NULL,0.003,'litr',0),(1108,145,343,NULL,0.0005,'kg',0),(1109,145,353,NULL,0.0003,'kg',0),(1110,145,346,NULL,0.0006,'kg',0),(1111,145,345,NULL,0.0006,'kg',0),(1112,145,351,NULL,0.001,'kg',0),(1113,146,134,NULL,0.5,'kg',0),(1114,146,457,NULL,0.007,'kg',0),(1115,146,348,NULL,0.01,'kg',0),(1116,146,106,NULL,0.006,'kg',0),(1117,146,274,NULL,0.025,'litr',0),(1118,146,160,NULL,0.5,'kg',0),(1119,146,63,NULL,0.15,'kg',0),(1120,147,160,NULL,0.1,'kg',0),(1121,147,63,NULL,0.055,'kg',0),(1122,147,78,NULL,0.02,'kg',0),(1123,147,344,NULL,0.0005,'kg',0),(1124,147,343,NULL,0.0001,'kg',0),(1125,147,353,NULL,0.0001,'kg',0),(1126,147,94,NULL,0.001,'kg',0),(1127,147,351,NULL,0.001,'kg',0),(1128,147,274,NULL,0.001,'litr',0),(1129,148,158,NULL,0.15,'kg',0),(1130,148,241,NULL,0.076,'kg',0),(1131,148,371,NULL,0.0076,'kg',0),(1132,148,181,NULL,0.012,'kg',0),(1133,148,502,NULL,0.002,'litr',0),(1134,148,150,NULL,0.076,'szt',0),(1135,148,351,NULL,0.0011,'kg',0),(1136,148,348,NULL,0.00015,'kg',0),(1137,148,78,NULL,0.028,'kg',0),(1138,148,231,NULL,0.015,'kg',0),(1139,148,457,NULL,0.00023,'kg',0),(1140,148,488,NULL,0.008,'kg',0),(1141,149,240,NULL,0.1,'kg',0),(1142,149,78,NULL,0.002,'kg',0),(1143,149,166,NULL,0.015,'kg',0),(1144,149,343,NULL,0.001,'kg',0),(1145,149,274,NULL,0.001,'litr',0),(1146,150,163,NULL,0.16,'kg',0),(1147,150,210,NULL,0.025,'litr',0),(1148,150,414,NULL,0.02,'kg',0),(1149,150,274,NULL,0.02,'litr',0),(1150,150,295,NULL,0.02,'kg',0),(1151,151,120,NULL,0.09,'kg',0),(1152,151,486,NULL,0.05,'kg',0),(1153,151,457,NULL,0.0001,'kg',0),(1154,151,348,NULL,0.0001,'kg',0),(1155,151,371,NULL,0.02,'kg',0),(1156,151,338,NULL,0.007,'kg',0),(1157,151,71,NULL,0.03,'kg',0),(1158,151,285,NULL,0.05,'kg',0),(1159,151,289,NULL,0.05,'kg',0),(1160,152,176,NULL,0.08,'kg',0),(1161,152,285,NULL,0.04,'kg',0),(1162,152,289,NULL,0.02,'kg',0),(1163,152,78,NULL,0.03,'kg',0),(1164,152,173,NULL,0.02,'kg',0),(1165,152,182,NULL,0.02,'kg',0),(1166,152,295,NULL,0.08,'kg',0),(1167,152,457,NULL,0.002,'kg',0),(1168,152,348,NULL,0.001,'kg',0),(1169,152,274,NULL,0.01,'litr',0),(1170,153,120,NULL,0.05,'kg',0),(1171,153,150,NULL,0.7,'szt',0),(1172,153,431,NULL,0.015,'kg',0),(1173,153,348,NULL,0.0002,'kg',0),(1174,153,304,NULL,0.0015,'kg',0),(1175,153,351,NULL,0.001,'kg',0),(1176,153,274,NULL,0.01,'litr',0),(1177,153,457,NULL,0.0005,'kg',0),(1178,153,414,NULL,0.01,'kg',0),(1179,153,332,NULL,0.0002,'kg',0),(1180,153,125,NULL,0.1,'kg',0),(1181,153,127,NULL,0.025,'litr',0),(1182,154,486,NULL,0.03,'kg',0),(1183,154,309,NULL,0.034,'kg',0),(1184,154,501,NULL,0.0135,'litr',0),(1185,154,351,NULL,0.002,'kg',0),(1186,154,348,NULL,0.002,'kg',0),(1187,155,236,NULL,0.1,'kg',0),(1188,155,253,NULL,0.01,'kg',0),(1189,155,274,NULL,0.0125,'litr',0),(1190,155,150,NULL,0.4,'szt',0),(1191,155,457,NULL,0.00025,'kg',0),(1192,155,502,NULL,0.066,'litr',0),(1193,155,295,NULL,0.033,'kg',0),(1194,155,348,NULL,0.00033,'kg',0),(1195,155,322,NULL,0.035,'kg',0),(1196,155,351,NULL,0.002,'kg',0),(1197,155,488,NULL,0.0016,'kg',0),(1198,155,231,NULL,0.0023,'kg',0),(1199,156,214,NULL,0.09,'kg',0),(1200,156,501,NULL,0.08,'litr',0),(1201,156,106,NULL,0.018,'kg',0),(1202,156,449,NULL,0.15,'kg',0),(1203,156,393,NULL,0.01,'kg',0),(1204,157,316,NULL,0.07,'kg',0),(1205,157,457,NULL,0.0025,'kg',0),(1206,157,348,NULL,0.0015,'kg',0),(1207,157,295,NULL,0.06,'kg',0),(1208,157,78,NULL,0.01,'kg',0),(1209,157,322,NULL,0.035,'kg',0),(1210,157,501,NULL,0.02,'litr',0),(1211,157,231,NULL,0.013,'kg',0),(1212,158,178,NULL,0.075,'kg',0),(1213,158,457,NULL,0.001,'kg',0),(1214,158,274,NULL,0.001,'litr',0),(1215,159,316,NULL,0.08,'kg',0),(1216,159,346,NULL,0.0002,'kg',0),(1217,159,295,NULL,0.02,'kg',0),(1218,159,285,NULL,0.016,'kg',0),(1219,159,487,NULL,0.0006,'kg',0),(1220,159,457,NULL,0.0004,'kg',0),(1221,159,348,NULL,0.00016,'kg',0),(1222,159,173,NULL,0.02,'kg',0),(1223,159,52,NULL,0.01,'kg',0),(1224,159,343,NULL,0.00004,'kg',0),(1225,159,353,NULL,0.00004,'kg',0),(1226,159,345,NULL,0.00016,'kg',0),(1227,159,351,NULL,0.0004,'kg',0),(1228,159,94,NULL,0.0002,'kg',0),(1229,159,487,NULL,0.0006,'kg',0),(1230,160,295,NULL,0.1,'kg',0),(1231,160,233,NULL,0.1,'kg',0),(1232,160,150,NULL,0.5,'szt',0),(1233,160,274,NULL,0.01,'litr',0),(1234,160,77,NULL,0.02,'kg',0),(1235,161,160,NULL,0.075,'kg',0),(1236,161,348,NULL,0.0002,'kg',0),(1237,161,176,NULL,0.03,'kg',0),(1238,161,63,NULL,0.027,'kg',0),(1239,161,240,NULL,0.02,'kg',0),(1240,161,181,NULL,0.005,'kg',0),(1241,161,344,NULL,0.0025,'kg',0),(1242,161,343,NULL,0.0005,'kg',0),(1243,161,353,NULL,0.00005,'kg',0),(1244,161,457,NULL,0.00015,'kg',0),(1245,162,378,NULL,0.25,'kg',0),(1246,162,271,NULL,0.15,'kg',0),(1247,162,318,NULL,0.02,'kg',0),(1248,162,79,NULL,0.02,'kg',0),(1249,162,28,NULL,0.05,'kg',0),(1250,162,407,NULL,0.15,'kg',0),(1251,162,277,NULL,0.03,'kg',0),(1252,162,285,NULL,0.2,'kg',0),(1253,162,319,NULL,0.01,'kg',0),(1254,163,474,NULL,0.025,'kg',0),(1255,163,241,NULL,0.033,'kg',0),(1256,164,163,NULL,0.066,'kg',0),(1257,164,285,NULL,0.033,'kg',0),(1258,164,78,NULL,0.016,'kg',0),(1259,164,295,NULL,0.02,'kg',0),(1260,164,181,NULL,0.02,'kg',0),(1261,164,345,NULL,0.00053,'kg',0),(1262,164,346,NULL,0.0013,'kg',0),(1263,164,457,NULL,0.001,'kg',0),(1264,164,348,NULL,0.00053,'kg',0),(1265,164,297,NULL,0.0006,'kg',0),(1266,164,304,NULL,0.00066,'kg',0),(1267,164,351,NULL,0.0016,'kg',0),(1268,164,106,NULL,0.0013,'kg',0),(1269,164,274,NULL,0.004,'litr',0),(1270,164,353,NULL,0.0001,'kg',0),(1271,164,343,NULL,0.00013,'kg',0),(1272,164,488,NULL,0.002,'kg',0),(1273,164,352,NULL,0.0033,'litr',0),(1274,164,272,NULL,0.036,'kg',0),(1275,164,347,NULL,0.00053,'kg',0),(1276,165,120,NULL,0.1,'kg',0),(1277,165,285,NULL,0.025,'kg',0),(1278,165,295,NULL,0.025,'kg',0),(1279,165,78,NULL,0.025,'kg',0),(1280,165,63,NULL,0.04,'kg',0),(1281,165,269,NULL,0.025,'kg',0),(1282,165,457,NULL,0.001,'kg',0),(1283,165,348,NULL,0.001,'kg',0),(1284,165,274,NULL,0.01,'litr',0),(1285,165,333,NULL,0.005,'kg',0),(1286,166,272,NULL,0.03,'kg',0),(1287,166,296,NULL,0.03,'kg',0),(1288,166,86,NULL,0.01,'kg',0),(1289,166,210,NULL,0.03,'litr',0),(1290,167,455,NULL,0.02,'kg',0),(1291,167,48,NULL,0.06,'kg',0),(1292,167,414,NULL,0.02,'kg',0),(1293,167,195,NULL,0.06,'kg',0),(1294,167,387,NULL,0.02,'kg',0),(1295,167,210,NULL,0.02,'litr',0),(1296,168,7,NULL,0.06,'kg',0),(1297,168,6,NULL,0.1,'kg',0),(1298,168,1,NULL,0.11,'kg',0),(1299,168,8,NULL,0.01,'kg',0),(1300,168,5,NULL,1,'kg',0),(1301,169,381,NULL,0.3,'kg',0),(1302,169,478,NULL,0.013,'kg',0),(1303,169,477,NULL,0.013,'kg',0),(1304,169,285,NULL,0.013,'kg',0),(1305,169,289,NULL,0.013,'kg',0),(1306,169,319,NULL,0.02,'kg',0),(1307,169,101,NULL,0.04,'kg',0),(1308,169,317,NULL,0.04,'kg',0),(1309,170,381,NULL,0.125,'kg',0),(1310,170,319,NULL,0.015,'kg',0),(1311,170,101,NULL,0.01,'kg',0),(1312,170,317,NULL,0.02,'kg',0),(1313,171,171,NULL,0.018,'kg',0),(1314,171,172,NULL,0.015,'kg',0),(1315,171,94,NULL,0.01,'kg',0),(1316,171,247,NULL,0.09,'litr',0),(1317,172,142,NULL,2,'szt',0),(1318,172,94,NULL,0.005,'kg',0),(1319,173,259,NULL,0.6,'litr',0),(1320,173,261,NULL,0.5,'litr',0),(1321,173,260,NULL,0.5,'litr',0),(1322,173,436,NULL,0.5,'litr',0),(1323,173,437,NULL,0.5,'litr',0),(1324,173,481,NULL,1,'litr',0),(1325,173,101,NULL,0.03,'kg',0),(1326,174,259,NULL,0.5,'litr',0),(1327,174,261,NULL,0.4,'litr',0),(1328,174,260,NULL,0.4,'litr',0),(1329,174,436,NULL,0.35,'litr',0),(1330,174,437,NULL,0.35,'litr',0),(1331,174,481,NULL,0.8,'litr',0),(1332,175,436,NULL,0.3,'litr',0),(1333,175,437,NULL,0.3,'litr',0),(1334,175,481,NULL,0.3,'litr',0),(1335,175,101,NULL,0.02,'kg',0),(1336,176,259,NULL,0.5,'litr',0),(1337,176,261,NULL,0.3,'litr',0),(1338,176,260,NULL,0.3,'litr',0),(1339,176,436,NULL,0.3,'litr',0),(1340,176,437,NULL,0.3,'litr',0),(1341,176,481,NULL,0.6,'litr',0),(1342,176,101,NULL,0.02,'kg',0),(1343,177,259,NULL,0.4,'litr',0),(1344,177,261,NULL,0.3,'litr',0),(1345,177,260,NULL,0.3,'litr',0),(1346,177,436,NULL,0.25,'litr',0),(1347,177,437,NULL,0.25,'litr',0),(1348,177,481,NULL,0.4,'litr',0),(1349,177,101,NULL,0.02,'kg',0),(1350,178,119,NULL,1.4,'kg',0),(1351,178,77,NULL,0.04,'kg',0),(1352,178,501,NULL,0.23,'litr',0),(1353,178,150,NULL,4,'szt',0),(1354,178,351,NULL,0.006,'kg',0),(1355,178,457,NULL,0.016,'kg',0),(1356,178,348,NULL,0.006,'kg',0),(1357,179,165,NULL,0.16,'kg',0),(1358,179,257,NULL,0.002,'kg',0),(1359,179,274,NULL,0.05,'litr',0),(1360,180,189,NULL,1,'kg',0),(1361,180,224,NULL,0.2,'kg',0),(1362,180,302,NULL,0.2,'kg',0),(1363,180,388,NULL,0.2,'kg',0),(1364,180,304,NULL,0.01,'kg',0),(1365,180,313,NULL,0.2,'kg',0),(1366,180,501,NULL,0.3,'litr',0),(1367,180,213,NULL,0.3,'kg',0),(1368,181,120,NULL,1.2,'kg',0),(1369,181,210,NULL,0.1,'litr',0),(1370,181,150,NULL,3,'szt',0),(1371,181,351,NULL,0.05,'kg',0),(1372,181,106,NULL,0.05,'kg',0),(1373,181,431,NULL,0.05,'kg',0),(1374,181,304,NULL,0.02,'kg',0),(1375,181,185,NULL,0.02,'kg',0),(1376,181,12,NULL,10,'kg',0),(1377,182,234,NULL,0.7,'kg',0),(1378,182,284,NULL,0.3,'kg',0),(1379,182,106,NULL,0.05,'kg',0),(1380,182,344,NULL,0.01,'kg',0),(1381,182,78,NULL,0.15,'kg',0),(1382,183,291,NULL,0.17,'kg',0),(1383,183,101,NULL,0.3,'kg',0),(1384,183,94,NULL,0.15,'kg',0),(1385,183,173,NULL,0.15,'kg',0),(1386,183,150,NULL,4,'szt',0),(1387,183,431,NULL,0.15,'kg',0),(1388,183,274,NULL,0.1,'litr',0),(1389,184,484,NULL,2,'kg',0),(1390,184,241,NULL,0.8,'kg',0),(1391,184,457,NULL,0.028,'kg',0),(1392,184,297,NULL,0.004,'kg',0),(1393,184,78,NULL,0.4,'kg',0),(1394,184,150,NULL,8,'szt',0),(1395,184,77,NULL,0.02,'kg',0),(1396,184,231,NULL,0.6,'kg',0),(1397,184,304,NULL,0.008,'kg',0),(1398,185,474,NULL,0.4,'kg',0),(1399,185,242,NULL,0.4,'kg',0),(1400,185,457,NULL,0.004,'kg',0),(1401,185,348,NULL,0.004,'kg',0),(1402,185,351,NULL,0.004,'kg',0),(1403,185,304,NULL,0.01,'kg',0),(1404,185,150,NULL,2,'szt',0),(1405,185,285,NULL,0.12,'kg',0),(1406,185,77,NULL,0.05,'kg',0),(1407,186,450,NULL,0.312,'kg',0),(1408,186,495,NULL,0.1,'kg',0),(1409,186,428,NULL,0.15,'kg',0),(1410,186,150,NULL,1.87,'szt',0),(1411,186,257,NULL,0.1,'kg',0),(1412,186,457,NULL,0.005,'kg',0),(1413,186,348,NULL,0.002,'kg',0),(1414,186,231,NULL,0.01,'kg',0),(1415,186,106,NULL,0.002,'kg',0),(1416,187,107,NULL,0.1,'kg',0),(1417,187,486,NULL,0.1,'kg',0),(1418,187,353,NULL,0.002,'kg',0),(1419,187,343,NULL,0.002,'kg',0),(1420,187,150,NULL,0.07,'szt',0),(1421,187,253,NULL,0.05,'kg',0),(1422,187,173,NULL,0.1,'kg',0),(1423,187,274,NULL,0.1,'litr',0),(1424,188,316,NULL,0.128,'kg',0),(1425,188,457,NULL,0.001,'kg',0),(1426,188,348,NULL,0.0005,'kg',0),(1427,188,274,NULL,0.000066,'litr',0),(1428,188,470,NULL,0.00083,'kg',0),(1429,188,269,NULL,0.05,'kg',0),(1430,188,271,NULL,0.04,'kg',0),(1431,188,501,NULL,0.03,'litr',0),(1432,188,78,NULL,0.02,'kg',0),(1433,188,185,NULL,0.02,'kg',0),(1434,188,53,NULL,0.02,'kg',0),(1435,189,269,NULL,0.05,'kg',0),(1436,189,271,NULL,0.04,'kg',0),(1437,189,501,NULL,0.03,'litr',0),(1438,189,78,NULL,0.02,'kg',0),(1439,189,185,NULL,0.02,'kg',0),(1440,190,23,NULL,0.5,'l',0),(1441,190,179,NULL,0.2,'kg',0),(1442,190,501,NULL,0.12,'litr',0),(1443,190,94,NULL,0.01,'kg',0),(1444,190,18,NULL,2,'kg',0),(1445,191,158,NULL,0.15,'kg',0),(1446,191,173,NULL,0.002,'kg',0),(1447,191,486,NULL,0.15,'kg',0),(1448,191,351,NULL,0.03,'kg',0),(1449,191,372,NULL,0.015,'kg',0),(1450,191,185,NULL,0.01,'kg',0),(1451,192,506,NULL,20,'kg',0),(1452,192,457,NULL,0.003,'kg',0),(1453,192,348,NULL,0.003,'kg',0),(1454,192,489,NULL,16.65,'kg',0),(1455,192,336,NULL,0.001,'kg',0),(1456,192,350,NULL,0.0006,'kg',0),(1457,192,173,NULL,0.25,'kg',0),(1458,192,353,NULL,0.002,'kg',0),(1459,192,106,NULL,0.09,'kg',0),(1460,192,201,NULL,0.5,'kg',0),(1461,192,440,NULL,0.001,'litr',0),(1462,192,444,NULL,0.001,'kg',0),(1463,192,350,NULL,0.003,'kg',0),(1464,192,127,NULL,0.03,'litr',0),(1465,193,486,NULL,0.033,'kg',0),(1466,193,156,NULL,0.033,'kg',0),(1467,193,67,NULL,0.033,'kg',0),(1468,193,150,NULL,0.46,'szt',0),(1469,193,77,NULL,0.0166,'kg',0),(1470,193,457,NULL,0.00133,'kg',0),(1471,193,348,NULL,0.00033,'kg',0),(1472,193,150,NULL,0.5,'szt',0),(1473,193,127,NULL,0.015,'litr',0),(1474,193,351,NULL,0.0013,'kg',0),(1475,194,77,NULL,2,'kg',0),(1476,194,231,NULL,0.2,'kg',0),(1477,194,74,NULL,5,'kg',0),(1478,195,120,NULL,0.02,'kg',0),(1479,195,61,NULL,0.01,'kg',0),(1480,195,126,NULL,0.075,'kg',0),(1481,196,474,NULL,0.6,'kg',0),(1482,196,484,NULL,0.2,'kg',0),(1483,196,241,NULL,0.5,'kg',0),(1484,196,304,NULL,0.001,'kg',0),(1485,196,150,NULL,0.5,'szt',0),(1486,196,77,NULL,0.005,'kg',0),(1487,196,120,NULL,0.1,'kg',0),(1488,196,285,NULL,0.01,'kg',0),(1489,196,274,NULL,0.005,'litr',0),(1490,196,106,NULL,0.01,'kg',0),(1491,196,163,NULL,0.7,'kg',0),(1492,196,457,NULL,0.002,'kg',0),(1493,196,349,NULL,0.002,'kg',0),(1494,197,387,NULL,0.02,'kg',0),(1495,197,271,NULL,0.018,'kg',0),(1496,197,455,NULL,0.0075,'kg',0),(1497,197,304,NULL,0.0008,'kg',0),(1498,197,348,NULL,0.000027,'kg',0),(1499,197,457,NULL,0.000054,'kg',0),(1500,197,238,NULL,0.0019,'kg',0),(1501,197,106,NULL,0.000084,'kg',0),(1502,197,457,NULL,0.000025,'kg',0),(1503,197,348,NULL,0.0000084,'kg',0),(1504,197,267,NULL,0.0000084,'litr',0),(1505,197,251,NULL,0.0016,'kg',0),(1506,197,274,NULL,0.0061,'litr',0),(1507,197,329,NULL,0.000067,'kg',0),(1508,198,185,NULL,0.1,'kg',0),(1509,198,106,NULL,0.04,'kg',0),(1510,198,428,NULL,3.75,'kg',0),(1511,198,279,NULL,0.4,'kg',0),(1512,198,304,NULL,0.2,'kg',0),(1513,198,91,NULL,100,'szt',0),(1514,198,457,NULL,0.002,'kg',0),(1515,199,380,NULL,3.24,'kg',0),(1516,199,285,NULL,1.6,'kg',0),(1517,199,319,NULL,1.5,'kg',0),(1518,199,68,NULL,0.28,'kg',0),(1519,199,271,NULL,0.9,'kg',0),(1520,199,43,NULL,3,'kg',0),(1521,200,464,NULL,0.16,'szt',0),(1522,200,367,NULL,0.008,'kg',0),(1523,200,428,NULL,0.015,'kg',0),(1524,200,456,NULL,0.013,'kg',0),(1525,200,271,NULL,0.0066,'kg',0),(1526,200,286,NULL,0.004,'kg',0),(1527,201,161,NULL,0.03,'kg',0),(1528,201,285,NULL,0.0105,'kg',0),(1529,201,289,NULL,0.0105,'kg',0),(1530,201,195,NULL,0.015,'kg',0),(1531,201,185,NULL,0.00063,'kg',0),(1532,201,210,NULL,0.00123,'litr',0),(1533,201,457,NULL,0.000285,'kg',0),(1534,201,348,NULL,0.001275,'kg',0),(1535,202,158,NULL,0.057,'kg',0),(1536,202,224,NULL,0.01065,'kg',0),(1537,202,322,NULL,0.0057,'kg',0),(1538,202,113,NULL,0.0171,'kg',0),(1539,202,185,NULL,0.001065,'kg',0),(1540,202,101,NULL,0.0189,'kg',0),(1541,202,457,NULL,0.001065,'kg',0),(1542,202,348,NULL,0.000705,'kg',0),(1543,202,94,NULL,0.0045,'kg',0),(1544,203,218,NULL,0.015,'kg',0),(1545,203,321,NULL,0.016,'kg',0),(1546,203,120,NULL,0.011,'kg',0),(1547,203,304,NULL,0.00018,'kg',0),(1548,203,457,NULL,0.0024,'kg',0),(1549,203,348,NULL,0.00012,'kg',0),(1550,203,333,NULL,0.00018,'kg',0),(1551,203,274,NULL,0.0003,'litr',0),(1552,204,119,NULL,0.08,'kg',0),(1553,204,235,NULL,0.1,'kg',0),(1554,204,231,NULL,0.1,'kg',0),(1555,204,457,NULL,0.01,'kg',0),(1556,204,348,NULL,0.01,'kg',0),(1557,205,495,NULL,1.5,'kg',0),(1558,205,53,NULL,2,'kg',0),(1559,205,287,NULL,0.3,'kg',0),(1560,205,318,NULL,0.15,'kg',0),(1561,205,195,NULL,0.2,'kg',0),(1562,205,150,NULL,30,'szt',0),(1563,205,210,NULL,1,'litr',0),(1564,205,447,NULL,0.15,'kg',0),(1565,205,455,NULL,2,'kg',0),(1566,205,272,NULL,1,'kg',0),(1567,205,427,NULL,2,'kg',0),(1568,205,457,NULL,0.002,'kg',0),(1569,205,348,NULL,0.002,'kg',0),(1570,206,496,NULL,0.9,'kg',0),(1571,206,78,NULL,0.4,'kg',0),(1572,206,274,NULL,0.5,'litr',0),(1573,206,94,NULL,0.015,'kg',0),(1574,206,457,NULL,0.002,'kg',0),(1575,206,348,NULL,0.01,'kg',0),(1576,207,158,NULL,0.15,'kg',0),(1577,207,241,NULL,0.12,'kg',0),(1578,207,371,NULL,0.015,'kg',0),(1579,207,342,NULL,0.003,'kg',0),(1580,207,181,NULL,0.03,'kg',0),(1581,207,457,NULL,0.001,'kg',0),(1582,207,348,NULL,0.001,'kg',0),(1583,207,78,NULL,0.003,'kg',0),(1584,207,231,NULL,0.003,'kg',0),(1585,207,502,NULL,0.003,'litr',0),(1586,207,486,NULL,0.002,'kg',0),(1587,207,488,NULL,0.001,'kg',0),(1588,207,489,NULL,0.25,'kg',0),(1589,208,233,NULL,0.5,'kg',0),(1590,208,150,NULL,1,'szt',0),(1591,208,78,NULL,0.08,'kg',0),(1592,208,224,NULL,0.1,'kg',0),(1593,208,388,NULL,0.1,'kg',0),(1594,208,302,NULL,0.1,'kg',0),(1595,208,501,NULL,0.3,'litr',0),(1596,208,78,NULL,0.08,'kg',0),(1597,208,342,NULL,0.03,'kg',0),(1598,208,257,NULL,0.1,'kg',0),(1599,208,185,NULL,0.05,'kg',0),(1600,208,265,NULL,0.02,'litr',0),(1601,209,263,NULL,0.48,'kg',0),(1602,209,159,NULL,0.17,'kg',0),(1603,209,186,NULL,0.15,'kg',0),(1604,209,231,NULL,0.02,'kg',0),(1605,209,106,NULL,0.03,'kg',0),(1606,210,492,NULL,1.05,'kg',0),(1607,210,110,NULL,0.05,'kg',0),(1608,210,228,NULL,0.175,'kg',0),(1609,210,253,NULL,2.5,'kg',0),(1610,210,150,NULL,25,'szt',0),(1611,210,247,NULL,2.5,'litr',0),(1612,210,457,NULL,0.025,'kg',0),(1613,210,94,NULL,0.025,'kg',0),(1614,210,224,NULL,0.15,'kg',0),(1615,210,388,NULL,0.1125,'kg',0),(1616,210,302,NULL,0.075,'kg',0),(1617,210,457,NULL,0.0037,'kg',0),(1618,210,348,NULL,0.0015,'kg',0),(1619,210,351,NULL,0.001125,'kg',0),(1620,211,120,NULL,0.08,'kg',0),(1621,211,63,NULL,0.05,'kg',0),(1622,211,333,NULL,0.0001,'kg',0),(1623,212,371,NULL,0.05,'kg',0),(1624,212,486,NULL,0.025,'kg',0),(1625,212,457,NULL,0.00001,'kg',0),(1626,212,348,NULL,0.000001,'kg',0),(1627,213,501,NULL,0.1,'litr',0),(1628,213,94,NULL,0.03,'kg',0),(1629,213,508,NULL,0.05,'kg',0),(1630,213,98,NULL,0.02,'kg',0),(1631,213,222,NULL,0.03,'kg',0),(1632,214,257,NULL,1,'kg',0),(1633,214,231,NULL,0.8,'kg',0),(1634,214,95,NULL,0.4,'kg',0),(1635,214,150,NULL,8,'szt',0),(1636,215,42,NULL,1,'kg',0),(1637,215,176,NULL,0.3,'kg',0),(1638,215,33,NULL,1,'kg',0),(1639,215,39,NULL,1,'kg',0),(1640,215,40,NULL,1,'kg',0),(1641,215,271,NULL,0.2,'kg',0),(1642,215,296,NULL,0.2,'kg',0),(1643,215,288,NULL,0.2,'kg',0),(1644,215,490,NULL,1,'kg',0),(1645,216,253,NULL,1,'kg',0),(1646,216,238,NULL,0.4,'kg',0),(1647,216,95,NULL,0.4,'kg',0),(1648,216,150,NULL,2,'szt',0),(1649,216,434,NULL,0.02,'kg',0),(1650,216,231,NULL,0.25,'kg',0),(1651,216,334,NULL,0.02,'kg',0),(1652,217,84,NULL,0.04,'kg',0),(1653,217,150,NULL,2,'szt',0),(1654,217,318,NULL,0.08,'kg',0),(1655,218,150,NULL,3,'szt',0),(1656,218,450,NULL,0.1,'kg',0),(1657,218,501,NULL,0.05,'litr',0),(1658,218,231,NULL,0.03,'kg',0),(1659,218,106,NULL,0.01,'kg',0),(1660,218,318,NULL,0.1,'kg',0),(1661,218,395,NULL,0.05,'kg',0),(1662,218,369,NULL,0.02,'kg',0),(1663,219,150,NULL,1,'szt',0),(1664,219,247,NULL,0.02,'litr',0),(1665,219,253,NULL,0.02,'kg',0),(1666,219,418,NULL,0.1,'kg',0),(1667,219,453,NULL,0.02,'kg',0),(1668,219,35,NULL,0.02,'kg',0),(1669,219,274,NULL,0.01,'litr',0),(1670,219,285,NULL,0.03,'kg',0),(1671,220,150,NULL,2,'szt',0),(1672,220,54,NULL,0.1,'kg',0),(1673,220,468,NULL,0.1,'kg',0),(1674,220,502,NULL,0.06,'litr',0),(1675,220,317,NULL,0.15,'kg',0),(1676,221,476,NULL,0.15,'litr',0),(1677,222,139,NULL,0.15,'litr',0),(1678,223,408,NULL,0.125,'kg',0),(1679,223,318,NULL,0.15,'kg',0),(1680,223,274,NULL,0.02,'litr',0),(1681,223,369,NULL,0.002,'kg',0),(1682,223,106,NULL,0.002,'kg',0),(1683,224,489,NULL,0.15,'kg',0),(1684,224,274,NULL,0.03,'litr',0),(1685,224,336,NULL,0.001,'kg',0),(1686,225,20,NULL,0.75,'porcja',0),(1687,225,494,NULL,0.025,'kg',0),(1688,226,143,NULL,1,'szt',0),(1689,227,375,NULL,0.25,'kg',0),(1690,227,167,NULL,0.12,'kg',0),(1691,227,78,NULL,0.005,'kg',0),(1692,227,75,NULL,0.01,'kg',0),(1693,227,457,NULL,0.001,'kg',0),(1694,227,348,NULL,0.001,'kg',0),(1695,227,231,NULL,0.01,'kg',0),(1696,228,27,NULL,1,'kg',0),(1697,228,269,NULL,0.1,'kg',0),(1698,229,140,NULL,1,'szt',0),(1699,229,317,NULL,0.05,'kg',0),(1700,229,239,NULL,0.02,'kg',0),(1701,229,101,NULL,0.03,'kg',0),(1702,229,340,NULL,0.001,'kg',0),(1703,229,147,NULL,0.002,'kg',0),(1704,230,81,NULL,0.1,'kg',0),(1705,231,78,NULL,0.2,'kg',0),(1706,231,285,NULL,0.4,'kg',0),(1707,231,106,NULL,0.06,'kg',0),(1708,231,276,NULL,0.1,'kg',0),(1709,231,157,NULL,0.05,'kg',0),(1710,231,113,NULL,0.4,'kg',0),(1711,231,320,NULL,0.4,'kg',0),(1712,231,371,NULL,0.07,'kg',0),(1713,232,489,NULL,0.7,'kg',0),(1714,232,431,NULL,0.1,'kg',0),(1715,232,254,NULL,0.08,'kg',0),(1716,232,150,NULL,1,'szt',0),(1717,232,449,NULL,0.1,'kg',0),(1718,233,459,NULL,0.2,'kg',0),(1719,233,94,NULL,0.02,'kg',0),(1720,233,502,NULL,0.01,'litr',0),(1721,234,120,NULL,0.7,'kg',0),(1722,234,285,NULL,0.3,'kg',0),(1723,234,77,NULL,0.1,'kg',0),(1724,234,150,NULL,1,'szt',0),(1725,234,274,NULL,0.1,'litr',0),(1726,234,457,NULL,0.001,'kg',0),(1727,234,348,NULL,0.001,'kg',0),(1728,234,349,NULL,0.001,'kg',0),(1729,234,339,NULL,0.001,'kg',0),(1730,234,404,NULL,0.05,'kg',0),(1731,235,120,NULL,0.7,'kg',0),(1732,235,450,NULL,0.3,'kg',0),(1733,235,150,NULL,1,'szt',0),(1734,235,77,NULL,0.15,'kg',0),(1735,235,404,NULL,0.05,'kg',0),(1736,235,457,NULL,0.001,'kg',0),(1737,235,348,NULL,0.001,'kg',0),(1738,235,349,NULL,0.001,'kg',0),(1739,235,339,NULL,0.001,'kg',0),(1740,235,274,NULL,0.2,'litr',0),(1741,236,195,NULL,0.4,'kg',0),(1742,236,489,NULL,0.3,'kg',0),(1743,236,78,NULL,0.15,'kg',0),(1744,236,318,NULL,0.2,'kg',0),(1745,236,347,NULL,0.01,'kg',0),(1746,236,345,NULL,0.01,'kg',0),(1747,236,274,NULL,0.02,'litr',0),(1748,236,342,NULL,0.01,'kg',0),(1749,237,114,NULL,0.25,'kg',0),(1750,237,506,NULL,0.5,'kg',0),(1751,237,63,NULL,0.25,'kg',0),(1752,237,224,NULL,0.15,'kg',0),(1753,237,388,NULL,0.15,'kg',0),(1754,237,302,NULL,0.15,'kg',0),(1755,237,106,NULL,0.01,'kg',0),(1756,237,489,NULL,0.7,'kg',0),(1757,237,344,NULL,0.001,'kg',0),(1758,238,148,NULL,0.15,'kg',0),(1759,238,281,NULL,0.01,'kg',0),(1760,238,239,NULL,0.05,'kg',0),(1761,238,364,NULL,0.01,'kg',0),(1762,239,238,NULL,0.18,'kg',0),(1763,239,106,NULL,0.008,'kg',0),(1764,239,457,NULL,0.0024,'kg',0),(1765,239,348,NULL,0.0008,'kg',0),(1766,239,267,NULL,0.08,'litr',0),(1767,239,251,NULL,0.152,'kg',0),(1768,239,274,NULL,0.58,'litr',0),(1769,239,57,NULL,0.0064,'kg',0),(1770,240,160,NULL,0.1,'kg',0),(1771,240,63,NULL,0.03,'kg',0),(1772,240,78,NULL,0.01,'kg',0),(1773,240,343,NULL,0.0001,'kg',0),(1774,240,353,NULL,0.0003,'kg',0),(1775,240,94,NULL,0.001,'kg',0),(1776,240,351,NULL,0.001,'kg',0),(1777,240,274,NULL,0.001,'litr',0),(1778,240,344,NULL,0.0002,'kg',0),(1779,241,291,NULL,0.0437,'kg',0),(1780,241,242,NULL,0.0187,'kg',0),(1781,241,285,NULL,0.00625,'kg',0),(1782,241,304,NULL,0.00025,'kg',0),(1783,241,77,NULL,0.0005,'kg',0),(1784,241,351,NULL,0.00025,'kg',0),(1785,241,457,NULL,0.00025,'kg',0),(1786,241,348,NULL,0.000125,'kg',0),(1787,241,349,NULL,0.000125,'kg',0),(1788,241,333,NULL,0.00075,'kg',0),(1789,242,301,NULL,2.8,'kg',0),(1790,242,299,NULL,2.8,'kg',0),(1791,242,300,NULL,2.8,'kg',0),(1792,243,471,NULL,0.15,'kg',0),(1793,243,457,NULL,0.00075,'kg',0),(1794,243,348,NULL,0.00025,'kg',0),(1795,243,351,NULL,0.00075,'kg',0),(1796,243,106,NULL,0.0005,'kg',0),(1797,243,150,NULL,0.75,'szt',0),(1798,243,431,NULL,0.025,'kg',0),(1799,243,101,NULL,0.25,'kg',0),(1800,243,173,NULL,0.0625,'kg',0),(1801,243,23,NULL,0.2,'l',0),(1802,244,372,NULL,0.4,'kg',0),(1803,244,195,NULL,1.1,'kg',0),(1804,244,456,NULL,0.5,'kg',0),(1805,244,48,NULL,0.6,'kg',0),(1806,244,210,NULL,0.5,'litr',0),(1807,244,457,NULL,0.002,'kg',0),(1808,244,348,NULL,0.002,'kg',0),(1809,245,385,NULL,0.97,'kg',0),(1810,245,150,NULL,3,'szt',0),(1811,245,257,NULL,0.014,'kg',0),(1812,245,77,NULL,0.25,'kg',0),(1813,245,274,NULL,1.5,'litr',0),(1814,245,457,NULL,0.002,'kg',0),(1815,245,348,NULL,0.002,'kg',0),(1816,246,502,NULL,1.5,'litr',0),(1817,246,239,NULL,0.06,'kg',0),(1818,246,80,NULL,0.4,'kg',0),(1819,246,103,NULL,0.1,'kg',0),(1820,246,95,NULL,0.02,'kg',0),(1821,246,102,NULL,0.05,'kg',0),(1822,246,94,NULL,0.4,'kg',0),(1823,247,150,NULL,6,'szt',0),(1824,247,257,NULL,0.5,'kg',0),(1825,247,97,NULL,0.04,'kg',0),(1826,247,95,NULL,0.067,'kg',0),(1827,247,327,NULL,0.01,'kg',0),(1828,247,281,NULL,0.3,'kg',0),(1829,247,231,NULL,0.375,'kg',0),(1830,247,247,NULL,1,'litr',0),(1831,248,150,NULL,10,'szt',0),(1832,248,257,NULL,0.16,'kg',0),(1833,248,94,NULL,0.2,'kg',0),(1834,248,324,NULL,0.01,'kg',0),(1835,248,155,NULL,0.05,'kg',0),(1836,248,327,NULL,0.008,'kg',0),(1837,248,502,NULL,1,'litr',0),(1838,248,124,NULL,0.26,'kg',0),(1839,248,104,NULL,0.1,'kg',0),(1840,248,403,NULL,0.5,'kg',0),(1841,248,95,NULL,0.06,'kg',0),(1842,248,274,NULL,0.2,'litr',0),(1843,249,150,NULL,6,'szt',0),(1844,249,97,NULL,0.02,'kg',0),(1845,249,155,NULL,0.03,'kg',0),(1846,249,257,NULL,0.345,'kg',0),(1847,249,469,NULL,1,'kg',0),(1848,249,327,NULL,0.01,'kg',0),(1849,249,95,NULL,0.18,'kg',0),(1850,249,247,NULL,0.3,'litr',0),(1851,249,73,NULL,1,'kg',0),(1852,249,101,NULL,0.08,'kg',0),(1853,249,231,NULL,0.25,'kg',0),(1854,249,274,NULL,0.1,'litr',0),(1855,250,150,NULL,3,'szt',0),(1856,250,257,NULL,0.5,'kg',0),(1857,250,94,NULL,0.25,'kg',0),(1858,250,95,NULL,0.06,'kg',0),(1859,250,239,NULL,0.1,'kg',0),(1860,250,228,NULL,0.15,'kg',0),(1861,250,98,NULL,0.01,'kg',0),(1862,250,502,NULL,0.75,'litr',0),(1863,250,122,NULL,0.04,'kg',0),(1864,250,245,NULL,0.6,'kg',0),(1865,250,235,NULL,0.1,'kg',0),(1866,251,150,NULL,10,'szt',0),(1867,251,94,NULL,0.46,'kg',0),(1868,251,257,NULL,0.14,'kg',0),(1869,251,327,NULL,0.002,'kg',0),(1870,251,98,NULL,0.016,'kg',0),(1871,251,479,NULL,0.2,'kg',0),(1872,251,73,NULL,0.018,'kg',0),(1873,251,48,NULL,0.564,'kg',0),(1874,251,231,NULL,0.35,'kg',0),(1875,252,145,NULL,0.4,'kg',0),(1876,252,103,NULL,0.8,'kg',0),(1877,252,150,NULL,10,'szt',0),(1878,252,469,NULL,1.5,'kg',0),(1879,252,502,NULL,0.15,'litr',0),(1880,252,247,NULL,0.5,'litr',0),(1881,252,94,NULL,0.375,'kg',0),(1882,252,73,NULL,0.06,'kg',0),(1883,252,274,NULL,0.125,'litr',0),(1884,252,97,NULL,0.03,'kg',0),(1885,253,257,NULL,0.75,'kg',0),(1886,253,229,NULL,0.125,'kg',0),(1887,253,150,NULL,4,'szt',0),(1888,253,97,NULL,0.01,'kg',0),(1889,253,95,NULL,0.2,'kg',0),(1890,253,94,NULL,0.2,'kg',0),(1891,253,230,NULL,2,'kg',0),(1892,253,327,NULL,0.002,'kg',0),(1893,253,431,NULL,0.012,'kg',0),(1894,253,231,NULL,0.2,'kg',0),(1895,253,331,NULL,0.01,'kg',0),(1896,253,77,NULL,0.005,'kg',0),(1897,254,257,NULL,0.25,'kg',0),(1898,254,229,NULL,0.125,'kg',0),(1899,254,150,NULL,10,'szt',0),(1900,254,97,NULL,0.02,'kg',0),(1901,254,95,NULL,0.04,'kg',0),(1902,254,94,NULL,0.21,'kg',0),(1903,254,230,NULL,1.5,'kg',0),(1904,254,327,NULL,0.005,'kg',0),(1905,254,69,NULL,0.85,'kg',0),(1906,255,73,NULL,0.18,'kg',0),(1907,255,479,NULL,0.2,'kg',0),(1908,255,231,NULL,0.4,'kg',0),(1909,255,150,NULL,14,'szt',0),(1910,255,94,NULL,0.2,'kg',0),(1911,255,327,NULL,0.008,'kg',0),(1912,255,257,NULL,0.15,'kg',0),(1913,255,431,NULL,0.15,'kg',0),(1914,255,97,NULL,0.01,'kg',0),(1915,256,252,NULL,0.25,'kg',0),(1916,256,324,NULL,0.015,'kg',0),(1917,256,94,NULL,0.19,'kg',0),(1918,256,247,NULL,0.5,'litr',0),(1919,256,146,NULL,0,'kg',0),(1920,256,231,NULL,0.03,'kg',0),(1921,256,97,NULL,0.016,'kg',0),(1922,256,502,NULL,0.75,'litr',0),(1923,256,245,NULL,0.5,'kg',0),(1924,256,191,NULL,0.36,'kg',0),(1925,257,94,NULL,0.2,'kg',0),(1926,257,257,NULL,0.16,'kg',0),(1927,257,150,NULL,10,'szt',0),(1928,257,155,NULL,0.08,'kg',0),(1929,257,327,NULL,0.008,'kg',0),(1930,257,502,NULL,0.28,'litr',0),(1931,257,103,NULL,0.04,'kg',0),(1932,257,502,NULL,0.7,'litr',0),(1933,257,169,NULL,0.125,'kg',0),(1934,257,95,NULL,0.03,'kg',0),(1935,258,150,NULL,6,'szt',0),(1936,258,94,NULL,0.36,'kg',0),(1937,258,479,NULL,0.1,'kg',0),(1938,258,212,NULL,0.1,'kg',0),(1939,258,257,NULL,0.12,'kg',0),(1940,258,327,NULL,0.004,'kg',0),(1941,258,192,NULL,0.2,'kg',0),(1942,258,231,NULL,0.4,'kg',0),(1943,258,170,NULL,0.002,'kg',0),(1944,258,364,NULL,0.06,'kg',0),(1945,258,247,NULL,0.5,'litr',0),(1946,258,502,NULL,0.82,'litr',0),(1947,258,122,NULL,0.16,'kg',0),(1948,258,95,NULL,0.06,'kg',0),(1949,258,155,NULL,0.08,'kg',0),(1950,258,508,NULL,0.03,'kg',0),(1951,259,150,NULL,5,'szt',0),(1952,259,94,NULL,0.315,'kg',0),(1953,259,327,NULL,0.008,'kg',0),(1954,259,257,NULL,0.115,'kg',0),(1955,259,155,NULL,0.05,'kg',0),(1956,259,245,NULL,0.7,'kg',0),(1957,259,459,NULL,0.2,'kg',0),(1958,259,231,NULL,0.375,'kg',0),(1959,260,150,NULL,8,'szt',0),(1960,260,94,NULL,0.2,'kg',0),(1961,260,257,NULL,0.16,'kg',0),(1962,260,155,NULL,0.08,'kg',0),(1963,260,327,NULL,0.008,'kg',0),(1964,260,504,NULL,1,'kg',0),(1965,260,95,NULL,0.05,'kg',0),(1966,260,122,NULL,0.016,'kg',0),(1967,260,183,NULL,0.075,'kg',0),(1968,260,274,NULL,0.2,'litr',0),(1969,261,450,NULL,0.9,'kg',0),(1970,261,257,NULL,0.62,'kg',0),(1971,261,150,NULL,2,'szt',0),(1972,261,97,NULL,0.06,'kg',0),(1973,261,274,NULL,0.4,'litr',0),(1974,261,94,NULL,0.4,'kg',0),(1975,261,327,NULL,0.02,'kg',0),(1976,261,323,NULL,0.2,'kg',0),(1977,261,95,NULL,0.07,'kg',0),(1978,261,403,NULL,1,'kg',0),(1979,261,502,NULL,0.5,'kg',0),(1980,262,58,NULL,0.4,'kg',0),(1981,262,229,NULL,0.6,'kg',0),(1982,262,193,NULL,0.2,'kg',0),(1983,262,245,NULL,0.255,'kg',0),(1984,262,247,NULL,0.4,'litr',0),(1985,262,248,NULL,0.08,'kg',0),(1986,262,94,NULL,0.3,'kg',0),(1987,262,97,NULL,0.06,'kg',0),(1988,262,102,NULL,0.1,'kg',0),(1989,262,103,NULL,0.1,'kg',0),(1990,262,504,NULL,0.05,'kg',0),(1991,262,281,NULL,0.12,'kg',0),(1992,262,231,NULL,0.05,'kg',0),(1993,263,58,NULL,0.6,'kg',0),(1994,263,170,NULL,0.006,'kg',0),(1995,263,200,NULL,0.1,'litr',0),(1996,263,403,NULL,1,'kg',0),(1997,263,502,NULL,1,'kg',0),(1998,263,150,NULL,0,'szt',0),(1999,263,95,NULL,0.06,'kg',0),(2000,263,155,NULL,0.012,'kg',0),(2001,264,150,NULL,3,'szt',0),(2002,264,257,NULL,0.06,'kg',0),(2003,264,431,NULL,0.06,'kg',0),(2004,264,94,NULL,0.31,'kg',0),(2005,264,327,NULL,0.008,'kg',0),(2006,264,73,NULL,0,'kg',0),(2007,265,150,NULL,4,'szt',0),(2008,265,257,NULL,0.14,'kg',0),(2009,265,97,NULL,0.016,'kg',0),(2010,265,94,NULL,0.36,'kg',0),(2011,265,327,NULL,0.002,'kg',0),(2012,265,73,NULL,0.128,'kg',0),(2013,265,101,NULL,0.5,'kg',0),(2014,265,229,NULL,0.2,'kg',0),(2015,265,129,NULL,0.2,'kg',0),(2016,265,502,NULL,0.5,'kg',0),(2017,265,146,NULL,0.08,'kg',0),(2018,266,150,NULL,6,'szt',0),(2019,266,94,NULL,0.42,'kg',0),(2020,266,257,NULL,0.115,'kg',0),(2021,266,327,NULL,0.005,'kg',0),(2022,266,155,NULL,0.024,'kg',0),(2023,266,403,NULL,0.5,'kg',0),(2024,266,229,NULL,0.25,'kg',0),(2025,266,248,NULL,0.35,'kg',0),(2026,266,58,NULL,0.15,'kg',0),(2027,266,502,NULL,1,'kg',0),(2028,267,150,NULL,12,'szt',0),(2029,267,95,NULL,0.42,'kg',0),(2030,267,235,NULL,0.36,'kg',0),(2031,267,155,NULL,0.08,'kg',0),(2032,267,103,NULL,0.2,'kg',0),(2033,267,504,NULL,1.5,'kg',0),(2034,267,231,NULL,0.2,'kg',0),(2035,267,102,NULL,0.6,'kg',0),(2036,267,508,NULL,0.015,'kg',0),(2037,268,150,NULL,8,'szt',0),(2038,268,94,NULL,0.41,'kg',0),(2039,268,431,NULL,0.15,'kg',0),(2040,268,257,NULL,0.06,'kg',0),(2041,268,155,NULL,0.048,'kg',0),(2042,268,274,NULL,0.15,'litr',0),(2043,268,403,NULL,0.075,'kg',0),(2044,268,133,NULL,0.071,'kg',0),(2045,268,281,NULL,0.12,'kg',0),(2046,268,231,NULL,0.125,'kg',0),(2047,268,504,NULL,0.06,'kg',0),(2048,268,508,NULL,0.004,'kg',0),(2049,269,150,NULL,4,'szt',0),(2050,269,94,NULL,0.1,'kg',0),(2051,269,257,NULL,0.08,'kg',0),(2052,269,434,NULL,0.004,'kg',0),(2053,269,155,NULL,0.1,'kg',0),(2054,269,183,NULL,0.25,'kg',0),(2055,269,419,NULL,1,'kg',0),(2056,269,502,NULL,0.5,'kg',0),(2057,269,129,NULL,0.25,'kg',0),(2058,269,327,NULL,0.004,'kg',0),(2059,269,274,NULL,0.15,'litr',0),(2060,269,93,NULL,0.4,'szt',0),(2061,269,314,NULL,0.1,'kg',0),(2062,270,150,NULL,10,'szt',0),(2063,270,155,NULL,0.078,'kg',0),(2064,270,257,NULL,0.09,'kg',0),(2065,270,327,NULL,0.02,'kg',0),(2066,270,274,NULL,0.18,'litr',0),(2067,270,95,NULL,0.33,'kg',0),(2068,270,248,NULL,0.5,'kg',0),(2069,270,247,NULL,0.5,'litr',0),(2070,270,229,NULL,0.725,'kg',0),(2071,270,198,NULL,0.2,'litr',0),(2072,270,479,NULL,0.2,'kg',0),(2073,270,502,NULL,0.76,'kg',0),(2074,270,133,NULL,0.16,'kg',0),(2075,270,184,NULL,0.25,'kg',0),(2076,270,109,NULL,0.075,'kg',0),(2077,270,508,NULL,0.004,'kg',0),(2078,270,94,NULL,0.06,'kg',0),(2079,271,257,NULL,0.115,'kg',0),(2080,271,94,NULL,0.21,'kg',0),(2081,271,150,NULL,3,'szt',0),(2082,271,97,NULL,0.015,'kg',0),(2083,271,327,NULL,0.005,'kg',0),(2084,271,132,NULL,0.32,'kg',0),(2085,271,502,NULL,0.5,'kg',0),(2086,271,465,NULL,1,'kg',0),(2087,272,257,NULL,0.115,'kg',0),(2088,272,94,NULL,0.21,'kg',0),(2089,272,150,NULL,3,'szt',0),(2090,272,97,NULL,0.01,'kg',0),(2091,272,327,NULL,0.005,'kg',0),(2092,272,130,NULL,0.32,'kg',0),(2093,272,502,NULL,0.5,'kg',0),(2094,272,222,NULL,0.083,'kg',0),(2095,273,257,NULL,0.16,'kg',0),(2096,273,431,NULL,0.08,'kg',0),(2097,273,150,NULL,6,'szt',0),(2098,273,327,NULL,0.008,'kg',0),(2099,273,98,NULL,0.01,'kg',0),(2100,273,94,NULL,0.2,'kg',0),(2101,273,122,NULL,0.008,'kg',0),(2102,273,192,NULL,0.2,'kg',0),(2103,273,228,NULL,0.2,'kg',0),(2104,273,198,NULL,0.3,'litr',0),(2105,273,247,NULL,0.5,'litr',0),(2106,273,502,NULL,0.7,'kg',0),(2107,274,88,NULL,0.704,'kg',0),(2108,274,403,NULL,1,'kg',0),(2109,274,502,NULL,1,'kg',0),(2110,274,150,NULL,5,'szt',0),(2111,274,95,NULL,0.075,'kg',0),(2112,274,229,NULL,0.25,'kg',0),(2113,275,193,NULL,0.4,'kg',0),(2114,275,359,NULL,0.85,'kg',0),(2115,275,419,NULL,1,'kg',0),(2116,275,508,NULL,0.03,'kg',0),(2117,275,129,NULL,0.25,'kg',0),(2118,275,317,NULL,0.5,'kg',0),(2119,275,146,NULL,0.4,'kg',0),(2120,275,101,NULL,0.15,'kg',0),(2121,275,243,NULL,0.01,'kg',0),(2122,275,239,NULL,0.02,'kg',0),(2123,276,212,NULL,0.25,'kg',0),(2124,276,239,NULL,0.1,'kg',0),(2125,276,94,NULL,0.07,'kg',0),(2126,276,235,NULL,0.07,'kg',0),(2127,276,364,NULL,0.08,'kg',0),(2128,276,432,NULL,0.15,'kg',0),(2129,276,150,NULL,5,'szt',0),(2130,276,247,NULL,0.3,'litr',0),(2131,276,256,NULL,0.3,'kg',0),(2132,276,94,NULL,0.3,'kg',0),(2133,276,231,NULL,0.12,'kg',0),(2134,276,110,NULL,0.015,'kg',0),(2135,276,95,NULL,0.05,'kg',0),(2136,277,150,NULL,4,'szt',0),(2137,277,256,NULL,0.14,'kg',0),(2138,277,327,NULL,0.14,'kg',0),(2139,277,94,NULL,0.16,'kg',0),(2140,277,72,NULL,0.7,'kg',0),(2141,277,131,NULL,0.1,'kg',0),(2142,277,87,NULL,0.36,'kg',0),(2143,277,247,NULL,0.5,'litr',0),(2144,277,502,NULL,0.5,'kg',0),(2145,277,128,NULL,0.1,'kg',0),(2146,278,231,NULL,0.125,'kg',0),(2147,278,247,NULL,0.25,'litr',0),(2148,278,155,NULL,0.03,'kg',0),(2149,278,94,NULL,0.15,'kg',0),(2150,278,103,NULL,0.05,'kg',0),(2151,278,434,NULL,0.005,'kg',0),(2152,278,256,NULL,0.26,'kg',0),(2153,278,150,NULL,3,'szt',0),(2154,278,403,NULL,0.5,'kg',0),(2155,278,502,NULL,0.25,'kg',0),(2156,278,170,NULL,0.012,'kg',0),(2157,278,199,NULL,0.06,'litr',0),(2158,278,89,NULL,0.15,'kg',0),(2159,278,184,NULL,0.25,'kg',0),(2160,278,508,NULL,0.012,'kg',0),(2161,278,95,NULL,0.015,'kg',0),(2162,278,133,NULL,0.03,'kg',0),(2163,279,150,NULL,8,'szt',0),(2164,279,95,NULL,0.08,'kg',0),(2165,279,327,NULL,0.002,'kg',0),(2166,279,98,NULL,0.02,'kg',0),(2167,279,256,NULL,0.26,'kg',0),(2168,279,265,NULL,0.002,'litr',0),(2169,279,222,NULL,0.6,'kg',0),(2170,279,130,NULL,0.4,'kg',0),(2171,279,502,NULL,0.7,'kg',0),(2172,279,403,NULL,0.5,'kg',0),(2173,279,94,NULL,0.25,'kg',0),(2174,279,431,NULL,0.01,'kg',0),(2175,280,150,NULL,3,'szt',0),(2176,280,95,NULL,0.03,'kg',0),(2177,280,327,NULL,0.008,'kg',0),(2178,280,97,NULL,0.007,'kg',0),(2179,280,256,NULL,0.15,'kg',0),(2180,280,231,NULL,0.1,'kg',0),(2181,280,54,NULL,1.7,'kg',0),(2182,280,47,NULL,0.34,'kg',0),(2183,280,129,NULL,0.24,'kg',0),(2184,280,502,NULL,0.5,'kg',0),(2185,280,403,NULL,0.25,'kg',0),(2186,280,95,NULL,0.024,'kg',0),(2187,280,97,NULL,0.007,'kg',0),(2188,280,150,NULL,3,'szt',0),(2189,280,94,NULL,0.15,'kg',0),(2190,280,431,NULL,0.016,'kg',0),(2191,280,103,NULL,0.6,'kg',0),(2192,281,465,NULL,2.5,'kg',0),(2193,281,232,NULL,4,'litr',0),(2194,281,94,NULL,0.02,'kg',0),(2195,282,150,NULL,20,'szt',0),(2196,282,271,NULL,1,'kg',0),(2197,282,374,NULL,0.5,'kg',0),(2198,282,4,NULL,4,'kg',0),(2199,282,232,NULL,5,'litr',0),(2200,282,185,NULL,0.15,'kg',0),(2201,282,457,NULL,0.004,'kg',0),(2202,282,348,NULL,0.03,'kg',0),(2203,282,94,NULL,0.005,'kg',0),(2204,283,375,NULL,0.15,'kg',0),(2205,283,254,NULL,0.006,'kg',0),(2206,283,274,NULL,0.08,'litr',0),(2207,283,231,NULL,0.013,'kg',0),(2208,283,457,NULL,0.002,'kg',0),(2209,283,348,NULL,0.001,'kg',0),(2210,283,30,NULL,1,'porcji',0),(2211,284,502,NULL,0.4,'kg',0),(2212,284,185,NULL,0.015,'kg',0),(2213,284,488,NULL,0.005,'kg',0),(2214,285,488,NULL,0.001,'kg',0),(2215,285,501,NULL,0.066,'kg',0),(2216,285,457,NULL,0.002,'kg',0),(2217,285,351,NULL,0.002,'kg',0),(2218,285,348,NULL,0.003,'kg',0),(2219,285,274,NULL,0.012,'litr',0),(2220,285,254,NULL,0.01,'kg',0),(2221,285,231,NULL,0.002,'kg',0),(2222,285,150,NULL,0.4,'szt',0),(2223,285,236,NULL,0.11,'kg',0),(2224,285,30,NULL,1,'porcji',0),(2225,286,116,NULL,0.04,'kg',0),(2226,286,231,NULL,0.008,'kg',0),(2227,286,77,NULL,0.001,'kg',0),(2228,287,196,NULL,0.187,'kg',0),(2229,287,499,NULL,0.014,'kg',0),(2230,287,457,NULL,0.001,'kg',0),(2231,287,391,NULL,0.02,'kg',0),(2232,287,348,NULL,0.001,'kg',0),(2233,287,231,NULL,0.01,'kg',0),(2234,288,495,NULL,0.8,'kg',0),(2235,288,322,NULL,0.26,'kg',0),(2236,288,101,NULL,0.13,'kg',0),(2237,288,348,NULL,0.002,'kg',0),(2238,288,274,NULL,0.1,'litr',0),(2239,289,462,NULL,1,'kg',0),(2240,289,150,NULL,3,'szt',0),(2241,289,352,NULL,0.03,'litr',0),(2242,289,348,NULL,0.002,'kg',0),(2243,289,274,NULL,0.15,'litr',0),(2244,289,78,NULL,0.8,'kg',0),(2245,289,269,NULL,0.8,'kg',0),(2246,290,383,NULL,1,'kg',0),(2247,290,384,NULL,1,'kg',0),(2248,290,477,NULL,0.015,'kg',0),(2249,290,451,NULL,0.012,'kg',0),(2250,290,459,NULL,0.002,'kg',0),(2251,290,412,NULL,0.012,'kg',0),(2252,290,321,NULL,0.012,'kg',0),(2253,290,150,NULL,0.15,'szt',0),(2254,290,138,NULL,0.015,'kg',0),(2255,290,293,NULL,0.002,'kg',0),(2256,290,43,NULL,0.03,'kg',0),(2257,291,90,NULL,0.014,'kg',0),(2258,291,321,NULL,0.005,'kg',0),(2259,292,90,NULL,0.014,'kg',0),(2260,292,450,NULL,0.007,'kg',0),(2261,292,395,NULL,0.002,'kg',0),(2262,292,457,NULL,0.001,'kg',0),(2263,292,322,NULL,0.002,'kg',0),(2264,292,106,NULL,0.001,'kg',0),(2265,292,231,NULL,0.001,'kg',0),(2266,293,120,NULL,0.08,'kg',0),(2267,293,50,NULL,0.03,'kg',0),(2268,293,405,NULL,0.02,'kg',0),(2269,293,457,NULL,0.001,'kg',0),(2270,293,348,NULL,0.002,'kg',0),(2271,293,77,NULL,0.02,'kg',0),(2272,293,150,NULL,0.022,'szt',0),(2273,293,274,NULL,0.04,'litr',0),(2274,293,31,NULL,0.05,'kg',0),(2275,294,99,NULL,0.2,'kg',0),(2276,294,241,NULL,0.1,'kg',0),(2277,294,231,NULL,0.01,'kg',0),(2278,294,78,NULL,0.05,'kg',0),(2279,294,457,NULL,0.001,'kg',0),(2280,294,348,NULL,0.002,'kg',0),(2281,294,401,NULL,0.01,'kg',0),(2282,294,438,NULL,0,'kg',0),(2283,295,278,NULL,0.002,'kg',0),(2284,295,399,NULL,0.008,'kg',0),(2285,295,153,NULL,0.008,'kg',0),(2286,295,268,NULL,0.003,'kg',0),(2287,295,451,NULL,0.002,'kg',0),(2288,295,296,NULL,0.002,'kg',0),(2289,296,16,NULL,0.2,'kg',0),(2290,296,188,NULL,0.012,'kg',0),(2291,297,355,NULL,0.1,'kg',0),(2292,297,257,NULL,0.005,'kg',0),(2293,297,274,NULL,0.1,'litr',0),(2294,297,21,NULL,0.33,'porcja',0),(2295,298,302,NULL,0.5,'kg',0),(2296,298,388,NULL,0.3,'kg',0),(2297,298,489,NULL,0.15,'kg',0),(2298,298,86,NULL,0.03,'kg',0),(2299,298,231,NULL,0.1,'kg',0),(2300,298,502,NULL,0.15,'kg',0),(2301,298,457,NULL,0.003,'kg',0),(2302,298,348,NULL,0.002,'kg',0),(2303,299,495,NULL,0.01,'kg',0),(2304,299,90,NULL,0.025,'kg',0),(2305,299,457,NULL,0.002,'kg',0),(2306,299,348,NULL,0.002,'kg',0),(2307,299,231,NULL,0.03,'kg',0),(2308,300,378,NULL,0.25,'kg',0),(2309,300,120,NULL,0.1,'kg',0),(2310,300,53,NULL,0.1,'kg',0),(2311,300,500,NULL,0.1,'kg',0),(2312,300,106,NULL,0.001,'kg',0),(2313,300,401,NULL,0.05,'kg',0),(2314,300,251,NULL,0.003,'kg',0),(2315,300,271,NULL,0.03,'kg',0),(2316,300,319,NULL,0.08,'kg',0),(2317,300,363,NULL,0.02,'kg',0),(2318,300,382,NULL,0.005,'kg',0),(2319,301,414,NULL,0.003,'kg',0),(2320,301,387,NULL,0.02,'kg',0),(2321,301,210,NULL,0.01,'litr',0),(2322,301,150,NULL,0.4,'szt',0),(2323,301,121,NULL,0.03,'kg',0),(2324,301,48,NULL,0.03,'kg',0),(2325,302,119,NULL,0.1,'kg',0),(2326,302,350,NULL,0.001,'kg',0),(2327,302,457,NULL,0.002,'kg',0),(2328,302,348,NULL,0.001,'kg',0),(2329,302,106,NULL,0.002,'kg',0),(2330,302,274,NULL,0.003,'litr',0),(2331,303,348,NULL,0.0006,'kg',0),(2332,303,329,NULL,0.0004,'kg',0),(2333,303,181,NULL,0.0125,'kg',0),(2334,303,106,NULL,0.0075,'kg',0),(2335,303,233,NULL,0.1563,'kg',0),(2336,303,215,NULL,0.1,'kg',0),(2337,303,457,NULL,0.0013,'kg',0),(2338,304,76,NULL,1,'szt',0),(2339,304,318,NULL,0.025,'kg',0),(2340,304,379,NULL,0.025,'kg',0),(2341,304,210,NULL,0.15,'litr',0),(2342,304,462,NULL,0.033,'kg',0),(2343,304,233,NULL,0.033,'kg',0),(2344,304,78,NULL,0.0208,'kg',0),(2345,304,231,NULL,0.0108,'kg',0),(2346,304,150,NULL,0.25,'szt',0),(2347,304,457,NULL,0.001,'kg',0),(2348,304,348,NULL,0.001,'kg',0),(2349,304,79,NULL,0.031,'kg',0),(2350,304,274,NULL,0.003,'litr',0),(2351,304,239,NULL,0.0006,'kg',0),(2352,304,139,NULL,0.003,'litr',0),(2353,304,457,NULL,0.001,'kg',0),(2354,304,348,NULL,0.001,'kg',0),(2355,305,322,NULL,0.117,'kg',0),(2356,305,231,NULL,0.011,'kg',0),(2357,305,489,NULL,0.058,'kg',0),(2358,305,457,NULL,0.001,'kg',0),(2359,305,335,NULL,0.001,'kg',0),(2360,305,350,NULL,0.001,'kg',0),(2361,305,106,NULL,0.001,'kg',0),(2362,305,502,NULL,0.014,'kg',0),(2363,305,423,NULL,0.011,'kg',0),(2364,305,53,NULL,0.08,'kg',0),(2365,306,120,NULL,0.2,'kg',0),(2366,306,450,NULL,0.043,'kg',0),(2367,306,457,NULL,0.002,'kg',0),(2368,306,395,NULL,0.017,'kg',0),(2369,306,77,NULL,0.004,'kg',0),(2370,306,150,NULL,1,'szt',0),(2371,306,257,NULL,0.02,'kg',0),(2372,306,37,NULL,0.06,'kg',0),(2373,307,120,NULL,0.1,'kg',0),(2374,307,457,NULL,0.002,'kg',0),(2375,307,348,NULL,0.001,'kg',0),(2376,307,363,NULL,0.02,'kg',0),(2377,307,350,NULL,0.002,'kg',0),(2378,307,502,NULL,0.1,'kg',0),(2379,307,106,NULL,0.002,'kg',0),(2380,307,274,NULL,0.003,'litr',0),(2381,307,330,NULL,0.001,'kg',0),(2382,308,508,NULL,0.01,'kg',0),(2383,308,388,NULL,0.005,'kg',0),(2384,308,353,NULL,0.001,'kg',0),(2385,308,348,NULL,0.001,'kg',0),(2386,308,302,NULL,0.005,'kg',0),(2387,308,224,NULL,0.01,'kg',0),(2388,308,101,NULL,0.001,'kg',0),(2389,308,493,NULL,0.02,'kg',0),(2390,308,343,NULL,0.001,'kg',0),(2391,309,219,NULL,0.008,'kg',0),(2392,309,188,NULL,0.014,'kg',0),(2393,310,285,NULL,0.003,'kg',0),(2394,310,326,NULL,0.0001,'kg',0),(2395,310,188,NULL,0.014,'kg',0),(2396,311,145,NULL,0.2,'kg',0),(2397,311,103,NULL,0.08,'kg',0),(2398,311,150,NULL,14,'szt',0),(2399,311,469,NULL,1.5,'kg',0),(2400,311,229,NULL,0.3,'kg',0),(2401,311,94,NULL,0.12,'kg',0),(2402,311,73,NULL,0.12,'kg',0),(2403,311,97,NULL,0.03,'kg',0),(2404,311,124,NULL,0.9,'kg',0),(2405,312,256,NULL,2,'kg',0),(2406,312,274,NULL,0.3,'litr',0),(2407,312,247,NULL,1,'litr',0),(2408,312,154,NULL,2.6,'kg',0),(2409,312,511,NULL,0.32,'kg',0),(2410,312,304,NULL,0,'kg',0),(2411,312,457,NULL,0.01,'kg',0),(2412,312,348,NULL,0.01,'kg',0),(2413,312,344,NULL,0.001,'kg',0),(2414,312,231,NULL,0.15,'kg',0),(2415,313,256,NULL,2,'kg',0),(2416,313,247,NULL,1,'litr',0),(2417,313,274,NULL,0.3,'litr',0),(2418,313,446,NULL,2.6,'kg',0),(2419,313,231,NULL,0.25,'kg',0),(2420,313,322,NULL,0.4,'kg',0),(2421,313,457,NULL,0.01,'kg',0),(2422,313,348,NULL,0,'kg',0),(2423,314,256,NULL,2,'kg',0),(2424,314,247,NULL,1,'litr',0),(2425,314,274,NULL,0.3,'litr',0),(2426,314,446,NULL,2.6,'kg',0),(2427,314,231,NULL,0.5,'kg',0),(2428,314,322,NULL,0.4,'kg',0),(2429,314,457,NULL,0.01,'kg',0),(2430,314,348,NULL,0.01,'kg',0),(2431,315,256,NULL,2,'kg',0),(2432,315,247,NULL,1,'litr',0),(2433,315,274,NULL,0.3,'litr',0),(2434,315,166,NULL,2,'kg',0),(2435,315,64,NULL,0.8,'kg',0),(2436,315,78,NULL,0.07,'kg',0),(2437,315,457,NULL,0.01,'kg',0),(2438,315,348,NULL,0.01,'kg',0),(2439,315,231,NULL,0.2,'kg',0),(2440,316,253,NULL,0.4,'kg',0),(2441,316,231,NULL,0.2,'kg',0),(2442,316,150,NULL,3,'szt',0),(2443,316,500,NULL,0.1,'kg',0),(2444,316,154,NULL,1.2,'kg',0),(2445,316,511,NULL,0.16,'kg',0),(2446,316,304,NULL,0.04,'kg',0),(2447,316,457,NULL,0.01,'kg',0),(2448,316,348,NULL,0.01,'kg',0),(2449,317,256,NULL,0.4,'kg',0),(2450,317,231,NULL,0.2,'kg',0),(2451,317,150,NULL,3,'szt',0),(2452,317,500,NULL,0.1,'kg',0),(2453,317,120,NULL,1.7,'kg',0),(2454,317,285,NULL,0.4,'kg',0),(2455,317,78,NULL,0.4,'kg',0),(2456,317,404,NULL,0.4,'kg',0),(2457,317,304,NULL,0.04,'kg',0),(2458,317,457,NULL,0.01,'kg',0),(2459,317,348,NULL,0.01,'kg',0),(2460,317,341,NULL,0.08,'kg',0),(2461,318,256,NULL,0.4,'kg',0),(2462,318,231,NULL,0.2,'kg',0),(2463,318,150,NULL,3,'szt',0),(2464,318,500,NULL,0.1,'kg',0),(2465,318,449,NULL,2.2,'kg',0),(2466,318,396,NULL,0.4,'kg',0),(2467,318,457,NULL,0.01,'kg',0),(2468,318,348,NULL,0.01,'kg',0),(2469,318,231,NULL,0.3,'kg',0),(2470,319,253,NULL,0.6,'kg',0),(2471,319,457,NULL,0.01,'kg',0),(2472,319,110,NULL,0.025,'kg',0),(2473,319,274,NULL,0.05,'litr',0),(2474,319,78,NULL,0.8,'kg',0),(2475,320,469,NULL,0.5,'kg',0),(2476,320,150,NULL,2,'szt',0),(2477,320,256,NULL,0.1,'kg',0),(2478,320,231,NULL,0.04,'kg',0),(2479,320,502,NULL,0.08,'litr',0),(2480,320,97,NULL,0.04,'kg',0),(2481,321,120,NULL,0.125,'kg',0),(2482,321,449,NULL,0.0435,'kg',0),(2483,321,396,NULL,0.0175,'kg',0),(2484,321,322,NULL,0.0125,'kg',0),(2485,321,106,NULL,0.0025,'kg',0),(2486,321,458,NULL,0.00025,'kg',0),(2487,321,371,NULL,0.0375,'kg',0),(2488,321,285,NULL,0.005,'kg',0),(2489,321,99,NULL,0.005,'kg',0),(2490,321,231,NULL,0.0075,'kg',0),(2491,321,457,NULL,0.00025,'kg',0),(2492,321,348,NULL,0.00025,'kg',0),(2493,321,333,NULL,0.0005,'kg',0),(2494,321,363,NULL,0.0015,'kg',0),(2495,322,269,NULL,0.2,'kg',0),(2496,322,433,NULL,0.2,'kg',0),(2497,322,365,NULL,1.2,'porcji',0),(2498,322,38,NULL,0.18,'kg',0),(2499,322,26,NULL,0.18,'kg',0),(2500,323,120,NULL,0.1,'kg',0),(2501,323,457,NULL,0.002,'kg',0),(2502,323,348,NULL,0.001,'kg',0),(2503,323,77,NULL,0.02,'kg',0),(2504,323,254,NULL,0.01,'kg',0),(2505,323,150,NULL,0.022,'szt',0),(2506,323,274,NULL,0.04,'litr',0),(2507,324,120,NULL,0.15,'kg',0),(2508,324,237,NULL,0.1,'kg',0),(2509,324,271,NULL,0.06,'kg',0),(2510,324,318,NULL,0.2,'kg',0),(2511,324,319,NULL,0.045,'kg',0),(2512,324,79,NULL,0.02,'kg',0),(2513,324,28,NULL,0.05,'kg',0),(2514,325,220,NULL,1.25,'kg',0),(2515,325,94,NULL,0.5,'kg',0),(2516,326,257,NULL,0.24,'kg',0),(2517,326,229,NULL,0.45,'kg',0),(2518,326,327,NULL,0.004,'kg',0),(2519,326,94,NULL,0.315,'kg',0),(2520,326,150,NULL,15,'szt',0),(2521,326,73,NULL,0.06,'kg',0),(2522,326,97,NULL,0.024,'kg',0),(2523,326,419,NULL,1.5,'kg',0),(2524,327,150,NULL,5,'szt',0),(2525,327,94,NULL,0.1,'kg',0),(2526,327,257,NULL,0.08,'kg',0),(2527,327,327,NULL,0.001,'kg',0),(2528,327,155,NULL,0.005,'kg',0),(2529,327,274,NULL,0.125,'litr',0),(2530,327,502,NULL,0.5,'litr',0),(2531,327,425,NULL,1,'kg',0),(2532,327,129,NULL,0.2,'kg',0),(2533,328,254,NULL,1,'kg',0),(2534,328,150,NULL,6,'szt',0),(2535,328,457,NULL,0.004,'kg',0),(2536,329,254,NULL,0.7,'kg',0),(2537,329,150,NULL,9,'szt',0),(2538,329,94,NULL,0.15,'kg',0),(2539,329,500,NULL,0.2,'kg',0),(2540,329,148,NULL,1.7,'kg',0),(2541,329,327,NULL,0.002,'kg',0),(2542,329,331,NULL,0.002,'kg',0),(2543,329,231,NULL,0.2,'kg',0),(2544,329,95,NULL,0.1,'kg',0),(2545,330,204,NULL,0.05,'litr',0),(2546,331,464,NULL,0.1,'szt',0),(2547,331,495,NULL,0.02,'kg',0),(2548,331,428,NULL,0.02,'kg',0),(2549,332,163,NULL,2.8,'kg',0),(2550,332,344,NULL,0.004,'kg',0),(2551,332,457,NULL,0.009,'kg',0),(2552,332,106,NULL,0.006,'kg',0),(2553,332,348,NULL,0.003,'kg',0),(2554,333,150,NULL,3,'szt',0),(2555,333,63,NULL,0.05,'kg',0),(2556,333,78,NULL,0.01,'kg',0),(2557,333,274,NULL,0.003,'litr',0),(2558,333,231,NULL,0.025,'kg',0),(2559,333,447,NULL,0.005,'kg',0),(2560,334,489,NULL,0.1,'kg',0),(2561,334,231,NULL,0.01,'kg',0),(2562,334,502,NULL,0.06,'litr',0),(2563,334,457,NULL,0.002,'kg',0),(2564,334,185,NULL,0.001,'kg',0),(2565,335,120,NULL,0.12,'kg',0),(2566,335,443,NULL,1,'kg',0),(2567,335,125,NULL,0.1,'kg',0),(2568,335,333,NULL,0.001,'kg',0),(2569,335,457,NULL,0.001,'kg',0),(2570,335,274,NULL,0.001,'litr',0),(2571,336,63,NULL,0.05,'kg',0),(2572,336,78,NULL,0.01,'kg',0),(2573,336,274,NULL,0.003,'litr',0),(2574,337,23,NULL,6,'l',0),(2575,337,489,NULL,2.5,'kg',0),(2576,337,502,NULL,1,'litr',0),(2577,337,34,NULL,1.3,'kg',0),(2578,337,150,NULL,26,'szt',0),(2579,338,489,NULL,0.35,'kg',0),(2580,338,150,NULL,2,'szt',0),(2581,338,185,NULL,0.001,'kg',0),(2582,338,231,NULL,0.007,'kg',0),(2583,338,249,NULL,0.3,'kg',0),(2584,339,410,NULL,0.239,'kg',0),(2585,339,400,NULL,0.32,'kg',0),(2586,339,413,NULL,0.242,'kg',0),(2587,339,478,NULL,0.15,'kg',0),(2588,339,51,NULL,0.155,'kg',0),(2589,339,278,NULL,0.08,'kg',0),(2590,340,26,NULL,3,'kg',0),(2591,340,27,NULL,1,'kg',0),(2592,340,365,NULL,4,'porcji',0),(2593,340,269,NULL,0.18,'kg',0),(2594,340,15,NULL,4,'kg',0),(2595,341,457,NULL,0.001,'kg',0),(2596,341,385,NULL,0.059,'kg',0),(2597,341,348,NULL,0.001,'kg',0),(2598,341,344,NULL,0.002,'kg',0),(2599,341,343,NULL,0.002,'kg',0),(2600,341,499,NULL,0.007,'kg',0),(2601,342,164,NULL,0.03,'kg',0),(2602,342,457,NULL,0.001,'kg',0),(2603,342,348,NULL,0.001,'kg',0),(2604,342,344,NULL,0.001,'kg',0),(2605,342,106,NULL,0.001,'kg',0),(2606,342,274,NULL,0.002,'litr',0),(2607,343,160,NULL,0.1,'kg',0),(2608,343,295,NULL,0.5,'kg',0),(2609,343,217,NULL,0.5,'kg',0),(2610,343,274,NULL,0.1,'litr',0),(2611,343,78,NULL,0.3,'kg',0),(2612,343,457,NULL,0.006,'kg',0),(2613,343,348,NULL,0.003,'kg',0),(2614,343,352,NULL,0.003,'litr',0),(2615,344,15,NULL,1,'kg',0),(2616,344,26,NULL,1,'kg',0),(2617,344,365,NULL,1,'porcji',0),(2618,345,120,NULL,0.15,'kg',0),(2619,345,322,NULL,0.025,'kg',0),(2620,345,231,NULL,0.01,'kg',0),(2621,345,457,NULL,0.002,'kg',0),(2622,345,348,NULL,0.002,'kg',0),(2623,345,454,NULL,0.01,'kg',0),(2624,346,53,NULL,0.03,'kg',0),(2625,346,285,NULL,0.5,'kg',0),(2626,346,428,NULL,0.15,'kg',0),(2627,347,53,NULL,0.02,'kg',0),(2628,347,150,NULL,6,'szt',0),(2629,347,210,NULL,0.22,'litr',0),(2630,347,447,NULL,0.01,'kg',0),(2631,347,457,NULL,0.005,'kg',0),(2632,347,348,NULL,0.005,'kg',0),(2633,348,99,NULL,1.4,'kg',0),(2634,348,322,NULL,0.2,'kg',0),(2635,348,231,NULL,0.1,'kg',0),(2636,348,457,NULL,0.004,'kg',0),(2637,348,348,NULL,0.003,'kg',0),(2638,348,106,NULL,0.003,'kg',0),(2639,348,502,NULL,0.2,'litr',0),(2640,348,23,NULL,0.3,'l',0),(2641,348,454,NULL,0.013,'kg',0),(2642,349,389,NULL,0.45,'kg',0),(2643,349,303,NULL,0.236,'kg',0),(2644,349,226,NULL,0.219,'kg',0),(2645,349,148,NULL,0.295,'kg',0),(2646,349,322,NULL,0.269,'kg',0),(2647,349,211,NULL,0.3,'kg',0),(2648,349,457,NULL,0.004,'kg',0),(2649,349,348,NULL,0.005,'kg',0),(2650,350,120,NULL,0.12,'kg',0),(2651,350,363,NULL,0.015,'kg',0),(2652,350,333,NULL,0.004,'kg',0),(2653,350,62,NULL,0.02,'kg',0),(2654,350,226,NULL,0.01,'kg',0),(2655,350,303,NULL,0.01,'kg',0),(2656,350,99,NULL,0.01,'kg',0),(2657,350,22,NULL,1,'kg',0),(2658,350,322,NULL,0.1,'kg',0),(2659,350,502,NULL,0.05,'litr',0),(2660,351,319,NULL,0.02,'kg',0),(2661,351,407,NULL,0.02,'kg',0),(2662,351,277,NULL,0.01,'kg',0),(2663,351,451,NULL,0.005,'kg',0),(2664,352,120,NULL,0.15,'kg',0),(2665,352,322,NULL,0.025,'kg',0),(2666,352,231,NULL,0.01,'kg',0),(2667,352,457,NULL,0.002,'kg',0),(2668,352,348,NULL,0.002,'kg',0),(2669,352,77,NULL,0.01,'kg',0),(2670,352,150,NULL,0.5,'szt',0),(2671,352,255,NULL,0.01,'kg',0),(2672,352,398,NULL,0.01,'kg',0),(2673,353,14,NULL,1,'kg',0),(2674,353,176,NULL,0.105,'kg',0),(2675,353,41,NULL,1,'kg',0),(2676,353,33,NULL,2,'kg',0),(2677,353,294,NULL,0.12,'kg',0),(2678,353,457,NULL,0.03,'kg',0),(2679,353,52,NULL,0.03,'kg',0),(2680,353,399,NULL,0.03,'kg',0),(2681,353,40,NULL,1,'kg',0),(2682,353,39,NULL,1,'kg',0),(2683,353,318,NULL,0.05,'kg',0),(2684,353,271,NULL,0.05,'kg',0),(2685,353,285,NULL,0.05,'kg',0),(2686,353,268,NULL,0.05,'kg',0),(2687,353,296,NULL,0.05,'kg',0),(2688,353,288,NULL,0.05,'kg',0),(2689,353,490,NULL,2,'kg',0),(2690,354,270,NULL,0.05,'kg',0),(2691,355,156,NULL,2,'kg',0),(2692,355,302,NULL,1.5,'kg',0),(2693,355,322,NULL,0.8,'kg',0),(2694,355,388,NULL,2,'kg',0),(2695,355,457,NULL,0.021,'kg',0),(2696,355,348,NULL,0.008,'kg',0),(2697,355,342,NULL,0.025,'kg',0),(2698,355,106,NULL,0.01,'kg',0),(2699,355,274,NULL,0.1,'litr',0),(2700,356,224,NULL,1.5,'kg',0),(2701,356,388,NULL,1.5,'kg',0),(2702,356,302,NULL,1.5,'kg',0),(2703,356,502,NULL,1,'litr',0),(2704,356,322,NULL,0.4,'kg',0),(2705,356,457,NULL,0.1,'kg',0),(2706,356,348,NULL,0.05,'kg',0),(2707,356,335,NULL,0.1,'kg',0),(2708,356,185,NULL,0.15,'kg',0),(2709,356,376,NULL,5,'kg',0),(2710,357,85,NULL,0.7,'kg',0),(2711,357,150,NULL,2,'szt',0),(2712,357,428,NULL,0.05,'kg',0),(2713,357,277,NULL,0.005,'kg',0),(2714,358,506,NULL,3.7,'kg',0),(2715,358,486,NULL,1,'kg',0),(2716,358,353,NULL,0.003,'kg',0),(2717,358,342,NULL,0.015,'kg',0),(2718,358,160,NULL,3,'kg',0),(2719,358,168,NULL,0.25,'kg',0),(2720,359,489,NULL,1.5,'kg',0),(2721,359,75,NULL,1.7,'kg',0),(2722,359,185,NULL,0.1,'kg',0),(2723,359,502,NULL,0.5,'litr',0),(2724,359,342,NULL,0.01,'kg',0),(2725,359,348,NULL,0.002,'kg',0),(2726,359,486,NULL,0.5,'kg',0),(2727,359,23,NULL,6,'l',0),(2728,360,156,NULL,2.5,'kg',0),(2729,360,67,NULL,2,'kg',0),(2730,360,489,NULL,3.5,'kg',0),(2731,360,486,NULL,1.5,'kg',0),(2732,360,343,NULL,0.04,'kg',0),(2733,360,504,NULL,1,'litr',0),(2734,360,353,NULL,0.02,'kg',0),(2735,360,457,NULL,0.03,'kg',0),(2736,360,348,NULL,0.02,'kg',0),(2737,360,342,NULL,0.01,'kg',0),(2738,360,23,NULL,6,'l',0),(2739,361,492,NULL,3,'kg',0),(2740,361,78,NULL,0.6,'kg',0),(2741,361,274,NULL,0.1,'litr',0),(2742,361,310,NULL,0.5,'kg',0),(2743,361,342,NULL,0.05,'kg',0),(2744,361,457,NULL,0.006,'kg',0),(2745,361,348,NULL,0.006,'kg',0),(2746,361,502,NULL,0.5,'litr',0),(2747,361,487,NULL,0.01,'kg',0),(2748,361,168,NULL,1.68,'kg',0),(2749,361,78,NULL,0.07,'kg',0),(2750,361,75,NULL,0.14,'kg',0),(2751,361,457,NULL,0.014,'kg',0),(2752,361,348,NULL,0.014,'kg',0),(2753,361,231,NULL,0.14,'kg',0),(2754,362,254,NULL,0.5,'kg',0),(2755,362,150,NULL,8,'szt',0),(2756,362,231,NULL,0.4,'kg',0),(2757,362,483,NULL,0.03,'litr',0),(2758,362,500,NULL,0.2,'kg',0),(2759,362,95,NULL,0.08,'kg',0),(2760,362,274,NULL,2,'litr',0),(2761,363,138,NULL,0.15,'kg',0),(2762,363,96,NULL,0.05,'kg',0),(2763,363,199,NULL,0.05,'litr',0),(2764,363,101,NULL,0.03,'kg',0),(2765,363,502,NULL,0.05,'litr',0),(2766,363,13,NULL,1,'kg',0),(2767,363,10,NULL,2,'szt',0),(2768,364,322,NULL,0.5,'kg',0),(2769,364,224,NULL,0.5,'kg',0),(2770,364,489,NULL,0.8,'kg',0),(2771,364,111,NULL,5,'kg',0),(2772,364,23,NULL,6,'l',0),(2773,364,342,NULL,0.01,'kg',0),(2774,364,457,NULL,0.05,'kg',0),(2775,364,348,NULL,0.005,'kg',0),(2776,364,147,NULL,0.3,'kg',0),(2777,364,502,NULL,1,'litr',0),(2778,364,292,NULL,0.002,'kg',0),(2779,365,75,NULL,0.15,'kg',0),(2780,365,138,NULL,0.1,'kg',0),(2781,365,398,NULL,0.06,'kg',0),(2782,365,402,NULL,0.06,'kg',0),(2783,365,369,NULL,0.03,'kg',0),(2784,365,459,NULL,0.005,'kg',0),(2785,365,281,NULL,0.005,'kg',0),(2786,365,29,NULL,0.03,'l',0),(2787,366,275,NULL,0.75,'litr',0),(2788,366,239,NULL,0.75,'kg',0),(2789,366,101,NULL,1.5,'kg',0),(2790,367,318,NULL,3,'kg',0),(2791,367,78,NULL,1,'kg',0),(2792,367,285,NULL,0.113,'kg',0),(2793,367,289,NULL,0.113,'kg',0),(2794,367,49,NULL,0.48,'kg',0),(2795,367,224,NULL,1,'kg',0),(2796,367,106,NULL,0.028,'kg',0),(2797,367,345,NULL,0.003,'kg',0),(2798,367,251,NULL,0.086,'kg',0),(2799,367,346,NULL,0.026,'kg',0),(2800,367,348,NULL,0.018,'kg',0),(2801,367,94,NULL,0.056,'kg',0),(2802,367,265,NULL,0.084,'litr',0),(2803,367,457,NULL,0.03,'kg',0),(2804,367,431,NULL,0.052,'kg',0),(2805,367,100,NULL,0.014,'kg',0),(2806,368,318,NULL,3,'kg',0),(2807,368,78,NULL,1,'kg',0),(2808,368,457,NULL,0.058,'kg',0),(2809,368,106,NULL,0.04,'kg',0),(2810,368,285,NULL,0.42,'kg',0),(2811,368,49,NULL,0.48,'kg',0),(2812,368,195,NULL,0.34,'kg',0),(2813,368,265,NULL,0.128,'litr',0),(2814,368,94,NULL,0.228,'kg',0),(2815,368,345,NULL,0.006,'kg',0),(2816,368,349,NULL,0.018,'kg',0),(2817,368,346,NULL,0.026,'kg',0),(2818,368,251,NULL,0.086,'kg',0),(2819,368,431,NULL,0.052,'kg',0),(2820,368,100,NULL,0.014,'kg',0),(2821,369,373,NULL,0.01,'kg',0),(2822,369,271,NULL,0.01,'kg',0),(2823,369,457,NULL,0.0032,'kg',0),(2824,369,274,NULL,0.00017,'litr',0),(2825,369,120,NULL,0.02,'kg',0),(2826,369,210,NULL,0.00035,'litr',0),(2827,369,333,NULL,0.0001,'kg',0),(2828,369,285,NULL,0.01,'kg',0),(2829,369,322,NULL,0.005,'kg',0),(2830,370,105,NULL,0.1,'kg',0),(2831,370,247,NULL,0.1,'litr',0),(2832,370,504,NULL,0.15,'litr',0),(2833,371,468,NULL,1,'kg',0),(2834,371,150,NULL,5,'szt',0),(2835,371,97,NULL,0.1,'kg',0),(2836,371,457,NULL,0.003,'kg',0),(2837,371,254,NULL,1,'kg',0),(2838,371,247,NULL,0.7,'litr',0),(2839,371,274,NULL,0.0175,'litr',0),(2840,372,489,NULL,0.25,'kg',0),(2841,372,106,NULL,0.003,'kg',0),(2842,372,368,NULL,0.002,'kg',0),(2843,372,363,NULL,0.003,'kg',0),(2844,372,457,NULL,0.001,'kg',0),(2845,373,23,NULL,0.25,'l',0),(2846,373,66,NULL,0.1,'kg',0),(2847,373,117,NULL,0.1,'kg',0),(2848,373,457,NULL,0.001,'kg',0),(2849,373,348,NULL,0.002,'kg',0),(2850,373,392,NULL,0.015,'kg',0),(2851,373,502,NULL,0.008,'litr',0),(2852,373,454,NULL,0.013,'kg',0),(2853,374,489,NULL,4,'kg',0),(2854,374,431,NULL,0.6,'kg',0),(2855,374,150,NULL,4,'szt',0),(2856,374,492,NULL,2.4,'kg',0),(2857,374,224,NULL,0.3,'kg',0),(2858,374,388,NULL,0.234,'kg',0),(2859,374,302,NULL,0.234,'kg',0),(2860,374,457,NULL,0.0023,'kg',0),(2861,374,348,NULL,0.001395,'kg',0),(2862,374,352,NULL,0.00069,'litr',0),(2863,374,344,NULL,0.00093,'kg',0),(2864,374,78,NULL,0.3486,'kg',0),(2865,374,273,NULL,15,'kg',0),(2866,375,19,NULL,0.07,'kg',0),(2867,375,130,NULL,0.001,'kg',0),(2868,375,403,NULL,0.05,'kg',0),(2869,375,502,NULL,0.05,'litr',0),(2870,375,94,NULL,0.03,'kg',0),(2871,375,244,NULL,0.00005,'kg',0),(2872,376,451,NULL,0.04,'kg',0),(2873,376,78,NULL,0.015,'kg',0),(2874,376,138,NULL,0.05,'kg',0),(2875,376,477,NULL,0.05,'kg',0),(2876,376,120,NULL,0.26,'kg',0),(2877,376,150,NULL,0.5,'szt',0),(2878,376,254,NULL,0.03,'kg',0),(2879,376,401,NULL,0.05,'kg',0),(2880,376,460,NULL,0.005,'kg',0),(2881,376,292,NULL,0.005,'kg',0),(2882,376,411,NULL,0.04,'kg',0),(2883,376,321,NULL,0.04,'kg',0),(2884,376,9,NULL,0.08,'kg',0),(2885,377,214,NULL,0.12,'kg',0),(2886,377,63,NULL,0.08,'kg',0),(2887,377,501,NULL,0.08,'litr',0),(2888,377,304,NULL,0.002,'kg',0),(2889,377,231,NULL,0.01,'kg',0),(2890,377,401,NULL,0.015,'kg',0),(2891,377,457,NULL,0.002,'kg',0),(2892,377,348,NULL,0.001,'kg',0),(2893,378,492,NULL,0.6,'kg',0),(2894,378,78,NULL,0.12,'kg',0),(2895,378,274,NULL,0.02,'litr',0),(2896,378,342,NULL,0.01,'kg',0),(2897,378,457,NULL,0.0012,'kg',0),(2898,378,348,NULL,0.0012,'kg',0),(2899,378,502,NULL,0.1,'litr',0),(2900,378,487,NULL,0.002,'kg',0),(2901,379,254,NULL,1.2,'kg',0),(2902,379,231,NULL,0.3,'kg',0),(2903,379,95,NULL,0.13,'kg',0),(2904,379,150,NULL,9,'szt',0),(2905,379,94,NULL,0.22,'kg',0),(2906,379,327,NULL,0.042,'kg',0),(2907,379,149,NULL,5,'kg',0),(2908,379,500,NULL,0.4,'kg',0),(2909,379,431,NULL,0.15,'kg',0),(2910,379,331,NULL,0.004,'kg',0),(2911,380,481,NULL,1,'litr',0),(2912,380,56,NULL,0.2,'litr',0),(2913,380,101,NULL,0.13,'kg',0),(2914,380,239,NULL,0.025,'kg',0),(2915,380,209,NULL,0.05,'kg',0),(2916,381,449,NULL,2.5,'kg',0),(2917,381,322,NULL,0.852,'kg',0),(2918,381,231,NULL,0.3,'kg',0),(2919,381,106,NULL,0.044,'kg',0),(2920,381,457,NULL,0.005,'kg',0),(2921,381,348,NULL,0.004,'kg',0),(2922,382,206,NULL,0.05,'litr',0),(2923,382,205,NULL,0.05,'litr',0),(2924,382,207,NULL,0.05,'litr',0),(2925,383,150,NULL,8,'szt',0),(2926,383,94,NULL,0.29,'kg',0),(2927,383,96,NULL,0.29,'kg',0),(2928,383,231,NULL,0.425,'kg',0),(2929,383,104,NULL,0.225,'kg',0),(2930,383,257,NULL,0.1,'kg',0),(2931,383,155,NULL,0.033,'kg',0),(2932,383,280,NULL,0.19,'kg',0),(2933,384,54,NULL,0.106,'kg',0),(2934,384,148,NULL,0.0225,'kg',0),(2935,384,498,NULL,0.0375,'kg',0),(2936,384,177,NULL,0.0337,'kg',0),(2937,384,223,NULL,0.0375,'kg',0),(2938,384,478,NULL,0.0318,'kg',0),(2939,384,477,NULL,0.0318,'kg',0),(2940,385,485,NULL,0.1,'kg',0),(2941,386,322,NULL,2,'kg',0),(2942,386,231,NULL,0.2,'kg',0),(2943,386,489,NULL,1,'kg',0),(2944,386,457,NULL,0.005,'kg',0),(2945,386,351,NULL,0.005,'kg',0),(2946,386,350,NULL,0.002,'kg',0),(2947,386,106,NULL,0.007,'kg',0),(2948,386,502,NULL,0.25,'litr',0),(2949,386,428,NULL,0.2,'kg',0),(2950,386,53,NULL,0.08,'kg',0),(2951,387,85,NULL,0.4,'kg',0),(2952,387,150,NULL,2,'szt',0),(2953,387,428,NULL,0.05,'kg',0),(2954,387,277,NULL,0.005,'kg',0),(2955,388,271,NULL,2.5,'kg',0),(2956,388,457,NULL,0.1,'kg',0),(2957,388,185,NULL,0.008,'kg',0),(2958,388,106,NULL,0.004,'kg',0),(2959,388,86,NULL,0.5,'kg',0),(2960,389,472,NULL,0.3,'kg',0),(2961,389,457,NULL,0.001,'kg',0),(2962,389,344,NULL,0.002,'kg',0),(2963,389,348,NULL,0.001,'kg',0),(2964,389,106,NULL,0.003,'kg',0),(2965,389,274,NULL,0.003,'litr',0),(2966,389,148,NULL,0.02,'kg',0),(2967,389,3,NULL,0.5,'kg',0),(2968,389,511,NULL,0.005,'kg',0),(2969,389,363,NULL,0.003,'kg',0),(2970,389,45,NULL,1,'kg',0),(2971,389,150,NULL,0.13,'szt',0),(2972,389,254,NULL,0.013,'kg',0),(2973,389,431,NULL,0.013,'kg',0),(2974,390,120,NULL,0.1,'kg',0),(2975,390,457,NULL,0.002,'kg',0),(2976,390,348,NULL,0.001,'kg',0),(2977,390,77,NULL,0.008,'kg',0),(2978,390,150,NULL,0.5,'szt',0),(2979,390,274,NULL,0.1,'litr',0),(2980,390,125,NULL,0.1,'kg',0),(2981,390,443,NULL,0.1,'kg',0),(2982,391,2,NULL,1,'porcji',0),(2983,391,19,NULL,0.025,'kg',0),(2984,391,403,NULL,0.04,'kg',0),(2985,391,504,NULL,0.1,'litr',0),(2986,392,148,NULL,0.18,'kg',0),(2987,392,48,NULL,0.15,'kg',0),(2988,392,317,NULL,0.185,'kg',0),(2989,392,477,NULL,0.1,'kg',0),(2990,392,138,NULL,0.22,'kg',0),(2991,392,70,NULL,0,'kg',0),(2992,393,449,NULL,0.45,'kg',0),(2993,393,255,NULL,0.4,'kg',0),(2994,393,274,NULL,0.125,'litr',0),(2995,393,94,NULL,0.2,'kg',0),(2996,393,150,NULL,3,'szt',0),(2997,393,327,NULL,0.01,'kg',0),(2998,393,502,NULL,1.5,'litr',0),(2999,393,403,NULL,0.5,'kg',0),(3000,393,222,NULL,0.5,'kg',0),(3001,393,65,NULL,0.5,'kg',0),(3002,394,425,NULL,1,'kg',0),(3003,394,502,NULL,0.5,'litr',0),(3004,394,129,NULL,0.3,'kg',0),(3005,394,359,NULL,0.85,'kg',0),(3006,394,101,NULL,1.5,'kg',0),(3007,394,317,NULL,1,'kg',0),(3008,394,239,NULL,0.04,'kg',0),(3009,394,508,NULL,0.03,'kg',0),(3010,394,243,NULL,0.05,'kg',0),(3011,395,231,NULL,0.3,'kg',0),(3012,395,255,NULL,0.2,'kg',0),(3013,395,150,NULL,10,'szt',0),(3014,395,94,NULL,0.1,'kg',0),(3015,395,97,NULL,0.1,'kg',0),(3016,395,431,NULL,0.1,'kg',0),(3017,395,247,NULL,1,'litr',0),(3018,396,42,NULL,1,'kg',0),(3019,396,176,NULL,0.095,'kg',0),(3020,396,38,NULL,1,'kg',0),(3021,396,33,NULL,1,'kg',0),(3022,396,25,NULL,0.5,'kg',0),(3023,396,40,NULL,1,'kg',0),(3024,396,268,NULL,0.05,'kg',0),(3025,396,296,NULL,0.05,'kg',0),(3026,396,288,NULL,0.05,'kg',0),(3027,396,45,NULL,1,'kg',0),(3028,396,83,NULL,0.09,'kg',0),(3029,396,210,NULL,0.05,'litr',0),(3030,396,251,NULL,0.05,'kg',0),(3031,396,173,NULL,0.1,'kg',0),(3032,397,388,NULL,0.45,'kg',0),(3033,398,85,NULL,0.4,'kg',0),(3034,398,150,NULL,2,'szt',0),(3035,398,428,NULL,0.05,'kg',0),(3036,398,277,NULL,0.005,'kg',0),(3037,399,189,NULL,2.8,'kg',0),(3038,399,75,NULL,3.5,'kg',0),(3039,399,489,NULL,2,'kg',0),(3040,399,185,NULL,0.15,'kg',0),(3041,399,502,NULL,1,'litr',0),(3042,399,486,NULL,0.5,'kg',0),(3043,399,224,NULL,0.336,'kg',0),(3044,399,302,NULL,0.42,'kg',0),(3045,399,388,NULL,0.504,'kg',0),(3046,399,322,NULL,0.252,'kg',0),(3047,399,457,NULL,0.0616,'kg',0),(3048,399,348,NULL,0.00336,'kg',0),(3049,399,297,NULL,0.00252,'kg',0),(3050,399,353,NULL,0.00168,'kg',0),(3051,399,343,NULL,0.00084,'kg',0),(3052,399,342,NULL,0.084,'kg',0),(3053,400,361,NULL,3.824,'kg',0),(3054,400,94,NULL,1,'kg',0),(3055,401,163,NULL,2.8,'kg',0),(3056,401,344,NULL,0.004,'kg',0),(3057,401,457,NULL,0.009,'kg',0),(3058,401,332,NULL,0.006,'kg',0),(3059,401,348,NULL,0.002,'kg',0),(3060,402,163,NULL,1.8,'kg',0),(3061,402,344,NULL,0.004,'kg',0),(3062,402,106,NULL,0.003,'kg',0),(3063,402,457,NULL,0.002,'kg',0),(3064,402,348,NULL,0.001,'kg',0),(3065,403,241,NULL,3.5,'kg',0),(3066,403,78,NULL,0.27,'kg',0),(3067,403,231,NULL,0.1,'kg',0),(3068,403,274,NULL,0.2,'litr',0),(3069,403,457,NULL,0.0015,'kg',0),(3070,403,348,NULL,0.029,'kg',0),(3071,403,77,NULL,0.2,'kg',0),(3072,403,502,NULL,0.4,'litr',0),(3073,403,344,NULL,0.006,'kg',0),(3074,403,342,NULL,0.13,'kg',0),(3075,403,343,NULL,0.002,'kg',0),(3076,404,156,NULL,2,'kg',0),(3077,404,302,NULL,1.5,'kg',0),(3078,404,322,NULL,0.8,'kg',0),(3079,404,388,NULL,2,'kg',0),(3080,404,457,NULL,0.021,'kg',0),(3081,404,348,NULL,0.008,'kg',0),(3082,404,342,NULL,0.025,'kg',0),(3083,404,101,NULL,0.06,'kg',0),(3084,404,369,NULL,0.025,'kg',0),(3085,404,106,NULL,0.01,'kg',0),(3086,404,274,NULL,0.1,'litr',0),(3087,405,106,NULL,0.03,'kg',0),(3088,405,239,NULL,0.1,'kg',0),(3089,405,269,NULL,0.1,'kg',0),(3090,405,457,NULL,0.002,'kg',0),(3091,405,251,NULL,0.12,'kg',0),(3092,405,348,NULL,0,'kg',0),(3093,405,369,NULL,0.005,'kg',0),(3094,405,274,NULL,0.4,'litr',0),(3095,406,106,NULL,0.02,'kg',0),(3096,406,266,NULL,0.1,'litr',0),(3097,406,239,NULL,0.2,'kg',0),(3098,406,251,NULL,0.2,'kg',0),(3099,406,57,NULL,0.004,'kg',0),(3100,406,274,NULL,0.8,'litr',0),(3101,406,348,NULL,0.003,'kg',0),(3102,406,457,NULL,0.004,'kg',0),(3103,407,92,NULL,2.6,'kg',0),(3104,407,286,NULL,1,'kg',0),(3105,407,457,NULL,0.02,'kg',0),(3106,407,346,NULL,0.02,'kg',0),(3107,407,106,NULL,0.04,'kg',0),(3108,407,274,NULL,0.1,'litr',0),(3109,408,160,NULL,3,'kg',0),(3110,408,312,NULL,0.02,'kg',0),(3111,408,499,NULL,0.1,'kg',0),(3112,408,475,NULL,0.075,'kg',0),(3113,408,344,NULL,0.004,'kg',0),(3114,408,457,NULL,0.002,'kg',0),(3115,408,348,NULL,0.003,'kg',0),(3116,408,239,NULL,0.01,'kg',0),(3117,408,176,NULL,1.5,'kg',0),(3118,408,60,NULL,0.5,'kg',0),(3119,409,75,NULL,5.7,'kg',0),(3120,409,265,NULL,0.12,'litr',0),(3121,409,94,NULL,0.65,'kg',0),(3122,409,86,NULL,0.1,'kg',0),(3123,409,457,NULL,0.04,'kg',0),(3124,409,348,NULL,0.004,'kg',0),(3125,410,461,NULL,2.3,'kg',0),(3126,410,231,NULL,0.2,'kg',0),(3127,410,148,NULL,1,'kg',0),(3128,410,106,NULL,0.05,'kg',0),(3129,410,457,NULL,0.01,'kg',0),(3130,410,348,NULL,0.002,'kg',0),(3131,410,344,NULL,0.008,'kg',0),(3132,411,233,NULL,2,'kg',0),(3133,411,119,NULL,1.5,'kg',0),(3134,411,348,NULL,0.004,'kg',0),(3135,411,457,NULL,0.02,'kg',0),(3136,411,332,NULL,0.036,'kg',0),(3137,412,17,NULL,4.7,'kg',0),(3138,412,134,NULL,3.7,'kg',0),(3139,412,224,NULL,0.6,'kg',0),(3140,412,388,NULL,0.7,'kg',0),(3141,412,302,NULL,0.1,'kg',0),(3142,412,343,NULL,0.004,'kg',0),(3143,412,353,NULL,0.004,'kg',0),(3144,412,457,NULL,0.08,'kg',0),(3145,412,348,NULL,0.004,'kg',0),(3146,412,342,NULL,0.04,'kg',0),(3147,413,233,NULL,2.5,'kg',0),(3148,413,332,NULL,0.022,'kg',0),(3149,413,342,NULL,0.02,'kg',0),(3150,413,348,NULL,0.008,'kg',0),(3151,413,150,NULL,2,'szt',0),(3152,413,181,NULL,0.2,'kg',0),(3153,413,457,NULL,0.04,'kg',0),(3154,413,302,NULL,0.11,'kg',0),(3155,413,224,NULL,0.3,'kg',0),(3156,413,388,NULL,0.3,'kg',0),(3157,413,488,NULL,0.16,'kg',0),(3158,414,115,NULL,3,'kg',0),(3159,414,176,NULL,2,'kg',0),(3160,414,60,NULL,0.5,'kg',0),(3161,414,342,NULL,0.01,'kg',0),(3162,414,457,NULL,0.01,'kg',0),(3163,414,348,NULL,0.005,'kg',0),(3164,414,353,NULL,0.003,'kg',0),(3165,414,343,NULL,0.003,'kg',0),(3166,414,181,NULL,0.8,'kg',0),(3167,415,233,NULL,2.5,'kg',0),(3168,415,106,NULL,0.12,'kg',0),(3169,415,457,NULL,0.02,'kg',0),(3170,415,348,NULL,0.01,'kg',0),(3171,415,329,NULL,0.006,'kg',0),(3172,415,181,NULL,0.2,'kg',0),(3173,416,507,NULL,2,'kg',0),(3174,416,224,NULL,0.3,'kg',0),(3175,416,388,NULL,0.3,'kg',0),(3176,416,302,NULL,0.3,'kg',0),(3177,416,457,NULL,0.03,'kg',0),(3178,416,348,NULL,0.008,'kg',0),(3179,416,353,NULL,0.004,'kg',0),(3180,416,343,NULL,0.002,'kg',0),(3181,416,342,NULL,0.04,'kg',0),(3182,416,136,NULL,1,'kg',0),(3183,416,489,NULL,0.2,'kg',0),(3184,417,115,NULL,2,'kg',0),(3185,417,507,NULL,1.5,'kg',0),(3186,417,224,NULL,0.3,'kg',0),(3187,417,388,NULL,0.4,'kg',0),(3188,417,302,NULL,0.3,'kg',0),(3189,417,342,NULL,0.06,'kg',0),(3190,417,343,NULL,0.002,'kg',0),(3191,417,353,NULL,0.002,'kg',0),(3192,417,502,NULL,0.5,'litr',0),(3193,417,265,NULL,0.05,'litr',0),(3194,417,344,NULL,0.008,'kg',0),(3195,417,489,NULL,2.134,'kg',0),(3196,417,348,NULL,0.002,'kg',0),(3197,418,295,NULL,1.6,'kg',0),(3198,418,285,NULL,1,'kg',0),(3199,418,99,NULL,1.2,'kg',0),(3200,418,322,NULL,0.5,'kg',0),(3201,418,181,NULL,0.4,'kg',0),(3202,418,274,NULL,0.2,'litr',0),(3203,418,342,NULL,0.05,'kg',0),(3204,418,457,NULL,0.005,'kg',0),(3205,418,348,NULL,0.008,'kg',0),(3206,418,94,NULL,0.01,'kg',0),(3207,418,441,NULL,0.002,'litr',0),(3208,418,195,NULL,0.425,'kg',0),(3209,419,489,NULL,2.4,'kg',0),(3210,419,450,NULL,0.824,'kg',0),(3211,419,431,NULL,0.3,'kg',0),(3212,419,457,NULL,0.004,'kg',0),(3213,419,253,NULL,0.06,'kg',0),(3214,419,502,NULL,0.4,'litr',0),(3215,419,398,NULL,0.4,'kg',0),(3216,420,189,NULL,0.09,'kg',0),(3217,420,224,NULL,0.012,'kg',0),(3218,420,302,NULL,0.015,'kg',0),(3219,420,388,NULL,0.018,'kg',0),(3220,420,322,NULL,0.009,'kg',0),(3221,420,457,NULL,0.0022,'kg',0),(3222,420,348,NULL,0.00012,'kg',0),(3223,420,297,NULL,0.00009,'kg',0),(3224,420,353,NULL,0.00006,'kg',0),(3225,420,343,NULL,0.00003,'kg',0),(3226,420,342,NULL,0.003,'kg',0),(3227,421,23,NULL,2,'l',0),(3228,421,181,NULL,0.3,'kg',0),(3229,421,502,NULL,0.13,'litr',0),(3230,421,457,NULL,0.008,'kg',0),(3231,421,348,NULL,0.002,'kg',0),(3232,421,213,NULL,0.25,'kg',0),(3233,422,24,NULL,2,'kg',0),(3234,422,311,NULL,0.5,'kg',0),(3235,422,489,NULL,0.7,'kg',0),(3236,422,502,NULL,0.2,'litr',0),(3237,422,231,NULL,0.03,'kg',0),(3238,422,322,NULL,0.15,'kg',0),(3239,423,24,NULL,6.66,'kg',0),(3240,423,489,NULL,0.6,'kg',0),(3241,423,67,NULL,0.2,'kg',0),(3242,423,156,NULL,0.2,'kg',0),(3243,423,227,NULL,0.2,'kg',0),(3244,423,502,NULL,0.2,'litr',0),(3245,423,304,NULL,0.006,'kg',0),(3246,423,233,NULL,0.9,'kg',0),(3247,423,78,NULL,0.114,'kg',0),(3248,423,231,NULL,0.042,'kg',0),(3249,423,274,NULL,0.084,'litr',0),(3250,423,457,NULL,0,'kg',0),(3251,423,348,NULL,0.012,'kg',0),(3252,423,77,NULL,0.084,'kg',0),(3253,423,501,NULL,0.174,'litr',0),(3254,423,344,NULL,0,'kg',0),(3255,423,342,NULL,0.054,'kg',0),(3256,423,343,NULL,0,'kg',0),(3257,424,23,NULL,2,'l',0),(3258,424,489,NULL,1,'kg',0),(3259,424,224,NULL,0.02,'kg',0),(3260,424,502,NULL,0.2,'litr',0),(3261,424,348,NULL,0.001,'kg',0),(3262,424,269,NULL,0.5,'kg',0),(3263,425,489,NULL,1,'kg',0),(3264,425,167,NULL,0.13,'kg',0),(3265,425,304,NULL,0.01,'kg',0),(3266,426,507,NULL,0.6,'kg',0),(3267,426,167,NULL,0.12,'kg',0),(3268,426,160,NULL,0.6,'kg',0),(3269,426,302,NULL,0.006,'kg',0),(3270,426,348,NULL,0.002,'kg',0),(3271,426,344,NULL,0.001,'kg',0),(3272,426,304,NULL,0.002,'kg',0),(3273,426,24,NULL,6.66,'kg',0),(3274,427,174,NULL,0.13,'kg',0),(3275,427,344,NULL,0.0008,'kg',0),(3276,427,86,NULL,0.013,'kg',0),(3277,427,352,NULL,0.01,'litr',0),(3278,427,509,NULL,0.033,'kg',0),(3279,427,348,NULL,0.0002,'kg',0),(3280,427,353,NULL,0.00026,'kg',0),(3281,427,343,NULL,0.00013,'kg',0),(3282,427,501,NULL,0.002,'litr',0),(3283,427,106,NULL,0.00026,'kg',0),(3284,428,163,NULL,0.52,'kg',0),(3285,428,63,NULL,0.12,'kg',0),(3286,428,78,NULL,0.04,'kg',0),(3287,428,269,NULL,0.04,'kg',0),(3288,428,457,NULL,0.008,'kg',0),(3289,428,348,NULL,0.004,'kg',0),(3290,428,344,NULL,0.006,'kg',0),(3291,428,251,NULL,0.008,'kg',0),(3292,428,487,NULL,0.16,'kg',0),(3293,428,106,NULL,0.004,'kg',0),(3294,429,472,NULL,0.45,'kg',0),(3295,429,148,NULL,0.02,'kg',0),(3296,429,344,NULL,0.002,'kg',0),(3297,429,457,NULL,0.002,'kg',0),(3298,429,348,NULL,0.002,'kg',0),(3299,429,510,NULL,0.004,'kg',0),(3300,429,332,NULL,0.002,'kg',0),(3301,429,274,NULL,0.06,'litr',0),(3302,430,456,NULL,0.5,'kg',0),(3303,431,54,NULL,0.106,'kg',0),(3304,431,148,NULL,0.0225,'kg',0),(3305,431,69,NULL,0.0375,'kg',0),(3306,431,177,NULL,0.0337,'kg',0),(3307,431,223,NULL,0.0375,'kg',0),(3308,431,478,NULL,0.0318,'kg',0),(3309,431,477,NULL,0.0318,'kg',0),(3310,432,474,NULL,0.187,'kg',0),(3311,432,391,NULL,0.15,'kg',0),(3312,432,499,NULL,0.007,'kg',0),(3313,432,457,NULL,0.001,'kg',0),(3314,432,348,NULL,0.001,'kg',0),(3315,432,362,NULL,0.01,'litr',0),(3316,432,333,NULL,0.002,'kg',0),(3317,432,304,NULL,0.004,'kg',0),(3318,433,385,NULL,0.15,'kg',0),(3319,433,274,NULL,0.06,'litr',0),(3320,433,150,NULL,0.75,'szt',0),(3321,433,77,NULL,0.03,'kg',0),(3322,433,457,NULL,0.004,'kg',0),(3323,433,348,NULL,0.0015,'kg',0),(3324,433,257,NULL,0.015,'kg',0),(3325,433,12,NULL,1,'kg',0),(3326,433,75,NULL,0.13,'kg',0),(3327,433,265,NULL,0.001,'litr',0),(3328,433,94,NULL,0.005,'kg',0),(3329,433,348,NULL,0.001,'kg',0),(3330,433,274,NULL,0.001,'litr',0),(3331,434,163,NULL,0.153,'kg',0),(3332,434,457,NULL,0.004,'kg',0),(3333,434,348,NULL,0.0005,'kg',0),(3334,434,344,NULL,0.00025,'kg',0),(3335,434,352,NULL,0.0015,'litr',0),(3336,434,274,NULL,0.005,'litr',0),(3337,434,106,NULL,0.001,'kg',0),(3338,434,343,NULL,0.001,'kg',0),(3339,434,348,NULL,0.00025,'kg',0),(3340,434,346,NULL,0.0005,'kg',0),(3341,434,489,NULL,0.15,'kg',0),(3342,434,75,NULL,0.13,'kg',0),(3343,434,265,NULL,0.001,'litr',0),(3344,434,94,NULL,0.005,'kg',0),(3345,434,348,NULL,0.001,'kg',0),(3346,434,457,NULL,0.001,'kg',0),(3347,434,274,NULL,0.001,'litr',0),(3348,434,353,NULL,0.0001,'kg',0),(3349,435,120,NULL,0.12,'kg',0),(3350,435,457,NULL,0.001,'kg',0),(3351,435,348,NULL,0.001,'kg',0),(3352,435,253,NULL,0.01,'kg',0),(3353,435,150,NULL,0.5,'szt',0),(3354,435,274,NULL,0.04,'litr',0),(3355,435,489,NULL,0.15,'kg',0),(3356,435,161,NULL,0.04,'kg',0),(3357,435,285,NULL,0.014,'kg',0),(3358,435,289,NULL,0.014,'kg',0),(3359,435,185,NULL,0.00084,'kg',0),(3360,435,210,NULL,0.0017,'litr',0),(3361,435,457,NULL,0.00038,'kg',0),(3362,435,348,NULL,0.0017,'kg',0),(3363,436,120,NULL,0.11,'kg',0),(3364,436,77,NULL,0.02,'kg',0),(3365,436,127,NULL,0.02,'litr',0),(3366,436,231,NULL,0.03,'kg',0),(3367,436,457,NULL,0.002,'kg',0),(3368,436,348,NULL,0.001,'kg',0),(3369,436,414,NULL,0.025,'kg',0),(3370,436,304,NULL,0.004,'kg',0),(3371,436,150,NULL,0.5,'szt',0),(3372,436,257,NULL,0.01,'kg',0),(3373,436,489,NULL,0.15,'kg',0),(3374,436,158,NULL,0.076,'kg',0),(3375,436,224,NULL,0.0142,'kg',0),(3376,436,322,NULL,0.0076,'kg',0),(3377,436,113,NULL,0.0228,'kg',0),(3378,436,185,NULL,0.00142,'kg',0),(3379,436,101,NULL,0.0252,'kg',0),(3380,436,457,NULL,0.00142,'kg',0),(3381,436,348,NULL,0.00094,'kg',0),(3382,436,94,NULL,0.006,'kg',0),(3383,437,468,NULL,0.2,'kg',0),(3384,437,150,NULL,2,'szt',0),(3385,437,257,NULL,0.1,'kg',0),(3386,437,457,NULL,0.002,'kg',0),(3387,437,231,NULL,0.04,'kg',0),(3388,437,331,NULL,0.001,'kg',0),(3389,437,500,NULL,0.08,'kg',0),(3390,437,94,NULL,0,'kg',0),(3391,438,450,NULL,2.5,'kg',0),(3392,438,322,NULL,0.5,'kg',0),(3393,438,231,NULL,0.2,'kg',0),(3394,438,457,NULL,0.001,'kg',0),(3395,438,348,NULL,0.003,'kg',0),(3396,438,106,NULL,0.01,'kg',0),(3397,438,397,NULL,0.54,'kg',0),(3398,438,257,NULL,2,'kg',0),(3399,438,247,NULL,1.35,'litr',0),(3400,438,274,NULL,0.35,'litr',0),(3401,439,492,NULL,5.5,'kg',0),(3402,439,224,NULL,1.3,'kg',0),(3403,439,388,NULL,1,'kg',0),(3404,439,302,NULL,1,'kg',0),(3405,439,457,NULL,0.01,'kg',0),(3406,439,348,NULL,0.006,'kg',0),(3407,439,352,NULL,0.003,'litr',0),(3408,439,344,NULL,0.004,'kg',0),(3409,439,257,NULL,3,'kg',0),(3410,439,247,NULL,3,'litr',0),(3411,439,274,NULL,0.5,'litr',0),(3412,439,78,NULL,1.5,'kg',0),(3413,439,231,NULL,0.2,'kg',0),(3414,440,311,NULL,1.5,'kg',0),(3415,440,160,NULL,3,'kg',0),(3416,440,78,NULL,1,'kg',0),(3417,440,457,NULL,0.001,'kg',0),(3418,440,348,NULL,0,'kg',0),(3419,440,231,NULL,0.2,'kg',0),(3420,440,253,NULL,2,'kg',0),(3421,440,247,NULL,1.35,'litr',0),(3422,440,274,NULL,0.35,'litr',0),(3423,441,163,NULL,0.3,'kg',0),(3424,441,78,NULL,0.35,'kg',0),(3425,441,457,NULL,0.003,'kg',0),(3426,441,348,NULL,0.003,'kg',0),(3427,441,342,NULL,0.005,'kg',0),(3428,441,487,NULL,0.15,'kg',0),(3429,441,168,NULL,0.12,'kg',0),(3430,441,269,NULL,0.208,'kg',0),(3431,441,78,NULL,0.058,'kg',0),(3432,441,148,NULL,0.182,'kg',0),(3433,442,112,NULL,0.4,'kg',0),(3434,442,106,NULL,0.015,'kg',0),(3435,442,274,NULL,0.02,'litr',0),(3436,442,457,NULL,0.001,'kg',0),(3437,442,348,NULL,0.001,'kg',0),(3438,443,385,NULL,0.15,'kg',0),(3439,443,269,NULL,0.05,'kg',0),(3440,443,63,NULL,0.03,'kg',0),(3441,443,78,NULL,0.02,'kg',0),(3442,443,457,NULL,0.0005,'kg',0),(3443,443,344,NULL,0.0005,'kg',0),(3444,443,502,NULL,0.05,'litr',0),(3445,443,44,NULL,1,'porcji',0),(3446,443,4,NULL,1,'kg',0),(3447,444,489,NULL,1.7,'kg',0),(3448,444,78,NULL,0.5,'kg',0),(3449,444,231,NULL,0.1,'kg',0),(3450,444,457,NULL,0.001,'kg',0),(3451,444,348,NULL,0.004,'kg',0),(3452,444,467,NULL,0.8,'kg',0),(3453,444,253,NULL,2,'kg',0),(3454,444,247,NULL,1.35,'litr',0),(3455,444,274,NULL,0.35,'litr',0),(3456,445,75,NULL,4.5,'kg',0),(3457,445,106,NULL,0.16,'kg',0),(3458,445,343,NULL,0.003,'kg',0),(3459,445,353,NULL,0.003,'kg',0),(3460,445,457,NULL,0.06,'kg',0),(3461,446,254,NULL,1,'kg',0),(3462,446,459,NULL,0.01,'kg',0),(3463,446,283,NULL,0.01,'kg',0),(3464,446,212,NULL,0.01,'kg',0),(3465,446,430,NULL,0.01,'kg',0),(3466,446,429,NULL,0.01,'kg',0),(3467,446,457,NULL,0.02,'kg',0),(3468,446,110,NULL,0.05,'kg',0),(3469,446,292,NULL,0.01,'kg',0),(3470,447,356,NULL,0.35,'kg',0),(3471,447,118,NULL,0.1,'kg',0),(3472,447,489,NULL,0.16,'kg',0),(3473,447,231,NULL,0.01,'kg',0),(3474,447,101,NULL,0.01,'kg',0),(3475,447,457,NULL,0.001,'kg',0),(3476,447,348,NULL,0.002,'kg',0),(3477,447,274,NULL,0.2,'litr',0),(3478,448,502,NULL,0.05,'litr',0),(3479,448,247,NULL,0.02,'litr',0),(3480,448,94,NULL,0.003,'kg',0),(3481,448,508,NULL,0.001,'kg',0),(3482,448,183,NULL,0.01,'kg',0),(3483,448,97,NULL,0.003,'kg',0),(3484,448,55,NULL,0.01,'kg',0),(3485,449,502,NULL,0.04,'litr',0),(3486,449,403,NULL,0.014,'kg',0),(3487,449,88,NULL,0.033,'kg',0),(3488,449,95,NULL,0.003,'kg',0),(3489,449,97,NULL,0.003,'kg',0),(3490,450,502,NULL,1.5,'litr',0),(3491,450,245,NULL,0.5,'kg',0),(3492,450,282,NULL,0.3,'kg',0),(3493,450,325,NULL,0.3,'kg',0),(3494,450,144,NULL,0.25,'kg',0),(3495,450,231,NULL,0.1,'kg',0);
/*!40000 ALTER TABLE `recipe_ingredients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipe_tags`
--

DROP TABLE IF EXISTS `recipe_tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recipe_tags` (
  `recipeId` int(11) NOT NULL,
  `tagId` int(11) NOT NULL,
  PRIMARY KEY (`recipeId`,`tagId`),
  KEY `recipe_tags_tagId_fkey` (`tagId`),
  CONSTRAINT `recipe_tags_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `recipes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `recipe_tags_tagId_fkey` FOREIGN KEY (`tagId`) REFERENCES `tags` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipe_tags`
--

LOCK TABLES `recipe_tags` WRITE;
/*!40000 ALTER TABLE `recipe_tags` DISABLE KEYS */;
/*!40000 ALTER TABLE `recipe_tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipeitem`
--

DROP TABLE IF EXISTS `recipeitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recipeitem` (
  `id` varchar(191) NOT NULL,
  `recipeId` varchar(191) NOT NULL,
  `ingredientId` varchar(191) NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `unit` varchar(191) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `RecipeItem_recipeId_fkey` (`recipeId`),
  KEY `RecipeItem_ingredientId_fkey` (`ingredientId`),
  CONSTRAINT `RecipeItem_ingredientId_fkey` FOREIGN KEY (`ingredientId`) REFERENCES `ingredient` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `RecipeItem_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `recipe` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipeitem`
--

LOCK TABLES `recipeitem` WRITE;
/*!40000 ALTER TABLE `recipeitem` DISABLE KEYS */;
/*!40000 ALTER TABLE `recipeitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recipes`
--

DROP TABLE IF EXISTS `recipes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recipes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recipeNumber` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `basePortions` double NOT NULL DEFAULT 1,
  `portionUnit` varchar(20) NOT NULL DEFAULT 'porcja',
  `status` enum('AKTYWNA','SEZONOWA','TESTOWA','ARCHIWALNA') NOT NULL DEFAULT 'AKTYWNA',
  `notes` text DEFAULT NULL,
  `isArchived` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `recipes_recipeNumber_key` (`recipeNumber`)
) ENGINE=InnoDB AUTO_INCREMENT=1351 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recipes`
--

LOCK TABLES `recipes` WRITE;
/*!40000 ALTER TABLE `recipes` DISABLE KEYS */;
INSERT INTO `recipes` VALUES (1,1,'Przysmak Boryny',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(2,2,'Przysmak Juhasa',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(3,3,'Placek po zbójnicku 2020 karczma',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(4,4,'Schabowy wieprzowy karczma 2020',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(5,5,'Karkówka zestaw Karczma 2020',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(6,6,'Żebro pieczone 2020 karczma',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(7,7,'Kurczak w trzech odsłonach',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(8,9,'Filet z dorsza',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(9,10,'Salatka Szefa',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(10,11,'Żurek w chlebie 2020 karczma',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(11,12,'Kotlet po góralsku',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(12,13,'Grillowana polędwiczka z pure i mizeria 2020 karczma',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(13,15,'.Żurek',133,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(14,16,'Kwaśnica',30,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(15,18,'Sandacz',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(16,19,'Nuggetsy',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(17,21,'Owoce na komunię - 1 patera na 10 osób',10,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(18,22,'.Flaki wołowe',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(19,24,'Tagiatella ze szpinakiem i kurczakiem w sosie śmietanowym',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(20,25,'Frytki',8,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(21,26,'Flaki małe',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(22,27,'Beza karczma 2020 - porcja 2g',40,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(23,28,'Golonka pieczona 2020 karczma',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(24,29,'Puchar lodowy 2020 karczma',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(25,30,'Pierogi z mięsem',18,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(26,31,'Pierogi z kapustą i grzybami',18,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(27,32,'Coca-cola 0,2l',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(28,33,'Naleśniki z wiśniami',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(29,35,'Żywiec z nalewaka 0,5l',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(30,36,'Eb',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(31,37,'Herbata',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(32,38,'Żywiec 0,5l',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(33,39,'Żubrowka but. na imprezę',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(34,40,'Żurek w talerzu 2020 karczma',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(35,42,'Rosół karczma 2020 ze swojskim makaronem',10,'porc','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(36,44,'Warka 0,5l',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(37,46,'Woda n/gaz kropla beskidu 0,33l',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(38,47,'Naleśniki  z twarogiem z sokiem cappy',5,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(39,48,'Sałatka z kurczakiem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(40,49,'Pierniki drobne',140,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(41,50,'Naleśniki z jablakmi',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(42,51,'ŻUREK - receptura na 1l',40,'litr','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(43,52,'Placki ziemniaczane',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(44,53,'Rosół podreceptura - wywar bez makaronu (na 1 litr)',20,'l','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(45,54,'Udko kacze z kopytkami 2020 karczma',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(46,56,'Krem pomidorowy',20,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(47,58,'Góralski przysmak żeberko',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(48,59,'Jabłka z kruszonką',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(49,60,'.Surówka z białej kapusty',100,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(50,61,'surówka z kwaszonej kapusty',15,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(51,62,'.Surówka z selera z prażonym słonecznikiem',48,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(52,63,'surówka z marchwi i ananasa Porcja 150g',30,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(53,64,'.Bulion drobiowo-wołowy z kluseczkami',100,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(54,65,'Sałatka',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(55,72,'Sandacz z warzywami i frytkami',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(56,74,'sandacz z sosem serowym i warzywami',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(57,75,'grzanki z karczochem i owczym serem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(58,76,'deska serów',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(59,77,'deska wędlin',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(60,78,'Grillowany camembert 2020 karczma',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(61,79,'Naleśniki',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(62,80,'Łosoś parowany z fasolką',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(63,82,'.Gołąbki z kaszą i sosem grzybowym',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(64,87,'szarlotka firmowa z lodami',12,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(65,90,'Pierś z kurczaka ze szpinakiem karczma 2020',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(66,92,'pierogi ze szpinakiem',18,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(67,93,'kluski ziemniaczane',4,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(68,94,'Zupa ogórkowa',15,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(69,98,'Polędwiczki grillowane z sosem z zielonego pieprzu',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(70,100,'Knedle z owocami 2020',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(71,101,'.Rosół z makaronem',100,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(72,102,'Farsz szpinakowy',29,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(73,103,'Bitki wieprzowe po polsku',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(74,104,'Duszone roladki z indyka W sosie śmietanowo-serowym 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(75,105,'Faszerowana noga kurczęcia 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(76,106,'Sałatka w koszyczku',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(77,107,'Kieszonka drobiowa faszerowana warzywami 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(78,108,'.Kieszonka wieprzowa faszerowana pieczarkami',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(79,109,'W Kotlet de volaile z serem 2023 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(80,110,'Kotlet de volaile z pieczarkami 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(81,111,'Kotlet de volaile z serem-jednoporcjowo',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(82,112,'.Kotlet mielony',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(83,113,'.Kotlet Schabowy',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(84,114,'Kotlet schabowy-jednoporcjowo',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(85,115,'duszony  indyk z fasolką i kopytkami 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(86,116,'W Pieczeń z karkówki w sosie własnym i kaszą pęczak 2023 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(87,117,'Pieczeń z łopatki',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(88,118,'Rolada wieprzowa faszerowana grzybami leśnymi',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(89,119,'W Rumiane udko z kurczaka 2023 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(90,120,'Zawijaniec drobiowy z serem topionym i wędzonką 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(91,121,'Zawijaniec Wieprzowy',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(92,122,'Zawijańce z suszonymi pomidorami',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(93,123,'.Zraz wieprzowy z boczkiem wędzonym podany z kaszą pęczak',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(94,124,'Zraz wieprzowy z boczkiem-jednoporcjowo',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(95,126,'.Żeberka w kapuście kiszonej',133,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(96,127,'.Eskalop drobiowy w sosie porowym z mini marchewką',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(97,128,'Niedziała',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(98,129,'Imperiale',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(99,130,'Roladki z kurczaka z susz.pomidorem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(100,131,'Schab z kością',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(101,132,'Udko w panierce',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(102,133,'.Udko kacze z żurawiną',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(103,134,'Leczo z klopsikami',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(104,135,'Ziemniaki',1,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(105,136,'Wiosenna',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(106,137,'.Buraczki',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(107,138,'surówka z białej kapusty',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(108,139,'Marche z Groszkiem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(109,140,'Mizeria',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(110,141,'Owoce  2020 wesele - KIELICHY',100,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(111,142,'Lody w formie deseru',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(112,143,'Frytki sami',100,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(113,144,'Deska Wiejskich Przysmaków',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(114,145,'W Golonka w galarecie 2023 wesele',268,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(115,146,'Bruschetta',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(116,147,'Tymbalik drobiowy',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(117,148,'Kąski pstrąga w galarecie 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(118,149,'Klasyczna sałatka jarzynowa',2,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(119,150,'Klopsiki w occie 2020 wesele - 3 klopsiki',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(120,153,'W Pasztet wiejski w asyście żurawiny 2023 wesele',120,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(121,154,'Pieczarka z papryką i ogórkiem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(122,155,'Pieczeń rzymska',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(123,156,'Pstrąg wędzony',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(124,157,'Rolowany śledzik w zalewie octowej',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(125,158,'W Ryba po japońsku 2023 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(126,159,'Sałatka \"Smak lata\"',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(127,160,'Sałatka koktajlowa z krewetkami',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(128,161,'Sałatka rosyjska z tuńczykiem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(129,163,'Sałatka z makaronem tortelini 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(130,164,'W Sałatka z wędzonym kurczakiem 2023',8,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(131,165,'.Pieczony schab w sosie śliwkowym',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(132,166,'śledź po sułtańsku',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(133,167,'Śledź po kaszubsku 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(134,168,'W Śledź w śmietanie z ananasem 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(135,169,'Udko wędzone',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(136,170,'Kakówka ze śliwką',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(137,171,'Schab z suszonymi pomidorami',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(138,172,'Ryba po poznańsku',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(139,173,'Żołądki w glazurze',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(140,174,'Sałatka z piersią na parze \"Ani\"',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(141,175,'Barszcz z pasztecikiem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(142,176,'Krokiet z kapustą i grzybami',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(143,177,'Krokiet z pieczarkami i serem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(144,178,'Duszony filet z indyka z fasolką i kopytkami',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(145,179,'Flaki wołowe',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(146,180,'.Golonka duszona w piwie z kapustą zasmażaną',5,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(147,181,'Kapusta zasmażana 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(148,182,'.Gołąbki mięsne',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(149,183,'Gulasz Węgierski z kaszą',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(150,184,'Karkówka zapiekana serem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(151,185,'Kurczak po chińsku w asyście ryżu',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(152,186,'Leczo w sosie pomidorowym  kiełbaską',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(153,187,'Medaliony z frytkami 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(154,188,'Sosie warzywno-grzybowym',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(155,189,'.Ryba w sosie śmietanowo-pieczarkowym',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(156,190,'Makaron ze szpinakiem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(157,191,'Sakiewki wieprzowe w sosie',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(158,192,'Kluski śląskie',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(159,193,'.Strogonow wieprzowy serwowany z grzankami',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(160,194,'Pieczarka nadziewana mięsem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(161,195,'Bigos 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(162,196,'W Sałatka Grecka 2023',8,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(163,197,'Deska przysmaków (kolorowe rolady)  komunia 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(164,198,'.Zupa gulaszowa na ostro',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(165,199,'Szaszłyk 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(166,200,'Sos tatarski',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(167,201,'Sałatka z ananasem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(168,202,'Pieczywo',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(169,203,'Dekoracja duża',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(170,204,'Dekoracja mała',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(171,205,'Kawa Imprezy',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(172,206,'Herbata imprezy',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(173,207,'Napoje zimne Wesele dwu dniowe',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(174,208,'Napoje zimne na wesele jednodniowe',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(175,209,'Napoje zimne na stypę',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(176,210,'Napoje zimne na imprezę nocną',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(177,211,'Napoje zimne na imprezę dzienną',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(178,213,'Terrina drobiowa 2020 wesele',100,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(179,214,'Karp smażony',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(180,215,'zupa grzybowa',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(181,216,'cycki w majonezie',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(182,217,'stek ze strusia',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(183,218,'pałka z kurczaka w sosie słodko-kwaśnym',4,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(184,219,'terrina z wątróbki 2020 wesele',100,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(185,220,'rolada drobiowa 2020 wesele (cala rolada - 10 porcji)',10,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(186,221,'W Rolada szpinakowa 2020 wesele (cała rolada - 10 porcji)',10,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(187,223,'ryba w sosie greckim',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(188,224,'.Polędwiczki w sosie pieprzowym',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(189,225,'sos ogórkowy',2,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(190,226,'Pomidorowa z makaronem',2,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(191,227,'Gołąbki warzywne',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(192,228,'.Żeberka na słodko lub tradycyjne podane z ziemniakami opiekanymi',111,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(193,229,'Kotlety  warzywny 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(194,230,'.Bukiet warzyw gotowanych z masłem i bułką tartą',100,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(195,231,'kurczak na patyku z frytkami',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(196,232,'półmisek rolad mięsnych (2 plastry rolady, plaster karkówki)',10,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(197,233,'sałatka orzeźwiająca 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(198,234,'W vol-au-vent 2023',100,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(199,235,'mix sałat',100,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(200,236,'tortilla z szynką 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(201,237,'surówka z pekińskiej 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(202,238,'surówka z białej kapusty i czerwonej fasoli 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(203,239,'sałatka z kolorowego makaronu z kurczakiem 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(204,242,'pierś z indyka z migdałąmi',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(205,243,'pólmisek firmowy ( roladki z łososia, rożki,bagietka z pastą jajeczną)',100,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(206,244,'Śledź w oleju z cebulą',10,'szt','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(207,245,'Gołąbki z mięsem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(208,249,'Zupa klopsowa',6,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(209,250,'Noga z gęsi',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(210,251,'pasztecik 2020 wesele',100,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(211,252,'kurczak na patyku',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(212,253,'ryż z warzywami',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(213,254,'panna cotta',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(214,255,'Ciastka maślane',13,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(215,256,'GRILL PROPOZUCJA 1 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(216,257,'Pierniki 200g',9,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(217,259,'tosty z jajkiem sadzonym',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(218,260,'omlet ze szpinakiem i pomidorami i fetą',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(219,261,'naleśnik ze szpinakier zwijany z tawrogiem i papryką',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(220,262,'omlet bananowy z twarogiem i pomarańczami',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(221,263,'Grzaniec biały',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(222,264,'Grzaniec czerwony',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(223,265,'Caprese z sosem rucolowym',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(224,266,'ziemniaki opiekane',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(225,267,'Placki ziemniaczane z łososiem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(226,268,'herbata Pallavi',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(227,269,'Sandacz soute z kaszą jęczmienną/ pęczak',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(228,270,'Smalec na karczme 2020',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(229,271,'Herbata zimowa',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(230,272,'Pieczywo',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(231,273,'Fasolka  Puerto Rico',6,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(232,274,'kopytka ze szpinakiem',4,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(233,275,'słonecznik w karmelu',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(234,276,'klopsiki ze szpinakiem nie panierowane',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(235,277,'klopsiki ze szpinakiem panierowane',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(236,278,'zupa meksykańska',6,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(237,279,'Zupa fasolowa',6,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(238,280,'pieczone jabłko',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(239,281,'Sos Vinegret 2020',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(240,282,'Kapusta zasmażana do golonki 2020',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(241,283,'Pałka z kurczaka z farszem z mięsa mielonego i papryki 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(242,284,'.Mix pierogów z okrasą',100,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(243,285,'Udka słodko-kwaśne 2020 wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(244,286,'sałatka z ryżem i ananasem',30,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(245,287,'kotlet schabowy',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(246,288,'Mus chałwowy',65,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(247,289,'Orzechowiec 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(248,290,'czarny las 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(249,291,'Sernik  królewski',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(250,292,'Krówka tofi 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(251,293,'Ananasek 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(252,294,'sernik złota rosa 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(253,295,'szarlotka 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(254,296,'szarlotka z brzoskwiniami 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(255,297,'rafaello 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(256,298,'3 bit 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(257,299,'capuccino 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(258,300,'Cycki murzynki 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(259,301,'Słonecznikowiec 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(260,302,'porzeczkowiec 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(261,303,'Leśny mech',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(262,304,'Maxi king',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(263,305,'Tiramisu',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(264,306,'cytrynowiec',24,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(265,307,'Cytrynowiec 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(266,308,'góra lodowa 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(267,309,'Ciasto czekoladowe z białym musem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(268,310,'Oczy carycy',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(269,311,'ciasto z marzunkami',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(270,312,'Ciasteczkowy potwór',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(271,313,'ciasto truskawkowe z galaretką',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(272,314,'ciasto malinowe z galaretką',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(273,315,'ciasto papieskie 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(274,316,'Oreo',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(275,317,'sernik na zimno z herbatnikami 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(276,318,'makowiec',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(277,319,'królowa śniegu 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(278,320,'kostka hiszpańska',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(279,321,'malinowa chmurka 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(280,322,'Bananowa chmurka',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(281,323,'Koktajl truskawkowy karczma 2020 porcja - 200 ml',25,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(282,324,'Chłodnik karczma 2020 - porcja 300ml',20,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(283,325,'.Sandacz w sosie koperkowym',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(284,326,'Sos koperkowy (porcja 40g)',10,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(285,327,'Dorsz w sosie koperkowym wesele 2022',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(286,328,'W Fasolka z masłem  i bulką tartą 2023',1,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(287,329,'W Udko z serem camembert i śliwką wesele',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(288,330,'Tatarki z łososia',40,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(289,331,'W Tatarki wołowe',40,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(290,332,'Sałatki w ambuszkach 3 sposoby - po 100g',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(291,333,'Koperta z ciasta francuskiego z pomidorami suszonymi 1 szt',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(292,334,'Koperty z ciasta francuskiego ze szpinakiem - 1 szt',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(293,335,'.Kotlet drobiowy z mozzarellą',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(294,336,'Cukinia faszerowana mięsem mielonym z sosem czosnkowym 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(295,337,'Koreczki 1 szt',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(296,338,'Sałatka jarzynowa w słonej babeczce 1 szt',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(297,339,'.Filet z pstrąga podany na puree chrzanowym',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(298,340,'Puree pietruszkowe-chrzanowe karczma 2022 (porcja 300g)',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(299,341,'W Łosoś w cieście francuskim wesele 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(300,342,'w Sałatka Cezar wesele 2023',8,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(301,343,'Sałatka z wędzonym kurczakiem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(302,344,'.Rolada z indyka w tymianku',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(303,345,'Spaghetti 2022',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(304,346,'Mini burger 2022',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(305,347,'Krem z pora z grzanką wesele 2022',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(306,348,'.Rulon drobiowy nadziewany szpinakiem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(307,349,'.Polędwiczki drobiowe w sosie śmietanowo - ziołowym',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(308,350,'Tymbaliki z łososiem wesele 2022',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(309,351,'Babeczka na słono z ryba wedzona komunia 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(310,352,'Babeczka na słono z pasta paprykowa komunia  2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(311,353,'Sernik z wiśniami 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(312,355,'Pierogi z kaczką karczma 2020 - sztuka',144,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(313,356,'pierogi ze szczupakiem',18,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(314,357,'pierpgi ze szczupakiem',18,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(315,358,'pierogi z kaszą',150,'szt','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(316,359,'Pierogi pieczone z kaczką',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(317,360,'Pierogi pieczone z gyrosem',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(318,361,'pierogi pieczone ze szpinakiem',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(319,362,'cebularze',8,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(320,363,'pierogi leniwe',8,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(321,364,'.Pierś z kurczaka faszerowana fetą i szpinakiem na sosie szpinakowym z ryżem',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(322,365,'Deska naszych przysmaków 2024 Wesele',8,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(323,366,'Filet drobiowy panierowany karczma 2020',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(324,367,'sałatka z grillowanym kurczakiem 2020 karczma',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(325,368,'Mus z malin karczma 2020 1 litr',20,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(326,369,'Sernik wiedeński',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(327,370,'Pychotka 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(328,371,'Makaron Domowy porcja 100g karczma 2020',30,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(329,372,'Szarlotka na catering 2020',12,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(330,373,'Gałka lodów śmietankowych zielona budka',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(331,374,'W Mini tortilla z łososiem 2023 wesele (1 tortilla = 8 porcji)',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(332,375,'Pasztet z Karkówki mielonej - SŁOIK 150g',19,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(333,376,'Jajecznica z 3 jaj na maśle Karczma 2020',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(334,377,'Puree ziemniaczane karczma 2020 porcja 110g',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(335,378,'Pierś grillowana dla dzieci karczma 2020',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(336,379,'okrasa do pierogów karczma 2020 porcja 30 g',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(337,380,'Szczawiowa karczma 2020 - receptura porcje 300 ml z jajkiem',26,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(338,381,'Talerz ziemniaków z jajkiem Karczma 2020 -',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(339,382,'Deska serów (1 na 8 osób) 2022',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(340,383,'Deska mięs (1 na 8 osób) 2022',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(341,384,'Schab ze śliwką 2022',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(342,385,'Karkówka 1 plaster 2022',4,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(343,386,'Łazanki (porcja 200g)',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(344,387,'Wyroby rolad (karkówka, schab ze śliwką, rolada drobiowa) wesele 2022',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(345,388,'Rulon w szynce parmeńskiej 2022',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(346,389,'Bagietka z pastą paprykową',15,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(347,390,'Bagietka z pastą jajeczną',33,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(348,391,'Krem z cukini z chipsem z szynki',7,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(349,393,'SURÓWKA COLESŁAW  2024',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(350,394,'.Pierś otulona boczkiem podana na cukinii z marchewką',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(351,395,'W Koreczki capresse',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(352,396,'Panierowany rulon nadziewany porem i gorgonzolą 2024',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(353,398,'Grill propozycja 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(354,399,'ogórek małosolny 2024',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(355,400,'Zupa krem z białych warzyw  2024',20,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(356,401,'Zupa rybna (porcja 300ml)',66.5,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(357,402,'Tartinka',10,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(358,403,'Kwaśnica słoik 2020',15,'słoików','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(359,404,'Buraczkowa słoik 2020',13,'słoików','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(360,405,'Zupa jarzynowa słoik 2020',13,'SŁOIKÓW','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(361,406,'Gulasz karczma 2020 - porcja 250 g + 150g kaszy',14,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(362,407,'Faworki karczma 2020',120,'szt','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(363,408,'Gruszka w sosie karmelowym Karczma 2020',1,'szt','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(364,409,'Zupa krem z dyni Karczma 2020 porcja 250 ml',36,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(365,410,'Sałatka z pieczonego buraka z kozim serem Karczma 2020',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(366,411,'Sos do sałatki z buraka 1l',1,'l','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(367,412,'Sos słodko-kwaśny słoik 0,4 2020',16,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(368,413,'Sos do spaghetti wege 2020 słoik 0,4',16,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(369,414,'Sałatka z makaronem ryżowym i grillowanym kurczakiem 2020',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(370,415,'Czekolada do picia 2020',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(371,416,'Pierogi z twarogiem karczma 2020 - sztuka',70,'szt','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(372,417,'Ziemniaki zapiekane z rozmarynem Karczma 2020 - porcja 250g',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(373,418,'Krem brokułowy + chips',2,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(374,419,'Kartacze z mięsem karczma 2021 (porcja - 2 kartacze)',15,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(375,420,'Deser mus z malin, z bitą śmietaną i mascarpone z pistacjami Walentynki 2021',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(376,422,'Sałatka szpinakowa walentynki 2021',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(377,423,'Makaron penne z boczkiem karczma 2021',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(378,424,'Gulasz słoik 2021 0,7l',1,'szt','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(379,425,'Szarlotka 2021 - 1 porcja (samo ciasto)',24,'porcje','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(380,426,'Lemoniada 2021 - szklanka ok 220',5,'szklanek','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(381,427,'W Farsz szpinakowy',29,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(382,431,'Lody 3 rodzaje',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(383,437,'BROWNIE 2024',36,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(384,438,'Owoce komunia 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(385,439,'Węgorz wędzony 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(386,468,'.Krem z pora z grzankami czosnkowymi',17,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(387,469,'Tartinki 2023',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(388,501,'Ogórek małosolny słoik [receptura na 1kg (słoik 0,7-1,97zł)]',5,'kg','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(389,502,'Udko kacze z ziemniakami zasmażanymi karczma 2021',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(390,503,'Fileciki panierowane dla dzieci 2023',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(391,504,'Deser Bezowo-malinowy karczma 2021',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(392,505,'Sałatka owocowa 2021',6.6,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(393,513,'Deser Leśny mech 2023',30,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(394,514,'DESER MANGO 2023',30,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(395,515,'Eklerki 2023',16,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(396,534,'GRILL PROPOZYCJA 1',1,'os','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(397,556,'Coleslaw',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(398,558,'2024 Tartinki',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(399,601,'Botwinka 2020 słoik 0,7',15,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(400,602,'Kompot z rabarbaru 2020 słik 0,7',15,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(401,951,'Karkówka mielona słoik',19,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(402,952,'Karkówka w sosie słoik',3,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(403,953,'Zupa klopsowa słoik 2020 - porcja 700 ml',14,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(404,954,'Krem z białych warzyw  2024',20,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(405,955,'Winegret ogórkowy',5,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(406,956,'Winegret klasyczny',7,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(407,957,'Hummus z ciecierzycy',13,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(408,958,'Bigos słoik',6,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(409,959,'Ćwikła z chrzanem słoik',10,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(410,960,'Smalec słoik 100ml',18,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(411,961,'Kiełbasa słoik - porcja 300 ml',11,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(412,962,'Galaretka wieprzowa słoik',16,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(413,963,'Klopsiki w sosie pomidorowym słoik',9,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(414,964,'Fasolka po bretońsku słoik',23,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(415,965,'Sos do spaghetti słoik',8,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(416,966,'Zupa grochowa słoik 2020 - porcja 700ml',14,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(417,967,'Zupa fasolowa - słoik 2020 - 700ml porcja',20,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(418,968,'Leczo wege słoik',5,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(419,969,'Kopytka ze szpinakiem i sosem gorgonzola',12,'porcji','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(420,970,'Wywar słoik',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(421,971,'Pomidorowa słoik 2020 - 700 ml porcja',8,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(422,972,'Grzybowa słoik',8,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(423,973,'Zupa warzywna z pulpetami Karczma 2020',6,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(424,974,'Ogórkowa słoik 2020 - 700ml porcja',6,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(425,975,'Krupnik słoik',6,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(426,976,'Kapuśniak słoik',8,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(427,977,'Żurek słoik',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(428,978,'Zraz 4 szt w słoiku',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(429,979,'Kaczka 2 szt w słoiku',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(430,980,'Szynka z liściem 0,5kg',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(431,981,'W Owoce 2023 komunia - na 1 osobę',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(432,982,'Udko z serem camembert i śliwką wesele 2021',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(433,983,'Schabowy zestaw',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(434,984,'Karkowka z ziemniakami i buraczkami',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(435,985,'Schabowy drobiowy z pekińską',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(436,986,'Devolay z ziemniakami i surówką',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(437,987,'Pierogi leniwe 12szt.',2,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(438,988,'Pierogi ze szpinakiem karczma 2020 - sztuka',120,'szt','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(439,989,'Pierogi z mięsem karczma 2020 - sztuka',420,'szt','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(440,990,'Pierogi z kapustą i grzybami karczma 2020 - sztuka',140,'szt','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(441,991,'Gulasz wieprzowy z kaszą i sałatką karczma 2020',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(442,992,'Wegański smalec z fasoli słoik',3,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(443,993,'Zraz wieprzowy zestaw 2020 karczma',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(444,994,'Pierogi ruskie karczma 2020 - sztuka',140,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(445,995,'Zakwas buraczany słoik',11,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(446,996,'Swojski chleb 2020 (blaszka)',14,'kromek','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(447,997,'Pstrąg z patelni karczma 2020',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(448,998,'Deser panna cotta 2021',3,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(449,999,'Deser oreo 2021',1,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000'),(450,1000,'Deser z karmelem 2023',30,'porcja','AKTYWNA',NULL,0,'2026-03-04 10:59:58.000','2026-03-04 10:59:58.000');
/*!40000 ALTER TABLE `recipes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reservation`
--

DROP TABLE IF EXISTS `reservation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reservation` (
  `id` varchar(191) NOT NULL,
  `roomId` varchar(191) NOT NULL,
  `tableId` varchar(191) DEFAULT NULL,
  `date` date NOT NULL,
  `timeFrom` datetime(3) NOT NULL,
  `timeTo` datetime(3) DEFAULT NULL,
  `guestName` varchar(191) NOT NULL,
  `guestPhone` varchar(191) DEFAULT NULL,
  `guestEmail` varchar(191) DEFAULT NULL,
  `guestCount` int(11) NOT NULL,
  `type` enum('TABLE','BANQUET') NOT NULL DEFAULT 'TABLE',
  `notes` varchar(191) DEFAULT NULL,
  `status` enum('PENDING','CONFIRMED','CANCELLED','NO_SHOW','COMPLETED') NOT NULL DEFAULT 'PENDING',
  `source` enum('PHONE','ONLINE','WALK_IN') NOT NULL DEFAULT 'PHONE',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `Reservation_roomId_fkey` (`roomId`),
  KEY `Reservation_tableId_fkey` (`tableId`),
  CONSTRAINT `Reservation_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `Reservation_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `table` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reservation`
--

LOCK TABLES `reservation` WRITE;
/*!40000 ALTER TABLE `reservation` DISABLE KEYS */;
/*!40000 ALTER TABLE `reservation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role`
--

DROP TABLE IF EXISTS `role`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`permissions`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `Role_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role`
--

LOCK TABLES `role` WRITE;
/*!40000 ALTER TABLE `role` DISABLE KEYS */;
INSERT INTO `role` VALUES ('cmlw9tjp80000v8vz79cu9fol','ADMIN','[\"order.create\",\"order.edit_sent\",\"order.cancel\",\"order.storno\",\"order.discount_small\",\"order.discount_large\",\"order.transfer_table\",\"payment.close\",\"payment.refund\",\"invoice.create\",\"invoice.advance\",\"invoice.correct\",\"report.own_shift\",\"report.all\",\"warehouse.manage\",\"config.manage\",\"cash_drawer.open_manual\",\"audit.view\",\"banquet.manage\",\"banquet.add_extras\"]'),('cmlw9tjph0001v8vzyhe8qjm7','WAITER','[\"order.create\",\"order.discount_small\",\"order.transfer_table\",\"payment.close\",\"invoice.create\",\"report.own_shift\",\"banquet.add_extras\"]'),('cmmc5lmcf0000vcvzvwkz6kiv','SZEF_KUCHNI','[]');
/*!40000 ALTER TABLE `role` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `room`
--

DROP TABLE IF EXISTS `room`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `room` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `capacity` int(11) NOT NULL,
  `type` enum('RESTAURANT','BANQUET','OUTDOOR','PRIVATE') NOT NULL,
  `isSeasonal` tinyint(1) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `canMergeWith` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`canMergeWith`)),
  `layoutJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`layoutJson`)),
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `backgroundImage` varchar(191) DEFAULT NULL,
  `backgroundOpacity` double NOT NULL DEFAULT 1,
  `decorElements` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`decorElements`)),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `room`
--

LOCK TABLES `room` WRITE;
/*!40000 ALTER TABLE `room` DISABLE KEYS */;
INSERT INTO `room` VALUES ('cmlwksy2x000050vzltc00c8s','Restauracja',100,'RESTAURANT',0,1,'[]',NULL,1,NULL,1,'[]'),('cmlwksy32000150vzt22fufbm','Sala Złota',150,'BANQUET',0,1,'[\"cmlwksy2x000050vzltc00c8s\"]',NULL,2,NULL,1,'[]'),('cmlwksy37000250vzp52de1n2','Sala Diamentowa',150,'BANQUET',0,1,'[]',NULL,3,NULL,1,'[]'),('cmlwksy3c000350vzhknqphh9','Wiata',100,'OUTDOOR',1,1,'[]',NULL,4,NULL,1,'[]'),('cmlwksy3i000450vzmzszvxzh','Pokój 10',25,'PRIVATE',0,1,'[]',NULL,5,NULL,1,'[]');
/*!40000 ALTER TABLE `room` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roommerge`
--

DROP TABLE IF EXISTS `roommerge`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roommerge` (
  `id` varchar(191) NOT NULL,
  `roomIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`roomIds`)),
  `mergedName` varchar(191) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `activeFrom` datetime(3) NOT NULL,
  `activeTo` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roommerge`
--

LOCK TABLES `roommerge` WRITE;
/*!40000 ALTER TABLE `roommerge` DISABLE KEYS */;
/*!40000 ALTER TABLE `roommerge` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `setcomponent`
--

DROP TABLE IF EXISTS `setcomponent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `setcomponent` (
  `id` varchar(191) NOT NULL,
  `setId` varchar(191) NOT NULL,
  `componentId` varchar(191) NOT NULL,
  `quantity` decimal(10,3) NOT NULL DEFAULT 1.000,
  `isRequired` tinyint(1) NOT NULL DEFAULT 0,
  `isDefault` tinyint(1) NOT NULL DEFAULT 1,
  `priceDelta` decimal(10,2) NOT NULL DEFAULT 0.00,
  `sortOrder` int(11) NOT NULL DEFAULT 0,
  `isHidden` tinyint(1) NOT NULL DEFAULT 0,
  `noPrintKitchen` tinyint(1) NOT NULL DEFAULT 0,
  `printWithMinus` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SetComponent_setId_componentId_key` (`setId`,`componentId`),
  KEY `SetComponent_setId_idx` (`setId`),
  KEY `SetComponent_componentId_fkey` (`componentId`),
  CONSTRAINT `SetComponent_componentId_fkey` FOREIGN KEY (`componentId`) REFERENCES `product` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `SetComponent_setId_fkey` FOREIGN KEY (`setId`) REFERENCES `product` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `setcomponent`
--

LOCK TABLES `setcomponent` WRITE;
/*!40000 ALTER TABLE `setcomponent` DISABLE KEYS */;
/*!40000 ALTER TABLE `setcomponent` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shift`
--

DROP TABLE IF EXISTS `shift`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shift` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `startedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `endedAt` datetime(3) DEFAULT NULL,
  `cashStart` decimal(10,2) NOT NULL DEFAULT 0.00,
  `cashEnd` decimal(10,2) DEFAULT NULL,
  `status` enum('OPEN','CLOSED') NOT NULL DEFAULT 'OPEN',
  PRIMARY KEY (`id`),
  KEY `Shift_userId_status_idx` (`userId`,`status`),
  KEY `Shift_startedAt_idx` (`startedAt`),
  CONSTRAINT `Shift_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shift`
--

LOCK TABLES `shift` WRITE;
/*!40000 ALTER TABLE `shift` DISABLE KEYS */;
INSERT INTO `shift` VALUES ('cmlwksyn8001i50vztw09aer4','cmlw9tjuk0003v8vzm90mbgpw','2026-02-21 17:11:40.387',NULL,500.00,NULL,'OPEN');
/*!40000 ALTER TABLE `shift` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shiftswaprequest`
--

DROP TABLE IF EXISTS `shiftswaprequest`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shiftswaprequest` (
  `id` varchar(191) NOT NULL,
  `requesterId` varchar(191) NOT NULL,
  `targetId` varchar(191) NOT NULL,
  `date` date NOT NULL,
  `status` enum('PENDING','ACCEPTED','REJECTED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `reason` varchar(191) DEFAULT NULL,
  `respondedAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `ShiftSwapRequest_requesterId_fkey` (`requesterId`),
  KEY `ShiftSwapRequest_targetId_fkey` (`targetId`),
  CONSTRAINT `ShiftSwapRequest_requesterId_fkey` FOREIGN KEY (`requesterId`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `ShiftSwapRequest_targetId_fkey` FOREIGN KEY (`targetId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shiftswaprequest`
--

LOCK TABLES `shiftswaprequest` WRITE;
/*!40000 ALTER TABLE `shiftswaprequest` DISABLE KEYS */;
/*!40000 ALTER TABLE `shiftswaprequest` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staffavailability`
--

DROP TABLE IF EXISTS `staffavailability`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `staffavailability` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `date` date NOT NULL,
  `available` tinyint(1) NOT NULL DEFAULT 1,
  `timeFrom` varchar(191) DEFAULT NULL,
  `timeTo` varchar(191) DEFAULT NULL,
  `note` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `StaffAvailability_userId_date_key` (`userId`,`date`),
  CONSTRAINT `StaffAvailability_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staffavailability`
--

LOCK TABLES `staffavailability` WRITE;
/*!40000 ALTER TABLE `staffavailability` DISABLE KEYS */;
/*!40000 ALTER TABLE `staffavailability` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_minimums`
--

DROP TABLE IF EXISTS `stock_minimums`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_minimums` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `productId` int(11) NOT NULL,
  `minimum` double NOT NULL,
  `unit` varchar(20) NOT NULL,
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_minimums_productId_key` (`productId`),
  CONSTRAINT `stock_minimums_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_minimums`
--

LOCK TABLES `stock_minimums` WRITE;
/*!40000 ALTER TABLE `stock_minimums` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_minimums` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stockitem`
--

DROP TABLE IF EXISTS `stockitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stockitem` (
  `id` varchar(191) NOT NULL,
  `warehouseId` varchar(191) NOT NULL,
  `ingredientId` varchar(191) NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `unit` varchar(191) NOT NULL,
  `minQuantity` decimal(10,3) NOT NULL DEFAULT 0.000,
  `lastDeliveryPrice` decimal(10,2) DEFAULT NULL,
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `StockItem_warehouseId_ingredientId_key` (`warehouseId`,`ingredientId`),
  KEY `StockItem_ingredientId_fkey` (`ingredientId`),
  CONSTRAINT `StockItem_ingredientId_fkey` FOREIGN KEY (`ingredientId`) REFERENCES `ingredient` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `StockItem_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouse` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stockitem`
--

LOCK TABLES `stockitem` WRITE;
/*!40000 ALTER TABLE `stockitem` DISABLE KEYS */;
INSERT INTO `stockitem` VALUES ('cmlw9tkf4002xv8vzw9sj9xqh','cmlw9tke1002ov8vz7g736nkz','cmlw9tkei002sv8vzmkikstoj',10.000,'kg',5.000,NULL,'2026-02-21 12:04:12.831'),('cmlw9tkf8002yv8vzu32e4eow','cmlw9tke1002ov8vz7g736nkz','cmlw9tkem002tv8vzrrkwu7gp',50.000,'kg',20.000,NULL,'2026-02-21 12:04:12.835'),('cmlw9tkfd002zv8vzm53v1j7i','cmlw9tke1002ov8vz7g736nkz','cmlw9tkep002uv8vzwowu4iy6',2.000,'kg',1.000,NULL,'2026-02-21 12:04:12.840'),('cmlw9tkfi0030v8vz3md7n0rn','cmlw9tke1002ov8vz7g736nkz','cmlw9tkes002vv8vz0ar0so3h',5.000,'l',2.000,NULL,'2026-02-21 12:04:12.845'),('cmlw9tkfm0031v8vz69nu71b5','cmlw9tke1002ov8vz7g736nkz','cmlw9tkew002wv8vzl3sndxbo',100.000,'szt',24.000,NULL,'2026-02-21 12:04:12.850');
/*!40000 ALTER TABLE `stockitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stockmove`
--

DROP TABLE IF EXISTS `stockmove`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stockmove` (
  `id` varchar(191) NOT NULL,
  `type` enum('PZ','WZ','RW','MM','INV') NOT NULL,
  `documentNumber` varchar(191) DEFAULT NULL,
  `warehouseFromId` varchar(191) DEFAULT NULL,
  `warehouseToId` varchar(191) DEFAULT NULL,
  `itemsJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`itemsJson`)),
  `note` varchar(191) DEFAULT NULL,
  `userId` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `StockMove_warehouseFromId_fkey` (`warehouseFromId`),
  KEY `StockMove_warehouseToId_fkey` (`warehouseToId`),
  CONSTRAINT `StockMove_warehouseFromId_fkey` FOREIGN KEY (`warehouseFromId`) REFERENCES `warehouse` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `StockMove_warehouseToId_fkey` FOREIGN KEY (`warehouseToId`) REFERENCES `warehouse` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stockmove`
--

LOCK TABLES `stockmove` WRITE;
/*!40000 ALTER TABLE `stockmove` DISABLE KEYS */;
/*!40000 ALTER TABLE `stockmove` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supergroup`
--

DROP TABLE IF EXISTS `supergroup`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `supergroup` (
  `id` varchar(191) NOT NULL,
  `number` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `categoryIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`categoryIds`)),
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `SuperGroup_number_key` (`number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supergroup`
--

LOCK TABLES `supergroup` WRITE;
/*!40000 ALTER TABLE `supergroup` DISABLE KEYS */;
/*!40000 ALTER TABLE `supergroup` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `synclog`
--

DROP TABLE IF EXISTS `synclog`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `synclog` (
  `id` varchar(191) NOT NULL,
  `operationId` varchar(191) NOT NULL,
  `table` varchar(191) NOT NULL,
  `localId` varchar(191) NOT NULL,
  `serverId` varchar(191) DEFAULT NULL,
  `serverVersion` int(11) DEFAULT NULL,
  `success` tinyint(1) NOT NULL,
  `processedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `SyncLog_operationId_key` (`operationId`),
  KEY `SyncLog_operationId_idx` (`operationId`),
  KEY `SyncLog_processedAt_idx` (`processedAt`),
  KEY `SyncLog_localId_table_idx` (`localId`,`table`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `synclog`
--

LOCK TABLES `synclog` WRITE;
/*!40000 ALTER TABLE `synclog` DISABLE KEYS */;
/*!40000 ALTER TABLE `synclog` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `systemconfig`
--

DROP TABLE IF EXISTS `systemconfig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `systemconfig` (
  `id` varchar(191) NOT NULL,
  `key` varchar(191) NOT NULL,
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`value`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `SystemConfig_key_key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `systemconfig`
--

LOCK TABLES `systemconfig` WRITE;
/*!40000 ALTER TABLE `systemconfig` DISABLE KEYS */;
INSERT INTO `systemconfig` VALUES ('33cb6f70-e321-4853-93f5-6b1f266a90f8','hotel_integration','{\"enabled\":true,\"baseUrl\":\"http://127.0.0.1:3000\",\"apiKey\":\"a89f3281-8ae4-4c06-a351-987b35caa4f\"}'),('cmlw9tkhh0035v8vztdjhnn5t','companyName','\"Karczma Łabędź\"'),('cmlw9tkhl0036v8vzahrnyqbt','sessionTimeoutMinutes','5'),('cmlw9tkhp0037v8vzk5elf3jg','discountThresholdPercent','10'),('cmlw9tkht0038v8vzj4bolfp0','kdsServedRetentionMinutes','30'),('cmlw9tkhx0039v8vzto6k1vyk','kdsAlarmAfterMinutes','20');
/*!40000 ALTER TABLE `systemconfig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `table`
--

DROP TABLE IF EXISTS `table`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `table` (
  `id` varchar(191) NOT NULL,
  `roomId` varchar(191) NOT NULL,
  `number` int(11) NOT NULL,
  `seats` int(11) NOT NULL,
  `positionX` double NOT NULL DEFAULT 0,
  `positionY` double NOT NULL DEFAULT 0,
  `shape` enum('RECTANGLE','ROUND','LONG') NOT NULL DEFAULT 'RECTANGLE',
  `status` enum('FREE','OCCUPIED','BILL_REQUESTED','RESERVED','BANQUET_MODE','INACTIVE') NOT NULL DEFAULT 'FREE',
  `assignedUser` varchar(191) DEFAULT NULL,
  `needsAttention` tinyint(1) NOT NULL DEFAULT 0,
  `allowMultipleOrders` tinyint(1) NOT NULL DEFAULT 0,
  `customColor` varchar(191) DEFAULT NULL,
  `description` varchar(191) DEFAULT NULL,
  `height` double NOT NULL DEFAULT 80,
  `isAvailable` tinyint(1) NOT NULL DEFAULT 1,
  `rotation` int(11) NOT NULL DEFAULT 0,
  `width` double NOT NULL DEFAULT 80,
  `zIndex` int(11) NOT NULL DEFAULT 0,
  `qrId` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Table_qrId_key` (`qrId`),
  KEY `Table_roomId_status_idx` (`roomId`,`status`),
  CONSTRAINT `Table_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `room` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `table`
--

LOCK TABLES `table` WRITE;
/*!40000 ALTER TABLE `table` DISABLE KEYS */;
INSERT INTO `table` VALUES ('cmlwksy3v000550vzzhvbyjey','cmlwksy2x000050vzltc00c8s',1,4,0,0,'RECTANGLE','FREE','cmlw9tjse0002v8vzu0cr8wlr',0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy40000650vzb3qzfrb8','cmlwksy2x000050vzltc00c8s',2,4,0,0,'RECTANGLE','FREE','cmlw9tjse0002v8vzu0cr8wlr',0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy44000750vzoutnwolj','cmlwksy2x000050vzltc00c8s',3,4,0,0,'RECTANGLE','FREE','cmlw9tjuk0003v8vzm90mbgpw',0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy4a000850vzrolh31dr','cmlwksy2x000050vzltc00c8s',4,4,0,0,'RECTANGLE','FREE','cmlw9tjse0002v8vzu0cr8wlr',0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy4f000950vziw227q0y','cmlwksy2x000050vzltc00c8s',5,6,0,0,'RECTANGLE','FREE','cmlw9tjuk0003v8vzm90mbgpw',0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy4k000a50vzajzwbrwl','cmlwksy2x000050vzltc00c8s',6,6,0,0,'RECTANGLE','FREE','cmlw9tjuk0003v8vzm90mbgpw',0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy4q000b50vzbs71mhow','cmlwksy2x000050vzltc00c8s',7,6,0,0,'RECTANGLE','FREE','cmlw9tjse0002v8vzu0cr8wlr',0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy4v000c50vzwsjiy9cc','cmlwksy2x000050vzltc00c8s',8,6,0,0,'RECTANGLE','FREE','cmlw9tjse0002v8vzu0cr8wlr',0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy4z000d50vzwoffibas','cmlwksy2x000050vzltc00c8s',9,6,0,0,'RECTANGLE','FREE','cmlw9tjse0002v8vzu0cr8wlr',0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy54000e50vz4nhozsph','cmlwksy2x000050vzltc00c8s',10,6,0,0,'RECTANGLE','FREE','cmlw9tjse0002v8vzu0cr8wlr',0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy57000f50vzv6q63fyb','cmlwksy2x000050vzltc00c8s',11,6,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy5b000g50vzbq244ms6','cmlwksy2x000050vzltc00c8s',12,6,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy5f000h50vzej2bj1h8','cmlwksy2x000050vzltc00c8s',13,6,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy5j000i50vz7czosrdp','cmlwksy2x000050vzltc00c8s',14,6,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy5n000j50vzaobvcfv9','cmlwksy2x000050vzltc00c8s',15,6,0,0,'RECTANGLE','FREE','cmlw9tjuk0003v8vzm90mbgpw',0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy5s000k50vz4k4vqeva','cmlwksy32000150vzt22fufbm',1,4,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy5x000l50vz5wbcpus0','cmlwksy32000150vzt22fufbm',2,4,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy62000m50vzyqzqjk32','cmlwksy32000150vzt22fufbm',3,4,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy66000n50vzm3qeq1jh','cmlwksy32000150vzt22fufbm',4,4,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy6a000o50vzcpqhfoos','cmlwksy32000150vzt22fufbm',5,6,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy6d000p50vzfea77day','cmlwksy32000150vzt22fufbm',6,6,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy6h000q50vzflzrj7pw','cmlwksy32000150vzt22fufbm',7,6,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy6k000r50vzf1brnllv','cmlwksy32000150vzt22fufbm',8,6,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy6p000s50vzhwn2v4e1','cmlwksy32000150vzt22fufbm',9,6,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy6s000t50vzo7qtsfw1','cmlwksy32000150vzt22fufbm',10,6,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy6w000u50vz74sky6x4','cmlwksy3c000350vzhknqphh9',1,4,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy70000v50vzsw664nov','cmlwksy3c000350vzhknqphh9',2,4,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy73000w50vzpaekg7ik','cmlwksy3c000350vzhknqphh9',3,4,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy77000x50vzol29howj','cmlwksy3c000350vzhknqphh9',4,4,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy7a000y50vzlfkeedjs','cmlwksy3c000350vzhknqphh9',5,6,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy7d000z50vzkqcgfilt','cmlwksy3c000350vzhknqphh9',6,6,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy7g001050vze2cc4rz5','cmlwksy3c000350vzhknqphh9',7,6,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL),('cmlwksy7k001150vzxug5rja6','cmlwksy3c000350vzhknqphh9',8,6,0,0,'RECTANGLE','FREE',NULL,0,0,NULL,NULL,80,1,0,80,0,NULL);
/*!40000 ALTER TABLE `table` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tags`
--

DROP TABLE IF EXISTS `tags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tags` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `color` varchar(7) NOT NULL DEFAULT '#6B7280',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `tags_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tags`
--

LOCK TABLES `tags` WRITE;
/*!40000 ALTER TABLE `tags` DISABLE KEYS */;
INSERT INTO `tags` VALUES (1,'Imprezy','#c1951a','2026-03-04 11:51:27.958'),(2,'Restauracja','#9c1672','2026-03-04 11:52:24.020');
/*!40000 ALTER TABLE `tags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `taxrate`
--

DROP TABLE IF EXISTS `taxrate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `taxrate` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `ratePercent` decimal(5,2) NOT NULL,
  `fiscalSymbol` varchar(191) NOT NULL,
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `taxrate`
--

LOCK TABLES `taxrate` WRITE;
/*!40000 ALTER TABLE `taxrate` DISABLE KEYS */;
INSERT INTO `taxrate` VALUES ('cmlw9tk0n0007v8vzhe0i4po0','VAT 23%',23.00,'A',0),('cmlw9tk0s0008v8vzb6x32a65','VAT 8%',8.00,'B',1),('cmlw9tk0w0009v8vz5eerjshm','VAT 5%',5.00,'C',0),('cmlw9tk11000av8vzh1re12ed','VAT 0%',0.00,'D',0),('cmlw9tk16000bv8vz8s7evthi','Zw.',0.00,'E',0);
/*!40000 ALTER TABLE `taxrate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timeentry`
--

DROP TABLE IF EXISTS `timeentry`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `timeentry` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `clockIn` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `clockOut` datetime(3) DEFAULT NULL,
  `breakMin` int(11) NOT NULL DEFAULT 0,
  `note` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `TimeEntry_userId_fkey` (`userId`),
  CONSTRAINT `TimeEntry_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timeentry`
--

LOCK TABLES `timeentry` WRITE;
/*!40000 ALTER TABLE `timeentry` DISABLE KEYS */;
/*!40000 ALTER TABLE `timeentry` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tip`
--

DROP TABLE IF EXISTS `tip`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tip` (
  `id` varchar(191) NOT NULL,
  `orderId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `method` enum('CASH','CARD','BLIK','TRANSFER','VOUCHER','ROOM_CHARGE') NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `Tip_orderId_fkey` (`orderId`),
  KEY `Tip_userId_fkey` (`userId`),
  CONSTRAINT `Tip_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `order` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `Tip_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tip`
--

LOCK TABLES `tip` WRITE;
/*!40000 ALTER TABLE `tip` DISABLE KEYS */;
INSERT INTO `tip` VALUES ('cmlxt9y0u000jqwvz222rf2kt','cmlxt9xws000hqwvzulg4uonm','cmlw9tjuk0003v8vzm90mbgpw',10.00,'CASH','2026-02-22 13:56:35.838'),('cmlxtae3n001uqwvzyzn3k4zl','cmlxtae0m001sqwvzw23fxjhu','cmlw9tjuk0003v8vzm90mbgpw',10.00,'CASH','2026-02-22 13:56:56.675'),('cmlxtc3oi0035qwvzfgoftkps','cmlxtc3lm0033qwvzxm4a2pnh','cmlw9tjuk0003v8vzm90mbgpw',10.00,'CASH','2026-02-22 13:58:16.482'),('cmlxtcrvp004kqwvz2ltl6bb8','cmlxtcrsv004iqwvzxpz13szu','cmlw9tjuk0003v8vzm90mbgpw',10.00,'CASH','2026-02-22 13:58:47.845'),('cmlxtdyn5005zqwvzawbguiya','cmlxtdykb005xqwvz7ddx09gg','cmlw9tjuk0003v8vzm90mbgpw',10.00,'CASH','2026-02-22 13:59:43.265');
/*!40000 ALTER TABLE `tip` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unit_conversions`
--

DROP TABLE IF EXISTS `unit_conversions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unit_conversions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fromUnit` varchar(20) NOT NULL,
  `toUnit` varchar(20) NOT NULL,
  `factor` double NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unit_conversions_fromUnit_toUnit_key` (`fromUnit`,`toUnit`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unit_conversions`
--

LOCK TABLES `unit_conversions` WRITE;
/*!40000 ALTER TABLE `unit_conversions` DISABLE KEYS */;
INSERT INTO `unit_conversions` VALUES (1,'g','kg',0.001),(2,'kg','g',1000),(3,'ml','l',0.001),(4,'l','ml',1000),(5,'dag','kg',0.01),(6,'kg','dag',100);
/*!40000 ALTER TABLE `unit_conversions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `pin` varchar(191) NOT NULL,
  `roleId` varchar(191) NOT NULL,
  `authMethod` enum('PIN','NFC','BARCODE','CARD') NOT NULL DEFAULT 'PIN',
  `tokenId` varchar(191) DEFAULT NULL,
  `tokenType` enum('NFC','BARCODE','CARD','MAGNETIC_COM','MAGNETIC_USB','RFID_CLAMSHELL','DALLAS_DATAPROCESS','DALLAS_DEMIURG','DALLAS_JARLTECH','DALLAS_MP00202','FILE_READER') DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `isOwner` tinyint(1) NOT NULL DEFAULT 0,
  `expiresAt` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `allowedCategoryIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`allowedCategoryIds`)),
  `allowedPriceLevelIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`allowedPriceLevelIds`)),
  `allowedTableIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`allowedTableIds`)),
  `autoLogoutSec` int(11) DEFAULT NULL,
  `permissionsJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissionsJson`)),
  `pinBistroMo` varchar(191) DEFAULT NULL,
  `uiButtonGroups` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`uiButtonGroups`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_pin_key` (`pin`),
  UNIQUE KEY `User_tokenId_key` (`tokenId`),
  KEY `User_roleId_fkey` (`roleId`),
  CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `role` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('cmlw9tjse0002v8vzu0cr8wlr','Łukasz','$2b$10$NxJrBs9j3kKr95L9GqAJN.toK0mnz4PyqhuFELBTlM3jBkcn5g70e','cmlw9tjp80000v8vz79cu9fol','PIN',NULL,NULL,1,1,NULL,'2026-02-21 12:04:12.013',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('cmlw9tjuk0003v8vzm90mbgpw','Kelner 1','$2b$10$dNOXtj7PMt9vzTyMVbEFZ.bCWy2bvOUXmvDSnXGFyw8ZhIYcVUiXm','cmlw9tjph0001v8vzyhe8qjm7','PIN',NULL,NULL,1,0,NULL,'2026-02-21 12:04:12.091',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('cmlw9tjwj0004v8vztv5onczv','Kelner 2','$2b$10$VN.3/nrIoy.e8nYyubpdp.KOBjTg/wBRG58Yv8FHN2FoQUMIyb5ii','cmlw9tjph0001v8vzyhe8qjm7','PIN',NULL,NULL,1,0,NULL,'2026-02-21 12:04:12.163',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('cmlw9tjyh0005v8vz4edypn5w','Kelner 3','$2b$10$g5f2pwFhfmoQqu6.zDtF5.umlqyzTO.HaLAJr364YgFYjJmIorj4e','cmlw9tjph0001v8vzyhe8qjm7','PIN',NULL,NULL,1,0,NULL,'2026-02-21 12:04:12.233',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('cmlw9tk0e0006v8vz3q1d6xgc','Kelner 4','$2b$10$Kr1IGORewK9OoC8RzLsaHebp38t08bhhahhDX2KcidxjAP36PP9h2','cmlw9tjph0001v8vzyhe8qjm7','PIN',NULL,NULL,1,0,NULL,'2026-02-21 12:04:12.302',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('cmlwksyp7001j50vzrihlng38','Kierowca Jan','$2b$10$a8jMF2fq8G99mJXyOLtI0e2cfg/voBi9LsvC2gsDICJBzGvF7KYxi','cmlw9tjph0001v8vzyhe8qjm7','PIN',NULL,NULL,1,0,NULL,'2026-02-21 17:11:40.459',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('cmlwksyr6001l50vz4iqx25kb','Kierowca Adam','$2b$10$qcbx5NNU02UHn.ot7nv2WuZTtPiwQ4GzSsykSwz3JXkqASU/Fwq.K','cmlw9tjph0001v8vzyhe8qjm7','PIN',NULL,NULL,1,0,NULL,'2026-02-21 17:11:40.530',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('cmlwksyt3001n50vzdcjkr1rk','Kierowca Piotr','$2b$10$dFhG3qGBlj.IRhn8jExy5.BtFDkfyw.rRgRjzPUnYX5wvmvn5DFu6','cmlw9tjph0001v8vzyhe8qjm7','PIN',NULL,NULL,1,0,NULL,'2026-02-21 17:11:40.599',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('cmmc5lmln0001vcvzq7vy0edk','Basia','$2b$10$3IBloqRgqb7zlnw6tCK7iOUHmeo6kHdjnE2E/5ldeIqhzqPsgcTZS','cmmc5lmcf0000vcvzvwkz6kiv','PIN',NULL,NULL,1,0,NULL,'2026-03-04 14:50:22.763',NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usermacro`
--

DROP TABLE IF EXISTS `usermacro`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `usermacro` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `slot` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `actionsJson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`actionsJson`)),
  `hotkey` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserMacro_userId_slot_key` (`userId`,`slot`),
  KEY `UserMacro_userId_idx` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usermacro`
--

LOCK TABLES `usermacro` WRITE;
/*!40000 ALTER TABLE `usermacro` DISABLE KEYS */;
/*!40000 ALTER TABLE `usermacro` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userpospreference`
--

DROP TABLE IF EXISTS `userpospreference`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `userpospreference` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `keyboardMode` tinyint(1) NOT NULL DEFAULT 0,
  `t9Mode` tinyint(1) NOT NULL DEFAULT 0,
  `buttonRows` int(11) NOT NULL DEFAULT 4,
  `showPrices` tinyint(1) NOT NULL DEFAULT 1,
  `showImages` tinyint(1) NOT NULL DEFAULT 0,
  `confirmQuantity` tinyint(1) NOT NULL DEFAULT 0,
  `autoPrintKitchen` tinyint(1) NOT NULL DEFAULT 1,
  `soundEnabled` tinyint(1) NOT NULL DEFAULT 1,
  `quickAmounts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`quickAmounts`)),
  `favoriteProducts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`favoriteProducts`)),
  `recentProducts` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`recentProducts`)),
  `customColors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`customColors`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserPosPreference_userId_key` (`userId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userpospreference`
--

LOCK TABLES `userpospreference` WRITE;
/*!40000 ALTER TABLE `userpospreference` DISABLE KEYS */;
INSERT INTO `userpospreference` VALUES ('cmlxdt1rd0001u0vzj4ogw2zs','cmlw9tjuk0003v8vzm90mbgpw',0,0,4,1,0,0,1,1,NULL,'[]',NULL,NULL,'2026-02-22 06:43:33.287','2026-02-22 08:47:47.142'),('cmmb2zhc9000110vzbkb4h1a5','cmlw9tjse0002v8vzu0cr8wlr',0,0,4,1,0,0,1,1,NULL,NULL,NULL,NULL,'2026-03-03 20:49:24.105','2026-03-03 20:49:24.105');
/*!40000 ALTER TABLE `userpospreference` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouse`
--

DROP TABLE IF EXISTS `warehouse`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `warehouse` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `type` enum('MAIN','BAR','KITCHEN','COLD_STORAGE') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouse`
--

LOCK TABLES `warehouse` WRITE;
/*!40000 ALTER TABLE `warehouse` DISABLE KEYS */;
INSERT INTO `warehouse` VALUES ('cmlw9tke1002ov8vz7g736nkz','Główny','MAIN'),('cmlw9tke4002pv8vzwd22r082','Bar','BAR'),('cmlw9tke8002qv8vz21fd3pa7','Kuchnia','KITCHEN'),('cmlw9tkeb002rv8vzztg48ivv','Chłodnia','COLD_STORAGE');
/*!40000 ALTER TABLE `warehouse` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workschedule`
--

DROP TABLE IF EXISTS `workschedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `workschedule` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `date` date NOT NULL,
  `shiftStart` varchar(191) NOT NULL,
  `shiftEnd` varchar(191) NOT NULL,
  `role` varchar(191) DEFAULT NULL,
  `note` varchar(191) DEFAULT NULL,
  `isConfirmed` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `WorkSchedule_userId_date_key` (`userId`,`date`),
  CONSTRAINT `WorkSchedule_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workschedule`
--

LOCK TABLES `workschedule` WRITE;
/*!40000 ALTER TABLE `workschedule` DISABLE KEYS */;
/*!40000 ALTER TABLE `workschedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `workstationconfig`
--

DROP TABLE IF EXISTS `workstationconfig`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `workstationconfig` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `allowedCategoryIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`allowedCategoryIds`)),
  `allowedRoomIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`allowedRoomIds`)),
  `defaultPriceLevelId` varchar(191) DEFAULT NULL,
  `defaultRoomId` varchar(191) DEFAULT NULL,
  `askQuantityRegular` tinyint(1) NOT NULL DEFAULT 0,
  `askQuantityWeighted` tinyint(1) NOT NULL DEFAULT 1,
  `askPrice` tinyint(1) NOT NULL DEFAULT 0,
  `askPriceManual` tinyint(1) NOT NULL DEFAULT 1,
  `autoSendKitchen` tinyint(1) NOT NULL DEFAULT 0,
  `autoLogoutOnChange` tinyint(1) NOT NULL DEFAULT 0,
  `refreshOnExit` tinyint(1) NOT NULL DEFAULT 0,
  `showOtherGroups` tinyint(1) NOT NULL DEFAULT 1,
  `ordersOldestFirst` tinyint(1) NOT NULL DEFAULT 1,
  `showOnlyOwn` tinyint(1) NOT NULL DEFAULT 0,
  `logoutOnOrderExit` tinyint(1) NOT NULL DEFAULT 0,
  `forceSelectWaiter` tinyint(1) NOT NULL DEFAULT 0,
  `mergeSimilarItems` tinyint(1) NOT NULL DEFAULT 1,
  `askGuestCount` tinyint(1) NOT NULL DEFAULT 0,
  `printKitchenOnPay` tinyint(1) NOT NULL DEFAULT 0,
  `printOnEveryChange` tinyint(1) NOT NULL DEFAULT 0,
  `fiscalWithShift` tinyint(1) NOT NULL DEFAULT 0,
  `invoiceWithGenDesc` varchar(191) NOT NULL DEFAULT 'ask',
  `askFiscalize` tinyint(1) NOT NULL DEFAULT 0,
  `confirmReceipt` tinyint(1) NOT NULL DEFAULT 1,
  `confirmKitchen` tinyint(1) NOT NULL DEFAULT 1,
  `skipZeroInReports` tinyint(1) NOT NULL DEFAULT 0,
  `askBeforePrint` tinyint(1) NOT NULL DEFAULT 0,
  `skipZeroOnReceipt` tinyint(1) NOT NULL DEFAULT 0,
  `receiptWithGenDesc` tinyint(1) NOT NULL DEFAULT 0,
  `mergeBeforeFiscal` tinyint(1) NOT NULL DEFAULT 1,
  `noStockUpdatePrint` tinyint(1) NOT NULL DEFAULT 0,
  `autoProduction` tinyint(1) NOT NULL DEFAULT 0,
  `fiscalizeWhat` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`fiscalizeWhat`)),
  `stationNumber` int(11) DEFAULT NULL,
  `pluginOnEnter` varchar(191) DEFAULT NULL,
  `pluginOnExit` varchar(191) DEFAULT NULL,
  `allowedWarehouseIds` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`allowedWarehouseIds`)),
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `WorkstationConfig_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `workstationconfig`
--

LOCK TABLES `workstationconfig` WRITE;
/*!40000 ALTER TABLE `workstationconfig` DISABLE KEYS */;
/*!40000 ALTER TABLE `workstationconfig` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'pos_karczma'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-04 17:23:13
