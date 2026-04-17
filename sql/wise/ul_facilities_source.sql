    SELECT f.facility_id "facility_id"
         , fa.facility_alias_id "facility_alias_id"
         , fa.facility_name "facility_name"
         , UPPER(fa.city) "city"
         , UPPER(sp.state_prov_name) "province"
         , fa.state_prov "region"
         ,fa.county "territory"
      FROM facility f
 LEFT JOIN facility_alias fa ON fa.facility_id = f.facility_id
 LEFT JOIN state_prov sp ON f.state_prov = sp.state_prov AND sp.country_code = f.country_code
     WHERE LENGTH(fa.facility_alias_id) <= 5
       AND NVL(f.mark_for_deletion,0) = 0
       AND NVL(fa.mark_for_deletion,0) = 0
ORDER BY 2