    SELECT TO_CHAR(SYSDATE,'YYYY-MM-DD') inventory_date
         , fa.facility_id
         , lh.locn_hdr_id
         , ic.item_id
         , wi.tc_lpn_id
         , wi.batch_nbr
         , SUM(wi.on_hand_qty) onhand_qty
         , SUM(wi.on_hand_qty/CASE WHEN su.size_uom = 'H' THEN 10 ELSE 1 END*ipc.unit_price)*100 onhand_cost
      FROM wm_inventory wi
INNER JOIN facility_alias fa ON fa.facility_id = wi.c_facility_id
INNER JOIN locn_hdr lh ON lh.locn_id = wi.location_id
INNER JOIN item_cbo ic ON ic.item_id = wi.item_id
 LEFT JOIN size_uom su ON su.size_uom_id = ic.base_storage_uom_id
 LEFT JOIN item_price_cbo ipc ON ipc.item_id = ic.item_id AND ipc.price_type_id = 206 AND ipc.mark_for_deletion = 0
     WHERE mppa_dc.is_aisle_valid(lh.whse, lh.aisle, 1) = 1
       AND wi.marked_for_delete = 'N'
       AND wi.inbound_outbound_indicator = 'I'
       AND SUBSTR(ic.item_name,1,2) NOT IN ('15','16')
           ::pParam::
  GROUP BY TO_CHAR(SYSDATE,'YYYY-MM-DD')
         , fa.facility_id
         , lh.locn_hdr_id
         , ic.item_id
         , wi.tc_lpn_id
         , wi.batch_nbr
  ORDER BY 1, 2, 3, 4, 5