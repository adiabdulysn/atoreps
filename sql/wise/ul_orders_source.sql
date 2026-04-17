    SELECT o.o_facility_alias_id
         , o.d_facility_id
         , NVL(l.tc_shipment_id,'-')
         , o.tc_order_id
         , TO_CHAR(o.order_date_dttm,'YYYY-MM-DD') order_date
         , o.order_type
         , CASE
             WHEN th.invn_need_type = '50' THEN 'S'
             WHEN th.invn_need_type = '51' THEN 'C'
             WHEN th.invn_need_type = '2' THEN 'R'
           END pick_type
         , CASE o.o_facility_alias_id
             WHEN '104' THEN 'D'
             WHEN '105' THEN 'D'
             WHEN '106' THEN 'D'
             WHEN '108' THEN 'F'
             WHEN '110' THEN CASE WHEN oli.alloc_type = 'FRS' THEN 'F' ELSE 'D' END
           END storage_type
         , NVL(COUNT(td.item_id),0) sku_count
         , TO_CHAR(wp.create_date_time,'YYYY-MM-DD') waved_date
         , CASE WHEN th.stat_code = '90' THEN TO_CHAR(th.mod_date_time,'YYYY-MM-DD') END packed_date
         , TO_CHAR(l.loaded_dttm,'YYYY-MM-DD') loaded_date
         , TO_CHAR(l.shipped_dttm,'YYYY-MM-DD') shipped_date
      FROM orders o
INNER JOIN order_line_item oli ON oli.order_id = o.order_id
 LEFT JOIN task_dtl td ON td.task_genrtn_ref_nbr = oli.wave_nbr AND td.item_id = oli.item_id
INNER JOIN task_hdr th ON th.task_id = td.task_id AND th.task_cmpl_ref_nbr = td.task_cmpl_ref_nbr AND th.invn_need_type IN ('50', '51', '2')
 LEFT JOIN lpn l ON l.tc_lpn_id = th.task_cmpl_ref_nbr AND l.inbound_outbound_indicator = 'O'
 LEFT JOIN wave_parm wp ON wp.wave_nbr = oli.wave_nbr
     WHERE o.is_original_order = 1
           ::pParam::
  GROUP BY o.o_facility_alias_id
         , o.d_facility_id
         , l.tc_shipment_id
         , o.tc_order_id
         , TO_CHAR(o.order_date_dttm,'YYYY-MM-DD')
         , o.order_type
         , CASE
             WHEN th.invn_need_type = '50' THEN 'S'
             WHEN th.invn_need_type = '51' THEN 'C'
             WHEN th.invn_need_type = '2' THEN 'R'
           END
         , CASE o.o_facility_alias_id
             WHEN '104' THEN 'D'
             WHEN '105' THEN 'D'
             WHEN '106' THEN 'D'
             WHEN '108' THEN 'F'
             WHEN '110' THEN CASE WHEN oli.alloc_type = 'FRS' THEN 'F' ELSE 'D' END
           END
         , TO_CHAR(wp.create_date_time,'YYYY-MM-DD')
         , CASE WHEN th.stat_code = '90' THEN TO_CHAR(th.mod_date_time,'YYYY-MM-DD') END
         , TO_CHAR(l.loaded_dttm,'YYYY-MM-DD')
         , TO_CHAR(l.shipped_dttm,'YYYY-MM-DD')
  ORDER BY 3, 4