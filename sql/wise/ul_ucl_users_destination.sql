 INSERT INTO ucl_users (ucl_user_id, user_name, user_full_name, user_menu, dc)
      VALUES ?
ON DUPLICATE KEY UPDATE user_name = VALUES(user_name), user_full_name = VALUES(user_full_name), user_menu = VALUES(user_menu), dc = VALUES(dc)