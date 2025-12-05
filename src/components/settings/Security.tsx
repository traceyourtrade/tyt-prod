"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faEnvelope, faLock, faKey, faShield, faCheck } from "@fortawesome/free-solid-svg-icons";

const Security = () => {
  const [showCurr, setShowCurr] = useState<boolean>(false);
  const [showNew, setShowNew] = useState<boolean>(false);
  const [showRe, setShowRe] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [rePassword, setRePassword] = useState("");
  const [resetEmail, setResetEmail] = useState("");

  const PasswordInput = ({ 
    label, 
    value, 
    onChange, 
    show, 
    onToggle 
  }: { 
    label: string; 
    value: string;
    onChange: (val: string) => void;
    show: boolean; 
    onToggle: () => void;
  }) => (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#252525] border border-[#2a2a2a] rounded-xl px-4 py-3 pr-12 text-sm text-white font-medium placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all duration-200"
          placeholder="••••••••"
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
        >
          <FontAwesomeIcon icon={show ? faEyeSlash : faEye} className="text-sm" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white">Security Settings</h2>
        <p className="text-gray-500 text-sm mt-1">Manage your password and account security</p>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <FontAwesomeIcon icon={faKey} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Change Password</h3>
              <p className="text-xs text-gray-500">Update your password regularly</p>
            </div>
          </div>

          <div className="space-y-4">
            <PasswordInput
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              show={showCurr}
              onToggle={() => setShowCurr(!showCurr)}
            />
            
            <div className="h-px bg-[#2a2a2a]" />

            <PasswordInput
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              show={showNew}
              onToggle={() => setShowNew(!showNew)}
            />

            <PasswordInput
              label="Confirm New Password"
              value={rePassword}
              onChange={setRePassword}
              show={showRe}
              onToggle={() => setShowRe(!showRe)}
            />

            <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-colors">
              <FontAwesomeIcon icon={faCheck} className="text-xs" />
              Update Password
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <FontAwesomeIcon icon={faLock} className="text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Forgot Password</h3>
                <p className="text-xs text-gray-500">Reset your password via email</p>
              </div>
            </div>

            <div className="bg-[#252525] border border-[#2a2a2a] rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-400 leading-relaxed">
                Enter your registered email address and we'll send you a password reset link. Follow the instructions in the email to reset your password.
              </p>
            </div>

            <div className="space-y-2 mb-4">
              <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-[#252525] border border-[#2a2a2a] rounded-xl px-4 py-3 pr-12 text-sm text-white font-medium placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all duration-200"
                />
                <FontAwesomeIcon icon={faEnvelope} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
            </div>

            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#252525] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-gray-300 text-sm font-medium rounded-xl transition-colors">
              <FontAwesomeIcon icon={faEnvelope} className="text-xs" />
              Send Reset Link
            </button>
          </div>

          <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#252525] flex items-center justify-center">
                <FontAwesomeIcon icon={faShield} className="text-gray-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Two-Factor Authentication</h3>
                <p className="text-xs text-gray-500">Add an extra layer of security</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#252525] border border-[#2a2a2a] rounded-xl">
              <div>
                <p className="text-sm text-gray-300 font-medium">Status</p>
                <p className="text-xs text-gray-500">Not enabled</p>
              </div>
              <button className="px-4 py-2 bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-[#2a2a2a] text-gray-300 text-sm font-medium rounded-lg transition-colors">
                Enable
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security;
