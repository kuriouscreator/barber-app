# Appointments Setup Guide

This guide will help you set up persistent appointments in Supabase for the barber app.

## 1. Database Setup

Run the SQL script to create the appointments table and sample data:

```sql
-- Copy and paste the contents of setup-appointments-schema.sql into your Supabase SQL editor
```

Or run it directly in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `setup-appointments-schema.sql`
4. Click "Run" to execute the script

## 2. What the Script Creates

### Tables
- **appointments**: Main table for storing appointment data
- **appointment_details**: View that joins appointments with user and barber information

### Features
- Row Level Security (RLS) policies for data protection
- Automatic timestamp updates
- Sample data for testing
- Proper indexes for performance

### RLS Policies
- Users can only view/edit their own appointments
- Barbers can view/edit appointments assigned to them
- Secure data access based on user roles

## 3. Sample Data

The script includes sample appointments for testing:
- 2 upcoming appointments for the customer
- 2 past appointments (one with a review)
- Proper relationships with demo users

## 4. Testing the Integration

After running the setup script:

1. **Sign in as customer**: `customer@demo.com` / `customer123`
2. **Check appointments**: Go to the Appointments tab to see persistent data
3. **Book new appointment**: Create a new appointment and verify it persists
4. **Cancel appointment**: Test cancellation functionality
5. **Submit review**: Test review submission for past appointments

## 5. Key Features

### Appointment Management
- ✅ Create new appointments
- ✅ Update appointment details
- ✅ Cancel appointments
- ✅ Submit reviews and ratings
- ✅ View appointment history

### Data Persistence
- ✅ All appointments stored in Supabase
- ✅ Automatic user association
- ✅ Secure access controls
- ✅ Real-time updates

### Integration
- ✅ Works with existing UI components
- ✅ Maintains backward compatibility
- ✅ Handles both new and legacy appointment formats

## 6. API Methods

The `AppointmentService` provides these methods:

```typescript
// Get all user appointments
AppointmentService.getUserAppointments()

// Create new appointment
AppointmentService.createAppointment(appointmentData)

// Update appointment
AppointmentService.updateAppointment(appointmentId, updateData)

// Cancel appointment
AppointmentService.cancelAppointment(appointmentId)

// Submit review
AppointmentService.submitReview(appointmentId, rating, reviewText, reviewPhotoUrl)

// Get upcoming appointments
AppointmentService.getUpcomingAppointments()

// Get past appointments
AppointmentService.getPastAppointments()
```

## 7. Troubleshooting

### Common Issues

1. **"No barber found" error**
   - Ensure you have a barber user in your profiles table
   - Run the database setup script first

2. **RLS policy errors**
   - Check that RLS policies are properly set up
   - Verify user authentication

3. **Appointment not showing**
   - Check that the appointment was created successfully
   - Verify user_id matches the authenticated user

### Verification Queries

Check if appointments exist:
```sql
SELECT * FROM appointments;
```

Check RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'appointments';
```

Check sample data:
```sql
SELECT * FROM appointment_details;
```

## 8. Next Steps

After setting up appointments:

1. **Test all appointment flows** in the app
2. **Verify data persistence** across app restarts
3. **Test with multiple users** to ensure data isolation
4. **Consider adding more features** like appointment reminders, rescheduling, etc.

The appointments system is now fully integrated with Supabase and ready for production use!
