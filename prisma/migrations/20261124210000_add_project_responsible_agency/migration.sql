ALTER TABLE `projeto_obra`
  ADD COLUMN `orgaoResponsavelId` INTEGER NULL,
  ADD INDEX `projeto_obra_orgaoResponsavelId_idx` (`orgaoResponsavelId`),
  ADD CONSTRAINT `projeto_obra_orgaoResponsavelId_fkey`
    FOREIGN KEY (`orgaoResponsavelId`) REFERENCES `orgao_publico` (`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
