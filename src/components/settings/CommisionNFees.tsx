"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faChevronDown } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image"

interface Account {
  tradeNo: number;
  name: string;
  subtext: string;
  brokerIcon: string;
  type: string;
  balance: string;
  lastUpdate: string;
  instrument: string;
  LorS: string;
  lotSize: number;
  comissions: number;
  fees: number;
}

const CommissionNfees = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const accounts: Account[] = [
    {
      tradeNo: 1123,
      name: "Himanshu MT5",
      subtext: "Meta Trader 5",
      brokerIcon: "https://upload.wikimedia.org/wikipedia/commons/2/27/MetaTrader_5.png?20220616130717",
      type: "Autosync",
      balance: "$43,698.55",
      lastUpdate: "10/02/2025, 12:05 AM",
      instrument: "XAUUSD",
      LorS: "Long",
      lotSize: 1,
      comissions: 33,
      fees: 30,
    },
    {
      tradeNo: 1124,
      name: "Tanmay Zerodha",
      subtext: "Kite - Zerodha",
      brokerIcon: "https://images.seeklogo.com/logo-png/48/2/zerodha-kite-logo-png_seeklogo-487028.png",
      type: "Autosync",
      balance: "₹75,446.05",
      lastUpdate: "13/02/2025, 02:05 PM",
      instrument: "BANKNIFTY",
      LorS: "Long",
      lotSize: 2,
      comissions: 26,
      fees: 23,
    },
    {
      tradeNo: 1125,
      name: "Tate Crypto",
      subtext: "Binance",
      brokerIcon: "https://logowik.com/content/uploads/images/binance-black-icon5996.logowik.com.webp",
      type: "File upload",
      balance: "$559.90",
      lastUpdate: "01/03/2025, 04:05 PM",
      instrument: "BTCUSDT",
      LorS: "Short",
      lotSize: 10,
      comissions: 20,
      fees: 17,
    },
  ];

  return (
    <div className="w-[95%] h-[80vh] mx-auto">
      <div className="w-[95%] h-[100px] flex items-center justify-between font-inter mx-auto">
        <div>
          <h3 className="text-[20px]">Commission & Fees</h3>
          <p className="text-[12px] text-[#bebebe] font-[550]">Detailed Insights of all the Commissions & Fees on your Trades.</p>
        </div>
      </div>

      <div className="w-[95%] h-[80px] flex items-start justify-between mx-auto">
        <div className="w-[180px] h-[50px] bg-[rgba(122,122,122,0.214)] rounded-[15px] relative">
          <div className="w-full h-[45px] flex items-center justify-evenly text-[13px] cursor-pointer font-[550]" onClick={toggleDropdown}>
            <FontAwesomeIcon icon={faUser} />
            <span>Select Accounts</span>
            <FontAwesomeIcon icon={faChevronDown} />
          </div>
          <div
            className="w-[180px] flex flex-col items-center justify-evenly text-[13px] cursor-pointer font-[550] absolute z-10 bg-[rgba(196,196,196,0.366)] backdrop-blur-[8px] rounded-[10px] mt-[10px] overflow-hidden transition-[height] duration-1000 ease-in-out"
            style={{ height: isOpen ? 'auto' : '0px' }}
          >
            <span className="w-full text-center py-[5px]">Select Accounts</span>
            <span className="w-full text-center py-[5px]">Select Accounts</span>
            <span className="w-full text-center py-[5px]">Select Accounts</span>
            <span className="w-full text-center py-[5px]">Select Accounts</span>
          </div>
        </div>

        <div className="w-1/2 h-auto flex items-start justify-end">
          <div className="w-[180px] h-[50px] bg-[rgba(122,122,122,0.214)] ml-[20px] rounded-[15px] flex items-center justify-start">
            <span className="text-[21px] font-[550] text-green-600 ml-[15px] mr-[15px]">$</span>
            <p className="text-[13px] flex flex-col font-[550]">
              Total Commission
              <span className="text-[12px] text-[#bebebe]">${accounts.reduce((sum, account) => sum + account.comissions, 0)}</span>
            </p>
          </div>
          <div className="w-[180px] h-[50px] bg-[rgba(122,122,122,0.214)] ml-[20px] rounded-[15px] flex items-center justify-start">
            <span className="text-[21px] font-[550] text-green-600 ml-[15px] mr-[15px]">$</span>
            <p className="text-[13px] flex flex-col font-[550]">
              Total Fees
              <span className="text-[12px] text-[#bebebe]">${accounts.reduce((sum, account) => sum + account.fees, 0)}</span>
            </p>
          </div>
        </div>
      </div>

      <div className="w-[95%] h-[calc(80vh-200px)] flex items-start justify-between font-inter mx-auto bg-[rgba(122,122,122,0.214)] rounded-[25px]">
        <table className="w-full border-collapse rounded-[8px] overflow-hidden">
          <thead>
            <tr className="bg-gradient-to-r from-[#a857d8] to-[#ff9b81] text-white rounded-[25px]">
              <th className="p-[12px] text-center font-bold"><FontAwesomeIcon icon={faChevronDown} /></th>
              <th className="p-[12px] text-center font-bold">Trade Details</th>
              <th className="p-[12px] text-center font-bold">Instrument</th>
              <th className="p-[12px] text-center font-bold">Trade</th>
              <th className="p-[12px] text-center font-bold">Lotsize</th>
              <th className="p-[12px] text-center font-bold">Commissions</th>
              <th className="p-[12px] text-center font-bold">Fees</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account, index) => (
              <tr key={index} className="cursor-pointer">
                <td className="p-[12px] text-center">
                  {/* <Image src={account.brokerIcon} alt="Broker" className="w-[30px] h-auto rounded-full" width={100} height={100} /> */}
                </td>
                <td className="p-[12px] text-left font-bold">
                  <strong>Trade <span style={{ color: "#9d83dd", fontWeight: "400" }}>#{account.tradeNo}</span></strong>
                  <div className="text-[10px] text-[#bebebe] relative left-[30px]">{account.lastUpdate}</div>
                </td>
                <td className="p-[12px] text-center text-[14px] text-[#bebebe] font-[550]">{account.instrument}</td>
                <td className="p-[12px] text-center">
                  <span 
                    className="px-[10px] py-[3px] rounded-[25px]"
                    style={{ 
                      background: account.LorS === "Long" ? "rgba(85, 209, 23, 0.66)" : "rgba(240, 101, 101, 0.55)",
                      color: account.LorS === "Long" ? "#0a7000" : "#ff3131"
                    }}
                  >
                    {account.LorS}
                  </span>
                </td>
                <td className="p-[12px] text-center text-[#bebebe] font-[550]">{account.lotSize} Lots</td>
                <td className="p-[12px] text-center text-[14px] text-[#bebebe] font-[550]">${account.comissions}</td>
                <td className="p-[12px] text-center text-[14px] text-[#bebebe] font-[550]">${account.fees}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CommissionNfees;