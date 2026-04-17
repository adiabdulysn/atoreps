select im.ITEM,
    ITEM_DESC,
    ils.LOC,
    case when il.LOC ='104' then 'Dc Balaraja'
            when il.LOC ='105' then 'Dc Low land'
            when il.LOC ='106' then 'Dc High land'
            when il.LOC ='108' then 'Dc Cibitung'
            when il.LOC ='110' then 'Dc Porong' else STORE_NAME end STORE_NAME,
    STOCK_ON_HAND,
    INTRANSIT,
    ONORDER_TSF,
    ONORDER_PO,
    AVSLS AVSALES_QTY,
    round(STOCK_ON_HAND/case when AVSLS   ='0' then null else AVSLS end,2)  INVDAYS_QTY,
    ils.UNIT_COST Unit_cost,
    ---(Nvl(STOCK_ON_HAND,0)+nvl(INTRANSIT,0)+nvl(ONORDER_TSF,0)+nvl(ONORDER_PO,0))TOTAL_INVENTORY,
    STOCK_ON_HAND * ils.UNIT_COST TOTAL_INVENTORY
from item_master@rmsprdsm im
    inner join item_loc@rmsprdsm il on il.item=im.item and il.STATUS='A'
    inner join item_supp_country@rmsprdsm  isc on isc.item=im.ITEM and PRIMARY_SUPP_IND ='Y'
    inner join rrpprdsm.item_sup_parent_nono@rmsprdsm isp on isp.item=isc.item and isp.item=im.item
    inner join sups@rmsprdsm sp on sp.SUPPLIER=isc.SUPPLIER and sp.SUP_STATUS='A'
    left join item_loc_soh@rmsprdsm ils on ils.item=im.ITEM and ils.loc=il.loc
    left join store@rmsprdsm st on st.store=ils.loc
    left join (select  TO_LOC,item,sum(SHIP_QTY)  SHIP_QTY,sum(RECEIVED_QTY) RECEIVED_QTY,sum(SHIP_QTY- RECEIVED_QTY) INTRANSIT
                from tsfhead@rmsprdsm tsh
                left join tsfdetail@rmsprdsm tsd on tsd.tsf_no=tsh.tsf_no
                left join store@rmsprdsm st on st.store=tsh.to_loc
            where FROM_LOC_TYPE='W'
                and TO_LOC_TYPE in ('S','W')
                and STATUS='S'
                and SHIP_QTY is not null
                and RECEIVED_QTY <> SHIP_QTY
            group by TO_LOC,item) Int on int.item=im.item and int.TO_LOC=il.loc                
    left join (select  TO_LOC,item,sum(TSF_QTY) ONORDER_TSF
                from tsfhead@rmsprdsm tsh
                left join tsfdetail@rmsprdsm tsd on tsd.tsf_no=tsh.tsf_no
                left join store@rmsprdsm st on st.store=tsh.to_loc
            where FROM_LOC_TYPE='W'
                and TO_LOC_TYPE in ('S','W')
                and STATUS='A'
            group by TO_LOC,item) tsa on tsa.item=im.item and tsa.TO_LOC=il.loc
    left join (select od.LOCATION Loc, orc.ITEM Item,sum(QTY_ORDERED) ONORDER_PO
                from ordhead@rmsprdsm od
                    inner join ordloc@rmsprdsm orc on orc.order_no=od.order_no
                    inner join ordsku@rmsprdsm ors on ors.order_no=od.order_no
                    inner join sups@rmsprdsm sp on sp.SUPPLIER=od.SUPPLIER
                    inner join item_master@rmsprdsm im on orc.item=im.item
                where od.LOC_TYPE in ('W')
                    and od.STATUS = 'A'
                group by od.LOCATION,orc.ITEM ) po on po.item=im.item and po.Loc=il.loc
    left join rrpprdsm.atrp_avsls@rmsprdsm avs on avs.item=im.item and avs.loc=il.loc
where im.ITEM_LEVEL ='2'
    and STORE_CLOSE_DATE is null
    ---and im.ITEM='68003247'
    ---and sp.SUPPLIER ='38021'.
    and ils.LOC not in ('238','232','124')
    and SUP_PARENT='P & G INDONESIA'