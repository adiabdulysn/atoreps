    SELECT
        to_char(sysdate, 'YYYY-MM-DD') run_date 
        ,o.o_facility_alias_id dc
         , CASE
             WHEN o.o_facility_alias_id IN ('104','105','106') THEN 'D'
             WHEN o.o_facility_alias_id = '108' THEN 'F'
             WHEN o.o_facility_alias_id = '110' THEN CASE WHEN SUBSTR(ic.item_name,1,2) IN ('39','61','69','92','96','97') THEN 'F' ELSE 'D' END
             ELSE ''
           END merch_type
         , fa.county territory
         , o.d_facility_alias_id facility_alias_id
         , o.tc_order_id stm_number
         , CASE oli.do_dtl_status
             WHEN 110 THEN '1-Released'
             WHEN 115 THEN '2-Prepared'
             WHEN 120 THEN '2-Prepared'
             WHEN 130 THEN '2-Prepared'
             WHEN 140 THEN '3-In Picking'
             WHEN 150 THEN '4-Packed'
             WHEN 180 THEN '5-Loaded'
           END stm_status
         , CASE oli.alloc_type WHEN 'SPP' THEN 'SNG' ELSE CASE o.order_type WHEN 'RV' THEN 'RTV' WHEN 'T' THEN 'TBAD' WHEN 'X' THEN 'XDK' ELSE 'REG-'||o.order_type END END stm_type
         , TO_CHAR(o.order_date_dttm,'YYYY-MM-DD HH24:MI:SS') stm_date
         , TO_CHAR(a.verified_dttm,'YYYY-MM-DD HH24:MI:SS') verified_date
         , TO_CHAR(swp.create_date_time,'YYYY-MM-DD HH24:MI:SS') waved_date
         , oli.item_id
         , oli.ref_field3 oos
         , CASE
             WHEN oli.do_dtl_status = 110 THEN oli.orig_order_qty
             WHEN oli.do_dtl_status = 115 THEN oli.orig_order_qty
             WHEN oli.do_dtl_status = 120 THEN
               CASE WHEN oli.units_pakd IS NULL THEN oli.allocated_qty
                    ELSE CASE WHEN oli.shipped_qty IS NULL THEN oli.units_pakd ELSE oli.allocated_qty-oli.shipped_qty END
               END
             WHEN oli.do_dtl_status = 130 THEN oli.allocated_qty
             WHEN oli.do_dtl_status = 140 THEN oli.allocated_qty - NVL(oli.shipped_qty,0)
             WHEN oli.do_dtl_status IN (150,180) THEN oli.units_pakd - NVL(oli.shipped_qty,0)
           END quantity
         , CASE
             WHEN oli.do_dtl_status = 110 THEN oli.orig_order_qty
             WHEN oli.do_dtl_status = 115 THEN oli.orig_order_qty
             WHEN oli.do_dtl_status = 120 THEN
               CASE WHEN oli.units_pakd IS NULL THEN oli.allocated_qty
                    ELSE CASE WHEN oli.shipped_qty IS NULL THEN oli.units_pakd ELSE oli.allocated_qty-oli.shipped_qty END
               END
             WHEN oli.do_dtl_status = 130 THEN oli.allocated_qty
             WHEN oli.do_dtl_status = 140 THEN oli.allocated_qty - NVL(oli.shipped_qty,0)
             WHEN oli.do_dtl_status IN (150,180) THEN oli.units_pakd - NVL(oli.shipped_qty,0)
           END / ipc.quantity cartons
         , CASE
             WHEN oli.do_dtl_status = 110 THEN oli.orig_order_qty
             WHEN oli.do_dtl_status = 115 THEN oli.orig_order_qty
             WHEN oli.do_dtl_status = 120 THEN
               CASE WHEN oli.units_pakd IS NULL THEN oli.allocated_qty
                    ELSE CASE WHEN oli.shipped_qty IS NULL THEN oli.units_pakd ELSE oli.allocated_qty-oli.shipped_qty END
               END
             WHEN oli.do_dtl_status = 130 THEN oli.allocated_qty
             WHEN oli.do_dtl_status = 140 THEN oli.allocated_qty - NVL(oli.shipped_qty,0)
             WHEN oli.do_dtl_status IN (150,180) THEN oli.units_pakd - NVL(oli.shipped_qty,0)
           END / ipc.quantity * ipc.volume volume
         , CASE
             WHEN oli.do_dtl_status = 110 THEN oli.orig_order_qty
             WHEN oli.do_dtl_status = 115 THEN oli.orig_order_qty
             WHEN oli.do_dtl_status = 120 THEN
               CASE WHEN oli.units_pakd IS NULL THEN oli.allocated_qty
                    ELSE CASE WHEN oli.shipped_qty IS NULL THEN oli.units_pakd ELSE oli.allocated_qty-oli.shipped_qty END
               END
             WHEN oli.do_dtl_status = 130 THEN oli.allocated_qty
             WHEN oli.do_dtl_status = 140 THEN oli.allocated_qty - NVL(oli.shipped_qty,0)
             WHEN oli.do_dtl_status IN (150,180) THEN oli.units_pakd - NVL(oli.shipped_qty,0)
           END / ipc.quantity * ipc.weight weight
         , CASE
             WHEN oli.do_dtl_status = 110 THEN oli.orig_order_qty
             WHEN oli.do_dtl_status = 115 THEN oli.orig_order_qty
             WHEN oli.do_dtl_status = 120 THEN
               CASE WHEN oli.units_pakd IS NULL THEN oli.allocated_qty
                    ELSE CASE WHEN oli.shipped_qty IS NULL THEN oli.units_pakd ELSE oli.allocated_qty-oli.shipped_qty END
               END
             WHEN oli.do_dtl_status = 130 THEN oli.allocated_qty
             WHEN oli.do_dtl_status = 140 THEN oli.allocated_qty - NVL(oli.shipped_qty,0)
             WHEN oli.do_dtl_status IN (150,180) THEN oli.units_pakd - NVL(oli.shipped_qty,0)
           END / CASE WHEN su.size_uom = 'H' THEN 10 ELSE 1 END * ipr.unit_price*100 value
      FROM orders o
INNER JOIN order_line_item oli on oli.order_id = o.order_id
 LEFT JOIN facility_alias fa ON fa.facility_id = o.d_facility_id
 LEFT JOIN asn a ON a.tc_asn_id = o.ref_field_4
 LEFT JOIN ship_wave_parm swp ON swp.ship_wave_nbr = oli.ship_wave_nbr
 LEFT JOIN item_cbo ic ON ic.item_id = oli.item_id
 LEFT JOIN size_uom su ON su.size_uom_id = ic.base_storage_uom_id
 LEFT JOIN item_package_cbo ipc on ipc.item_id = ic.item_id AND ipc.package_uom_id = 46 AND ipc.is_std = '1'
 LEFT JOIN item_price_cbo ipr ON ipr.item_id = ic.item_id AND ipr.mark_for_deletion = 0
     WHERE NVL(o.is_original_order,0) = 1
       AND ((o.order_type =  'X' AND o.do_status BETWEEN 120 AND 185) OR (o.order_type <> 'X' AND o.do_status < 190))
       AND oli.do_dtl_status < 190
       AND SUBSTR(ic.item_name,1,2) > '20'
       AND TRUNC(CASE WHEN o.order_type = 'X' THEN NVL(a.verified_dttm,SYSDATE) ELSE SYSDATE+1 END) <> TRUNC(SYSDATE)