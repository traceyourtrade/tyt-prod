import { IUser } from "@/models/main/user.model";

const ADMIN_EMAILS = [
  "himanshuparwal123@gmail.com"
];

export interface SubscriptionStatus {
  hasAccess: boolean;
  isSubscribed: boolean;
  isOnTrial: boolean;
  trialDaysLeft: number;
  canStartTrial: boolean;
  status: 'subscribed' | 'trial' | 'expired' | 'none' | 'inactive';
}

export function isTrialEligible(user: IUser): boolean {
  // User can start trial if: hasn't used trial yet AND has never subscribed
  const trialUsed = user.subscription?.trialUsed ?? false;
  const hasEverSubscribed = user.subscription?.hasEverSubscribed ?? false;
  return !trialUsed && !hasEverSubscribed;
}

export function getSubscriptionStatus(user: IUser): SubscriptionStatus {
  // Admin bypass - admins always have full access
  if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
    return {
      hasAccess: true,
      isSubscribed: true,
      isOnTrial: false,
      trialDaysLeft: 0,
      canStartTrial: false,
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
        canStartTrial: false,
        status: 'subscribed'
      };
    }
  }
  
  // Check for active trial period (3-day free trial)
  if (user.subscription?.trialEndsAt) {
    const trialEnd = new Date(user.subscription.trialEndsAt);
    if (trialEnd > now) {
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        hasAccess: true,
        isSubscribed: false,
        isOnTrial: true,
        trialDaysLeft: Math.max(0, daysLeft),
        canStartTrial: false,
        status: 'trial'
      };
    }
  }
  
  // Check if user can start a trial
  const canStartTrial = isTrialEligible(user);
  
  // No active subscription or trial
  return {
    hasAccess: false,
    isSubscribed: false,
    isOnTrial: false,
    trialDaysLeft: 0,
    canStartTrial,
    status: canStartTrial ? 'inactive' : 'expired'
  };
}

export function activateTrial(user: IUser): Date {
  const now = new Date();
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 3);
  
  if (!user.subscription) {
    user.subscription = {
      isSubscribed: false,
      trialUsed: false
    };
  }
  
  user.subscription.trialActivatedAt = now;
  user.subscription.trialEndsAt = trialEndsAt;
  user.subscription.trialUsed = true;
  user.subscription.subscriptionStatus = 'pending';
  
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
  user.subscription.hasEverSubscribed = true;
  
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
