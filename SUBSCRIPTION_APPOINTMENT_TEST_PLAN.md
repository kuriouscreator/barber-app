# Subscription-Appointment Connection Test Plan

## 🎯 **Testing the New Cut Tracking System**

### **Phase 1: Database Function Tests**

1. **Run the test queries** in `test-functions.sql` in your Supabase SQL Editor
2. **Verify you have**:
   - At least one user with an active subscription
   - The new database functions are working

### **Phase 2: App Integration Tests**

#### **Test 1: Booking with Available Cuts**
1. Open the app and go to the Book screen
2. Check that the footer shows "Cuts remaining: X" (where X > 0)
3. Select a service, date, and time
4. Verify the "Confirm Booking" button is enabled
5. Book the appointment
6. **Expected**: Appointment created successfully, cuts remaining decreases by 1

#### **Test 2: Booking with No Cuts Remaining**
1. If you have 0 cuts remaining, try to book an appointment
2. **Expected**: 
   - "Confirm Booking" button shows "No Cuts Remaining" and is disabled
   - Footer shows "Cuts remaining: 0" in red
   - If you somehow try to book, you get an error message with upgrade options

#### **Test 3: Cancellation with Cut Restoration**
1. Book an appointment (if you have cuts available)
2. Go to Appointments screen and cancel the appointment
3. **Expected**: 
   - Appointment is cancelled
   - If enough days remain in billing period (≥7 days), cuts are restored
   - You can now book another appointment

#### **Test 4: Cancellation without Cut Restoration**
1. If your subscription period ends in less than 7 days, cancel an appointment
2. **Expected**: 
   - Appointment is cancelled
   - Cuts are NOT restored (prevents abuse)
   - You still cannot book new appointments

### **Phase 3: Edge Cases**

#### **Test 5: Multiple Appointments**
1. If you have a plan with multiple cuts (e.g., 4 cuts/month)
2. Book multiple appointments
3. **Expected**: Each appointment uses 1 cut, remaining cuts decrease accordingly

#### **Test 6: Subscription Renewal**
1. Wait for subscription period to renew (or manually update in database)
2. **Expected**: Cuts reset to full amount, you can book again

### **Phase 4: UI/UX Verification**

#### **Test 7: Visual Feedback**
1. Check that remaining cuts are clearly displayed
2. Verify color coding (red when 0 cuts, normal when > 0)
3. Confirm button states change appropriately
4. Error messages are helpful and actionable

## 🐛 **Troubleshooting**

### **Common Issues:**

1. **"Function does not exist" errors**
   - Make sure you ran the `connect-subscriptions-appointments.sql` script
   - Check that all functions were created successfully

2. **"No cuts remaining" but you should have cuts**
   - Check your subscription status in the database
   - Verify the `user_subscriptions` table has correct data
   - Check if you have upcoming appointments that are consuming cuts

3. **App not showing remaining cuts**
   - Check browser/app console for errors
   - Verify the `AppointmentService.getRemainingCuts()` function is working
   - Check network requests in developer tools

### **Database Queries for Debugging:**

```sql
-- Check user's subscription status
SELECT * FROM public.user_subscription_status WHERE user_id = 'YOUR_USER_ID';

-- Check user's appointments
SELECT * FROM appointments WHERE user_id = 'YOUR_USER_ID' ORDER BY appointment_date DESC;

-- Test remaining cuts function
SELECT public.get_user_remaining_cuts('YOUR_USER_ID'::UUID);
```

## ✅ **Success Criteria**

The system is working correctly when:
- [ ] Users can only book appointments when they have remaining cuts
- [ ] Remaining cuts are accurately calculated and displayed
- [ ] Cancellations restore cuts when appropriate
- [ ] UI provides clear feedback about cut availability
- [ ] Error messages are helpful and guide users to solutions
- [ ] No database errors or app crashes occur

## 🚀 **Next Steps After Testing**

Once testing is complete:
1. **Deploy to production** (if testing passes)
2. **Update user documentation** about the new cut system
3. **Monitor usage** to ensure the system works as expected
4. **Gather user feedback** and iterate if needed
