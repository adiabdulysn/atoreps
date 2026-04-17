select distinct( oo.O_FACILITY_ALIAS_ID) "Whse"
       ,oo.O_FACILITY_NAME "Name"
       ,oo.D_FACILITY_ALIAS_ID "Store"
       ,oo.D_FACILITY_NAME "Store Name"
       ,od.REF_FIELD_4 "Po Nbr"
       ,oo.tc_order_id "Tc Order Id"
       ,case when order_type='X' then 'XDK'else'REG' end "Stm Type"
       ,substr(ic.item_name,1,2) "Dept"
       ,ool.ITEM_NAME "Item"
       ,ic.DESCRIPTION "Item Desc"
       ,case when BASE_STORAGE_UOM_ID='657' then 'Unit' 
             when BASE_STORAGE_UOM_ID='281' then 'Hecto' end "Uom"
       ,QUANTITY "Std"
       ,MERCH_TYPE "Suhu"
       ,ool.ORDER_QTY "Order Qty"
       ,ool.SHIPPED_QTY "Shipped Qty"
       ,case when BASE_STORAGE_UOM_ID='657' THEN ool.SHIPPED_QTY
             when BASE_STORAGE_UOM_ID='281' then ool.SHIPPED_QTY/10 END as "Ship Qty Pcs"
       ,round(ool.SHIPPED_QTY/QUANTITY) "Collie"
       ,iw.UNIT_PRICE*100 "Unit Cost"
       ,iw.RETAIL_PRICE*100 "Unit Retail"
       ,ds.DESCRIPTION "Order Status"
       ,ol.tc_shipment_id "Sj Number"
       ,uu.USER_FIRST_NAME||'-'||USER_LAST_NAME  "Invc User Id"
       ,sh.ASSIGNED_SHIP_VIA||'-'|| sv.DESCRIPTION "Ship Via"
       ,sh.PRO_NUMBER "Driver"
       ,sh.TRAILER_NUMBER "Trailer Number"
       ,sh.TRACTOR_NUMBER "Tractor Number"
       ,sh.SEAL_NUMBER "Seal Number"
       ,TO_CHAR(oo.ORDER_DATE_DTTM, 'YYYY-MM-DD') "Order date"
       ,TO_CHAR(oo.SHIP_DATE, 'YYYY-MM-DD') "Ship Date"
       ,ont.NOTE "Note"
from outpt_order_line_item ool
        inner join outpt_orders oo on oo.tc_order_id=ool.tc_order_id and oo.INVC_BATCH_NBR=ool.INVC_BATCH_NBR
        inner join orders od on od.tc_order_id=oo.tc_order_id and od.tc_order_id=ool.tc_order_id
        inner join outpt_lpn ol on ol.INVC_BATCH_NBR=oo.INVC_BATCH_NBR and  ol.TC_ORDER_ID=od.PARENT_ORDER_ID
        inner join item_cbo ic on ic.item_name=ool.ITEM_NAME
        inner join item_wms iw on iw.item_id=ic.item_id
        left  join item_package_cbo ipc on ipc.ITEM_ID=ic.item_id and PACKAGE_UOM_ID='46' and ipc.MARK_FOR_DELETION='0'
        left  join ucl_user uu on uu.USER_NAME=ol.CREATED_SOURCE
        left join shipment sh on sh.tc_shipment_id=ol.tc_shipment_id 
        left join order_note ont on ont.order_id=od.order_id
        left join do_status ds on ds.ORDER_STATUS=od.do_status
        left join ship_via sv on sv.SHIP_VIA=sh.ASSIGNED_SHIP_VIA
where od.IS_ORIGINAL_ORDER =1
and ool.SHIPPED_QTY<>'0'
and  oo.O_FACILITY_ALIAS_ID in ('108','110')
and to_char(oo.SHIP_DATE, 'YYYY-MM-DD') BETWEEN '2025-12-01' AND TO_CHAR(SYSDATE, 'YYYY-MM-DD')
and substr(ic.item_name,1,2) ='97'