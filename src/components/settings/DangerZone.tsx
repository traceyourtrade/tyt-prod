"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Trash2, AlertCircle } from "lucide-react";
import DeleteAccountModal from "./DeleteAccountModal";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { cn } from "@/lib/utils";

const DangerZone = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data = await res.json();
          setUserEmail(data.email || "");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };
    fetchProfile();
  }, []);

  const handleDeleteAccount = async () => {
    const res = await fetch("/api/user/delete", {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Failed to delete account");
    }

    Cookies.remove("authToken");
    Cookies.remove("userId");
    Cookies.remove("token");
    router.push("/login");
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
          "bg-gradient-to-br from-red-500/20 to-red-500/5"
        )}>
          <AlertTriangle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">Danger Zone</h2>
          <p className="text-sm text-muted-foreground">Irreversible and destructive actions</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "rounded-2xl border overflow-hidden",
          "bg-red-500/5 dark:bg-red-500/5",
          "border-red-500/20"
        )}
      >
        <div className="h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-red-500" />
        
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <motion.div 
                animate={{ 
                  scale: [1, 1.05, 1],
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center flex-shrink-0"
              >
                <AlertCircle className="w-6 h-6 text-red-500" />
              </motion.div>
              <div>
                <h3 className="font-semibold text-foreground text-lg">Delete Account</h3>
                <p className="text-muted-foreground mt-1 max-w-md">
                  Permanently delete your ProJournX account and all associated data including trades, 
                  journals, and settings. This action cannot be undone.
                </p>
                <div className="flex items-center gap-2 mt-3 text-sm text-red-500">
                  <AlertTriangle className="w-4 h-4" />
                  <span>All your data will be permanently erased</span>
                </div>
              </div>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02, x: [0, -2, 2, -2, 2, 0] }}
              whileTap={{ scale: 0.98 }}
              transition={{ x: { duration: 0.4 } }}
              onClick={() => setShowDeleteModal(true)}
              className={cn(
                "px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap",
                "bg-red-500/10 text-red-500 border border-red-500/30",
                "hover:bg-red-500 hover:text-white hover:border-red-500"
              )}
            >
              <Trash2 className="w-4 h-4" />
              Delete Account
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className={cn(
        "p-4 rounded-xl border",
        "bg-amber-500/5 border-amber-500/20"
      )}>
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-amber-600 dark:text-amber-400">Before you go</p>
            <p className="text-sm text-muted-foreground mt-1">
              If you're having issues with your account, our support team might be able to help. 
              Consider reaching out before deleting your account.
            </p>
          </div>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        userEmail={userEmail}
      />
    </motion.div>
  );
};

export default DangerZone;
