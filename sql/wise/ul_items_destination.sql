 INSERT INTO items (item_id, item_name, description, hs_code)
      VALUES ?
ON DUPLICATE KEY UPDATE item_name = VALUES(item_name), description = VALUES(description), hs_code=VALUES(hs_code)