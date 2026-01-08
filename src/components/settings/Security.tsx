"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faShield, faKey, faSpinner, faCheck, faExclamationCircle } from "@fortawesome/free-solid-svg-icons";

const Security = () => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handlePasswordChange = async () => {
    setMessage(null);

    if (!currentPwd) {
      setMessage({ type: 'error', text: 'Please enter your current password' });
      return;
    }
    if (newPwd.length < 8) {
      setMessage({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }
    if (newPwd !== confirmPwd) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (newPwd === currentPwd) {
      setMessage({ type: 'error', text: 'New password must be different from current password' });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/user-profile/put", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          apiName: "changePassword",
          password: currentPwd,
          newPassword: newPwd
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully!' });
        setCurrentPwd("");
        setNewPwd("");
        setConfirmPwd("");
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setIsLoading(false);
    }
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

        {message && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
            message.type === 'success' 
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
              : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            <FontAwesomeIcon icon={message.type === 'success' ? faCheck : faExclamationCircle} />
            {message.text}
          </div>
        )}

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
            hint="Minimum 8 characters"
          />
          <PasswordField 
            label="Confirm New Password"
            value={confirmPwd}
            onChange={setConfirmPwd}
            show={showConfirm}
            onToggle={() => setShowConfirm(!showConfirm)}
            error={confirmPwd && newPwd !== confirmPwd ? "Passwords don't match" : undefined}
          />
          <button 
            onClick={handlePasswordChange}
            disabled={isLoading || !currentPwd || !newPwd || !confirmPwd}
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                Updating...
              </>
            ) : (
              "Update Password"
            )}
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
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#262626] text-gray-500 text-[10px] font-medium rounded">
                  COMING SOON
                </span>
              </div>
              <p className="text-xs text-gray-500">Add an extra layer of security</p>
            </div>
          </div>
          <button
            disabled
            className="w-10 h-6 rounded-full bg-gray-200 dark:bg-[#262626] opacity-50 cursor-not-allowed relative"
          >
            <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white" />
          </button>
        </div>
      </div>
    </div>
  );
};

const PasswordField = ({ label, value, onChange, show, onToggle, hint, error }: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  show: boolean;
  onToggle: () => void;
  hint?: string;
  error?: string;
}) => (
  <div>
    <label className="block text-xs text-gray-500 mb-1">{label}</label>
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full px-3 py-2 pr-10 text-sm bg-gray-50 dark:bg-[#1a1a1a] border rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500 ${
          error ? 'border-red-500' : 'border-gray-200 dark:border-[#262626]'
        }`}
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
    {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

export default Security;
