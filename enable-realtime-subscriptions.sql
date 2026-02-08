-- Enable Realtime for user_subscriptions table
-- This allows the app to listen for real-time changes when webhooks update subscription data

-- Enable Realtime for the user_subscriptions table
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_subscriptions;

-- Verify the table is enabled for Realtime
SELECT schemaname, tablename, hasindexes, hasrules, hastriggers 
FROM pg_tables 
WHERE tablename = 'user_subscriptions';

-- Check if the table is in the Realtime publication
SELECT schemaname, tablename 
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime' 
AND tablename = 'user_subscriptions';

