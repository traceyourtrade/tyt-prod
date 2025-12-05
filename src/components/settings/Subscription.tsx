"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCrown, faCheck, faStar, faBars } from "@fortawesome/free-solid-svg-icons";

interface Props {
  onMenuClick: () => void;
}

const Subscription = ({ onMenuClick }: Props) => {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    { name: "Basic", price: billing === "monthly" ? 699 : 599, features: ["Unlimited trades", "Basic analytics", "Email support"] },
    { name: "Premium", price: billing === "monthly" ? 1299 : 1199, features: ["Everything in Basic", "Advanced analytics", "Priority support", "API access", "Custom reports"], popular: true }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onMenuClick} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white">
          <FontAwesomeIcon icon={faBars} />
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription</h2>
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <FontAwesomeIcon icon={faCrown} className="text-emerald-500 text-sm" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">Current Plan</p>
            <p className="text-xs text-gray-500">TYT Premium</p>
          </div>
          <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-red-500/10 text-red-500 rounded">Expired</span>
        </div>
        <div className="flex items-center justify-between text-sm py-2 border-t border-gray-100 dark:border-[#262626]">
          <span className="text-gray-500">Expires</span>
          <span className="text-gray-900 dark:text-white">04/02/2025</span>
        </div>
      </div>

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
          Yearly <span className="text-emerald-500 text-xs">-15%</span>
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
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
            <p className={`font-semibold ${plan.popular ? "text-emerald-500" : "text-gray-900 dark:text-white"}`}>
              {plan.name}
            </p>
            <p className="mt-2">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{plan.price}</span>
              <span className="text-gray-500 text-sm">/mo</span>
            </p>
            <ul className="mt-4 space-y-2">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <FontAwesomeIcon icon={faCheck} className={`text-xs ${plan.popular ? "text-emerald-500" : "text-gray-400"}`} />
                  {f}
                </li>
              ))}
            </ul>
            <button className={`w-full mt-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              plan.popular 
                ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                : "bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#252525] text-gray-900 dark:text-white"
            }`}>
              {plan.popular ? "Get Started" : "Select"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscription;
