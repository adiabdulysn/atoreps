    SELECT a.destination_facility_alias_id dc
         , bp.bp_id
         , a.tc_asn_id po_number
         , CASE WHEN a.ref_field_1 = 'X' THEN 'X' WHEN a.ref_field_1 IS NULL THEN 'R' END po_type
         , TO_CHAR(a.created_dttm,'YYYY-MM-DD') po_date
         , a.asn_status po_status
         , COUNT(1) sku_count
         , SUM(ad.shipped_qty  / CASE WHEN su.size_uom = 'H' THEN 10 ELSE 1 END) po_quantity
         , SUM(ad.received_qty / CASE WHEN su.size_uom = 'H' THEN 10 ELSE 1 END) received_quantity
         , SUM(ad.shipped_qty  / CASE WHEN su.size_uom = 'H' THEN 10 ELSE 1 END*ipr.unit_price*100) po_value
         , SUM(ad.received_qty / CASE WHEN su.size_uom = 'H' THEN 10 ELSE 1 END*ipr.unit_price*100) received_value
         , TO_CHAR(a.first_receipt_dttm,'YYYY-MM-DD HH24:MI:SS') first_received
         , TO_CHAR(a.last_receipt_dttm,'YYYY-MM-DD HH24:MI:SS') last_received
         , TO_CHAR(a.verified_dttm,'YYYY-MM-DD HH24:MI:SS') verified
      FROM asn a
INNER JOIN asn_detail ad ON ad.asn_id = a.asn_id
 LEFT JOIN business_partner bp ON bp.business_partner_id = a.business_partner_id and bp.mark_for_deletion = 0
 LEFT JOIN item_cbo ic ON ic.item_id = ad.sku_id
 LEFT JOIN size_uom su ON su.size_uom_id = ic.base_storage_uom_id
 LEFT JOIN item_package_cbo ipc ON ipc.item_id = ic.item_id AND ipc.package_uom_id = 46 AND ipc.mark_for_deletion = 0
 LEFT JOIN item_price_cbo ipr ON ipr.item_id = ic.item_id AND ipr.mark_for_deletion = 0
     WHERE a.destination_type = 'W'
       AND a.asn_orgn_type ='P'
           ::pParam::
  GROUP BY a.destination_facility_alias_id
         , bp.bp_id
         , a.tc_asn_id
         , CASE WHEN a.ref_field_1 = 'X' THEN 'X' WHEN a.ref_field_1 IS NULL THEN 'R' END
         , a.created_dttm
         , a.asn_status
         , a.first_receipt_dttm
         , a.last_receipt_dttm
         , a.verified_dttm