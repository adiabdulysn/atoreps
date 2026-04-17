select O_FACILITY_ALIAS_ID  "Dc",
       fa2.FACILITY_NAME "Dc_Name",     
       D_FACILITY_ALIAS_ID "Store",
       fa.FACILITY_NAME "Store Name",
       TC_ORDER_ID "Order nbr",
       order_type "Type",
       case when O_FACILITY_ALIAS_ID='104' then'Dry'            
            when substr(ic.item_name,1,2) in ('33','34','91','98','99') then'Dry'
            when substr(ic.item_name,1,2) in ('35','36','37') then'Dry'
            when substr(ic.item_name,1,2) in ('39','92') then'Frs'
            when substr(ic.item_name,1,2) in ('61','69','96','97') then 'Frs'
            When substr(ic.item_name,1,2) in ('68') then'Dry'
            When substr(ic.item_name,1,2) in ('15','16','17') then'Pro' End "Dept",
       substr(ic.item_name,1,2) "Div",
       ic.ITEM_NAME "Item",
       ic.DESCRIPTION "Item Desc",
       ipc.QUANTITY "Std",
       case when BASE_STORAGE_UOM_ID=657 THEN oli.ORIG_ORDER_QTY 
            when BASE_STORAGE_UOM_ID=281 then oli.ORIG_ORDER_QTY/10 END as "Oriq Qty",
       case when BASE_STORAGE_UOM_ID=657 THEN oli.ALLOCATED_QTY 
            when BASE_STORAGE_UOM_ID=281 then oli.ALLOCATED_QTY/10 END as  "Alloc Qty",
       case when oli.DO_DTL_STATUS =200 and BASE_STORAGE_UOM_ID=657 THEN oli.ORIG_ORDER_QTY 
            when oli.DO_DTL_STATUS =200 and BASE_STORAGE_UOM_ID=281 then oli.ORIG_ORDER_QTY/10
            when oli.DO_DTL_STATUS in ('130','140','150','190')  and ALLOCATED_QTY < ORIG_ORDER_QTY and BASE_STORAGE_UOM_ID=657 THEN oli.ORIG_ORDER_QTY- ALLOCATED_QTY
            when oli.DO_DTL_STATUS in ('130','140','150','190')  and ALLOCATED_QTY < ORIG_ORDER_QTY and  BASE_STORAGE_UOM_ID=281 then (oli.ORIG_ORDER_QTY- ALLOCATED_QTY)/10
            when oli.DO_DTL_STATUS in ('140','150','190')   and oli.wave_nbr is not null and  UNITS_PAKD < ALLOCATED_QTY  and BASE_STORAGE_UOM_ID=657 THEN oli.ALLOCATED_QTY- UNITS_PAKD
            when oli.DO_DTL_STATUS in ('140','150','190')   and oli.wave_nbr is not null and  UNITS_PAKD < ALLOCATED_QTY  and BASE_STORAGE_UOM_ID=281 then (oli.ALLOCATED_QTY- UNITS_PAKD)/10
              END as "Cancel Qty",       
       round(case when oli.DO_DTL_STATUS =200   THEN oli.ORIG_ORDER_QTY 
            when oli.DO_DTL_STATUS in ('130','140','150','190')  and ALLOCATED_QTY < ORIG_ORDER_QTY  THEN oli.ORIG_ORDER_QTY- ALLOCATED_QTY
            when oli.DO_DTL_STATUS in ('140','150','190')  and oli.wave_nbr is not null and  UNITS_PAKD < ALLOCATED_QTY  THEN oli.ALLOCATED_QTY- UNITS_PAKD
              END /ipc.QUANTITY,2) "Collies",
       (case when oli.DO_DTL_STATUS =200 and BASE_STORAGE_UOM_ID=657 THEN oli.ORIG_ORDER_QTY 
            when oli.DO_DTL_STATUS =200 and BASE_STORAGE_UOM_ID=281 then oli.ORIG_ORDER_QTY/10
            when oli.DO_DTL_STATUS in ('130','140','150','190')  and ALLOCATED_QTY < ORIG_ORDER_QTY and BASE_STORAGE_UOM_ID=657 THEN oli.ORIG_ORDER_QTY- ALLOCATED_QTY
            when oli.DO_DTL_STATUS in ('130','140','150','190')  and ALLOCATED_QTY < ORIG_ORDER_QTY and  BASE_STORAGE_UOM_ID=281 then (oli.ORIG_ORDER_QTY- ALLOCATED_QTY)/10
            when oli.DO_DTL_STATUS in ('140','150','190')   and oli.wave_nbr is not null and  UNITS_PAKD < ALLOCATED_QTY  and BASE_STORAGE_UOM_ID=657 THEN oli.ALLOCATED_QTY- UNITS_PAKD
            when oli.DO_DTL_STATUS in ('140','150','190')   and oli.wave_nbr is not null and  UNITS_PAKD < ALLOCATED_QTY  and BASE_STORAGE_UOM_ID=281 then (oli.ALLOCATED_QTY- UNITS_PAKD)/10
              END *UNIT_PRICE)*100  as "Cost",
       oli.DO_DTL_STATUS||'-'||ds.DESCRIPTION "Dtl Status"
       ,oli.LAST_UPDATED_SOURCE "User Id"
       ,case when oli.DO_DTL_STATUS ='200' and oli.wave_nbr is null and oli.LAST_UPDATED_SOURCE='MSM101' and trunc(od.LAST_UPDATED_DTTM)-trunc(ORDER_DATE_DTTM) <'7' then 'Admin By Retek'
             when oli.DO_DTL_STATUS ='200' and oli.wave_nbr is null and oli.LAST_UPDATED_SOURCE='MSM101' and trunc(od.LAST_UPDATED_DTTM)-trunc(ORDER_DATE_DTTM) >=7 then 'Durasi By Retek'
             when oli.DO_DTL_STATUS ='200' and oli.wave_nbr is null and oli.LAST_UPDATED_SOURCE <>'MSM101'  then 'Cancel By Admin Wms'
             when oli.DO_DTL_STATUS ='200' and oli.wave_nbr is not null  and RTL_TO_BE_DISTROED_QTY is null then 'Cancel By system'
             when oli.DO_DTL_STATUS  in ('140','150','190','200') and oli.wave_nbr is not null and RTL_TO_BE_DISTROED_QTY ='0' then 'Cancel By Picker'
             when oli.DO_DTL_STATUS between 120 and '190' and oli.wave_nbr is not null and  ALLOCATED_QTY < ORIG_ORDER_QTY then 'Cancel By system'
             when oli.DO_DTL_STATUS  in ('140','150','190') and oli.wave_nbr is not null and  UNITS_PAKD < ALLOCATED_QTY  and  RTL_TO_BE_DISTROED_QTY ='0'then 'Cancel By Picker'
             when oli.DO_DTL_STATUS  in ('140','150','190') and oli.wave_nbr is not null and  RTL_TO_BE_DISTROED_QTY ='0' then 'Cancel By Picker' end "Cancel Type"
       ,to_char(ORDER_DATE_DTTM, 'YYYY-MM-DD HH24:MI:SS')"Order Date"
       ,to_char(oli.LAST_UPDATED_DTTM, 'YYYY-MM-DD HH24:MI:SS') "Last update"
       ,to_char(oli.LAST_UPDATED_DTTM,'MON') "Bulan"
       ,to_char(oli.LAST_UPDATED_DTTM,'YYYY') "Tahun"
