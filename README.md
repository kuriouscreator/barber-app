# 💈 Barber App - React Native

A sleek, modern React Native mobile app for barber clients with subscription management, booking, and check-in features.

![Barber App](https://img.shields.io/badge/React%20Native-0.79.5-blue) ![Expo](https://img.shields.io/badge/Expo-53.0.22-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## 🚀 Quick Start Guide

### Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** or **yarn** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)
- **Expo CLI** (we'll install this in the setup)

### 📱 For Mobile Testing

You'll also need:
- **iPhone** with **Expo Go** app (from App Store)
- **Android phone** with **Expo Go** app (from Google Play Store)

## 🛠️ Installation & Setup

### Step 1: Clone the Repository

```bash
git clone <your-repo-url>
cd barber-app
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Install Expo CLI (if not already installed)

```bash
npm install -g @expo/cli
```

### Step 4: Start the Development Server

```bash
npx expo start
```

You should see output like this:
```
Starting project at /path/to/barber-app
Starting Metro Bundler
▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
█ ▄▄▄▄▄ █▄▀▀▄▀█▀█ █▄█ ██▀ █
█ █   █ █ ▄▄█▄▄ ▄▄▄  ▄ █  █
█ █▄▄▄█ █▀███▄█ █▄▀▀▀▄█   █
█▄▄▄▄▄▄▄█▄████▄▄▄▄▄▄▄▄███▄█

› Metro waiting on exp://192.168.1.100:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

## 📱 Testing on Your Phone

### Option 1: iPhone (Recommended)

1. **Download Expo Go** from the App Store
2. **Open your iPhone Camera** app
3. **Scan the QR code** displayed in your terminal
4. **Tap the notification** that appears to open the app in Expo Go

### Option 2: Android

1. **Download Expo Go** from Google Play Store
2. **Open the Expo Go app**
3. **Tap "Scan QR Code"**
4. **Scan the QR code** from your terminal

### Option 3: iOS Simulator (Mac only)

1. **Press `i`** in the terminal where Expo is running
2. This will automatically open the iOS Simulator

### Option 4: Android Emulator

1. **Press `a`** in the terminal where Expo is running
2. Make sure you have Android Studio and an emulator set up

## 🎮 Demo Mode Instructions

The app runs in **demo mode** with realistic mock data. Here's how to test all features:

### 1. Login
- **Use any email and password** (e.g., `demo@example.com` / `password123`)
- The app will automatically log you in

### 2. Choose a Subscription
- Go to **Profile** → **Manage Subscription**
- Select from 3 plans:
  - **Basic**: $29.99/month - 1 haircut
  - **Premium**: $79.99/month - 3 haircuts
  - **Elite**: $149.99/month - 6 haircuts
- **Test Apple Pay** (simulated payment)

### 3. Book an Appointment
- Tap **"Book Appointment"** on the Home screen
- **Select a service** (Classic Haircut, Beard Trim, etc.)
- **Choose a date** (next 14 days available)
- **Pick a time slot** (auto-scrolls to next section)
- **Add special requests** (optional)
- **Confirm your booking** (automatically navigates to Appointments tab)

### 4. Manage Appointments
- **View Appointments Tab** - See upcoming and past appointments
- **Reschedule** - Change date/time of upcoming appointments
- **Cancel** - Cancel appointments with automatic credit restoration
- **Review** - Rate and review past appointments
- **Rebook** - Quick rebook from past appointments

### 5. Test Check-in Feature
- After booking, you can test the check-in process
- Tap **"I've arrived"** when at the barbershop
- Wait for barber approval

### 6. Admin Features
- Switch to the **Admin tab**
- View **pending check-ins**
- **Approve or reject** client check-ins
- See **today's schedule**

## 🏗️ Project Structure

```
barber-app/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── AppointmentCard.tsx      # Reusable appointment display
│   │   ├── PaymentButton.tsx        # Payment processing component
│   │   ├── ScheduleManagementModal.tsx
│   │   ├── ServiceAddModal.tsx
│   │   └── ServiceEditModal.tsx
│   ├── context/            # React Context for state management
│   │   └── AppContext.tsx
│   ├── data/               # Mock data and constants
│   │   └── mockData.ts
│   ├── navigation/         # Navigation configuration
│   │   └── AppNavigator.tsx
│   ├── screens/            # App screens
│   │   ├── LoginScreen.tsx         # Authentication
│   │   ├── RegisterScreen.tsx      # User registration
│   │   ├── HomeScreen.tsx          # Dashboard with appointments
│   │   ├── BookScreen.tsx          # Booking/rescheduling flow
│   │   ├── AppointmentsScreen.tsx  # Dedicated appointments tab
│   │   ├── ProfileScreen.tsx       # User profile & settings
│   │   ├── AdminScreen.tsx         # Barber admin interface
│   │   ├── SubscriptionScreen.tsx  # Subscription management
│   │   └── CheckInScreen.tsx       # Check-in functionality
│   ├── services/           # Business logic services
│   │   ├── PaymentService.ts       # Payment processing
│   │   └── AppointmentService.ts   # Appointment management
│   ├── theme/              # Design system
│   │   ├── colors.ts               # Color palette
│   │   ├── typography.ts           # Font system
│   │   ├── spacing.ts              # Spacing & layout
│   │   └── index.ts                # Theme exports
│   └── types/              # TypeScript definitions
│       └── index.ts                # Type definitions
├── App.tsx                 # Main app component
├── package.json
└── README.md
```

## 🎨 Design System

### Colors
- **Primary**: Black (#000000)
- **Secondary**: White (#FFFFFF)
- **Grays**: Cool-toned grays (#F8FAFC to #0F172A)
- **Accents**: Blue (#3B82F6), Success (#10B981), Warning (#F59E0B), Error (#EF4444)

### Typography
- **Font Family**: System fonts
- **Sizes**: 12px to 48px scale
- **Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)

## 🔧 Development Commands

```bash
# Start development server
npx expo start

# Start with iOS simulator
npx expo start --ios

# Start with Android emulator
npx expo start --android

# Start web version
npx expo start --web

# Clear cache and start
npx expo start --clear

# Type checking
npx tsc --noEmit

# Install dependencies
npm install
```

## 📱 Features

### ✅ Completed Features

#### 🔐 Authentication & User Management
- **Authentication System** - Login/register with demo mode
- **User Profiles** - Complete profile management with preferences
- **Role-based Access** - Customer and barber/admin views

#### 💳 Subscription & Payment System
- **Subscription Management** - 3-tier system with credit tracking
- **Payment Integration** - Apple Pay/Google Pay support
- **Credit System** - Automatic credit deduction and restoration
- **Billing Management** - Payment method updates and billing history

#### 📅 Advanced Booking System
- **Service Selection** - Multiple service types with pricing
- **Smart Scheduling** - 14-day availability with time slot management
- **Rescheduling** - Full reschedule functionality with credit restoration
- **Rebooking** - Quick rebook from past appointments
- **Auto-scroll Booking Flow** - App-like guided booking experience
- **Special Requests** - Custom requests and quick-tag options

#### 📋 Appointment Management
- **Dedicated Appointments Tab** - Upcoming and past appointment views
- **Appointment Cards** - Reusable, consistent appointment display
- **Cancel Appointments** - With automatic credit restoration
- **Review System** - Rate and review past appointments
- **Appointment History** - Complete booking history tracking

#### 🏠 Enhanced Home Experience
- **Dashboard Overview** - Upcoming appointments and quick actions
- **Stats Cards** - Cuts remaining and days left display
- **Plan Management** - Quick access to subscription details
- **Modern Card Design** - Consistent styling throughout

#### 🎨 Modern UI/UX Design
- **Responsive Design** - Optimized for all screen sizes
- **Consistent Styling** - Unified design system with proper spacing
- **Linear Gradient Buttons** - Modern, eye-catching primary actions
- **Pill-shaped Elements** - Rounded buttons and input fields
- **Proper Typography** - Consistent font weights and sizes
- **Card-based Layout** - Clean, organized information display

#### 🔧 Technical Features
- **TypeScript Integration** - Full type safety throughout
- **Reusable Components** - Modular, maintainable code structure
- **Service Layer Architecture** - Centralized appointment management
- **Navigation Flow** - Seamless screen transitions
- **State Management** - React Context for global state
- **Mock Data System** - Realistic demo data for testing

### 🔮 Future Enhancements

- Real backend integration
- Push notifications
- Advanced analytics
- Multi-barber support
- Service customization
- Loyalty programs

## 🛡️ Security & Privacy

- No real payment processing (demo mode)
- No sensitive data stored
- All API calls are simulated
- Mock data only

## 🐛 Troubleshooting

### Common Issues

**"Metro bundler failed to start"**
```bash
npx expo start --clear
```

**"Unable to resolve module"**
```bash
rm -rf node_modules
npm install
```

**"Expo Go can't connect"**
- Make sure your phone and computer are on the same WiFi network
- Try restarting the Expo server

**"iOS Simulator not opening"**
```bash
xcrun simctl list devices
xcrun simctl boot "iPhone 16 Pro"
open -a Simulator
```

### Getting Help

- Check the [Expo documentation](https://docs.expo.dev/)
- Visit [React Navigation docs](https://reactnavigation.org/)
- Open an issue in this repository

## 📄 License

This project is for demonstration purposes. All rights reserved.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

**Happy coding! 🚀**

For questions or support, please open an issue in this repository.