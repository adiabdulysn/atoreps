 INSERT INTO ship_via (ship_via_id, ship_via, description)
      VALUES ?
ON DUPLICATE KEY UPDATE ship_via = VALUES(ship_via), description = VALUES(description)