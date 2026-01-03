import { IUser } from "@/models/main/user.model";

const ADMIN_EMAILS = [
  "himanshuparwal123@gmail.com"
];

export interface SubscriptionStatus {
  hasAccess: boolean;
  isSubscribed: boolean;
  isOnTrial: boolean;
  trialDaysLeft: number;
  status: 'subscribed' | 'trial' | 'expired' | 'none' | 'inactive';
}

export function getSubscriptionStatus(user: IUser): SubscriptionStatus {
  // Admin bypass - admins always have full access
  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return {
      hasAccess: true,
      isSubscribed: true,
      isOnTrial: false,
      trialDaysLeft: 0,
      status: 'subscribed'
    };
  }

  const now = new Date();
  
  // Check for active paid subscription
  if (user.subscription?.isSubscribed && user.subscription?.subscriptionStatus === 'active') {
    const expiry = user.subscription.subscriptionExpiry;
    if (expiry && new Date(expiry) > now) {
      return {
        hasAccess: true,
        isSubscribed: true,
        isOnTrial: false,
        trialDaysLeft: 0,
        status: 'subscribed'
      };
    }
  }
  
  // NO FREE TRIAL - Blocking pay-to-use model
  // Users must pay to access premium features
  // Trial logic removed - hasAccess is false unless subscribed
  
  // Check if subscription status is 'inactive' (new user who hasn't subscribed yet)
  if (user.subscription?.subscriptionStatus === 'inactive') {
    return {
      hasAccess: false,
      isSubscribed: false,
      isOnTrial: false,
      trialDaysLeft: 0,
      status: 'inactive'
    };
  }
  
  // Default: no access for non-subscribed users
  return {
    hasAccess: false,
    isSubscribed: false,
    isOnTrial: false,
    trialDaysLeft: 0,
    status: 'none'
  };
}

export function activateTrial(user: IUser): Date {
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 5);
  
  if (!user.subscription) {
    user.subscription = {
      isSubscribed: false,
      trialUsed: false
    };
  }
  
  user.subscription.trialEndsAt = trialEndsAt;
  user.subscription.trialUsed = true;
  
  return trialEndsAt;
}

export function activateSubscription(
  user: IUser, 
  subscriptionId: string, 
  customerId?: string
): void {
  if (!user.subscription) {
    user.subscription = {
      isSubscribed: false,
      trialUsed: true
    };
  }
  
  user.subscription.isSubscribed = true;
  user.subscription.subscriptionId = subscriptionId;
  user.subscription.subscriptionStatus = 'active';
  user.subscription.razorpayCustomerId = customerId;
  
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 1);
  user.subscription.subscriptionExpiry = expiry;
}

export function cancelSubscription(user: IUser): void {
  if (user.subscription) {
    user.subscription.isSubscribed = false;
    user.subscription.subscriptionStatus = 'cancelled';
  }
}

export async function verifyProAccess(uniqueId: string): Promise<{ hasAccess: boolean; error?: string }> {
  try {
    const { getUserModel } = await import("@/models/main/user.model");
    const User = await getUserModel();
    const user = await User.findOne({ uniqueId });
    
    if (!user) {
      return { hasAccess: false, error: "User not found" };
    }
    
    const status = getSubscriptionStatus(user);
    return { hasAccess: status.hasAccess };
  } catch (error) {
    console.error("Error verifying pro access:", error);
    return { hasAccess: false, error: "Failed to verify subscription" };
  }
}
