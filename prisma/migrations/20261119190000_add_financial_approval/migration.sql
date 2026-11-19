ALTER TABLE `liberacao_recurso`
  ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN `criadoPorUsuarioId` INTEGER NULL,
  ADD COLUMN `aprovadoPorUsuarioId` INTEGER NULL,
  ADD COLUMN `dataAprovacao` DATETIME(0) NULL,
  ADD INDEX `liberacao_recurso_criadoPorUsuarioId_fkey`(`criadoPorUsuarioId`),
  ADD INDEX `liberacao_recurso_aprovadoPorUsuarioId_fkey`(`aprovadoPorUsuarioId`);

UPDATE `liberacao_recurso`
SET `criadoPorUsuarioId` = (SELECT `id` FROM `usuario` ORDER BY `id` ASC LIMIT 1)
WHERE `criadoPorUsuarioId` IS NULL;

ALTER TABLE `liberacao_recurso`
  MODIFY COLUMN `criadoPorUsuarioId` INTEGER NOT NULL,
  ADD CONSTRAINT `liberacao_recurso_criadoPorUsuarioId_fkey`
    FOREIGN KEY (`criadoPorUsuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `liberacao_recurso_aprovadoPorUsuarioId_fkey`
    FOREIGN KEY (`aprovadoPorUsuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `pagamento`
  ADD COLUMN `status` VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
  ADD COLUMN `criadoPorUsuarioId` INTEGER NULL,
  ADD COLUMN `aprovadoPorUsuarioId` INTEGER NULL,
  ADD COLUMN `dataAprovacao` DATETIME(0) NULL,
  ADD INDEX `pagamento_criadoPorUsuarioId_fkey`(`criadoPorUsuarioId`),
  ADD INDEX `pagamento_aprovadoPorUsuarioId_fkey`(`aprovadoPorUsuarioId`);

UPDATE `pagamento`
SET `criadoPorUsuarioId` = (SELECT `id` FROM `usuario` ORDER BY `id` ASC LIMIT 1)
WHERE `criadoPorUsuarioId` IS NULL;

ALTER TABLE `pagamento`
  MODIFY COLUMN `criadoPorUsuarioId` INTEGER NOT NULL,
  ADD CONSTRAINT `pagamento_criadoPorUsuarioId_fkey`
    FOREIGN KEY (`criadoPorUsuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `pagamento_aprovadoPorUsuarioId_fkey`
    FOREIGN KEY (`aprovadoPorUsuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
