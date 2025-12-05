"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCrown, faCreditCard, faCalendarAlt, faArrowRight, faStar } from "@fortawesome/free-solid-svg-icons";

const Subscription = () => {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = {
    monthly: [
      { name: "Basic", price: 699, popular: false },
      { name: "Premium", price: 1299, popular: true }
    ],
    yearly: [
      { name: "Basic", price: 599, popular: false },
      { name: "Premium", price: 1199, popular: true }
    ]
  };

  const features = [
    "Unlimited trade imports",
    "Advanced analytics",
    "Custom reports",
    "Priority support",
    "API access"
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 lg:mb-8">
        <h2 className="text-lg lg:text-xl font-bold text-white">Subscription</h2>
        <p className="text-gray-500 text-xs lg:text-sm mt-1">Manage your plan and billing details</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-8">
        <div className="xl:col-span-5 space-y-4 lg:space-y-6">
          <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faCrown} className="text-emerald-400 text-sm" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">Current Plan</h3>
                <p className="text-xs text-gray-500 truncate">Your active subscription</p>
              </div>
            </div>

            <div className="bg-[#252525] border border-[#2a2a2a] rounded-xl p-3 sm:p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-400">Plan</span>
                <span className="text-xs sm:text-sm text-white font-medium">TYT Premium</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-400">Price</span>
                <span className="text-xs sm:text-sm text-white font-medium">₹1,400 / month</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-400">Expires</span>
                <span className="text-xs sm:text-sm text-red-400 font-medium">04/02/2025</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm text-gray-400">Status</span>
                <span className="px-2 py-0.5 bg-red-500/15 text-red-400 text-xs font-medium rounded-md">Expired</span>
              </div>
            </div>

            <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-colors">
              <FontAwesomeIcon icon={faArrowRight} className="text-xs" />
              Renew Subscription
            </button>
          </div>

          <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[#252525] flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faCreditCard} className="text-gray-400 text-sm" />
              </div>
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-white">Payment Method</h3>
                <p className="text-xs text-gray-500 truncate">Your billing details</p>
              </div>
            </div>

            <div className="bg-[#252525] border border-[#2a2a2a] rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-7 sm:w-12 sm:h-8 bg-[#1e1e1e] rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gray-400">MC</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-medium truncate">•••• •••• •••• 6969</p>
                  <p className="text-xs text-gray-500">Expires 05/27</p>
                </div>
                <button className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex-shrink-0">Edit</button>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-600 flex-shrink-0" />
                <span className="truncate">Billed on the first of every month</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-600 flex-shrink-0" />
                <span className="truncate">Next billing: <strong className="text-gray-400">March 01, 2025</strong></span>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-7">
          <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-white">Available Plans</h3>
                <p className="text-xs text-gray-500 mt-1">Choose the plan that works for you</p>
              </div>

              <div className="flex items-center bg-[#252525] border border-[#2a2a2a] rounded-xl p-1 self-start sm:self-auto">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all ${
                    billingCycle === "monthly" 
                      ? "bg-emerald-500 text-white" 
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-all flex items-center gap-1 ${
                    billingCycle === "yearly" 
                      ? "bg-emerald-500 text-white" 
                      : "text-gray-400 hover:text-gray-300"
                  }`}
                >
                  Yearly
                  <span className="text-xs text-emerald-400">Save 15%</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {plans[billingCycle].map((plan, index) => (
                <div 
                  key={plan.name}
                  className={`relative bg-[#252525] border rounded-2xl p-4 sm:p-6 transition-all ${
                    plan.popular 
                      ? "border-emerald-500/50 ring-1 ring-emerald-500/20" 
                      : "border-[#2a2a2a] hover:border-[#3a3a3a]"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-emerald-500 text-white text-xs font-semibold rounded-full flex items-center gap-1">
                      <FontAwesomeIcon icon={faStar} className="text-[10px]" />
                      Popular
                    </div>
                  )}

                  <h4 className={`text-base sm:text-lg font-bold ${plan.popular ? "text-emerald-400" : "text-white"}`}>
                    {plan.name}
                  </h4>
                  
                  <div className="mt-3 sm:mt-4 mb-4 sm:mb-6">
                    <span className="text-2xl sm:text-3xl font-bold text-white">₹{plan.price}</span>
                    <span className="text-gray-500 text-xs sm:text-sm">/month</span>
                  </div>

                  <ul className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                    {features.slice(0, plan.popular ? 5 : 3).map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                        <FontAwesomeIcon icon={faCheck} className={`text-xs flex-shrink-0 ${plan.popular ? "text-emerald-400" : "text-gray-500"}`} />
                        <span className="truncate">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button 
                    className={`w-full py-2.5 sm:py-3 rounded-xl text-sm font-semibold transition-colors ${
                      plan.popular 
                        ? "bg-emerald-500 hover:bg-emerald-400 text-white" 
                        : "bg-[#1e1e1e] hover:bg-[#2a2a2a] text-gray-300 border border-[#2a2a2a]"
                    }`}
                  >
                    {plan.popular ? "Get Started" : "Select Plan"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
