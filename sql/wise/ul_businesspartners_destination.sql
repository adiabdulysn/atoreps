 INSERT INTO business_partners (bp_id, business_partner_id, description, city)
      VALUES ?
ON DUPLICATE KEY UPDATE business_partner_id = VALUES(business_partner_id), description = VALUES(description), city = VALUES(city)