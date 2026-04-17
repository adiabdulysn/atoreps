    SELECT o.o_facility_alias_id "dc"
         , o.d_facility_id "facility_id"
         , o.tc_order_id "order_number"
         , o.order_type "order_type"
         , TO_CHAR(o.order_date_dttm,'YYYY-MM-DD') "order_date"
         , oli.item_id "item_id"
         , su.size_uom "uom"
         , ipc.quantity "standard_pack"
         , NVL(ipr.unit_price,0)*100 "item_value"
         , SUM(oli.orig_order_qty/CASE WHEN su.size_uom = 'H' THEN 10 ELSE 1 END) "ordered_qty"
         , SUM(NVL(oli.allocated_qty,0)/CASE WHEN su.size_uom = 'H' THEN 10 ELSE 1 END) "waved_qty"
         , SUM(NVL(oli.units_pakd,0)/CASE WHEN su.size_uom = 'H' THEN 10 ELSE 1 END) "packed_qty"
         , SUM(CASE
             WHEN oli.do_dtl_status = 200 THEN oli.orig_order_qty/CASE WHEN su.size_uom = 'H' THEN 10 ELSE 1 END
             WHEN oli.do_dtl_status = 190 THEN (oli.orig_order_qty-NVL(oli.units_pakd,0))/CASE WHEN su.size_uom = 'H' THEN 10 ELSE 1 END
           END) "cancelled_qty"
         , CASE
             WHEN oli.wave_nbr IS NULL AND o.last_updated_source = 'MSM101' THEN 'D'
             WHEN oli.wave_nbr IS NULL AND o.last_updated_source <> 'MSM101' THEN 'A'
             WHEN oli.wave_nbr IS NOT NULL AND NVL(oli.allocated_qty,0) = 0 THEN 'S'
             WHEN NVL(oli.units_pakd,0) < oli.orig_order_qty THEN 'P'
           END "cancelled_reason"
      FROM order_line_item oli
INNER JOIN orders o ON oli.order_id = o.order_id
 LEFT JOIN item_cbo ic ON ic.item_id = oli.item_id
 LEFT JOIN size_uom su ON su.size_uom_id = ic.base_storage_uom_id
 LEFT JOIN item_price_cbo ipr ON ipr.item_id = ic.item_id AND ipr.mark_for_deletion = 0
 LEFT JOIN item_package_cbo ipc ON ipc.item_id = ic.item_id AND ipc.package_uom_id = 46 AND ipc.mark_for_deletion = 0 AND ipc.is_std = 1
     WHERE ((oli.do_dtl_status = 200) OR (oli.do_dtl_status = 190 AND units_pakd < orig_order_qty))
       AND o.order_type <> 'X'
       AND o.is_original_order = 1
       AND NOT EXISTS (SELECT 1 FROM order_line_item WHERE order_id = oli.order_id AND item_id = oli.item_id AND do_dtl_status <> 200 AND is_chase_created_line = 1)
           ::pParam::
  GROUP BY o.o_facility_alias_id
         , o.d_facility_id
         , o.tc_order_id
         , o.order_type
         , TO_CHAR(o.order_date_dttm,'YYYY-MM-DD')
         , oli.item_id
         , su.size_uom
         , ipc.quantity
         , ipr.unit_price
         , CASE
             WHEN oli.wave_nbr IS NULL AND o.last_updated_source = 'MSM101' THEN 'D'
             WHEN oli.wave_nbr IS NULL AND o.last_updated_source <> 'MSM101' THEN 'A'
             WHEN oli.wave_nbr IS NOT NULL AND NVL(oli.allocated_qty,0) = 0 THEN 'S'
             WHEN NVL(oli.units_pakd,0) < oli.orig_order_qty THEN 'P'
           END