SELECT case 
    when FROM_LOC ='777' then '108'
    when FROM_LOC ='888' then '104'
    when FROM_LOC ='111' then '110'
end "dc_code" ,
TO_LOC "facility_code",
null "shipment_id",
BOL_NO "shipment_number", 
to_char(SHIP_DATE,'yyyy-mm-dd  hh24:mi:ss') "shipment_date", 
to_char(RECEIVE_DATE,'yyyy-mm-dd hh24:mi:ss') "receive_date"
FROM SHIPMENT 
WHERE from_loc in('888','777','111')
and from_loc_type ='W' 
and TO_LOC_TYPE ='S'
and to_char(RECEIVE_DATE,'yyyy-mm-dd') between to_char(SYSDATE-1,'yyyy-mm-dd') and to_char(SYSDATE,'yyyy-mm-dd')