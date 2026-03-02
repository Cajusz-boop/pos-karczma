SET FOREIGN_KEY_CHECKS = 0;

UPDATE `Order` 
SET status = 'CANCELLED', closedAt = NOW() 
WHERE status NOT IN ('CLOSED', 'CANCELLED') 
AND createdAt < DATE_SUB(NOW(), INTERVAL 1 DAY);

UPDATE `Table` SET status = 'FREE' WHERE number = 8 AND status = 'OCCUPIED';

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Gotowe' as Status;
