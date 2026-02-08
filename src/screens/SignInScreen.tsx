import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { borderRadius } from '../theme/index';
import { BUSINESS_INFO } from '../constants/business';
import { RewardsService } from '../services/RewardsService';

const SignInScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showReferralField, setShowReferralField] = useState(false);
  const [referralCodeValid, setReferralCodeValid] = useState<boolean | null>(null);
  const [validatingReferral, setValidatingReferral] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [fullNameFocused, setFullNameFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [referralCodeFocused, setReferralCodeFocused] = useState(false);
  const [pendingEmailConfirmation, setPendingEmailConfirmation] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState('');

  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    signInWithPassword,
    signUpWithPassword,
    signInWithMagicLink,
  } = useAuth();

  // Debounced referral code validation
  useEffect(() => {
    if (!referralCode || referralCode.trim().length === 0) {
      setReferralCodeValid(null);
      setValidatingReferral(false);
      return;
    }

    // Clear existing timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }

    setValidatingReferral(true);

    // Debounce validation by 300ms
    validationTimeoutRef.current = setTimeout(async () => {
      const isValid = await RewardsService.validateReferralCode(referralCode);
      setReferralCodeValid(isValid);
      setValidatingReferral(false);
    }, 300);

    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, [referralCode]);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string): boolean => {
    return password.length >= 8;
  };

  const handleEmailPassword = async () => {
    // Basic validation
    if (isSignUp) {
      if (!email || !password || !confirmPassword || !fullName) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // Email validation
      if (!validateEmail(email)) {
        Alert.alert('Invalid Email', 'Please enter a valid email address');
        return;
      }

      // Password validation
      if (!validatePassword(password)) {
        Alert.alert('Weak Password', 'Password must be at least 8 characters long');
        return;
      }

      // Password match validation
      if (password !== confirmPassword) {
        Alert.alert('Password Mismatch', 'Passwords do not match');
        return;
      }
    } else {
      if (!email || !password) {
        Alert.alert('Error', 'Please fill in all fields');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const result = await signUpWithPassword(email, password, fullName, phone, referralCode || undefined);

        if (result.needsEmailConfirmation) {
          // Show email confirmation pending state
          setConfirmationEmail(email);
          setPendingEmailConfirmation(true);
        } else {
          // Email confirmation disabled, user is signed in automatically
          Alert.alert('Success', 'Account created successfully!');
        }
      } else {
        await signInWithPassword(email, password);
      }
    } catch (error: any) {
      // Handle specific Supabase errors
      let errorMessage = error.message;

      if (error.message.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please sign in instead.';
      } else if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please confirm your email address before signing in.';
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = 'Password is too weak. Use at least 8 characters.';
      }

      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setLoading(true);
    try {
      await signUpWithPassword(confirmationEmail, password, fullName, phone);
      Alert.alert('Email Sent', 'A new confirmation email has been sent');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    setPendingEmailConfirmation(false);
    setConfirmationEmail('');
    setIsSignUp(false);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPhone('');
  };

  const handleMagicLink = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await signInWithMagicLink(email);
      Alert.alert('Success', 'Check your email for the magic link');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to {BUSINESS_INFO.name}</Text>
          <Text style={styles.subtitle}>
            {pendingEmailConfirmation
              ? 'Check your email'
              : isSignUp
              ? 'Create your account'
              : 'Sign in to your account'}
          </Text>
        </View>

        {pendingEmailConfirmation ? (
          <View style={styles.confirmationContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="mail-outline" size={64} color={colors.text.secondary} />
            </View>

            <Text style={styles.confirmationTitle}>Email Sent!</Text>

            <Text style={styles.confirmationText}>
              We've sent a confirmation link to:
            </Text>

            <Text style={styles.confirmationEmail}>{confirmationEmail}</Text>

            <Text style={styles.confirmationInstructions}>
              Click the link in the email to activate your account. Don't forget to check your spam folder!
            </Text>

            <TouchableOpacity
              style={[styles.primaryButton, loading && styles.buttonDisabled]}
              onPress={handleResendConfirmation}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? 'Sending...' : 'Resend Email'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleBackToSignIn}
            >
              <Text style={styles.secondaryButtonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={[
                  styles.input,
                  fullNameFocused && styles.inputFocused
                ]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                placeholderTextColor={colors.text.secondary}
                autoCapitalize="words"
                onFocus={() => setFullNameFocused(true)}
                onBlur={() => setFullNameFocused(false)}
              />
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={[
                styles.input,
                emailFocused && styles.inputFocused
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              placeholderTextColor={colors.text.secondary}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Phone Number (Optional)</Text>
              <TextInput
                style={[
                  styles.input,
                  phoneFocused && styles.inputFocused
                ]}
                value={phone}
                onChangeText={setPhone}
                placeholder="(555) 123-4567"
                placeholderTextColor={colors.text.secondary}
                keyboardType="phone-pad"
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
              />
            </View>
          )}

          {isSignUp && (
            <View style={styles.referralContainer}>
              <TouchableOpacity
                style={styles.referralToggle}
                onPress={() => setShowReferralField(!showReferralField)}
              >
                <Text style={styles.referralToggleText}>Have a referral code?</Text>
                <Ionicons
                  name={showReferralField ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={colors.gray[700]}
                />
              </TouchableOpacity>

              {showReferralField && (
                <View style={styles.referralInputContainer}>
                  <Text style={styles.label}>Referral Code (Optional)</Text>
                  <View style={styles.referralInputWrapper}>
                    <TextInput
                      style={[
                        styles.input,
                        styles.referralInput,
                        referralCodeFocused && styles.inputFocused,
                        referralCodeValid === true && styles.inputValid,
                        referralCodeValid === false && styles.inputInvalid,
                      ]}
                      value={referralCode}
                      onChangeText={(text) => setReferralCode(text.toUpperCase())}
                      placeholder="Enter code (e.g., ABC12345)"
                      placeholderTextColor={colors.text.secondary}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      onFocus={() => setReferralCodeFocused(true)}
                      onBlur={() => setReferralCodeFocused(false)}
                    />
                    {validatingReferral && (
                      <View style={styles.validationIcon}>
                        <ActivityIndicator size="small" color={colors.gray[700]} />
                      </View>
                    )}
                    {!validatingReferral && referralCodeValid === true && (
                      <View style={styles.validationIcon}>
                        <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      </View>
                    )}
                    {!validatingReferral && referralCodeValid === false && referralCode.length > 0 && (
                      <View style={styles.validationIcon}>
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                      </View>
                    )}
                  </View>
                  <Text style={styles.helperText}>
                    Enter your friend's referral code to get started
                  </Text>
                </View>
              )}
            </View>
          )}

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password *</Text>
            <TextInput
              style={[
                styles.input,
                passwordFocused && styles.inputFocused
              ]}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor={colors.text.secondary}
              secureTextEntry
              autoCapitalize="none"
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            {isSignUp && (
              <Text style={styles.helperText}>
                Must be at least 8 characters
              </Text>
            )}
          </View>

          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={[
                  styles.input,
                  confirmPasswordFocused && styles.inputFocused
                ]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor={colors.text.secondary}
                secureTextEntry
                autoCapitalize="none"
                onFocus={() => setConfirmPasswordFocused(true)}
                onBlur={() => setConfirmPasswordFocused(false)}
              />
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, loading && styles.buttonDisabled]}
            onPress={handleEmailPassword}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleMagicLink}
            disabled={loading}
          >
            <Text style={styles.secondaryButtonText}>Send Magic Link</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.switchButtonText}>
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Sign Up"}
            </Text>
          </TouchableOpacity>
        </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  form: {
    gap: spacing.lg,
  },
  inputContainer: {
    gap: spacing.sm,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
  },
  input: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.button,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputFocused: {
    borderWidth: 2,
    shadowColor: colors.accent.primary,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryButton: {
    backgroundColor: colors.accent.primary,
    borderRadius: borderRadius.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.button,
    paddingVertical: spacing.md,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryButtonText: {
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
  },
  switchButton: {
    alignItems: 'center',
    marginTop: spacing.md,
  },
  switchButtonText: {
    color: colors.accent.primary,
    fontSize: typography.fontSize.sm,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  referralContainer: {
    gap: spacing.sm,
  },
  referralToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.white,
    borderRadius: borderRadius.button,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  referralToggleText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray[700],
  },
  referralInputContainer: {
    gap: spacing.sm,
  },
  referralInputWrapper: {
    position: 'relative',
  },
  referralInput: {
    paddingRight: 40,
  },
  validationIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  inputValid: {
    borderWidth: 1,
    borderColor: '#10B981',
  },
  inputInvalid: {
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  confirmationContainer: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  confirmationTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  confirmationText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  confirmationEmail: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent.primary,
    textAlign: 'center',
  },
  confirmationInstructions: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
});

export default SignInScreen;
