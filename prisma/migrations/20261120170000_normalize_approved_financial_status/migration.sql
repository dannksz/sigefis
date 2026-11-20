START TRANSACTION;

UPDATE `liberacao_recurso` SET `status` = 'APROVADA' WHERE `status` = 'APROVADO';
UPDATE `pagamento` SET `status` = 'APROVADA' WHERE `status` = 'APROVADO';
UPDATE `decisao_financeira` SET `status` = 'APROVADA' WHERE `status` = 'APROVADO';

COMMIT;
