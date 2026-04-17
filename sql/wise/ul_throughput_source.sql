     SELECT TO_CHAR(s.ship_date,'YYYY-MM-DD') tp_date
          , sd.from_loc dc
          , sd.to_loc facility_alias_id
          , SUBSTR(sd.item,1,2) dept
          , SUM(sd.qty_expected * sd.unit_cost) tp
       FROM shipment@rmsprdsm s
 INNER JOIN intprdsm.mpp_shipsku_avcost@rmsprdsm sd ON sd.shipment = s.shipment
      WHERE sd.from_loc IN ('90','99','104','105','106','108','110')
        AND SUBSTR(sd.item,1,2) > '20'
            ::pParam::
   GROUP BY s.ship_date
          , sd.from_loc
          , sd.to_loc
          , SUBSTR(sd.item,1,2)