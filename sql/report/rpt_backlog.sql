SELECT
	od.O_FACILITY_ALIAS_ID DC,
	fa.FACILITY_NAME DC_NAME,
	od.D_FACILITY_ALIAS_ID STORE,
	fa2.FACILITY_NAME STORE_NAME,
	case when od.ORDER_TYPE='X' then 'XDK' else od.ORDER_TYPE end ORDER_TYPE,
	od.TC_ORDER_ID,
	ic.ITEM_NAME ITEM_NAME,
	ic.DESCRIPTION ITEM_DESCRIPTION,
	case when oli.DO_DTL_STATUS='110' then oli.ORIG_ORDER_QTY
	when oli.DO_DTL_STATUS='130' then oli.ALLOCATED_QTY
	when oli.DO_DTL_STATUS='140' and SHIPPED_QTY is not null then oli.ALLOCATED_QTY-SHIPPED_QTY
	when oli.DO_DTL_STATUS='140' and SHIPPED_QTY is  null then oli.ALLOCATED_QTY
	when oli.DO_DTL_STATUS='150' and SHIPPED_QTY is not  null then oli.UNITS_PAKD-SHIPPED_QTY
	when oli.DO_DTL_STATUS='150' and SHIPPED_QTY is   null then oli.UNITS_PAKD
	when oli.DO_DTL_STATUS='120' and UNITS_PAKD is null then oli.ALLOCATED_QTY
	when oli.DO_DTL_STATUS='120' and UNITS_PAKD is not null then oli.UNITS_PAKD  end QTY_ORDER,
	round(case when oli.DO_DTL_STATUS='110' then oli.ORIG_ORDER_QTY
	when oli.DO_DTL_STATUS='130' then oli.ALLOCATED_QTY
	when oli.DO_DTL_STATUS='140' and SHIPPED_QTY is not null then oli.ALLOCATED_QTY-SHIPPED_QTY
	when oli.DO_DTL_STATUS='140' and SHIPPED_QTY is  null then oli.ALLOCATED_QTY
	when oli.DO_DTL_STATUS='150' and SHIPPED_QTY is not  null then oli.UNITS_PAKD-SHIPPED_QTY
	when oli.DO_DTL_STATUS='150' and SHIPPED_QTY is   null then oli.UNITS_PAKD
	when oli.DO_DTL_STATUS='120' and UNITS_PAKD is null then oli.ALLOCATED_QTY
	when oli.DO_DTL_STATUS='120' and UNITS_PAKD is not null then oli.UNITS_PAKD  end/QUANTITY,2) COLLIE,
	oli.DO_DTL_STATUS||'-'||ds2.DESCRIPTION DETAIL_STATUS,
	to_char(od.ORDER_DATE_DTTM, 'YYYY-MM-DD') order_date
FROM orders od
INNER JOIN order_line_item oli ON oli.order_id = od.order_id
LEFT JOIN item_cbo ic ON ic.item_id = oli.item_id
LEFT JOIN item_wms iw ON iw.item_id = ic.item_id
LEFT JOIN facility_alias fa ON fa.FACILITY_ID = od.O_FACILITY_ID
LEFT JOIN facility_alias fa2 ON fa2.FACILITY_ID = od.D_FACILITY_ID
LEFT JOIN do_status ds ON ds.ORDER_STATUS = od.DO_STATUS
LEFT JOIN do_status ds2 ON ds2.ORDER_STATUS = oli.DO_DTL_STATUS
LEFT JOIN item_package_cbo ipc ON ipc.item_id = ic.item_id AND ipc.PACKAGE_UOM_ID = '46' AND ipc.IS_STD = '1'
WHERE
	od.IS_ORIGINAL_ORDER = 1
	AND ( (od.ORDER_TYPE = 'X' AND od.DO_STATUS BETWEEN '120' AND '185') OR (od.ORDER_TYPE <> 'X' AND od.DO_STATUS < '190'))
	AND oli.DO_DTL_STATUS < '190'
    {{PARAMS}}