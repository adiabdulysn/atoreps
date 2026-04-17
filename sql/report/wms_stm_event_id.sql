select  Event_Id "Event Id",
        Stm "Stm",
        Create_Id_Stm  "Create Id Stm",
        Po_Nbr "Po Nbr",
        Po_Status "Po Status",
        Order_date "Order date",
        Dc "Dc",
        Store "Store",
        Store_Name "Store Name",
        Item "Item",
        Item_Desc "Item Desc",
        Stm_Qty "Stm Qty",
        Shipped_Qty "Shipped Qty",
        Received_Qty "Received Qty",
        Stm_Status "Stm Status",
        Shipped_date "Shipped date",
        Received_date  "Received date",
        LAST_UPDATED_DTTM "Last Updated Dttm"    
from ( 
    select NOTE Event_Id,
        od.TC_ORDER_ID Stm,
        null Create_Id_Stm,
        od.REF_FIELD_4 Po_Nbr,
        asn.ASN_STATUS||'-'||ast.DESCRIPTION Po_Status,
        to_char(od.ORDER_DATE_DTTM, 'YYYY-MM-DD') Order_date,
        od.O_FACILITY_ALIAS_ID Dc,
        od.D_FACILITY_ALIAS_ID Store,
        fa2.FACILITY_NAME Store_Name,
        ic.item_name Item,
        ic.DESCRIPTION Item_Desc,
        oli.ORIG_ORDER_QTY Stm_Qty,
        oli.SHIPPED_QTY Shipped_Qty,
        Null Received_Qty,
        od.DO_STATUS||'-'||ds.DESCRIPTION Stm_Status,
        to_char(SHIP_DATE, 'YYYY-MM-DD') Shipped_date,
        null Received_date,
        oli.LAST_UPDATED_DTTM
    from orders od
        inner join order_line_item oli on  oli.order_id=od.order_id
        inner  join item_cbo ic on ic.item_id=oli.item_id
        inner  join item_wms iw on iw.item_id=ic.item_id
        left join order_note orn on orn.order_id=od.order_id
        left join item_package_cbo ipc  on ipc.item_id=ic.item_id and ipc.PACKAGE_UOM_ID='46' and ipc.MARK_FOR_DELETION='0'
        left join do_status ds on ds.ORDER_STATUS=od.do_status
        left join do_status ds1 on ds1.ORDER_STATUS=oli.DO_DTL_STATUS
        inner  join facility_alias fa on fa.FACILITY_ALIAS_ID=od.O_FACILITY_ALIAS_ID
        inner  join facility_alias fa2 on fa2.FACILITY_ALIAS_ID=od.D_FACILITY_ALIAS_ID
        left join ucl_user uu on uu.USER_NAME=oli.LAST_UPDATED_SOURCE
        inner join asn asn on asn.tc_asn_id=od.REF_FIELD_4
        inner join asn_status ast on ast.ASN_STATUS=asn.ASN_STATUS
        inner join ASN_NOTE an on an.NOTE_ID=asn.HAS_NOTES and an.asn_id=asn.asn_id
        left join (select O_FACILITY_ALIAS_ID,oo.TC_ORDER_ID,item_id,ITEM_NAME,oo.INVC_BATCH_NBR,SHIP_DATE
                    from outpt_orders oo
                            inner join outpt_order_line_item oli on oli.TC_ORDER_ID=oo.TC_ORDER_ID and  oli.INVC_BATCH_NBR=oo.INVC_BATCH_NBR
                    where O_FACILITY_ALIAS_ID='{{DC_CODE}}')opt on opt.TC_ORDER_ID=od.TC_ORDER_ID and opt.item_id=oli.item_id
    where od.IS_ORIGINAL_ORDER =1
        and od.O_FACILITY_ALIAS_ID ='{{DC_CODE}}'
        and asn.REF_FIELD_5 ='Y'
        and  trunc(asn.CREATED_DTTM) between '01-oct-25' and trunc(sysdate)-1        
        and ((upper(an.NOTES) like'%LEBARAN%')or(upper(an.NOTES) like'%NATAL%'))
)