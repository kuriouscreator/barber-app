import * as Linking from 'expo-linking';
import { Alert } from 'react-native';

export const billingScheme = 'barbercuts';
export const billingSuccessUrl = `${billingScheme}://billing/success`;
export const billingCancelUrl = `${billingScheme}://billing/cancel`;

export interface BillingLinkHandler {
  onSuccess?: (sessionId?: string) => void;
  onCancel?: () => void;
}

export class BillingLinkManager {
  private static instance: BillingLinkManager;
  private handlers: BillingLinkHandler[] = [];

  static getInstance(): BillingLinkManager {
    if (!BillingLinkManager.instance) {
      BillingLinkManager.instance = new BillingLinkManager();
    }
    return BillingLinkManager.instance;
  }

  constructor() {
    this.setupLinkListener();
  }

  private setupLinkListener() {
    // Handle deep links when app is already running
    Linking.addEventListener('url', this.handleDeepLink);
    
    // Handle deep links when app is opened from a closed state
    Linking.getInitialURL().then((url) => {
      if (url) {
        this.handleDeepLink({ url });
      }
    });
  }

  private handleDeepLink = (event: { url: string }) => {
    const { url } = event;
    console.log('Received deep link:', url);

    try {
      const parsedUrl = Linking.parse(url);
      
      if (parsedUrl.scheme === billingScheme && parsedUrl.host === 'billing') {
        if (parsedUrl.path === '/success') {
          const sessionId = parsedUrl.queryParams?.session_id as string;
          this.handleBillingSuccess(sessionId);
        } else if (parsedUrl.path === '/cancel') {
          this.handleBillingCancel();
        }
      }
    } catch (error) {
      console.error('Error parsing deep link:', error);
    }
  };

  private handleBillingSuccess(sessionId?: string) {
    console.log('Billing success:', sessionId);
    
    // Notify all registered handlers
    this.handlers.forEach(handler => {
      if (handler.onSuccess) {
        handler.onSuccess(sessionId);
      }
    });

    // Show success message
    Alert.alert(
      'Success!',
      'Your subscription has been activated. You can now start booking haircuts.',
      [{ text: 'OK' }]
    );
  }

  private handleBillingCancel() {
    console.log('Billing cancelled');
    
    // Notify all registered handlers
    this.handlers.forEach(handler => {
      if (handler.onCancel) {
        handler.onCancel();
      }
    });

    // Show cancel message
    Alert.alert(
      'Cancelled',
      'Subscription setup was cancelled. You can try again anytime.',
      [{ text: 'OK' }]
    );
  }

  /**
   * Register a handler for billing deep links
   */
  addHandler(handler: BillingLinkHandler): () => void {
    this.handlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.handlers.indexOf(handler);
      if (index > -1) {
        this.handlers.splice(index, 1);
      }
    };
  }

  /**
   * Remove all handlers
   */
  removeAllHandlers() {
    this.handlers = [];
  }

  /**
   * Clean up listeners
   */
  cleanup() {
    Linking.removeAllListeners('url');
    this.removeAllHandlers();
  }
}

// Export singleton instance
export const billingLinkManager = BillingLinkManager.getInstance();
