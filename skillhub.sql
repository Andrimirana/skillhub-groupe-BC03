-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 06, 2026 at 08:15 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `skillhub-dash`
--

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `cache`
--

INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
('laravel-cache-jwt_blacklist:4a675d821c610a1f1d49113d892d3803851dbbc5ce12bbbdf7c85ba38f96a9ec', 'b:1;', 1772810080),
('laravel-cache-jwt_blacklist:e14d2839ebc2b4c088b2ddc2232a35ed1d4e6707a79bd025dda87c24e41f3b09', 'b:1;', 1772810067),
('laravel-cache-jwt_blacklist:e1cc07355f4bcfa8e70a137251c77a85227ed4afcc0e72fc02e5bbc879cc9c68', 'b:1;', 1772809658),
('laravel-cache-jwt_blacklist:fa722a2754980f3b9328e5fd73313be73c6075762e97435a2e6d2836791f0313', 'b:1;', 1772810220);

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `formations`
--

CREATE TABLE `formations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `titre` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `date` date NOT NULL,
  `statut` varchar(60) NOT NULL DEFAULT 'À venir',
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `duration` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `level` enum('beginner','intermediaire','advanced') NOT NULL DEFAULT 'beginner',
  `vues` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `formations`
--

INSERT INTO `formations` (`id`, `titre`, `description`, `date`, `statut`, `price`, `duration`, `level`, `vues`, `user_id`, `created_at`, `updated_at`) VALUES
(17, '¨Management entreprise', 'djfjjjijioj', '2026-01-04', 'À venir', 11000.00, 7, 'advanced', 0, 6, '2026-03-06 02:49:12', '2026-03-06 02:49:12'),
(18, 'PHP', 'jsjdçhuhuçh', '2026-01-17', 'Terminé', 7000.00, 14, 'intermediaire', 0, 7, '2026-03-06 03:00:07', '2026-03-06 03:00:07'),
(19, 'Marketing International', 'ojijhihihhuh', '2006-03-12', 'À venir', 11000.00, 20, 'advanced', 0, 7, '2026-03-06 03:01:44', '2026-03-06 03:01:44'),
(20, 'Laravel api', 'çuàh_hçhçh', '2026-01-20', 'Terminé', 4000.00, 10, 'intermediaire', 0, 8, '2026-03-06 03:08:10', '2026-03-06 03:08:10'),
(67, 'React Essentiel', 'Bases de React, composants et hooks', '2026-03-09', 'À venir', 450.00, 6, 'beginner', 12, 6, '2026-03-06 08:06:36', '2026-03-06 08:06:36'),
(68, 'Laravel API Pro', 'Conception et sécurisation d API REST', '2026-03-15', 'À venir', 5800.00, 12, 'advanced', 18, 6, '2026-03-06 08:06:36', '2026-03-06 08:06:36'),
(69, 'SQL Atelier Pratique', 'Jointures, index et optimisation des requêtes', '2026-02-27', 'Terminé', 320.00, 5, 'beginner', 27, 6, '2026-03-06 08:06:36', '2026-03-06 08:06:36'),
(70, 'Docker en Equipe', 'Conteneurs, images, réseaux et workflow projet', '2026-03-21', 'À venir', 2400.00, 8, 'intermediaire', 9, 6, '2026-03-06 08:06:36', '2026-03-06 08:06:36'),
(71, 'Architecture Cloud Moderne', 'Services cloud, scalabilité et coûts', '2026-03-28', 'À venir', 6900.00, 14, 'advanced', 6, 6, '2026-03-06 08:06:36', '2026-03-06 08:06:36'),
(72, 'JavaScript Moderne', 'ES6+, modules et bonnes pratiques frontend', '2026-03-10', 'À venir', 490.00, 6, 'beginner', 20, 7, '2026-03-06 08:06:36', '2026-03-06 08:06:36'),
(73, 'Cybersécurité Web', 'OWASP top 10 et protections côté API', '2026-03-17', 'À venir', 7300.00, 10, 'advanced', 11, 7, '2026-03-06 08:06:36', '2026-03-06 08:06:36'),
(74, 'Git Collaboration Avancée', 'Branches, rebase, revue de code et release', '2026-02-22', 'Terminé', 280.00, 4, 'beginner', 35, 7, '2026-03-06 08:06:36', '2026-03-06 08:06:36'),
(75, 'UX Produit Numérique', 'Parcours utilisateur, tests et itérations', '2026-03-24', 'À venir', 1700.00, 7, 'intermediaire', 14, 7, '2026-03-06 08:06:36', '2026-03-06 08:06:36'),
(76, 'Data Engineering Pipeline', 'ETL, orchestration et monitoring de flux', '2026-04-01', 'À venir', 5400.00, 13, 'advanced', 8, 7, '2026-03-06 08:06:36', '2026-03-06 08:06:36'),
(77, 'Python Fondamental', 'Syntaxe, fonctions et structures de données', '2026-03-11', 'À venir', 399.00, 5, 'beginner', 16, 8, '2026-03-06 08:06:36', '2026-03-06 08:06:36'),
(78, 'Kubernetes Production', 'Déploiement, scaling et résilience applicative', '2026-03-19', 'À venir', 8100.00, 15, 'advanced', 7, 8, '2026-03-06 08:06:36', '2026-03-06 08:06:36'),
(79, 'Tests Automatisés API', 'Tests feature, assertions et stratégie qualité', '2026-03-01', 'Terminé', 450.00, 6, 'intermediaire', 22, 8, '2026-03-06 08:06:36', '2026-03-06 08:06:36'),
(80, 'Design System Frontend', 'Composants réutilisables et cohérence UI', '2026-03-25', 'À venir', 2600.00, 9, 'intermediaire', 10, 8, '2026-03-06 08:06:36', '2026-03-06 08:06:36'),
(81, 'Machine Learning Appliqué', 'Pipeline ML de la préparation au déploiement', '2026-04-05', 'À venir', 9200.00, 16, 'advanced', 5, 8, '2026-03-06 08:06:36', '2026-03-06 08:06:36');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` tinyint(3) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_03_05_000100_add_role_to_users_table', 1),
(5, '2026_03_05_000200_create_formations_table', 1),
(6, '2026_03_06_000300_add_details_to_formations_table', 2),
(7, '2026_03_06_000400_rename_formateur_id_to_user_id_in_formations_table', 3);

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('GNyXpq0naCBhSi35C7csS0acJmCd1HHbF9qYoJ7a', NULL, '127.0.0.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36', 'YTozOntzOjY6Il90b2tlbiI7czo0MDoiZENXTFV6U2FwTTFSa0ZTSzlLMTRpNFQ2WDZxZjNLQk00YngzS2ZCQyI7czo5OiJfcHJldmlvdXMiO2E6Mjp7czozOiJ1cmwiO3M6MjE6Imh0dHA6Ly8xMjcuMC4wLjE6ODAwMCI7czo1OiJyb3V0ZSI7Tjt9czo2OiJfZmxhc2giO2E6Mjp7czozOiJvbGQiO2E6MDp7fXM6MzoibmV3IjthOjA6e319fQ==', 1772764420);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `role` varchar(30) NOT NULL DEFAULT 'formateur',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `role`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
(6, 'Faniry Andriniaina', 'faniry@skillhub.com', 'formateur', NULL, '$2y$12$ht2YQ1OIqvf3sFgPr3Fr/e8Plk57hsQEhjMRrQLcUmUrDPh0wA6Eu', NULL, '2026-03-06 02:48:36', '2026-03-06 02:48:36'),
(7, 'Manoa R', 'manoa@skillhub.com', 'formateur', NULL, '$2y$12$6bIRfVNiwKGzfknz3RTza.o/qwTEsFf0wzTXrbpZwleeB/1H4ZGWe', NULL, '2026-03-06 02:59:29', '2026-03-06 02:59:29'),
(8, 'Luce Arielle', 'arielle@skillhub.com', 'formateur', NULL, '$2y$12$tquNgKMXo1BsRVRvV3GtNuLsQlhpUSZ.sBVniBxhAwSYkegWLs.Jy', NULL, '2026-03-06 03:07:38', '2026-03-06 03:07:38');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indexes for table `formations`
--
ALTER TABLE `formations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `formations_user_id_foreign` (`user_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `formations`
--
ALTER TABLE `formations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=82;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `formations`
--
ALTER TABLE `formations`
  ADD CONSTRAINT `formations_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
