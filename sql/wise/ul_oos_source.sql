    SELECT TO_CHAR(cut_off_date,'YYYY-MM-DD') cut_off_date
         , region_hk region
         , str_format format
         , loc store_code
         , loc_name store_name
         , div_name
         , group_name
         , old_dept old_dept_name
         , dept_name
         , class_name
         , item item_code
         , item_desc item_description
         , matrix_abcxyz
         , source_wh
         , stock_cat stock_category
         , poos_dc oos_dc
         , total_dc from_dc
         , poos_supplier oos_supplier
         , total_supplier from_supplier
         , poos_all oos_all
         , poos_flg poos_all
         , CASE WHEN pareto = 'Y' THEN 1 ELSE 0 END pareto
         , flg_pure pure
         , CASE WHEN flg_block_md = 'Y' THEN 1 ELSE 0 END block_md
         , CASE WHEN flg_autorep = 'Y' THEN 1 ELSE 0 END autorep
         , CASE WHEN flg_singlepick = 'Y' THEN 1 ELSE 0 END singlepick
         , CASE WHEN flg_insuff_dc = 'Y' THEN 1 ELSE 0 END dc_insufficient
         , CASE WHEN flg_asst_dc = 'Y' THEN 1 ELSE 0 END dc_assortment
         , flg_oos_sl_supp oos_sl_supplier
         , flg_oos_forever oos_forever
         , CASE WHEN daily_basket = 'Y' THEN 1 ELSE 0 END daily_basket
         , CASE WHEN mhi_timika = 'Y' THEN 1 ELSE 0 END mhi_timika
         , CASE WHEN kpe = 'Y' THEN 1 ELSE 0 END kpe
         , asoh
         , safety_stock
         , tcost_ord_packsz purchase_needed
         , los_oos_tcost sales_lost
         , intransit
         , on_order_tsf on_ordered
         , sum_ordered
         , note notes
      FROM rrpprdsm.oos_hk_vl_tbl