"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faShield, faKey } from "@fortawesome/free-solid-svg-icons";

const Security = () => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handlePasswordChange = () => {
    if (newPwd !== confirmPwd) return;
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Security</h2>

      <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <FontAwesomeIcon icon={faKey} className="text-emerald-500 text-sm" />
          </div>
          <span className="font-medium text-gray-900 dark:text-white">Change Password</span>
        </div>

        <div className="space-y-3">
          <PasswordField 
            label="Current Password"
            value={currentPwd}
            onChange={setCurrentPwd}
            show={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
          />
          <PasswordField 
            label="New Password"
            value={newPwd}
            onChange={setNewPwd}
            show={showNew}
            onToggle={() => setShowNew(!showNew)}
          />
          <PasswordField 
            label="Confirm Password"
            value={confirmPwd}
            onChange={setConfirmPwd}
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
          />
          <button 
            onClick={handlePasswordChange}
            className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Update Password
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-[#1e1e1e] flex items-center justify-center">
              <FontAwesomeIcon icon={faShield} className="text-gray-500 text-sm" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
              <p className="text-xs text-gray-500">Add an extra layer of security</p>
            </div>
          </div>
          <button
            onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
            className={`w-10 h-6 rounded-full transition-colors relative ${
              twoFactorEnabled ? "bg-emerald-500" : "bg-gray-300 dark:bg-[#262626]"
            }`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              twoFactorEnabled ? "right-1" : "left-1"
            }`} />
          </button>
        </div>
      </div>
    </div>
  );
};

const PasswordField = ({ label, value, onChange, show, onToggle }: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  show: boolean;
  onToggle: () => void;
}) => (
  <div>
    <label className="block text-xs text-gray-500 mb-1">{label}</label>
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 pr-10 text-sm bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#262626] rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
        placeholder="••••••••"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        <FontAwesomeIcon icon={show ? faEyeSlash : faEye} className="text-sm" />
      </button>
    </div>
  </div>
);

export default Security;
