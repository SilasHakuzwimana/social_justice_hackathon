-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 28, 2024 at 06:51 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `civic_platform`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `national_id` varchar(16) NOT NULL,
  `location` varchar(100) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `reset_token` varchar(255) NOT NULL,
  `reset_token_expires` timestamp NULL DEFAULT NULL,
  `otp` varchar(9) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'citizen',
  `otp_expires` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password_hash`, `national_id`, `location`, `phone`, `created_at`, `updated_at`, `reset_token`, `reset_token_expires`, `otp`, `role`, `otp_expires`) VALUES
(1, 'Silas Hakuzwimana', 'hakusilas@gmail.com', '$2a$10$IOE2acS1y1LUAKcqMv13.eQVEwoWSpX7E/5.HeSKoyVgJXDpAshCG', '1200280136201193', 'Kigali', '+250783749019', '2024-09-24 16:42:14', '2024-09-24 16:42:14', '', NULL, '', 'admin', NULL),
(5, 'Sylvain IMANISHIMWE', 'hakuzwimanasilas@gmail.com', '$2a$10$eTbVeeKwvfuwg9LAcvGgLu5Ed/AXdsuMY.1v3heGSspUphX2jxRuC', '1201080136201194', 'Ruhango', '0789650049', '2024-09-24 17:03:17', '2024-09-24 17:03:17', '', '2024-09-24 20:04:31', '', 'citizen', NULL),
(6, 'Claudette', 'silashakuzwimana@gmail.com', '$2a$10$RSsLh4nM5g8jPN0EMHpvr./94KWGN8A9wXw5NV.qe/XY.KWsw72.C', '1201080136201193', 'Mareba', '+250788768417', '2024-09-24 17:40:10', '2024-09-24 17:40:10', '', NULL, '', 'citizen', NULL),
(11, 'Mukazibera', 'hakuzwisilas@gmail.com', '$2a$10$g7VvKQ2lLbT54JVN2GypDeXYXMqOnNp4fFtXCiuyB9sH4vQywwxFy', '1201080136201198', 'Kigali', '+250788768419', '2024-09-25 15:12:58', '2024-09-25 15:12:58', '', NULL, '', 'official', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `national_id` (`national_id`),
  ADD UNIQUE KEY `national_id_2` (`national_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
