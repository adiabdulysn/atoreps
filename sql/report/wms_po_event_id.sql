select an.NOTES "Event id",
    TC_ASN_ID  "Po Nbr",        
    null "Approval id",
    case when asn.REF_FIELD_1 ='X' then 'Xdk'
            when asn.REF_FIELD_1 is null then 'Reg'end "Po type",
    DESTINATION_FACILITY_ALIAS_ID "Location",
    fa.FACILITY_NAME  "Location_name",
    to_char(asn.CREATED_DTTM, 'YYYY-MM-DD HH24:MI:SS') "Create Date",
    case when asn.BUSINESS_PARTNER_ID is null then ORIGIN_FACILITY_ALIAS_ID else asn.BUSINESS_PARTNER_ID end "Supp Code",
    bp.DESCRIPTION   "Supp Name",
    ic.ITEM_NAME "Item name",
    ic.DESCRIPTION  "Item Desc",
    CASE WHEN BASE_STORAGE_UOM_ID='657' THEN ad.SHIPPED_QTY WHEN BASE_STORAGE_UOM_ID='281'  THEN ad.SHIPPED_QTY /10  END "Order Qty",
    CASE WHEN BASE_STORAGE_UOM_ID='657' THEN ad.RECEIVED_QTY WHEN BASE_STORAGE_UOM_ID='281' THEN ad.RECEIVED_QTY /10 END "Received Qty" ,
    asn.asn_status||'-'||ast.DESCRIPTION "Po status",
    to_char(asn.VERIFIED_DTTM, 'YYYY-MM-DD HH24:MI:SS')"Received date" 
from asn asn
    inner join ASN_detail ad on ad.asn_id=asn.asn_id
    inner join item_cbo ic on ic.item_id=ad.SKU_ID
    inner join item_wms iw on iw.item_id=ic.item_id
    left join asn_status ast on ast.ASN_STATUS=asn.ASN_STATUS
    left join facility_alias fa on fa.FACILITY_ALIAS_ID=asn.DESTINATION_FACILITY_ALIAS_ID
    left join BUSINESS_PARTNER bp on bp.BUSINESS_PARTNER_ID=asn.BUSINESS_PARTNER_ID and bp.MARK_FOR_DELETION='0'
    inner join ASN_NOTE an on an.NOTE_ID=asn.HAS_NOTES and an.asn_id=asn.asn_id
    left join item_package_cbo ipc on ipc.item_id=ic.item_id and ipc.PACKAGE_UOM_ID ='46' and ipc.MARK_FOR_DELETION='0' and ipc.IS_STD='1'
where DESTINATION_TYPE ='W'
    and DESTINATION_FACILITY_ALIAS_ID= '{{DC_CODE}}'
    and ASN_ORGN_TYPE='P'
    and asn.REF_FIELD_5 ='Y'
    and  trunc(asn.CREATED_DTTM) between '01-oct-25' and trunc(sysdate)-1        
    and ((upper(an.NOTES) like'%LEBARAN%') OR (upper(an.NOTES) like'%NATAL%'))