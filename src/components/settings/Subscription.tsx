"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faCheck, faStar, faArrowUp, faSpinner } from "@fortawesome/free-solid-svg-icons";

interface SubscriptionStatus {
  hasAccess: boolean;
  isSubscribed: boolean;
  isOnTrial: boolean;
  trialDaysLeft: number;
  status: 'subscribed' | 'trial' | 'expired' | 'none';
  subscriptionExpiry?: string;
  billingPeriod?: 'monthly' | 'yearly';
}

const Subscription = () => {
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const monthlyPrice = 849;
  const yearlyPrice = 8199;
  const yearlyMonthlyPrice = Math.round(yearlyPrice / 12);
  
  const plans = [
    { 
      name: "Pro", 
      price: billing === "monthly" ? monthlyPrice : yearlyMonthlyPrice, 
      features: [
        "Unlimited trades", 
        "Advanced analytics", 
        "AI-powered insights", 
        "Playbook builder", 
        "Prop firm mode", 
        "Priority support"
      ], 
      popular: true 
    }
  ];

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch("/api/subscription/status");
        if (response.ok) {
          const data = await response.json();
          setSubscriptionStatus(data);
        }
      } catch (err) {
        console.error("Failed to fetch subscription status:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleSubscribe = () => {
    router.push(`/checkout?plan=${billing}`);
  };

  const handleUpgradeToYearly = () => {
    router.push('/checkout?plan=yearly&upgrade=true');
  };

  const getStatusBadge = () => {
    if (!subscriptionStatus) return null;
    
    switch (subscriptionStatus.status) {
      case 'subscribed':
        return <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-emerald-500/10 text-emerald-500 rounded">Active</span>;
      case 'trial':
        return <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-blue-500/10 text-blue-500 rounded">{subscriptionStatus.trialDaysLeft} days left</span>;
      case 'expired':
        return <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-500 rounded">Expired</span>;
      default:
        return <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-gray-500/10 text-gray-500 rounded">Free</span>;
    }
  };

  const getPlanName = () => {
    if (!subscriptionStatus) return "Free";
    
    switch (subscriptionStatus.status) {
      case 'subscribed':
        return subscriptionStatus.billingPeriod === 'yearly' ? 'Pro Yearly' : 'Pro Monthly';
      case 'trial':
        return 'Pro Trial';
      default:
        return 'Free';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription</h2>
        <div className="flex items-center justify-center py-12">
          <FontAwesomeIcon icon={faSpinner} className="animate-spin text-gray-400 text-xl" />
        </div>
      </div>
    );
  }

  const isSubscribed = subscriptionStatus?.isSubscribed;
  const isMonthlySubscriber = isSubscribed && subscriptionStatus?.billingPeriod !== 'yearly';

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription</h2>

      <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            subscriptionStatus?.hasAccess ? 'bg-emerald-500/10' : 'bg-gray-500/10'
          }`}>
            <FontAwesomeIcon 
              icon={faCrown} 
              className={`text-sm ${subscriptionStatus?.hasAccess ? 'text-emerald-500' : 'text-gray-500'}`} 
            />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Current Plan</p>
            <p className="text-xs text-gray-500">{getPlanName()}</p>
          </div>
          {getStatusBadge()}
        </div>
        {subscriptionStatus?.subscriptionExpiry && (
          <div className="flex items-center justify-between text-sm py-2 border-t border-gray-100 dark:border-[#262626]">
            <span className="text-gray-500">
              {subscriptionStatus.status === 'subscribed' ? 'Renews' : 'Expires'}
            </span>
            <span className="text-gray-900 dark:text-white">
              {formatDate(subscriptionStatus.subscriptionExpiry)}
            </span>
          </div>
        )}
        
        {isMonthlySubscriber && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-[#262626]">
            <button
              onClick={handleUpgradeToYearly}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white transition-all"
            >
              <FontAwesomeIcon icon={faArrowUp} className="text-xs" />
              Upgrade to Yearly & Save 20%
            </button>
            <p className="text-xs text-center text-gray-500 mt-2">
              Pay ₹8,199/year instead of ₹10,188/year
            </p>
          </div>
        )}
      </div>

      {!isSubscribed && (
        <>
          <div className="flex items-center justify-center gap-2 p-1 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg w-fit mx-auto">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                billing === "monthly" ? "bg-white dark:bg-[#262626] text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                billing === "yearly" ? "bg-white dark:bg-[#262626] text-gray-900 dark:text-white shadow-sm" : "text-gray-500"
              }`}
            >
              Yearly <span className="text-emerald-500 text-xs">-20%</span>
            </button>
          </div>

          <div className="grid gap-3">
            {plans.map((plan) => (
              <div 
                key={plan.name}
                className={`relative bg-white dark:bg-[#141414] rounded-xl border p-4 ${
                  plan.popular ? "border-emerald-500" : "border-gray-200 dark:border-[#262626]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-emerald-500 text-white text-xs font-medium rounded flex items-center gap-1">
                    <FontAwesomeIcon icon={faStar} className="text-[10px]" /> Popular
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`font-semibold ${plan.popular ? "text-emerald-500" : "text-gray-900 dark:text-white"}`}>
                      {plan.name}
                    </p>
                    <p className="mt-1">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{plan.price}</span>
                      <span className="text-gray-500 text-sm">/mo</span>
                      {billing === "yearly" && (
                        <span className="ml-2 text-xs text-gray-400 line-through">₹{monthlyPrice}/mo</span>
                      )}
                    </p>
                    {billing === "yearly" && (
                      <p className="text-xs text-emerald-500 mt-1">Billed ₹{yearlyPrice}/year</p>
                    )}
                  </div>
                </div>
                <ul className="mt-4 grid grid-cols-2 gap-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <FontAwesomeIcon icon={faCheck} className={`text-xs ${plan.popular ? "text-emerald-500" : "text-gray-400"}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={handleSubscribe}
                  className={`w-full mt-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    plan.popular 
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                      : "bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#252525] text-gray-900 dark:text-white"
                  }`}
                >
                  {subscriptionStatus?.status === 'trial' ? 'Upgrade Now' : 'Get Started'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Subscription;
