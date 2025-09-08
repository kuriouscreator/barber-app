# Photo Upload Debug Guide

## 🎯 Issues Fixed

### ✅ Mock Data Removed
- **BarberProfileScreen** now only shows real reviews from database
- **No more fallback** to mock data when there are errors
- **Clean display** of only persisted reviews

### ✅ Photo Upload Debugging Added
- **Console logging** for photo upload process
- **Error handling** for image loading
- **Upload progress tracking** in storage service

## 🧪 Testing Photo Upload

### Step 1: Check Storage Bucket
Run this in your Supabase SQL editor:

```sql
-- Check if review-photos bucket exists
SELECT * FROM storage.buckets WHERE id = 'review-photos';

-- If no results, create the bucket:
INSERT INTO storage.buckets (id, name, public) 
VALUES ('review-photos', 'review-photos', true);
```

### Step 2: Test Photo Upload
1. **Open the app** and login as customer
2. **Go to Appointments tab**
3. **Click "Review"** on a past appointment
4. **Add a photo** by clicking "Add Photo"
5. **Check console logs** for upload progress:
   - "Starting photo upload for appointment: [ID]"
   - "Uploading to path: reviews/[ID]/[timestamp].jpg"
   - "Photo uploaded successfully, public URL: [URL]"

### Step 3: Verify Photo Display
1. **Submit the review** with the photo
2. **Check barber profile** to see if photo appears
3. **Look for console logs**:
   - "Rendering photos: [array of URLs]"
   - "Image loaded successfully: [URL]"

## 🔧 Troubleshooting

### Issue: "Bucket not found" Error
**Solution**: Create the storage bucket:
```sql
INSERT INTO storage.buckets (id, name, public) 
VALUES ('review-photos', 'review-photos', true);
```

### Issue: "Permission denied" Error
**Solution**: Check RLS policies:
```sql
-- Check if policies exist
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%review-photos%';

-- If missing, create policies:
CREATE POLICY "Anyone can view review photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'review-photos');

CREATE POLICY "Authenticated users can upload review photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'review-photos' 
    AND auth.role() = 'authenticated'
  );
```

### Issue: Photo Not Displaying
**Check**:
1. **Console logs** - Look for "Image load error" messages
2. **Network tab** - Check if image URL is accessible
3. **Storage bucket** - Verify file exists in Supabase dashboard

### Issue: Photo Upload Fails
**Check**:
1. **Console logs** - Look for "Storage upload error" messages
2. **File size** - Large images might fail
3. **Network connection** - Ensure stable internet

## 📱 Testing Checklist

- [ ] Storage bucket exists (`review-photos`)
- [ ] RLS policies are set up correctly
- [ ] Photo picker opens successfully
- [ ] Photo upload completes without errors
- [ ] Photo displays in review modal
- [ ] Photo appears on barber profile after submission
- [ ] No mock data shows in barber profile
- [ ] Console logs show successful upload

## 🎯 Expected Behavior

### Photo Upload Flow:
1. **User clicks "Add Photo"** → Image picker opens
2. **User selects photo** → Photo uploads to Supabase Storage
3. **Upload completes** → Photo appears in review modal
4. **User submits review** → Photo URL saved to database
5. **Review displays** → Photo shows on barber profile

### Console Logs to Look For:
```
Starting photo upload for appointment: [appointment-id]
Uploading to path: reviews/[appointment-id]/[timestamp].jpg
Photo uploaded successfully, public URL: [supabase-url]
Rendering photos: [array-of-urls]
Image loaded successfully: [supabase-url]
```

## 🚨 Common Issues

### 1. Bucket Not Created
**Error**: `Bucket 'review-photos' not found`
**Fix**: Run the bucket creation SQL

### 2. Permission Denied
**Error**: `new row violates row-level security policy`
**Fix**: Check and create RLS policies

### 3. Photo Not Displaying
**Error**: Image fails to load
**Fix**: Check if URL is accessible and file exists

### 4. Upload Fails
**Error**: Network or storage error
**Fix**: Check internet connection and file size

## 🎉 Success Indicators

- ✅ **No mock data** in barber profile
- ✅ **Photos upload** without errors
- ✅ **Photos display** in review modal
- ✅ **Photos persist** on barber profile
- ✅ **Console logs** show successful flow
- ✅ **Storage bucket** contains uploaded files

## 📋 Next Steps

1. **Test the complete flow** with photo upload
2. **Check console logs** for any errors
3. **Verify photos** appear on barber profile
4. **Remove debug logs** once everything works
5. **Test with multiple photos** if needed

The photo upload system should now work correctly with proper debugging and no mock data interference!
