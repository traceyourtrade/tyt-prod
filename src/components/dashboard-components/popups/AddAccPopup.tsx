"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleLeft, faChevronDown } from "@fortawesome/free-solid-svg-icons";

// Store
import calendarPopUp from "@/store/calendarPopUp";
import notifications from "@/store/notifications";
import useAccountDetails from "@/store/accountdetails";
import { useDataStore } from "@/store/store";

interface AccountDetails {
  accountName: string;
  accountBalance: string;
  description: string;
}

const AddAccPopup = () => {
  const { showAddAcc, setAddAcc } = calendarPopUp();
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
  const [forAccType, setForAcc] = useState<boolean>(false);
  const [forBroker, setForBroker] = useState<boolean>(false);

  const handleOnChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAccDetails({ ...accountDetails, [name]: value });
  };


  const submitFun = async (e: React.FormEvent) => {
    e.preventDefault();

    if (accountType === "Broker Sync") {
      const { accountName, description } = accountDetails;

      if (accountType === "Select your Account Type") {
        setError("Please select account type");
        setSuccess("");
      } else if (broker === "Select your Broker") {
        setError("Please select a broker");
        setSuccess("");
      } else {
        try {
          const res = await fetch(`/api/dashboard/post`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              accountName, 
              accountType, 
              broker, 
              investorId, 
              password: investorPw, 
              serverName: server, 
              description, 
              apiName:'createAutoSyncAccount'
            })
          });

          const data = await res.json();

          if (res.status === 200) {
            setError("");

            setTimeout(() => {
              setAddAcc();
              setAlertBoxG("Your account details are being fetched, this may take few seconds", "async-alert");
              accStatusPolling(accountName );
              setAccounts();
            }, 1500);

          } else {
            if (data.error === "User not authenticated") {
              setError("Authentication Failed");
            } else if (data.error === "Enter all the details") {
              setError("Fill all the entries");
            } else if (data.error === "Account already exists") {
              setError("Account with the same name is already created, try using different name");
            }
          }

        } catch (error) {
          console.error(error);
        }
      }
    } else {
      const { accountName, accountBalance, description } = accountDetails;

      if (accountType === "Select your Account Type") {
        setError("Please select account type");
        setSuccess("");
      } else if (broker === "Select your Broker") {
        setError("Please select a broker");
        setSuccess("");
      } else {
        try {
          const res = await fetch(`/api/dashboard/post`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              accountName, 
              accountBalance, 
              accountType, 
              broker, 
              description, 
              apiName:'createAccount'
            })
          });

          const data = await res.json();

          if (res.status === 200) {
            setError("");

            setTimeout(() => {
              setAddAcc();
              setAccounts();
            }, 1500);

          } else {
            if (data.error === "User not authenticated") {
              setError("Authentication Failed");
            } else if (data.error === "Enter all the details") {
              setError("Fill all the entries");
            } else if (data.error === "Account already exists") {
              setError("Account with the same name is already created, try using different name");
            }
          }

        } catch (error) {
          console.error(error);
        }
      }
    }
  };

  const brokers = ["MetaTrader 5", "MetaTrader 4", "Zerodha", "Binance", "Upstox", "Angel One"];

  return (
    <div className={`fixed inset-0 flex justify-start pt-12 min-h-screen z-50
  bg-black/40 backdrop-blur-md ${showAddAcc ? "block" : "hidden"}`}>
      <div className="w-11/12 max-w-[500px] h-fit bg-[#22212161] backdrop-blur-[30px] border border-gray-600 rounded-[25px] shadow-2xl scale-90 mx-auto">
        <div className="relative p-6">
          {/* Back Button */}
          <div className="absolute top-5 left-5">
            <button 
              onClick={() => setAddAcc()} 
              className="text-xs text-gray-400 font-semibold cursor-pointer flex items-center gap-2 hover:text-gray-300 transition-colors"
            >
              <FontAwesomeIcon icon={faCircleLeft} />
              Back
            </button>
          </div>

          {/* Logo */}
          <div className="text-center mt-2">
            <div className="w-[70px] h-[70px] mx-auto mt-1 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">TYT</span>
            </div>
          </div>

          {/* Header */}
          <h2 className="text-center text-2xl font-semibold text-white">Add New Account</h2>
          <p className="text-center text-xs text-gray-400 font-medium mt-1">
            Your trades, your data, your edge - fully automated and optimised
          </p>

          {/* Form */}
          <div className="w-full flex flex-col items-center mt-6">
            <input
              placeholder="Account Name"
              required
              autoComplete="off"
              type="text"
              name="accountName"
              value={accountDetails.accountName}
              onChange={handleOnChange}
              className="w-4/5 px-4 py-3 rounded-[25px] text-sm font-semibold bg-gray-100 border-none outline-none mb-4 text-black"
            />

            {/* Account Type Dropdown */}
            <div className="w-[calc(80%+30px)] min-h-[44px] rounded-[25px] bg-purple-600 mt-2 overflow-hidden">
              <div 
                className="w-full h-[44px] flex items-center justify-between text-white cursor-pointer px-4"
                onClick={() => { setForAcc(!forAccType); setForBroker(false); }}
              >
                <span className="font-semibold text-sm">{accountType}</span>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  className={`text-white transition-transform duration-300 ${forAccType ? "rotate-180" : ""}`}
                />
              </div>
              <div className={`bg-gray-100 transition-all duration-300 ease-in-out overflow-hidden ${
                forAccType ? "max-h-[120px] py-2" : "max-h-0"
              }`}>
                {["Broker Sync", "File Upload", "Manual"].map((type) => (
                  <div
                    key={type}
                    className="w-full px-4 py-2 cursor-pointer text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
                    onClick={() => { setAccountType(type); setForAcc(false); }}
                  >
                    {type}
                  </div>
                ))}
              </div>
            </div>

            {/* Account Balance for File Upload and Manual */}
            {(accountType === "File Upload" || accountType === "Manual") && (
              <input
                placeholder="Account Balance"
                required
                autoComplete="off"
                type="number"
                name="accountBalance"
                value={accountDetails.accountBalance}
                onChange={handleOnChange}
                className="w-4/5 px-4 py-3 rounded-[25px] text-sm font-semibold bg-gray-100 border-none outline-none mt-4 text-black"
              />
            )}

            {/* Broker Dropdown */}
            <div className="w-[calc(80%+30px)] min-h-[44px] rounded-[25px] bg-gray-100 mt-4 overflow-hidden">
              <div 
                className="w-full h-[44px] flex items-center justify-between text-gray-600 cursor-pointer px-4 font-semibold"
                onClick={() => { setForBroker(!forBroker); setForAcc(false); }}
              >
                <span className="text-sm">{broker}</span>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  className={`text-gray-600 transition-transform duration-300 ${forBroker ? "rotate-180" : ""}`}
                />
              </div>
              <div className={`bg-gray-100 transition-all duration-300 ease-in-out overflow-hidden ${
                forBroker 
                  ? accountType === "Broker Sync" 
                    ? "max-h-[60px] py-2" 
                    : "max-h-[200px] py-2"
                  : "max-h-0"
              }`}>
                {(accountType === "Broker Sync" ? ["MetaTrader 5"] : brokers).map((brokerItem) => (
                  <div
                    key={brokerItem}
                    className="w-full px-4 py-2 cursor-pointer text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
                    onClick={() => { setBroker(brokerItem); setForBroker(false); }}
                  >
                    {brokerItem}
                  </div>
                ))}
              </div>
            </div>

            {/* MT5 Credentials */}
            {accountType === "Broker Sync" && broker === "MetaTrader 5" && (
              <>
                <input
                  placeholder="Investor ID"
                  required
                  autoComplete="off"
                  type="text"
                  name="investorId"
                  value={investorId}
                  onChange={(e) => setInvestorId(e.target.value)}
                  className="w-4/5 px-4 py-3 rounded-[25px] text-sm font-semibold bg-gray-100 border-none outline-none mt-4 text-black"
                />
                <input
                  placeholder="Investor Password"
                  required
                  autoComplete="off"
                  type="password"
                  name="investorPw"
                  value={investorPw}
                  onChange={(e) => setInvestorPw(e.target.value)}
                  className="w-4/5 px-4 py-3 rounded-[25px] text-sm font-semibold bg-gray-100 border-none outline-none mt-4 text-black"
                />
                <input
                  placeholder="Server Name"
                  required
                  autoComplete="off"
                  type="text"
                  name="server"
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  className="w-4/5 px-4 py-3 rounded-[25px] text-sm font-semibold bg-gray-100 border-none outline-none mt-4 text-black"
                />
              </>
            )}

            <textarea
              autoComplete="off"
              name="description"
              value={accountDetails.description}
              onChange={handleOnChange}
              placeholder="Description (Optional)"
              className="w-4/5 text-black px-4 py-3 rounded-[25px] text-sm font-semibold bg-gray-100 border-none outline-none mt-4 h-20 resize-none"
            />
          </div>

          {/* Purple Bar Divider */}
          <div className="w-full flex justify-center my-6">
            <div className="w-1/2 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-70 rounded"></div>
          </div>

          {/* Error and Success Messages */}
          {error && (
            <p className="text-red-400 text-xs text-center mb-3 animate-pulse">{error}</p>
          )}
          {success && (
            <p className="text-green-400 text-xs text-center mb-3 animate-pulse">{success}</p>
          )}

          {/* Submit Button */}
          <button 
            className="w-36 mx-auto block py-3 rounded-[25px] text-sm text-white font-semibold border-none outline-none bg-purple-600 hover:bg-purple-700 cursor-pointer transition-all duration-200 transform hover:scale-105"
            onClick={submitFun}
          >
            Add Account
          </button>

          {/* Help Link */}
          <button className="w-full text-center text-purple-400 text-xs font-semibold mt-4 mb-2 cursor-pointer hover:text-purple-300 transition-colors">
            Need Help ?
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAccPopup;