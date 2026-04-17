INSERT INTO shipment_receive_store (dc_code, facility_code, shipment_id, shipment_number, shipment_date, receive_date)
VALUES ?
ON DUPLICATE KEY UPDATE dc_code = VALUES(dc_code), facility_code = VALUES(facility_code), shipment_number = VALUES(shipment_number), shipment_date = VALUES(shipment_date), receive_date = VALUES(receive_date)