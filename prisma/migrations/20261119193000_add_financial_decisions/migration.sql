CREATE TABLE `decisao_financeira` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `tipoOperacao` VARCHAR(20) NOT NULL,
  `operacaoId` INTEGER NOT NULL,
  `status` VARCHAR(20) NOT NULL,
  `justificativa` TEXT NOT NULL,
  `usuarioId` INTEGER NOT NULL,
  `dataDecisao` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `decisao_financeira_usuarioId_fkey`
  ON `decisao_financeira`(`usuarioId`);

CREATE INDEX `decisao_financeira_operacao_idx`
  ON `decisao_financeira`(`tipoOperacao`, `operacaoId`);

ALTER TABLE `decisao_financeira`
  ADD CONSTRAINT `decisao_financeira_usuarioId_fkey`
  FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
