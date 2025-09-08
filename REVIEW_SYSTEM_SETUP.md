# Review System Setup Guide

This guide explains how to set up the complete review system with persistent storage in Supabase.

## 🎯 Features Implemented

### ✅ Review Submission
- **Star Rating**: 1-5 star rating system
- **Text Review**: Optional detailed feedback
- **Photo Upload**: Real photo upload to Supabase Storage
- **Form Validation**: Rating is required, text and photos are optional

### ✅ Review Display
- **Barber Profile**: Shows all reviews with real-time stats
- **Appointment Cards**: Display reviews on past appointments
- **Real-time Updates**: Reviews appear immediately after submission

### ✅ Backend Integration
- **Supabase Storage**: Review photos stored in `review-photos` bucket
- **Database Persistence**: Reviews stored in `appointments` table
- **RLS Security**: Proper row-level security policies

## 🚀 Setup Instructions

### 1. Create Review Photos Storage Bucket

Run the SQL script to create the storage bucket and policies:

```sql
-- Run this in your Supabase SQL editor
\i setup-review-storage.sql
```

Or manually execute:

```sql
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
```

### 2. Verify Database Schema

Ensure your `appointments` table has the review columns:

```sql
-- Check if review columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
AND column_name IN ('rating', 'review_text', 'review_photo_url');
```

If missing, add them:

```sql
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5),
ADD COLUMN IF NOT EXISTS review_text TEXT,
ADD COLUMN IF NOT EXISTS review_photo_url TEXT;
```

### 3. Test the Review Flow

1. **Book an appointment** through the app
2. **Go to Appointments tab** and find your appointment
3. **Click "Review"** on a past appointment
4. **Submit a review** with:
   - Star rating (required)
   - Text feedback (optional)
   - Photo upload (optional)
5. **Navigate to barber profile** to see your review displayed

## 🔧 Technical Implementation

### Review Submission Flow

1. **User clicks "Review"** on appointment card
2. **ReviewModal opens** with form
3. **User selects rating** (required)
4. **User adds text** (optional)
5. **User uploads photo** (optional) → stored in Supabase Storage
6. **Form submission** → calls `AppointmentService.submitReview()`
7. **Database update** → marks appointment as completed + stores review
8. **Navigation** → redirects to barber profile
9. **UI refresh** → shows updated review

### Data Flow

```
ReviewModal → AppointmentService.submitReview() → Supabase appointments table
     ↓
Photo Upload → Supabase Storage (review-photos bucket)
     ↓
BarberProfileScreen → ReviewService.getBarberReviews() → Display reviews
```

### Key Files

- **`src/components/ReviewModal.tsx`** - Review submission UI
- **`src/services/AppointmentService.ts`** - Review submission logic
- **`src/services/ReviewService.ts`** - Review fetching logic
- **`src/services/storage.ts`** - Photo upload functionality
- **`src/screens/BarberProfileScreen.tsx`** - Review display
- **`setup-review-storage.sql`** - Storage bucket setup

## 🎨 UI Features

### Review Modal
- **Star Rating**: Interactive 1-5 star selection
- **Text Input**: Multi-line text area for feedback
- **Photo Upload**: Real camera roll integration
- **Form Validation**: Rating required, others optional
- **Loading States**: Proper error handling

### Barber Profile
- **Real-time Stats**: Average rating and total reviews
- **Review Cards**: Individual review display with photos
- **Loading States**: Shows loading while fetching
- **Empty States**: Handles no reviews gracefully
- **Pagination**: Show more/less reviews

### Appointment Cards
- **Review Display**: Shows star rating for reviewed appointments
- **Review Button**: Only shows for unreviewed past appointments
- **Status Updates**: Automatically marks as completed after review

## 🔒 Security

- **RLS Policies**: Users can only review their own appointments
- **Storage Security**: Photos are properly secured with RLS
- **Authentication**: All operations require valid user session
- **Data Validation**: Rating must be 1-5, text is optional

## 🧪 Testing

### Manual Testing Checklist

- [ ] Can submit review with rating only
- [ ] Can submit review with rating + text
- [ ] Can submit review with rating + text + photo
- [ ] Photo upload works correctly
- [ ] Review appears on barber profile immediately
- [ ] Review stats update correctly
- [ ] Cannot review same appointment twice
- [ ] Only past appointments show review button
- [ ] Form validation works (rating required)
- [ ] Error handling works for failed uploads

### Test Data

Create test appointments and reviews:

```sql
-- Create a test appointment with review
UPDATE appointments 
SET 
  rating = 5,
  review_text = 'Amazing haircut! Highly recommend.',
  review_photo_url = 'https://example.com/photo.jpg',
  status = 'completed'
WHERE id = 'your-appointment-id';
```

## 🚨 Troubleshooting

### Common Issues

1. **"No reviews yet" showing**: Check if barber has reviews in database
2. **Photo upload fails**: Verify storage bucket exists and RLS policies are correct
3. **Review not appearing**: Check appointment status is 'completed'
4. **Permission errors**: Ensure user is authenticated and has proper RLS access

### Debug Steps

1. Check Supabase logs for errors
2. Verify storage bucket exists: `SELECT * FROM storage.buckets WHERE id = 'review-photos'`
3. Check RLS policies: `SELECT * FROM pg_policies WHERE tablename = 'appointments'`
4. Test review submission in Supabase dashboard

## 🎉 Success!

Your review system is now fully functional with:
- ✅ Persistent review storage
- ✅ Real photo uploads
- ✅ Real-time review display
- ✅ Proper security policies
- ✅ Complete user experience

Users can now leave detailed reviews with photos, and barbers can see all their reviews with real-time statistics!
