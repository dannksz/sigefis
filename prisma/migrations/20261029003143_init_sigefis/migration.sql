-- CreateTable
CREATE TABLE `estado` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(45) NOT NULL,
    `sigla` VARCHAR(45) NOT NULL,
    `regiao` VARCHAR(45) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cidade` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(100) NOT NULL,
    `estadoId` INTEGER NOT NULL,

    INDEX `cidade_estadoId_fkey`(`estadoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `endereco` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `logradouro` VARCHAR(191) NOT NULL,
    `numero` VARCHAR(10) NOT NULL,
    `complemento` VARCHAR(45) NULL,
    `bairro` VARCHAR(45) NOT NULL,
    `cep` VARCHAR(8) NOT NULL,
    `cidadeId` INTEGER NOT NULL,

    INDEX `endereco_cidadeId_fkey`(`cidadeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `cpf` VARCHAR(11) NOT NULL,
    `cnpj` VARCHAR(14) NULL,
    `dataNascimento` DATETIME(0) NULL,
    `role` VARCHAR(45) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,
    `enderecoId` INTEGER NULL,
    `tokenVerificacao` VARCHAR(191) NULL,

    UNIQUE INDEX `usuario_email_key`(`email`),
    INDEX `usuario_enderecoId_fkey`(`enderecoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orgao_publico` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(45) NOT NULL,
    `sigla` VARCHAR(45) NOT NULL,
    `enderecoId` INTEGER NULL,

    INDEX `orgao_publico_enderecoId_fkey`(`enderecoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `verba_publica` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `valor` DECIMAL(12, 2) NOT NULL,
    `origem` VARCHAR(45) NOT NULL,
    `finalidade` VARCHAR(65) NOT NULL,
    `orgaoId` INTEGER NOT NULL,

    INDEX `verba_publica_orgaoId_fkey`(`orgaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emenda_parlamentar` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numero` VARCHAR(45) NOT NULL,
    `autor` VARCHAR(45) NOT NULL,
    `valor` DECIMAL(12, 2) NOT NULL,
    `verbaId` INTEGER NOT NULL,

    INDEX `emenda_parlamentar_verbaId_fkey`(`verbaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projeto_obra` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(45) NOT NULL,
    `descricao` VARCHAR(250) NOT NULL,
    `finalidade` VARCHAR(45) NOT NULL,
    `enderecoId` INTEGER NOT NULL,

    INDEX `projeto_obra_enderecoId_fkey`(`enderecoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projeto_verba` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoObraId` INTEGER NOT NULL,
    `verbaPublicaId` INTEGER NOT NULL,
    `valorAlocado` DECIMAL(12, 2) NOT NULL,
    `dataVinculacao` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `projeto_verba_projetoObraId_fkey`(`projetoObraId`),
    INDEX `projeto_verba_verbaPublicaId_fkey`(`verbaPublicaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `etapa_cronograma` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `projetoObraId` INTEGER NOT NULL,
    `nomeEtapa` VARCHAR(45) NOT NULL,
    `ordemEtapa` INTEGER NOT NULL,
    `percentualPrevisto` DECIMAL(5, 2) NOT NULL,
    `percentualExecutado` DECIMAL(5, 2) NOT NULL,
    `dataInicioPrevista` DATE NOT NULL,
    `dataFimPrevista` DATE NOT NULL,
    `dataInicioReal` DATE NULL,
    `dataFimReal` DATE NULL,
    `status` VARCHAR(45) NOT NULL,

    INDEX `etapa_cronograma_projetoObraId_fkey`(`projetoObraId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `liberacao_recurso` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `valorLiberacao` DECIMAL(12, 2) NOT NULL,
    `dataLiberacao` DATE NOT NULL,
    `verbaPublicaId` INTEGER NOT NULL,
    `etapaCronogramaId` INTEGER NOT NULL,

    INDEX `liberacao_recurso_etapaCronogramaId_fkey`(`etapaCronogramaId`),
    INDEX `liberacao_recurso_verbaPublicaId_fkey`(`verbaPublicaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empresa` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nome` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(18) NOT NULL,
    `representanteLegal` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `enderecoId` INTEGER NOT NULL,

    UNIQUE INDEX `empresa_cnpj_key`(`cnpj`),
    INDEX `empresa_enderecoId_fkey`(`enderecoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contrato` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `numeroContrato` VARCHAR(45) NOT NULL,
    `valorContrato` DECIMAL(12, 2) NOT NULL,
    `dataAssinatura` DATE NOT NULL,
    `dataInicio` DATE NOT NULL,
    `dataFim` DATE NOT NULL,
    `projetoObraId` INTEGER NOT NULL,
    `empresaId` INTEGER NOT NULL,
    `verbaPublicaId` INTEGER NOT NULL,

    INDEX `contrato_empresaId_fkey`(`empresaId`),
    INDEX `contrato_projetoObraId_fkey`(`projetoObraId`),
    INDEX `contrato_verbaPublicaId_fkey`(`verbaPublicaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagamento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `valorPagamento` DECIMAL(12, 2) NOT NULL,
    `dataPagamento` DATE NOT NULL,
    `numeroNotaFiscal` VARCHAR(45) NOT NULL,
    `contratoId` INTEGER NOT NULL,
    `etapaCronogramaId` INTEGER NOT NULL,

    INDEX `pagamento_contratoId_fkey`(`contratoId`),
    INDEX `pagamento_etapaCronogramaId_fkey`(`etapaCronogramaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `obra_fiscal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataDesignacao` DATE NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `projetoObraId` INTEGER NOT NULL,

    INDEX `obra_fiscal_projetoObraId_fkey`(`projetoObraId`),
    INDEX `obra_fiscal_usuarioId_fkey`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fiscalizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `dataVistoria` DATE NOT NULL,
    `percentualExecutado` DECIMAL(5, 2) NOT NULL,
    `parecerTecnico` TEXT NOT NULL,
    `statusVistoria` VARCHAR(45) NOT NULL,
    `projetoObraId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,
    `etapaCronogramaId` INTEGER NOT NULL,

    INDEX `fiscalizacao_etapaCronogramaId_fkey`(`etapaCronogramaId`),
    INDEX `fiscalizacao_projetoObraId_fkey`(`projetoObraId`),
    INDEX `fiscalizacao_usuarioId_fkey`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `evidencia_fiscalizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipoEvidencia` VARCHAR(45) NOT NULL,
    `caminhoArquivo` VARCHAR(255) NOT NULL,
    `latitude` VARCHAR(45) NOT NULL,
    `longitude` VARCHAR(45) NOT NULL,
    `dataRegistro` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `fiscalizacaoId` INTEGER NOT NULL,

    INDEX `evidencia_fiscalizacao_fiscalizacaoId_fkey`(`fiscalizacaoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conta_bancaria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `banco` VARCHAR(100) NOT NULL,
    `agencia` VARCHAR(20) NOT NULL,
    `numeroConta` VARCHAR(30) NOT NULL,
    `tipoConta` VARCHAR(45) NOT NULL,
    `orgaoPublicoId` INTEGER NOT NULL,
    `projetoObraId` INTEGER NOT NULL,

    INDEX `conta_bancaria_orgaoPublicoId_fkey`(`orgaoPublicoId`),
    INDEX `conta_bancaria_projetoObraId_fkey`(`projetoObraId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alerta_fiscalizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tipoAlerta` VARCHAR(50) NOT NULL,
    `descricao` TEXT NOT NULL,
    `severidade` VARCHAR(20) NOT NULL,
    `dataGeracao` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `statusAlerta` VARCHAR(30) NOT NULL,
    `projetoObraId` INTEGER NOT NULL,
    `fiscalizacaoId` INTEGER NOT NULL,

    INDEX `alerta_fiscalizacao_fiscalizacaoId_fkey`(`fiscalizacaoId`),
    INDEX `alerta_fiscalizacao_projetoObraId_fkey`(`projetoObraId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bloqueio_repasse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `motivoBloqueio` TEXT NOT NULL,
    `dataBloqueio` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `statusBloqueio` VARCHAR(30) NOT NULL,
    `dataDesbloqueio` DATETIME(0) NULL,
    `projetoObraId` INTEGER NOT NULL,
    `alertaFiscalizacaoId` INTEGER NOT NULL,

    INDEX `bloqueio_repasse_alertaFiscalizacaoId_fkey`(`alertaFiscalizacaoId`),
    INDEX `bloqueio_repasse_projetoObraId_fkey`(`projetoObraId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `processo_regularizacao` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `descricaoJustificativa` TEXT NOT NULL,
    `dataEnvio` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `statusProcesso` VARCHAR(30) NOT NULL,
    `bloqueioRepasseId` INTEGER NOT NULL,
    `usuarioId` INTEGER NOT NULL,

    INDEX `processo_regularizacao_bloqueioRepasseId_fkey`(`bloqueioRepasseId`),
    INDEX `processo_regularizacao_usuarioId_fkey`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `log_auditoria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `acao` VARCHAR(100) NOT NULL,
    `tabelaAfetada` VARCHAR(60) NOT NULL,
    `registroId` INTEGER NOT NULL,
    `detalhes` TEXT NOT NULL,
    `ipOrigem` VARCHAR(45) NOT NULL,
    `dataHora` DATETIME(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `usuarioId` INTEGER NOT NULL,

    INDEX `log_auditoria_usuarioId_fkey`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `cidade` ADD CONSTRAINT `cidade_estadoId_fkey` FOREIGN KEY (`estadoId`) REFERENCES `estado`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `endereco` ADD CONSTRAINT `endereco_cidadeId_fkey` FOREIGN KEY (`cidadeId`) REFERENCES `cidade`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `usuario` ADD CONSTRAINT `usuario_enderecoId_fkey` FOREIGN KEY (`enderecoId`) REFERENCES `endereco`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orgao_publico` ADD CONSTRAINT `orgao_publico_enderecoId_fkey` FOREIGN KEY (`enderecoId`) REFERENCES `endereco`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `verba_publica` ADD CONSTRAINT `verba_publica_orgaoId_fkey` FOREIGN KEY (`orgaoId`) REFERENCES `orgao_publico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emenda_parlamentar` ADD CONSTRAINT `emenda_parlamentar_verbaId_fkey` FOREIGN KEY (`verbaId`) REFERENCES `verba_publica`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projeto_obra` ADD CONSTRAINT `projeto_obra_enderecoId_fkey` FOREIGN KEY (`enderecoId`) REFERENCES `endereco`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projeto_verba` ADD CONSTRAINT `projeto_verba_projetoObraId_fkey` FOREIGN KEY (`projetoObraId`) REFERENCES `projeto_obra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projeto_verba` ADD CONSTRAINT `projeto_verba_verbaPublicaId_fkey` FOREIGN KEY (`verbaPublicaId`) REFERENCES `verba_publica`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `etapa_cronograma` ADD CONSTRAINT `etapa_cronograma_projetoObraId_fkey` FOREIGN KEY (`projetoObraId`) REFERENCES `projeto_obra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `liberacao_recurso` ADD CONSTRAINT `liberacao_recurso_etapaCronogramaId_fkey` FOREIGN KEY (`etapaCronogramaId`) REFERENCES `etapa_cronograma`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `liberacao_recurso` ADD CONSTRAINT `liberacao_recurso_verbaPublicaId_fkey` FOREIGN KEY (`verbaPublicaId`) REFERENCES `verba_publica`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `empresa` ADD CONSTRAINT `empresa_enderecoId_fkey` FOREIGN KEY (`enderecoId`) REFERENCES `endereco`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contrato` ADD CONSTRAINT `contrato_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresa`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contrato` ADD CONSTRAINT `contrato_projetoObraId_fkey` FOREIGN KEY (`projetoObraId`) REFERENCES `projeto_obra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contrato` ADD CONSTRAINT `contrato_verbaPublicaId_fkey` FOREIGN KEY (`verbaPublicaId`) REFERENCES `verba_publica`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamento` ADD CONSTRAINT `pagamento_contratoId_fkey` FOREIGN KEY (`contratoId`) REFERENCES `contrato`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamento` ADD CONSTRAINT `pagamento_etapaCronogramaId_fkey` FOREIGN KEY (`etapaCronogramaId`) REFERENCES `etapa_cronograma`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `obra_fiscal` ADD CONSTRAINT `obra_fiscal_projetoObraId_fkey` FOREIGN KEY (`projetoObraId`) REFERENCES `projeto_obra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `obra_fiscal` ADD CONSTRAINT `obra_fiscal_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fiscalizacao` ADD CONSTRAINT `fiscalizacao_etapaCronogramaId_fkey` FOREIGN KEY (`etapaCronogramaId`) REFERENCES `etapa_cronograma`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fiscalizacao` ADD CONSTRAINT `fiscalizacao_projetoObraId_fkey` FOREIGN KEY (`projetoObraId`) REFERENCES `projeto_obra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fiscalizacao` ADD CONSTRAINT `fiscalizacao_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `evidencia_fiscalizacao` ADD CONSTRAINT `evidencia_fiscalizacao_fiscalizacaoId_fkey` FOREIGN KEY (`fiscalizacaoId`) REFERENCES `fiscalizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conta_bancaria` ADD CONSTRAINT `conta_bancaria_orgaoPublicoId_fkey` FOREIGN KEY (`orgaoPublicoId`) REFERENCES `orgao_publico`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conta_bancaria` ADD CONSTRAINT `conta_bancaria_projetoObraId_fkey` FOREIGN KEY (`projetoObraId`) REFERENCES `projeto_obra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerta_fiscalizacao` ADD CONSTRAINT `alerta_fiscalizacao_fiscalizacaoId_fkey` FOREIGN KEY (`fiscalizacaoId`) REFERENCES `fiscalizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alerta_fiscalizacao` ADD CONSTRAINT `alerta_fiscalizacao_projetoObraId_fkey` FOREIGN KEY (`projetoObraId`) REFERENCES `projeto_obra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bloqueio_repasse` ADD CONSTRAINT `bloqueio_repasse_alertaFiscalizacaoId_fkey` FOREIGN KEY (`alertaFiscalizacaoId`) REFERENCES `alerta_fiscalizacao`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `bloqueio_repasse` ADD CONSTRAINT `bloqueio_repasse_projetoObraId_fkey` FOREIGN KEY (`projetoObraId`) REFERENCES `projeto_obra`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `processo_regularizacao` ADD CONSTRAINT `processo_regularizacao_bloqueioRepasseId_fkey` FOREIGN KEY (`bloqueioRepasseId`) REFERENCES `bloqueio_repasse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `processo_regularizacao` ADD CONSTRAINT `processo_regularizacao_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `log_auditoria` ADD CONSTRAINT `log_auditoria_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
