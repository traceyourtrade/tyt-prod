"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation, faSpinner, faTrash } from "@fortawesome/free-solid-svg-icons";

interface DeleteAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  userEmail: string;
}

const DeleteAccountModal = ({ isOpen, onClose, onConfirm, userEmail }: DeleteAccountModalProps) => {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const isConfirmValid = confirmText === "DELETE";

  const handleDelete = async () => {
    if (!isConfirmValid) return;
    
    setIsDeleting(true);
    setError("");
    
    try {
      await onConfirm();
    } catch (err: any) {
      setError(err.message || "Failed to delete account. Please try again.");
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (isDeleting) return;
    setConfirmText("");
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-red-500 via-red-600 to-red-500" />
        
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <FontAwesomeIcon icon={faTriangleExclamation} className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Delete Account</h2>
              <p className="text-sm text-muted-foreground">This action cannot be undone</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-lg">
              <p className="text-sm text-foreground">
                You are about to permanently delete your ProJournX account 
                <span className="font-medium"> ({userEmail})</span>. This will:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  Delete all your trading accounts and trades
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  Remove all journal entries and notes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  Delete all strategies and playbook entries
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  Remove your profile and settings permanently
                </li>
              </ul>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-red-500">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE"
                disabled={isDeleting}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 disabled:opacity-50 font-mono"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!isConfirmValid || isDeleting}
              className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                  Delete Account
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteAccountModal;
