"use client";
import { useEffect, useState } from "react";
import { X, Trash2, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import calendarPopUp from "@/store/calendarPopUp";
import notifications from "@/store/notifications";
import useAccountDetails from "@/store/accountdetails";
import { useDataStore } from "@/store/store";
import { cn } from "@/lib/utils";

interface AccountDetails {
  accountName: string;
  accountBalance: string;
  description: string;
}

interface DeleteAccData {
  accountType?: string;
  broker?: string;
  investorId?: string;
  investorPw?: string;
  serverName?: string;
  accountName?: string;
  accountBalance?: string;
  description?: string;
}

const DeleteAccPopup = () => {
  const { showDeleteAcc, setDeleteAcc, deleteAccData } = calendarPopUp();
  const { setAccounts } = useAccountDetails();
  const { setAlertBoxG } = notifications();
  const { bkurl } = useDataStore();

  const [accountDetails, setAccDetails] = useState<AccountDetails>({
    accountName: "",
    accountBalance: "",
    description: ""
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [confirmAccountName, setConfirmAccountName] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const data = deleteAccData as DeleteAccData;
    setAccDetails({
      accountName: data.accountName || "",
      accountBalance: data.accountBalance || "",
      description: data.description || ""
    });
    setConfirmAccountName("");
    setError("");
    setSuccess("");
  }, [deleteAccData]);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (confirmAccountName !== accountDetails.accountName) return;

    setIsDeleting(true);
    const { accountName } = accountDetails;

    try {
      const res = await fetch(`/api/dashboard/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accountName,
          apiName: (deleteAccData as DeleteAccData).accountType === 'Broker Sync' ? 'deleteAsyncAcc' : 'deleteFileManual'
        })
      });

      const data = await res.json();

      if (res.status === 200) {
        setError("");
        setSuccess("Account deleted successfully");

        setTimeout(() => {
          setDeleteAcc();
          setAlertBoxG("Your account has been deleted.", "async-alert");
          setAccounts();
          setIsDeleting(false);
        }, 1500);
      } else {
        setError(data.error || "Something went wrong");
        setIsDeleting(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      setIsDeleting(false);
    }
  };

  const isConfirmValid = confirmAccountName === accountDetails.accountName;

  return (
    <AnimatePresence>
      {showDeleteAcc && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteAcc()}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500" />
            
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Delete Account</h2>
                    <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setDeleteAcc()}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <div className="mb-6 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-500 mb-1">Warning</p>
                    <p className="text-sm text-muted-foreground">
                      You are about to permanently delete <span className="font-semibold text-foreground">{accountDetails.accountName}</span> and all associated trade data. This action is irreversible.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Type <span className="font-semibold text-red-500">{accountDetails.accountName}</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmAccountName}
                    onChange={(e) => { 
                      setConfirmAccountName(e.target.value); 
                      setError(""); 
                      setSuccess(""); 
                    }}
                    placeholder="Enter account name"
                    className={cn(
                      "w-full px-4 py-3 rounded-xl text-sm font-medium",
                      "bg-muted/50 border transition-all duration-200",
                      "placeholder:text-muted-foreground/50 text-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-red-500/30",
                      isConfirmValid 
                        ? "border-green-500/50 bg-green-500/5" 
                        : confirmAccountName 
                          ? "border-red-500/50" 
                          : "border-border"
                    )}
                  />
                </div>

                <AnimatePresence mode="wait">
                  {error && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-red-500 text-sm text-center"
                    >
                      {error}
                    </motion.p>
                  )}
                  {success && (
                    <motion.p 
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-green-500 text-sm text-center"
                    >
                      {success}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setDeleteAcc()}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-medium text-foreground bg-muted hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={!isConfirmValid || isDeleting}
                    className={cn(
                      "flex-1 px-4 py-3 rounded-xl text-sm font-medium text-white transition-all duration-200",
                      "flex items-center justify-center gap-2",
                      isConfirmValid && !isDeleting
                        ? "bg-red-600 hover:bg-red-700 cursor-pointer" 
                        : "bg-muted text-muted-foreground cursor-not-allowed"
                    )}
                  >
                    {isDeleting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Delete Account
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default DeleteAccPopup;
