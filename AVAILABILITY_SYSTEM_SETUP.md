# Availability System Setup Guide

## 🎯 Overview

This system ensures that when a customer books a time slot, it becomes unavailable for other customers. It includes:

- **Real-time availability checking** before booking
- **Automatic time slot blocking** when appointments are created
- **Dynamic time slot generation** based on barber's schedule and existing appointments
- **Schedule exception handling** for holidays and special days

## 🚀 Setup Instructions

### 1. Create Database Schema

Run the SQL script to create the availability tables:

```sql
-- Run this in your Supabase SQL editor
\i setup-availability-schema.sql
```

Or manually execute:

```sql
-- Create barber availability table
CREATE TABLE IF NOT EXISTS barber_availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  barber_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6) NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(barber_id, day_of_week)
);

-- Create schedule exceptions table
CREATE TABLE IF NOT EXISTS schedule_exceptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  barber_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT false,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(barber_id, date)
);

-- Enable RLS and create policies
ALTER TABLE barber_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule_exceptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for barber_availability
CREATE POLICY "Barbers can manage their own availability" ON barber_availability
  FOR ALL USING (auth.uid() = barber_id);

CREATE POLICY "Anyone can view barber availability" ON barber_availability
  FOR SELECT USING (true);

-- RLS policies for schedule_exceptions
CREATE POLICY "Barbers can manage their own schedule exceptions" ON schedule_exceptions
  FOR ALL USING (auth.uid() = barber_id);

CREATE POLICY "Anyone can view schedule exceptions" ON schedule_exceptions
  FOR SELECT USING (true);

-- Insert default availability for the barber
INSERT INTO barber_availability (barber_id, day_of_week, start_time, end_time, is_available)
SELECT 
  p.id,
  day_num,
  '09:00:00'::time,
  '18:00:00'::time,
  true
FROM profiles p
CROSS JOIN generate_series(1, 5) AS day_num -- Monday to Friday
WHERE p.role = 'barber'
ON CONFLICT (barber_id, day_of_week) DO NOTHING;
```

### 2. Verify Setup

Check that the tables were created and populated:

```sql
-- Check barber availability
SELECT * FROM barber_availability;

-- Check schedule exceptions
SELECT * FROM schedule_exceptions;

-- Check if barber profile exists
SELECT * FROM profiles WHERE role = 'barber';
```

## 🔧 How It Works

### **Time Slot Generation Process:**

1. **Get Barber's Weekly Schedule** - Retrieves working hours for each day
2. **Check Schedule Exceptions** - Looks for holidays or special hours
3. **Get Existing Appointments** - Fetches already booked time slots
4. **Generate Available Slots** - Creates 30-minute slots excluding conflicts
5. **Return Available Times** - Provides list of bookable time slots

### **Booking Process:**

1. **Customer Selects Date & Service** - Triggers availability check
2. **System Generates Available Times** - Shows only free time slots
3. **Customer Selects Time** - Chooses from available options
4. **Final Availability Check** - Verifies slot is still free before booking
5. **Appointment Created** - Time slot becomes unavailable for others

### **Conflict Prevention:**

- **Real-time Checking** - Verifies availability before each booking
- **Service Duration Consideration** - Blocks time based on service length
- **Automatic Blocking** - Booked slots immediately become unavailable
- **Error Handling** - Shows error if slot becomes unavailable during booking

## 🧪 Testing the System

### **Test 1: Basic Availability**
1. **Open booking screen** and select a service
2. **Select a date** (should show available times)
3. **Verify time slots** are generated correctly
4. **Book an appointment** and confirm it's created

### **Test 2: Time Slot Blocking**
1. **Book an appointment** for a specific time
2. **Try to book another appointment** for the same time
3. **Verify the time slot** is no longer available
4. **Check error message** if trying to book conflicting time

### **Test 3: Service Duration**
1. **Book a 60-minute service** (e.g., Premium Package)
2. **Check that 2 time slots** are blocked (e.g., 2:00 PM and 2:30 PM)
3. **Verify shorter services** can still book adjacent slots

### **Test 4: Schedule Exceptions**
1. **Add a schedule exception** for a specific date
2. **Check availability** for that date
3. **Verify exception** is respected (no availability or different hours)

## 📱 User Experience

### **For Customers:**
- ✅ **Only see available times** - No confusion about availability
- ✅ **Real-time updates** - Slots disappear as they're booked
- ✅ **Clear error messages** - Know when a slot becomes unavailable
- ✅ **Service-aware scheduling** - Longer services block more time

### **For Barbers:**
- ✅ **Automatic schedule management** - No double bookings
- ✅ **Flexible availability** - Set different hours per day
- ✅ **Exception handling** - Block days or change hours easily
- ✅ **Service duration awareness** - System handles different service lengths

## 🔍 Key Features

### **AvailabilityService Methods:**
- `getBarberAvailability()` - Get weekly schedule
- `getScheduleExceptions()` - Get date-specific exceptions
- `getAvailableTimeSlots()` - Generate available times
- `isTimeSlotAvailable()` - Check specific slot availability

### **Database Tables:**
- `barber_availability` - Weekly working hours
- `schedule_exceptions` - Special dates and hours
- `appointments` - Existing bookings (used for conflict detection)

### **Integration Points:**
- `BookScreen` - Uses real availability instead of mock data
- `AppointmentService` - Checks availability before creating appointments
- `AvailabilityService` - Handles all availability logic

## 🚨 Troubleshooting

### **Issue: No available times showing**
**Check:**
1. Barber profile exists with `role = 'barber'`
2. `barber_availability` table has entries
3. Selected date is within working hours
4. No schedule exceptions blocking the date

### **Issue: Time slots not blocking after booking**
**Check:**
1. Appointment was created successfully
2. `appointment_time` and `service_duration` are correct
3. Appointment status is 'scheduled' or 'confirmed'
4. Barber ID matches in both tables

### **Issue: Error "time slot no longer available"**
**This is expected behavior** - it means another customer booked the slot first. The system is working correctly by preventing double bookings.

## 🎉 Success Indicators

- ✅ **Available times generate** based on barber's schedule
- ✅ **Booked slots disappear** from available options
- ✅ **Service duration blocks** appropriate time slots
- ✅ **Error messages show** when slots become unavailable
- ✅ **No double bookings** occur
- ✅ **Schedule exceptions** are respected

## 📋 Next Steps

1. **Run the SQL setup** to create the availability tables
2. **Test booking flow** to verify time slots are generated
3. **Book multiple appointments** to test conflict prevention
4. **Add schedule exceptions** to test special date handling
5. **Verify barber dashboard** shows correct availability

The availability system is now fully integrated and will prevent double bookings while providing a smooth user experience!
