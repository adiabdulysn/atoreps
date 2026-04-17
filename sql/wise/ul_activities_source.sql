  WITH src AS
(   SELECT ptt.whse
         , uu.ucl_user_id
         , ptt.create_date_time
         , CASE WHEN ptt.create_date_time - LAG(ptt.create_date_time) OVER (PARTITION BY ptt.user_id, TRUNC(ptt.create_date_time) ORDER BY ptt.user_id, ptt.create_date_time) > NUMTODSINTERVAL(15,'MINUTE') THEN NUMTODSINTERVAL(0,'SECOND')
           ELSE NVL(ptt.create_date_time - LAG(ptt.create_date_time) OVER (PARTITION BY ptt.user_id, TRUNC(ptt.create_date_time) ORDER BY ptt.user_id, ptt.create_date_time),NUMTODSINTERVAL(0,'SECOND'))
           END duration
         , mppa_dc.get_shift(ptt.whse, ptt.create_date_time) shift
         , ptt.prod_trkg_tran_id
         , CASE WHEN ptt.tran_type IN ('100','200','300','500','800') THEN 1 ELSE 0 END trx_scope
         , ptt.tran_type||'-'||ptt.tran_code trx_code
         , mppa_dc.get_trx_type(sc.code_desc) trx_type
         , mppa_dc.get_trx_description(ptt.task_id, ptt.tran_type, ptt.tran_code, ptt.from_locn, ptt.to_locn, ptt.plt_id, ptt.ref_field_1, lhf.aisle, lht.aisle, lhf.locn_class, lht.locn_class, lhf.pick_detrm_zone) trx_desc
         , ptt.menu_optn_name
         , lhf.locn_hdr_id locnf
         , lht.locn_hdr_id locnt
         , ic.item_id
         , CASE ptt.whse
             WHEN '104' THEN 'D'
             WHEN '105' THEN 'D'
             WHEN '106' THEN 'D'
             WHEN '108' THEN 'F'
             WHEN '103' THEN 'F'
             WHEN '110' THEN
               CASE WHEN INSTR('39,61,69,92,96,97',SUBSTR(ic.item_name,1,2)) > 0 THEN 'F' ELSE 'D' END
           END storage_type
         , ptt.nbr_units quantity
         , CASE ptt.tran_type
           WHEN '500' THEN
             CASE
             WHEN NVL(ol.total_lpn_qty,0) = 0 THEN 0
             WHEN NVL(ol.misc_num_1,0) = 0 THEN ptt.nbr_units / ipc.quantity
             ELSE ptt.nbr_units / ol.total_lpn_qty * ol.misc_num_1
             END
           WHEN '800' THEN NVL(ol.misc_num_1,0)
           ELSE ptt.nbr_units / ipc.quantity
           END cartons
         , ptt.cntr_nbr
         , ptt.wave_nbr
         , ptt.ref_field_1
      FROM prod_trkg_tran ptt
 LEFT JOIN lpn ol ON ol.tc_lpn_id = ptt.cntr_nbr AND ol.inbound_outbound_indicator = 'O'
 LEFT JOIN ucl_user uu ON uu.user_name = ptt.user_id
 LEFT JOIN locn_hdr lhf ON lhf.locn_id = ptt.from_locn
 LEFT JOIN locn_hdr lht ON lht.locn_id = ptt.to_locn
 LEFT JOIN item_cbo ic ON ic.item_id = ptt.item_id
 LEFT JOIN item_package_cbo ipc ON ipc.item_id = ic.item_id AND ipc.package_uom_id = 46 AND ipc.mark_for_deletion = 0 AND ipc.is_std = 1
 LEFT JOIN sys_code sc ON sc.code_id = ptt.tran_type AND sc.rec_type||sc.code_type = 'S576'
     WHERE ptt.nbr_units >= 0
           ::pParam::
)   SELECT whse dc
         , ucl_user_id
         , TO_CHAR(create_date_time,'YYYY-MM-DD HH24:MI:SS') date_time
         , mppa_dc.interval_to_excel(duration)*24*60*60 duration
         , shift
         , prod_trkg_tran_id trx_id
         , trx_scope
         , trx_code
         , trx_type
         , menu_optn_name menu_name
         , SUBSTR(trx_desc,INSTR(trx_desc,mppa_dc.get_constant('mppa_dc.c_task_delim'),1,1)+1,INSTR(trx_desc,mppa_dc.get_constant('mppa_dc.c_task_delim'),1,2)-INSTR(trx_desc,mppa_dc.get_constant('mppa_dc.c_task_delim'),1,1)-1) task_main
         , SUBSTR(trx_desc,INSTR(trx_desc,mppa_dc.get_constant('mppa_dc.c_task_delim'),1,2)+1,INSTR(trx_desc,mppa_dc.get_constant('mppa_dc.c_task_delim'),1,3)-INSTR(trx_desc,mppa_dc.get_constant('mppa_dc.c_task_delim'),1,2)-1) task_sub
         , CASE SUBSTR(trx_desc,1,INSTR(trx_desc,mppa_dc.get_constant('mppa_dc.c_task_delim'),1,1)-1) WHEN 'SD' THEN 1 ELSE 0 END directed
         , TO_NUMBER(SUBSTR(trx_desc,INSTR(trx_desc,mppa_dc.get_constant('mppa_dc.c_task_delim'),1,3)+1,1) DEFAULT 0 ON CONVERSION ERROR) calculated
         , locnf from_locn_hdr_id
         , locnt to_locn_hdr_id
         , item_id
         , storage_type
         , quantity
         , cartons
         , cntr_nbr lpn_number
         , wave_nbr wave_number
         , ref_field_1 reference_number
      FROM src