select
    a.asn_id "po_id",
    a.asn_status "wms_asn_status",
    count(DISTINCT ic.item_id) "wms_count_sku",
    sum(ad.shipped_qty/decode(ipc.QUANTITY,NULL,1,ipc.QUANTITY)) "wms_sum_carton",
    sum(ad.SHIPPED_QTY/decode(ic.BASE_STORAGE_UOM_ID,218,10,1)) "wms_sum_shipped_qty",
    sum(ad.RECEIVED_QTY/decode(ic.BASE_STORAGE_UOM_ID,218,10,1)) "wms_sum_received_qty",
    to_char(a.first_receipt_dttm, 'yyyy-mm-dd hh24:mi:ss') "wms_first_receipt_dttm",
    to_char(a.last_receipt_dttm, 'yyyy-mm-dd hh24:mi:ss') "wms_last_receipt_dttm",
    to_char(a.verified_dttm, 'yyyy-mm-dd hh24:mi:ss') "wms_verified_dttm",
    to_char(a.last_updated_dttm, 'yyyy-mm-dd hh24:mi:ss') "wms_last_updated_dttm"
FROM asn a
    join asn_detail ad on a.asn_id=ad.asn_id 
    join item_cbo ic on ad.sku_id=ic.item_id
    left join item_package_cbo ipc on ic.item_id =ipc.item_id and ipc.package_uom_id=46 and ipc.is_std =1 and ipc.mark_for_deletion =0
where
a.destination_facility_alias_id in('104','108','110')
and a.first_receipt_dttm is not null
AND trunc(a.LAST_UPDATED_DTTM) BETWEEN trunc(sysdate-1) AND trunc(sysdate)
GROUP BY a.asn_id, a.asn_status, a.first_receipt_dttm, a.last_receipt_dttm, a.verified_dttm, a.last_updated_dttm, a.tc_asn_id