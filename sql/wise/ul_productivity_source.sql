    SELECT TO_CHAR(ptt.create_date_time,'YYYY-MM-DD') pick_date
         , ptt.whse dc
         , mppa_dc.get_shift(ptt.whse, ptt.create_date_time) shift
         , uu.ucl_user_id
         , mppa_dc.get_pick_type(SUBSTR(ic.item_name,1,2), lh.locn_class) category
         , SUM(CASE
                 WHEN lh.locn_class = 'C' THEN
                   CASE WHEN NVL(l.total_lpn_qty,0) = 0 THEN 0 ELSE ptt.nbr_units / l.total_lpn_qty * l.misc_num_1 END
                 WHEN lh.locn_class IN ('A','R','J') THEN 1
               END) collies
         , COUNT(DISTINCT mppa_dc.get_manhour_code(ptt.create_date_time))/4 manhours
         , SUM(mppa_dc.get_pick_grabs(SUBSTR(ic.item_name,1,2), ipc.quantity, lh.locn_class, ptt.nbr_units)) grabs
      FROM prod_trkg_tran ptt
INNER JOIN lpn l ON l.tc_lpn_id = ptt.cntr_nbr AND l.inbound_outbound_indicator = 'O'
 LEFT JOIN locn_hdr lh ON lh.locn_id = CASE ptt.tran_code WHEN '001' THEN ptt.from_locn ELSE ptt.to_locn END
 LEFT JOIN ucl_user uu ON uu.user_Name = ptt.user_id
 LEFT JOIN item_cbo ic ON ic.item_id = ptt.item_id
 LEFT JOIN item_package_cbo ipc ON ipc.item_id = ic.item_id AND ipc.mark_for_deletion = 0 AND ipc.is_std = '1' AND ipc.package_uom_id = 46
     WHERE ptt.tran_type = '500'
       AND ptt.tran_code IN ('001','011')
       AND SUBSTR(ic.item_name,1,2) NOT IN ('15','16')
       AND mppa_dc.get_shift(ptt.whse, ptt.create_date_time) IS NOT NULL
       AND mppa_dc.get_pick_type(SUBSTR(ic.item_name,1,2), lh.locn_class) IS NOT NULL
           ::pParam::
  GROUP BY TO_CHAR(ptt.create_date_time,'YYYY-MM-DD')
         , ptt.whse
         , mppa_dc.get_shift(ptt.whse, ptt.create_date_time)
         , uu.ucl_user_id
         , mppa_dc.get_pick_type(SUBSTR(ic.item_name,1,2), lh.locn_class)
    HAVING SUM(CASE
                 WHEN lh.locn_class = 'C' THEN
                   CASE WHEN NVL(l.total_lpn_qty,0) = 0 THEN 0 ELSE ptt.nbr_units / l.total_lpn_qty * l.misc_num_1 END
                 WHEN lh.locn_class IN ('A','R','J') THEN 1
               END) > 0