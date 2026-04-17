 select FACILITY_ALIAS_ID DC,
       FACILITY_NAME DC_NAME,
       'Dry' Dept,
       SUBSTR(ic.ITEM_NAME,1,2) Div,
       ic.item_name,
       ic.LONG_DESCRIPTION,
       quantity std_pack,
       case when BASE_STORAGE_UOM_ID ='657' then 'Unit' when BASE_STORAGE_UOM_ID ='281' then 'Hecto' end  UOM,
       sum(ON_HAND_QTY) SOH,
       nvl(Qty_booked,0) SOH_BOOKED,
       sum(ON_HAND_QTY) - nvl(Qty_booked,0) ASOH,
       (sum(ON_HAND_QTY) - nvl(Qty_booked,0))/quantity CARTON,
       Intransit Intransit_qty,
       case when sum(ON_HAND_QTY) - nvl(Qty_booked,0) <='0' then 'DC OOS' end reason
from wm_inventory wi  
   inner join item_cbo ic on ic.item_id=wi.item_id
   left join  locn_hdr lh on lh.locn_id=wi.location_id
   left join  facility_alias fa on fa.FACILITY_ID=wi.C_FACILITY_ID
   left join  item_PACKAGE_CBO ipc on ipc.item_id=ic.item_id and ipc.PACKAGE_UOM_ID ='46' and ipc.IS_STD='1'
   left join (select O_FACILITY_ALIAS_ID Dc
              ,ic.ITEM_NAME Item
              ,ic.DESCRIPTION item_Desc
             ,sum(case when oli.DO_DTL_STATUS='110' then oli.ORIG_ORDER_QTY
                       when oli.DO_DTL_STATUS='130' then oli.ALLOCATED_QTY
                       when oli.DO_DTL_STATUS='140' and ALLOCATED_QTY<>UNITS_PAKD then ALLOCATED_QTY-UNITS_PAKD
                       when oli.DO_DTL_STATUS='140' and UNITS_PAKD is null then ALLOCATED_QTY  end)  Qty_booked
                   from  orders od 
                       inner join order_line_item oli on od.order_id=oli.order_id
                       left join item_cbo  ic on ic.item_id=oli.item_id
                       left join item_wms  iw on iw.item_id=ic.item_id
                       left join item_package_cbo ipc on ipc.item_id=ic.item_id and ipc.PACKAGE_UOM_ID ='46' and ipc.IS_STD='1'
                   where  od.IS_ORIGINAL_ORDER =1
                       and od.O_FACILITY_ALIAS_ID ='105'
                   and do_status < '190'
                   and ORDER_TYPE  <> 'X' 
                   and oli.DO_DTL_STATUS<'190' 
                   and case when oli.DO_DTL_STATUS='110' then oli.ORIG_ORDER_QTY
                            when oli.DO_DTL_STATUS='130' then oli.ALLOCATED_QTY
                            when oli.DO_DTL_STATUS='140' and ALLOCATED_QTY<>UNITS_PAKD then ALLOCATED_QTY-UNITS_PAKD   end <>'0'
                   group by O_FACILITY_ALIAS_ID,ic.ITEM_NAME,ic.DESCRIPTION) STM on STM.Item=ic.item_name
         left join (select DESTINATION_FACILITY_ALIAS_ID DC, ic.ITEM_NAME SKU,ic.DESCRIPTION ITEM_DESC,sum(SHIPPED_QTY) Intransit 
                      from asn asn
                  inner join ASN_detail ad on ad.asn_id=asn.asn_id
                  inner join item_cbo ic on ic.item_id=ad.SKU_ID
                  inner join item_wms iw on iw.item_id=ic.item_id
                 where DESTINATION_FACILITY_ALIAS_ID='105'
                    and ASN_ORGN_TYPE='R'
                    and DESTINATION_TYPE ='W'
                    and asn.ASN_STATUS ='20'
                 group by DESTINATION_FACILITY_ALIAS_ID ,
                 ic.ITEM_NAME,
                 ic.DESCRIPTION) int on int.SKU=ic.item_name
where lh.whse='105'
   and substr(aisle,1,1)  in ('A','L')
   and aisle not in('RC','RD','RL','X1','X2','ST')
group by FACILITY_ALIAS_ID ,FACILITY_NAME ,SUBSTR(ic.ITEM_NAME,1,2) ,ic.item_name,ic.LONG_DESCRIPTION,quantity,
    case when BASE_STORAGE_UOM_ID ='657' then 'Unit' when BASE_STORAGE_UOM_ID ='281' then 'Hecto' end ,Qty_booked,Intransit