    SELECT ic.item_id
         , ic.item_name
         , ic.description
         , ic.REF_FIELD6 hs_code
      FROM item_cbo ic
     WHERE ic.company_id = 132
       AND ic.mark_for_deletion = 0
       AND LENGTH(ic.item_name) = 8
       AND SUBSTR(ic.item_name,1,2) > '20'
  ORDER BY 2