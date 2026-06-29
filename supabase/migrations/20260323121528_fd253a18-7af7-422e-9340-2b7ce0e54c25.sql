INSERT INTO public.mqtt_config (broker_url, auto_connect, oht_topic, oht_topic_2, oht_topic_3, intake_topic, wtp_topic)
VALUES (
  'wss://broker.hivemq.com:8884/mqtt',
  true,
  'Orbit/MOHGAON/OHT01/0000000001',
  'Orbit/MOHGAON/OHT02/0000000001',
  'Orbit/MOHGAON/OHT03/0000000001',
  'Orbit/MOHGAON/INTAKE/0000000001',
  'Orbit/MOHGAON/WTP/0000000001'
);

INSERT INTO public.plant_config (plant_name)
VALUES ('Mohgaon SCADA');