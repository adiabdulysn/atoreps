 INSERT INTO throughput (tp_date, dc, facility_alias_id, dept, value)
      VALUES ?
ON DUPLICATE KEY UPDATE value = VALUES(value)