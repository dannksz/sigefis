CREATE TABLE `mensagem_contato` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(120) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(11) NOT NULL,
    `motivo` VARCHAR(32) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `mensagem_contato_criadoEm_id_idx`(`criadoEm`, `id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
