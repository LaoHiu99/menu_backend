-- 初始化数据库脚本
-- 此脚本在 MySQL 容器首次启动时自动执行

-- 创建数据库 (如果不存在)
CREATE DATABASE IF NOT EXISTS menu_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE menu_system;

-- 设置默认字符集
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
