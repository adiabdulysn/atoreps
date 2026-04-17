 INSERT INTO productivity (pick_date, dc, shift, ucl_user_id, category, collies, manhours, grabs)
      VALUES ?
ON DUPLICATE KEY UPDATE collies = VALUES(collies), manhours = VALUES(manhours), grabs = VALUES(grabs)