-- Add unique constraint for aggregate upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_historian_aggregates_unique 
ON public.historian_aggregates (tag_config_id, bucket_start, bucket_size);
