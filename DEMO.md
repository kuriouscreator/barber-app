# Barber App Demo Guide

## Quick Demo Flow

### 1. Authentication
- **Login**: Use any email/password to log in (demo mode)
- **Register**: Create a new account with name, email, phone

### 2. Subscription Selection
- Navigate to Profile → Manage Subscription
- Choose from 3 plans:
  - **Basic**: $29.99/month - 1 haircut
  - **Premium**: $79.99/month - 3 haircuts  
  - **Elite**: $149.99/month - 6 haircuts
- Pay with Apple Pay (simulated)

### 3. Booking an Appointment
- Go to Book tab
- Select service (Classic Haircut, Beard Trim, etc.)
- Choose available date (next 14 days)
- Pick time slot
- Confirm booking

### 4. Check-in Process
- On appointment day, go to appointment details
- Tap "I've arrived" when at barbershop
- Wait for barber approval
- Credit deducted on approval

### 5. Admin Features
- Switch to Admin tab
- View pending check-ins
- Approve/reject client check-ins
- See today's schedule
- Manage subscriptions

## Key Features to Highlight

### 🎨 **Modern Design**
- Clean, minimal interface
- Black, white, and cool gray color scheme
- Professional typography
- Intuitive navigation

### 💳 **Payment Integration**
- Apple Pay on iOS
- Google Pay on Android (simulated)
- Secure payment processing
- Transaction confirmation

### 📅 **Smart Booking**
- Real-time availability
- Service selection
- Time slot management
- Appointment confirmation

### ✅ **Check-in System**
- Location-based check-in
- Barber approval workflow
- Credit management
- Status tracking

### 👨‍💼 **Admin Dashboard**
- Pending check-ins management
- Daily schedule view
- Subscription analytics
- Quick actions

## Demo Data

The app includes realistic mock data:
- **Barber**: Marcus Johnson
- **Services**: Classic Haircut, Beard Trim, Haircut + Beard, Styling
- **Availability**: Monday-Friday 9AM-5PM, Saturday 10AM-3PM
- **Sample Appointments**: Various statuses and times

## Technical Highlights

- **TypeScript**: Full type safety
- **React Navigation**: Smooth navigation flow
- **Context API**: Centralized state management
- **Custom Theming**: Consistent design system
- **Modular Architecture**: Scalable code structure
- **Payment Integration**: Apple/Google Pay support

## Testing Scenarios

1. **New User Flow**: Register → Subscribe → Book → Check-in
2. **Returning User**: Login → View credits → Book appointment
3. **Admin Flow**: View check-ins → Approve/reject → Manage schedule
4. **Payment Flow**: Select plan → Process payment → Confirm subscription
5. **Error Handling**: Invalid inputs, payment failures, network issues

## Performance Notes

- Fast navigation between screens
- Smooth animations and transitions
- Responsive design for all screen sizes
- Efficient state management
- Optimized component rendering
