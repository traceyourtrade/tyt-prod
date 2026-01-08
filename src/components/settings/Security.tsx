"use client";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Key, Shield, Eye, EyeOff, Check, AlertCircle, Loader2, Lock
} from "lucide-react";
import { cn } from "@/lib/utils";

const Security = () => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const passwordStrength = useMemo(() => {
    if (!newPwd) return { score: 0, label: "", color: "bg-muted" };
    let score = 0;
    if (newPwd.length >= 8) score++;
    if (newPwd.length >= 12) score++;
    if (/[A-Z]/.test(newPwd)) score++;
    if (/[0-9]/.test(newPwd)) score++;
    if (/[^A-Za-z0-9]/.test(newPwd)) score++;
    
    if (score <= 1) return { score: 1, label: "Weak", color: "bg-red-500" };
    if (score <= 2) return { score: 2, label: "Fair", color: "bg-amber-500" };
    if (score <= 3) return { score: 3, label: "Good", color: "bg-yellow-500" };
    if (score <= 4) return { score: 4, label: "Strong", color: "bg-emerald-500" };
    return { score: 5, label: "Very Strong", color: "bg-emerald-500" };
  }, [newPwd]);

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
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          "bg-gradient-to-br from-primary/20 to-primary/5"
        )}>
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Security</h2>
          <p className="text-sm text-muted-foreground">Manage your password and security settings</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "rounded-2xl border overflow-hidden",
          "bg-card dark:bg-zinc-900/50",
          "border-border dark:border-white/[0.08]"
        )}
      >
        <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-emerald-500" />
        
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-foreground">Change Password</h3>
              <p className="text-xs text-muted-foreground">Update your password to keep your account secure</p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {message && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={cn(
                  "mb-6 p-4 rounded-xl flex items-center gap-3 text-sm",
                  message.type === 'success' 
                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" 
                    : "bg-red-500/10 text-red-500 border border-red-500/20"
                )}
              >
                {message.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <PasswordField 
              label="Current Password"
              value={currentPwd}
              onChange={setCurrentPwd}
              show={showCurrent}
              onToggle={() => setShowCurrent(!showCurrent)}
              icon={Lock}
            />
            <div className="space-y-2">
              <PasswordField 
                label="New Password"
                value={newPwd}
                onChange={setNewPwd}
                show={showNew}
                onToggle={() => setShowNew(!showNew)}
                icon={Key}
              />
              {newPwd && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-1.5"
                >
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          level <= passwordStrength.score ? passwordStrength.color : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <p className={cn(
                    "text-xs",
                    passwordStrength.score <= 1 ? "text-red-500" :
                    passwordStrength.score <= 2 ? "text-amber-500" :
                    "text-emerald-500"
                  )}>
                    Password strength: {passwordStrength.label}
                  </p>
                </motion.div>
              )}
            </div>
            <PasswordField 
              label="Confirm New Password"
              value={confirmPwd}
              onChange={setConfirmPwd}
              show={showConfirm}
              onToggle={() => setShowConfirm(!showConfirm)}
              icon={Key}
              error={confirmPwd && newPwd !== confirmPwd ? "Passwords don't match" : undefined}
            />
            
            <motion.button 
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handlePasswordChange}
              disabled={isLoading || !currentPwd || !newPwd || !confirmPwd}
              className={cn(
                "w-full py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2",
                "bg-primary text-white hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Update Password
                </>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={cn(
          "rounded-2xl border overflow-hidden",
          "bg-card dark:bg-zinc-900/50",
          "border-border dark:border-white/[0.08]"
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                <Shield className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">Two-Factor Authentication</p>
                  <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[10px] font-medium rounded-full uppercase tracking-wider">
                    Coming Soon
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
            </div>
            <button
              disabled
              className={cn(
                "w-12 h-7 rounded-full relative transition-colors cursor-not-allowed",
                "bg-muted opacity-50"
              )}
            >
              <div className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow" />
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const PasswordField = ({ 
  label, 
  value, 
  onChange, 
  show, 
  onToggle, 
  icon: Icon,
  error 
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  show: boolean;
  onToggle: () => void;
  icon: React.ElementType;
  error?: string;
}) => (
  <div className="space-y-1.5">
    <label className="text-sm text-muted-foreground">{label}</label>
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2">
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "w-full pl-11 pr-11 py-3 text-sm rounded-xl transition-all",
          "bg-muted/50 border text-foreground placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary",
          error ? "border-red-500" : "border-border"
        )}
        placeholder="••••••••"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

export default Security;
