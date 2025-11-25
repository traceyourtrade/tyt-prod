"use client";
import { useState, useRef, useEffect, use } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare, faCircleInfo, faCircleXmark, faTrashCan } from "@fortawesome/free-solid-svg-icons";
import SyncIcon from "@mui/icons-material/Sync";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import useAccountDetails from "@/store/accountdetails";
import calendarPopUp from "@/store/calendarPopUp";
import notifications from "@/store/notifications";
import Image from "next/image";

interface Account {
  accountName: string;
  broker: string;
  accountType: string;
  accountBalance: string;
  lastUpdate: string;
}

const Account = () => {
  const [visibleOptions, setVisibleOptions] = useState<number | null>(null);
  const optionsRefs = useRef<(HTMLDivElement | null)[]>([]);

  const { accounts } = useAccountDetails();
  const { setEditAcc, setEditAccData, setDeleteAcc, setDeleteAccData,setAddAcc } = calendarPopUp();
  const { setAlertBoxG } = notifications();
  const MT5 = "https://upload.wikimedia.org/wikipedia/commons/2/27/MetaTrader_5.png?20220616130717";
  const MT4 = "https://fxscouts.com/wp-content/uploads/sites/20/2024/08/mt4-sign.png";

  const handleMenuClick = (index: number) => {
    console.log("Clicked menu for index:", index);
    setVisibleOptions(visibleOptions === index ? null : index);
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (visibleOptions !== null) {
      const currentRef = optionsRefs.current[visibleOptions];
      if (currentRef && !currentRef.contains(event.target as Node)) {
        setVisibleOptions(null);
      }
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visibleOptions]);

  return (
    <div className="w-[95%] h-[80vh] mx-auto">
      <div className="w-[95%] h-[100px] flex items-center justify-between font-inter mx-auto">
        <div>
          <h3 className="text-[20px]">ACCOUNTS</h3>
          <p className="text-[12px] text-[#bebebe] font-[550]">You can add upto 10 Active accounts</p>
        </div>
        <button className="text-[14px] no-underline text-white bg-[#803dca] px-[15px] py-[5px] rounded-[25px] cursor-pointer" onClick={() => setAddAcc()}>
          + Add New Account
        </button>
      </div>

      <div className="w-[95%] h-[calc(80vh-130px)] flex items-start justify-between font-inter mx-auto bg-[rgba(122,122,122,0.214)] rounded-[25px]">
        <table className="w-full border-collapse rounded-[8px] overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-[#a857d8] to-[#ff9b81] text-white rounded-[25px]">
              <th className="p-[12px] text-center font-bold">Account Name</th>
              <th className="p-[12px] text-center font-bold">Broker</th>
              <th className="p-[12px] text-center font-bold">Type</th>
              <th className="p-[12px] text-center font-bold">Sync</th>
              <th className="p-[12px] text-center font-bold">Balance</th>
              <th className="p-[12px] text-center font-bold">Last Update</th>
              <th className="p-[12px] text-center font-bold"></th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account, index) => (
              <tr key={index} className="cursor-pointer">
                <td className="p-[12px] text-left font-bold">
                  <strong>{account.accountName}</strong>
                  <div className="text-[10px] text-[#bebebe] ">{account.broker}</div>
                </td>
                <td className="p-[12px] text-center">
                  <Image 
                    src={account.broker === "MetaTrader 5" ? MT5 : account.broker === "MetaTrader 4" ? MT4 : ""} 
                    alt="Broker" 
                    className="w-[30px] h-auto rounded-full" 
                    width={100}
                    height={100}
                  />
                </td>
                <td className="p-[12px] text-center text-[12px] text-white font-[550]">{account.accountType}</td>
                <td className="p-[12px] text-center">
                  <SyncIcon className="text-[#54a0ff] cursor-pointer " fontSize="small"  width={100} height={100}/>
                </td>
                <td className="p-[12px] text-left font-bold text-white ">{account.accountBalance}</td>
                <td className="p-[12px] text-center text-[12px] text-[#555] font-[550]">{account.lastUpdate}</td>
                <td
                  className="p-[12px] text-center flex items-center gap-[10px]"
                  ref={(el) => (optionsRefs.current[index] = el)}
                >
                  <AttachFileIcon className="text-[#bebebe] cursor-pointer " fontSize="small" onClick={()=>alert("kdf")} />
                  <MoreVertIcon
                    className="text-[#bebebe] cursor-pointer "
                    fontSize="small"
                    onClick={() => handleMenuClick(index)}
                  />
                  <div
                    className={`w-[150px] h-auto bg-white flex flex-col items-start p-[10px] rounded-[10px] absolute mt-[180px] ml-[-100px] z-10 opacity-0 invisible transition-all duration-200 ease-in-out transform -translate-y-[10px] ${
                      visibleOptions === index ? "opacity-100 visible translate-y-0" : ""
                    }`}
                  >
                    <span 
                      onClick={() => { setEditAccData(account); setEditAcc();setVisibleOptions(null); }}
                      className="w-[90%] text-[12px] px-[5px] py-[5px] text-[#555] font-[550] text-left mx-auto rounded-[10px] hover:bg-[#ededed]"
                    >
                      <FontAwesomeIcon icon={faPenToSquare} className="mr-[5px] ml-[5px] text-[#333]" /> Edit
                    </span>
                    <span 
                      onClick={() => setAlertBoxG(account.accountName, "success")}
                      className="w-[90%] text-[12px] px-[5px] py-[5px] text-[#555] font-[550] text-left mx-auto rounded-[10px] hover:bg-[#ededed]"
                    >
                      <FontAwesomeIcon icon={faCircleInfo} className="mr-[5px] ml-[5px] text-[#333]" /> Account History
                    </span>
                    <span 
                      onClick={() => setAlertBoxG(account.accountName, "success")}
                      className="w-[90%] text-[12px] px-[5px] py-[5px] text-[#555] font-[550] text-left mx-auto rounded-[10px] hover:bg-[#ededed]"
                    >
                      <FontAwesomeIcon icon={faCircleXmark} className="mr-[5px] ml-[5px] text-[#333]" /> Clear Trades
                    </span>
                    <span 
                      onClick={() => { setDeleteAccData(account); setDeleteAcc() ;setVisibleOptions(null); }}
                      className="w-[90%] text-[12px] px-[5px] py-[5px] bg-[#ff6c6cce] text-white font-[550] text-left mx-auto rounded-[10px] hover:bg-[#ff6c6cce]"
                    >
                      <FontAwesomeIcon icon={faTrashCan} className="mr-[5px] ml-[5px] text-white" /> Delete Account
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Account;