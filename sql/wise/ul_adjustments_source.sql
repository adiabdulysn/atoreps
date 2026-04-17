    SELECT pt.whse dc
         , pt.tran_nbr pixtran_number
         , pt.tran_type||'.'||pt.tran_code||'.'||NVL(pt.actn_code,'XX') pixtran_code
         , ptc.pix_desc pixtran_name
         , CASE WHEN pt.rsn_code = 'DM' THEN 'D' ELSE 'A' END adjustment_type
         , TO_CHAR(pt.mod_date_time,'YYYY-MM-DD HH24:MI:SS') adjustment_date
         , lh.locn_hdr_id
         , pt.case_nbr lpn_number
         , ic.item_id item_id
         , pt.invn_adjmt_qty*CASE pt.invn_adjmt_type WHEN 'S' THEN -1 WHEN 'A' THEN 1 END adjustment_quantity
         , pt.invn_adjmt_qty*CASE pt.invn_adjmt_type WHEN 'S' THEN -1 WHEN 'A' THEN 1 END/CASE su.size_uom WHEN 'H' THEN 10 ELSE 1 END*ipr.unit_price*100 adjustment_value
         , uu.ucl_user_id ucl_user_id
      FROM pix_tran pt
 LEFT JOIN item_cbo ic ON ic.item_id = pt.item_id
 LEFT JOIN size_uom su ON su.size_uom_id = ic.base_storage_uom_id
 LEFT JOIN item_price_cbo ipr ON ipr.item_id = ic.item_id AND ipr.mark_for_deletion = 0
 LEFT JOIN ucl_user uu ON uu.USER_NAME = pt.sys_user_id
 LEFT JOIN pix_tran_code ptc ON ptc.tran_type = pt.tran_type
                            AND ptc.tran_code = pt.tran_code
                            AND ptc.actn_code = CASE WHEN pt.actn_code IS NULL THEN '*' ELSE pt.actn_code END
 LEFT JOIN locn_hdr lh ON lh.locn_id = pt.ref_field_1
     WHERE ((pt.rsn_code IS NOT NULL AND pt.tran_type||'.'||pt.tran_code||'.'||NVL(pt.actn_code,'XX') IN ('300.01.07','300.04.XX','300.09.XX','606.02.07')) OR
            (pt.tran_type||'.'||pt.tran_code||'.'||pt.actn_code IN ('300.01.01','300.01.09','300.01.14','300.04.14','300.09.14','606.02.01','606.02.09','606.02.14','606.04.03','606.04.14','606.09.03','606.09.14')))
       AND SUBSTR(NVL(ic.item_name,'XX'),1,2) > '20'
           ::pParam::