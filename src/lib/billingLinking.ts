// Billing Link Manager for handling deep links from Stripe checkout
import * as Linking from 'expo-linking';

interface BillingLinkHandler {
  onSuccess: (sessionId: string) => void;
  onCancel: () => void;
}

class BillingLinkManager {
  private handlers: BillingLinkHandler[] = [];

  addHandler(handler: BillingLinkHandler) {
    this.handlers.push(handler);
    
    // Return unsubscribe function
    return () => {
      const index = this.handlers.indexOf(handler);
      if (index > -1) {
        this.handlers.splice(index, 1);
      }
    };
  }

  handleUrl(url: string) {
    // Parse the URL to determine if it's a success or cancel
    if (url.includes('success') || url.includes('session_id')) {
      // Extract session ID from URL if present
      const sessionId = this.extractSessionId(url);
      this.handlers.forEach(handler => handler.onSuccess(sessionId));
    } else if (url.includes('cancel')) {
      this.handlers.forEach(handler => handler.onCancel());
    }
  }

  private extractSessionId(url: string): string {
    // Simple session ID extraction - can be enhanced based on actual URL structure
    const match = url.match(/session_id=([^&]+)/);
    return match ? match[1] : 'unknown';
  }
}

export const billingLinkManager = new BillingLinkManager();

// Set up global URL handler
Linking.addEventListener('url', (event) => {
  billingLinkManager.handleUrl(event.url);
});
