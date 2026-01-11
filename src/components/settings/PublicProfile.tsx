"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Share2, Link, Copy, Check, ShieldCheck, ShieldAlert, 
  Eye, EyeOff, Loader2, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicProfileSettings {
  isPublic: boolean;
  showEquityCurve: boolean;
  showMonthlyPnL: boolean;
  showWinRate: boolean;
  showProfitFactor: boolean;
  showTotalTrades: boolean;
  showTotalPnL: boolean;
  hideDollarAmounts: boolean;
  customUsername: string;
}

interface UserData {
  uniqueId: string;
  publicProfile: PublicProfileSettings;
  hasVerifiedAccounts: boolean;
}

const defaultSettings: PublicProfileSettings = {
  isPublic: false,
  showEquityCurve: true,
  showMonthlyPnL: true,
  showWinRate: true,
  showProfitFactor: true,
  showTotalTrades: true,
  showTotalPnL: true,
  hideDollarAmounts: false,
  customUsername: ""
};

const PublicProfile = () => {
  const [settings, setSettings] = useState<PublicProfileSettings>(defaultSettings);
  const [uniqueId, setUniqueId] = useState("");
  const [hasVerifiedAccounts, setHasVerifiedAccounts] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/profile", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUniqueId(data.uniqueId || "");
          setHasVerifiedAccounts(data.hasVerifiedAccounts || false);
          if (data.publicProfile) {
            setSettings({
              ...defaultSettings,
              ...data.publicProfile
            });
          }
        }
      } catch (e) {
        console.error("Failed to fetch profile settings:", e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const res = await fetch("/api/public-profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      
      if (res.ok) {
        setSaveMessage({ type: 'success', text: 'Settings saved successfully!' });
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const data = await res.json();
        setSaveMessage({ type: 'error', text: data.error || 'Failed to save settings' });
      }
    } catch (error) {
      console.error("Save error:", error);
      setSaveMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const getProfileUrl = useCallback(() => {
    const username = settings.customUsername || uniqueId;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://app.projournx.com';
    return `${baseUrl}/profile/${username}`;
  }, [settings.customUsername, uniqueId]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getProfileUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const updateSetting = <K extends keyof PublicProfileSettings>(
    key: K, 
    value: PublicProfileSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="w-24 h-5 bg-muted rounded animate-pulse" />
            <div className="w-48 h-4 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="h-64 bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            "bg-gradient-to-br from-primary/20 to-primary/5"
          )}>
            <Share2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Public Profile</h2>
            <p className="text-sm text-muted-foreground">Share your trading stats with others</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {hasVerifiedAccounts ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-full text-xs font-medium">
              <ShieldAlert className="w-3.5 h-3.5" />
              Unverified
            </div>
          )}
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
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                <Eye className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-foreground">Enable Public Profile</p>
                <p className="text-xs text-muted-foreground">Make your stats visible to others</p>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => updateSetting('isPublic', !settings.isPublic)}
              className={cn(
                "w-12 h-7 rounded-full relative transition-colors",
                settings.isPublic ? "bg-primary" : "bg-muted"
              )}
            >
              <motion.div 
                animate={{ x: settings.isPublic ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow"
              />
            </motion.button>
          </div>

          <AnimatePresence>
            {settings.isPublic && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-6"
              >
                <div className="h-px bg-border" />
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Link className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Custom Username</p>
                  </div>
                  <input
                    type="text"
                    value={settings.customUsername}
                    onChange={(e) => updateSetting('customUsername', e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                    placeholder={uniqueId || "custom-username"}
                    className={cn(
                      "w-full px-4 py-3 rounded-xl text-sm transition-all",
                      "bg-muted/50 border border-border",
                      "placeholder:text-muted-foreground text-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    )}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to use your default ID
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Shareable Link</p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-xl",
                    "bg-muted/50 border border-border"
                  )}>
                    <span className="flex-1 text-sm text-foreground truncate">
                      {getProfileUrl()}
                    </span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={copyToClipboard}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                        copied 
                          ? "bg-emerald-500/10 text-emerald-500" 
                          : "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          Copy
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <AnimatePresence>
        {settings.isPublic && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: 0.15 }}
            className={cn(
              "rounded-2xl border overflow-hidden",
              "bg-card dark:bg-zinc-900/50",
              "border-border dark:border-white/[0.08]"
            )}
          >
            <div className="p-6">
              <h3 className="font-medium text-foreground mb-4">Privacy Controls</h3>
              <p className="text-xs text-muted-foreground mb-6">
                Choose what information to display on your public profile
              </p>
              
              <div className="space-y-4">
                <Toggle 
                  label="Show Equity Curve" 
                  description="Display your cumulative P&L over time"
                  enabled={settings.showEquityCurve} 
                  onToggle={() => updateSetting('showEquityCurve', !settings.showEquityCurve)} 
                />
                <Toggle 
                  label="Show Monthly P&L" 
                  description="Display monthly performance breakdown"
                  enabled={settings.showMonthlyPnL} 
                  onToggle={() => updateSetting('showMonthlyPnL', !settings.showMonthlyPnL)} 
                />
                <Toggle 
                  label="Show Win Rate" 
                  description="Display your winning trade percentage"
                  enabled={settings.showWinRate} 
                  onToggle={() => updateSetting('showWinRate', !settings.showWinRate)} 
                />
                <Toggle 
                  label="Show Profit Factor" 
                  description="Display your profit factor ratio"
                  enabled={settings.showProfitFactor} 
                  onToggle={() => updateSetting('showProfitFactor', !settings.showProfitFactor)} 
                />
                <Toggle 
                  label="Show Total Trades" 
                  description="Display your total number of trades"
                  enabled={settings.showTotalTrades} 
                  onToggle={() => updateSetting('showTotalTrades', !settings.showTotalTrades)} 
                />
                <Toggle 
                  label="Show Total P&L" 
                  description="Display your overall profit/loss"
                  enabled={settings.showTotalPnL} 
                  onToggle={() => updateSetting('showTotalPnL', !settings.showTotalPnL)} 
                />
                
                <div className="h-px bg-border my-2" />
                
                <Toggle 
                  label="Hide Dollar Amounts" 
                  description="Show relative performance instead of actual values"
                  enabled={settings.hideDollarAmounts} 
                  onToggle={() => updateSetting('hideDollarAmounts', !settings.hideDollarAmounts)}
                  iconOff={EyeOff}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <AnimatePresence>
          {saveMessage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: -10 }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border",
                saveMessage.type === 'success' 
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" 
                  : "bg-red-500/10 border-red-500/20 text-red-600"
              )}
            >
              {saveMessage.text}
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            "ml-auto flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all",
            "bg-primary text-primary-foreground hover:bg-primary/90",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Save Changes
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};

const Toggle = ({ 
  label, 
  description, 
  enabled, 
  onToggle,
  iconOff
}: { 
  label: string; 
  description: string;
  enabled: boolean; 
  onToggle: () => void;
  iconOff?: React.ElementType;
}) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
        {iconOff ? (
          <EyeOff className="w-4 h-4 text-muted-foreground" />
        ) : (
          enabled ? <Eye className="w-4 h-4 text-primary" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <div>
        <p className="font-medium text-foreground text-sm">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={cn(
        "w-12 h-7 rounded-full relative transition-colors",
        enabled ? "bg-primary" : "bg-muted"
      )}
    >
      <motion.div 
        animate={{ x: enabled ? 20 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow"
      />
    </motion.button>
  </div>
);

export default PublicProfile;
