-- Create review-photos storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for review-photos bucket
CREATE POLICY "Anyone can view review photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-photos');

CREATE POLICY "Authenticated users can upload review photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'review-photos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Users can update their own review photos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'review-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own review photos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'review-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
