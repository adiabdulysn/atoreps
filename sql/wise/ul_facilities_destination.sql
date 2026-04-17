 INSERT INTO facilities (facility_id, facility_alias_id, facility_name, city, province, region, territory)
      VALUES ?
ON DUPLICATE KEY UPDATE facility_alias_id = VALUES(facility_alias_id), facility_name = VALUES(facility_name), city = VALUES(city), province = VALUES(province), territory = VALUES(territory)