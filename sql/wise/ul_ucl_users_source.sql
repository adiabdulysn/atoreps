    SELECT uu.ucl_user_id "ucl_user_id"
         , uu.user_name "user_name"
         , INITCAP(CASE WHEN user_first_name = user_last_name THEN user_first_name ELSE user_first_name||' '||user_last_name END) "user_full_name"
         , LISTAGG(DISTINCT REPLACE (REPLACE (REPLACE(REPLACE(REPLACE (r.role_name,'[BAL]',''),'[CIB]',''),'[SBY]',''),'[TIM LL]',''),'[TIM HL]',''),',') within group (order by r.role_name) "user_menu"
         , rg.region_name "dc"
      FROM access_control ac
INNER JOIN ucl_user uu ON uu.ucl_user_id = ac.ucl_user_id
INNER JOIN role r ON r.role_id = ac.role_id AND r.company_id = 1 AND r.is_active = 1
 LEFT JOIN company c ON c.company_id = ac.business_unit_id
 LEFT JOIN region rg ON rg.region_id = ac.geo_region_id
 LEFT JOIN user_group ug ON ug.user_group_id = ac.user_group_id
     WHERE ac.company_id = 1
       AND (r.role_name LIKE '[BAL]%' OR r.role_name like '[CIB]%' OR r.role_name like '[SBY]%' OR r.role_name like '[TIM LL]%' OR r.role_name like '[TIM HL]%')
       AND c.company_name='DC'
       AND LENGTH(uu.user_name) <= 10
       AND rg.region_name in('104','105','106','108','110')
  GROUP BY uu.ucl_user_id,uu.user_name,uu.user_first_name,uu.user_last_name,rg.region_name 
  ORDER BY 1