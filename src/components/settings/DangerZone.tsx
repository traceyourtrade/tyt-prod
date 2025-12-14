"use client";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import DeleteAccountModal from "./DeleteAccountModal";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";

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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Danger Zone</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Irreversible and destructive actions
        </p>
      </div>

      <div className="bg-card border border-red-500/30 rounded-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-red-500 via-red-600 to-red-500" />
        
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Delete Account</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently delete your ProJournX account and all associated data. 
                  This action cannot be undone.
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/30 rounded-lg font-medium hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
              Delete Account
            </button>
          </div>
        </div>
      </div>

      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteAccount}
        userEmail={userEmail}
      />
    </div>
  );
};

export default DangerZone;
