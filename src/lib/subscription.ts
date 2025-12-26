import { IUser } from "@/models/main/user.model";

export interface SubscriptionStatus {
  hasAccess: boolean;
  isSubscribed: boolean;
  isOnTrial: boolean;
  trialDaysLeft: number;
  status: 'subscribed' | 'trial' | 'expired' | 'none';
}

export function getSubscriptionStatus(user: IUser): SubscriptionStatus {
  const now = new Date();
  
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
  
  if (user.subscription?.trialEndsAt) {
    const trialEnd = new Date(user.subscription.trialEndsAt);
    if (trialEnd > now) {
      const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        hasAccess: true,
        isSubscribed: false,
        isOnTrial: true,
        trialDaysLeft: daysLeft,
        status: 'trial'
      };
    }
  }
  
  if (user.subscription?.trialUsed) {
    return {
      hasAccess: false,
      isSubscribed: false,
      isOnTrial: false,
      trialDaysLeft: 0,
      status: 'expired'
    };
  }
  
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
