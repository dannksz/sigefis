ALTER TABLE `log_auditoria` DROP FOREIGN KEY `log_auditoria_usuarioId_fkey`;

ALTER TABLE `log_auditoria` MODIFY `usuarioId` INTEGER NULL;

ALTER TABLE `log_auditoria` ADD CONSTRAINT `log_auditoria_usuarioId_fkey`
    FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
