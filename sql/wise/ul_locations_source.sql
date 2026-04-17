    SELECT lh.locn_hdr_id
         , lh.locn_id
         , lh.facility_id
         , lh.locn_class
         , lh.dsp_locn
         , lh.pick_detrm_zone
      FROM locn_hdr lh
     WHERE lh.locn_class IS NOT NULL
       AND lh.dsp_locn IS NOT NULL
  ORDER BY 3, 5