from orders od INNER JOIN  order_line_item oli on od.order_id=oli.order_id
    LEFT JOIN item_CBO ic on  ic.item_id=oli.item_id
    LEFT JOIN item_wms iw on  iw.item_id=ic.item_id
    LEFT JOIN do_status ds on  ds.ORDER_STATUS=oli.DO_DTL_STATUS
    LEFT JOIN facility_alias fa on  fa.FACILITY_ALIAS_ID=od.D_FACILITY_ALIAS_ID
    LEFT JOIN facility_alias fa2 on  fa2.FACILITY_ALIAS_ID=od.O_FACILITY_ALIAS_ID
    LEFT JOIN state_prov sp on  sp.STATE_PROV=fa.STATE_PROV and sp.COUNTRY_CODE ='ID'
    LEFT JOIN item_package_cbo ipc  on ipc.item_id=ic.item_id and ipc.PACKAGE_UOM_ID ='46' and ipc.MARK_FOR_DELETION='0' and IS_STD ='1'
    LEFT JOIN do_status ds2 on ds2.ORDER_STATUS=od.do_status
    left join wave_parm wp on wp.wave_nbr=oli.wave_nbr
where IS_ORIGINAL_ORDER =1
    and od.order_type<>'X'
    and ((oli.DO_DTL_STATUS=200) or 
         (oli.DO_DTL_STATUS in ('130','140','150','190')  and ALLOCATED_QTY < ORIG_ORDER_QTY)or
         (oli.DO_DTL_STATUS in ('150','190')  and UNITS_PAKD < ALLOCATED_QTY))
    and oli.CREATED_SOURCE = 'MSM101'  
    and trunc(oli.LAST_UPDATED_DTTM) =trunc(sysdate)-1
    {{PARAMS}}
    and  not exists (select 'x' from order_line_item where order_id=oli.order_id and item_id=oli.item_id and DO_DTL_STATUS <>'200' and IS_CHASE_CREATED_LINE ='1')