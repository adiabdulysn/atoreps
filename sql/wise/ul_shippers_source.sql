    SELECT ship_via_id
         , ship_via
         , description
      FROM ship_via
     WHERE marked_for_deletion = 0
       AND tc_company_id = 132
  ORDER BY 1