"use client";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleLeft } from "@fortawesome/free-solid-svg-icons";
import calendarPopUp from "@/store/calendarPopUp";
import notifications from "@/store/notifications";
import useAccountDetails from "@/store/accountdetails";
import { useDataStore } from "@/store/store";


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
  const { setAlertBoxG, accStatusPolling } = notifications();
  const { bkurl } = useDataStore();

  const [accountType, setAccountType] = useState<string>("Select your Account Type");
  const [broker, setBroker] = useState<string>("Select your Broker");
  const [investorId, setInvestorId] = useState<string>("");
  const [investorPw, setInvestorPw] = useState<string>("");
  const [server, setServer] = useState<string>("");
  const [accountDetails, setAccDetails] = useState<AccountDetails>({
    accountName: "",
    accountBalance: "",
    description: ""
  });
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [confirmAccountName, setConfirmAccountName] = useState<string>("");

  useEffect(() => {
    const data = deleteAccData as DeleteAccData;
    setAccountType(data.accountType || "Select your Account Type");
    setBroker(data.broker || "Select your Broker");
    setInvestorId(data.investorId || "");
    setInvestorPw(data.investorPw || "");
    setServer(data.serverName || "");
    setAccDetails({
      accountName: data.accountName || "",
      accountBalance: data.accountBalance || "",
      description: data.description || ""
    });
  }, [deleteAccData]);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAccDetails({ ...accountDetails, [name]: value });
  };


  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();

    const { accountName } = accountDetails;

    try {
      const res = await fetch(`/api/dashboard/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          accountName,
          apiName:deleteAccData.accountType === 'Broker Sync' ? 'deleteAsyncAcc' : 'deleteFileManual'
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
        }, 1500);
      } else {
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    }
  };

  return (
<div
  className={`fixed inset-0 flex justify-start pt-12 min-h-screen 
  bg-black/40 backdrop-blur-md 
  ${showDeleteAcc ? "block" : "hidden"}`}
>

      <div className="w-11/12 max-w-[500px] h-fit bg-[#22212161] backdrop-blur-[30px] border border-gray-600 rounded-[25px] shadow-2xl scale-90 mx-auto">
        <div className="relative p-6">
          <div className="absolute top-5 left-5">
            <button 
              onClick={() => setDeleteAcc()} 
              className="text-xs text-gray-400 font-semibold cursor-pointer flex items-center gap-2 hover:text-gray-300 transition-colors"
            >
              <FontAwesomeIcon icon={faCircleLeft} />
              Back
            </button>
          </div>

          <div className="text-center mt-2">
            {/* Logo placeholder - replace with your actual logo */}
            <div className="w-[70px] h-[70px] mx-auto mt-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">TYT</span>
            </div>
          </div>

          <h2 className="text-center text-2xl font-semibold text-white mb-2">Delete Account</h2>
          
          <div className="text-center text-sm text-gray-300 mb-5">
            Enter <strong className="text-white">{accountDetails.accountName}</strong> to confirm delete
          </div>
          
          <div className="text-center text-sm text-red-400 mb-5">
            This will delete all your trade data from us.
          </div>

          <div className="w-full flex flex-col items-center mt-5">
            <input
              placeholder="Enter Account Name"
              type="text"
              value={confirmAccountName}
              onChange={(e) => { 
                setConfirmAccountName(e.target.value); 
                setError(""); 
                setSuccess(""); 
              }}
              className={`w-4/5 px-4 py-3 rounded-[25px] text-sm font-semibold bg-gray-100 border-none outline-none transition-colors text-black ${
                confirmAccountName && confirmAccountName !== accountDetails.accountName 
                  ? "border-2 border-red-500" 
                  : "border-2 border-transparent"
              }`}
            />
          </div>

          <div className="w-full flex justify-center my-6">
            <div className="w-1/2 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-70 rounded"></div>
          </div>

          {error && (
            <p className="text-red-400 text-xs text-center mb-2 animate-pulse">{error}</p>
          )}
          {success && (
            <p className="text-green-400 text-xs text-center mb-2 animate-pulse">{success}</p>
          )}

          <button
            className={`w-36 mx-auto block py-3 rounded-[25px] text-sm text-white font-semibold border-none outline-none transition-all duration-200 ${
              confirmAccountName === accountDetails.accountName 
                ? "bg-red-600 hover:bg-red-700 cursor-pointer transform hover:scale-105" 
                : "bg-gray-500 cursor-not-allowed"
            }`}
            onClick={handleDelete}
            disabled={confirmAccountName !== accountDetails.accountName}
          >
            Delete Account
          </button>

          <button className="w-full text-center text-purple-400 text-xs font-semibold mt-4 mb-2 cursor-pointer hover:text-purple-300 transition-colors">
            Need Help ?
          </button>
        </div>
      </div>
    </div>
  );
};


export default DeleteAccPopup;