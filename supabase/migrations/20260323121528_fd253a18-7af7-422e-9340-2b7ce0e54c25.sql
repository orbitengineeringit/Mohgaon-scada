INSERT INTO public.mqtt_config (broker_url, auto_connect, oht_topic, oht_topic_2, oht_topic_3, intake_topic, wtp_topic)
VALUES (
  'wss://broker.hivemq.com:8884/mqtt',
  true,
  'Orbit/BuaBicchiya/OHT0000000001',
  'Orbit/BuaBicchiya/OHT0000000002',
  'Orbit/BuaBicchiya/OHT0000000003',
  'Orbit/BuaBicchiya/INTAKE0000001',
  'Orbit/BuaBicchiya/WTP0000000001'
);

INSERT INTO public.plant_config (plant_name)
VALUES ('Bua Bicchiya SCADA');