 INSERT INTO locations (locn_hdr_id, locn_id, facility_id, locn_class, dsp_locn, pick_detrm_zone)
      VALUES ?
ON DUPLICATE KEY UPDATE locn_id = VALUES(locn_id), facility_id = VALUES(facility_id), locn_class = VALUES(locn_class), dsp_locn = VALUES(dsp_locn), pick_detrm_zone = VALUES(pick_detrm_zone)