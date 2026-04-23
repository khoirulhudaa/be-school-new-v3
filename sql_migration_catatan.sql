-- =====================================================
-- SQL Migration: Catatan Siswa Online Sync
-- =====================================================
-- Run this on 112.78.143.92 MySQL
-- Database: be_school_new
-- =====================================================

-- Check if Catatan table exists
DESCRIBE Catatan;

-- If not exists, create it:
CREATE TABLE IF NOT EXISTS `Catatan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `siswaId` int NOT NULL,
  `judul` varchar(255) DEFAULT NULL,
  `isi` text,
  `warna` varchar(20) DEFAULT '#FFFFF9C4',
  `tanggal` date DEFAULT NULL,
  `isPinned` tinyint(1) DEFAULT '0',
  `isArchived` tinyint(1) DEFAULT '0',
  `isChecklist` tinyint(1) DEFAULT '0',
  `checklist` json DEFAULT NULL,
  `labels` json DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `siswaId` (`siswaId`),
  KEY `siswaId_archived` (`siswaId`,`isArchived`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- If table exists, add missing columns:
ALTER TABLE `Catatan`
  ADD COLUMN IF NOT EXISTS `warna` varchar(20) DEFAULT '#FFFFF9C4' AFTER `isi`,
  ADD COLUMN IF NOT EXISTS `tanggal` date DEFAULT NULL AFTER `warna`,
  ADD COLUMN IF NOT EXISTS `isPinned` tinyint(1) DEFAULT '0' AFTER `tanggal`,
  ADD COLUMN IF NOT EXISTS `isArchived` tinyint(1) DEFAULT '0' AFTER `isPinned`,
  ADD COLUMN IF NOT EXISTS `isChecklist` tinyint(1) DEFAULT '0' AFTER `isArchived`,
  ADD COLUMN IF NOT EXISTS `checklist` json DEFAULT NULL AFTER `isChecklist`,
  ADD COLUMN IF NOT EXISTS `labels` json DEFAULT NULL AFTER `checklist`;

-- =====================================================
-- Also need to run the Sequelize migration:
-- cd /www/wwwroot/be-school-new
-- npx sequelize-cli db:migrate
-- =====================================================