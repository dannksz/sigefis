ALTER TABLE `obra_fiscal`
  ADD COLUMN `tipoFiscal` VARCHAR(20) NOT NULL DEFAULT 'INTERNO';

CREATE TABLE `revisao_fiscalizacao` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `fiscalizacaoId` INTEGER NOT NULL,
  `fiscalExternoId` INTEGER NOT NULL,
  `statusRevisao` VARCHAR(30) NOT NULL,
  `parecer` TEXT NOT NULL,
  `dataRevisao` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `revisao_fiscalizacao_fiscalizacaoId_fkey`
  ON `revisao_fiscalizacao`(`fiscalizacaoId`);

CREATE INDEX `revisao_fiscalizacao_fiscalExternoId_fkey`
  ON `revisao_fiscalizacao`(`fiscalExternoId`);

ALTER TABLE `revisao_fiscalizacao`
  ADD CONSTRAINT `revisao_fiscalizacao_fiscalizacaoId_fkey`
  FOREIGN KEY (`fiscalizacaoId`) REFERENCES `fiscalizacao`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `revisao_fiscalizacao_fiscalExternoId_fkey`
  FOREIGN KEY (`fiscalExternoId`) REFERENCES `usuario`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
