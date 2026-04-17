 INSERT INTO inventory (inventory_date, facility_id, locn_hdr_id, item_id, tc_lpn_id, batch_nbr, onhand_qty, onhand_cost)
      VALUES ?
ON DUPLICATE KEY UPDATE onhand_qty = VALUES(onhand_qty), onhand_cost = VALUES(onhand_cost)