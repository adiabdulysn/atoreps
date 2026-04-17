    SELECT bp_id
         , business_partner_id
         , description
         , city
      FROM business_partner
     WHERE mark_for_deletion = 0
       AND tc_company_id = 132
  ORDER BY 2