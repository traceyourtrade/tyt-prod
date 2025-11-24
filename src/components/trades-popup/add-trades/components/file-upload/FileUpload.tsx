'use client';

import { useState, useRef } from "react";
import Cookies from "js-cookie";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
    faDotCircle, 
    faChevronDown, 
    faCheck, 
    faPlus, 
    faFileArrowUp, 
    faTrashCan,
    faXmark 
} from "@fortawesome/free-solid-svg-icons";
import { faHtml5 } from "@fortawesome/free-brands-svg-icons";
import { useDataStore as store } from "@/store/store";
import useAccountDetails from "@/store/accountdetails";

const FileUpload = () => {
    // stores
    let { accounts, setAccounts } = useAccountDetails();
    
    accounts = accounts.filter((ele) => {
        return ele.accountType === "File Upload"
    });

    const { bkurl } = store();

    // drop downs for accounts
    const [showAccountDropdown, setShowAccountDropdown] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<any>(null);

    const toggleAccountDropdown = () => setShowAccountDropdown((prev) => !prev);

    const handleAccountSelect = (account: any) => {
        setSelectedAccount(account);
        setBrokerName(account.broker);
        setBrokers([account.broker]);
        setShowAccountDropdown(false);
    };

    // drop downs for fileUpload
    const [showFileDropdown, setShowFileDropdown] = useState(false);
    const [selectedFile, setSelectedFile] = useState<any>(null);

    const toggleFileDropdown = () => setShowFileDropdown((prev) => !prev);

    const handleFileSelect = (account: any) => {
        setSelectedFile(account);
        setShowFileDropdown(false);
    };

    // drop downs for TimeZone
    const [showTZDropdown, setTZDropdown] = useState(false);
    const [selectedTz, setSelectedTz] = useState<any>(null);

    const toggleTZDropdown = () => setTZDropdown((prev) => !prev);

    const handleTZSelect = (account: any) => {
        setSelectedTz(account);
        setTZDropdown(false);
    };

    // Variables & Arr for storing input
    const [tradeDetails, setTradeDetails] = useState<any[]>([]);

    const fileFormatArr = [
        { _id: 1, accountName: "HTML", faLink: faHtml5 },
        { _id: 2, accountName: "XML", faLink: faHtml5 },
    ];

    const timeZones = [
        { _id: 1, accountName: "Alaska Daylight Time (AKDT) UTC-08:00" },
        { _id: 2, accountName: "Alaska Standard Time (AKST) UTC-09:00" },
        { _id: 3, accountName: "American Samoa Standard Time (SST) UTC-11:00" },
        { _id: 4, accountName: "Arabian Standard Time (AST) UTC+03:00" },
        { _id: 5, accountName: "Argentina Time (ART) UTC-03:00" },
        { _id: 6, accountName: "Armenia Time (AMT) UTC+04:00" },
        { _id: 7, accountName: "Australian Central Daylight Time (ACDT) UTC+10:30" },
        { _id: 8, accountName: "Australian Central Standard Time (ACST) UTC+09:30" },
        { _id: 9, accountName: "Australian Eastern Daylight Time (AEDT) UTC+11:00" },
        { _id: 10, accountName: "Australian Eastern Standard Time (AEST) UTC+10:00" },
        { _id: 11, accountName: "Australian Western Daylight Time (AWDT) UTC+09:00" },
        { _id: 12, accountName: "Australian Western Standard Time (AWST) UTC+08:00" },
        { _id: 13, accountName: "Atlantic Daylight Time (ADT) UTC-03:00" },
        { _id: 14, accountName: "Bhutan Time (BTT) UTC+06:00" },
        { _id: 15, accountName: "British Summer Time (BST) UTC+01:00" },
        { _id: 16, accountName: "Central Daylight Time (CDT) UTC-05:00" },
        { _id: 17, accountName: "Central European Summer Time (CEST) UTC+02:00" },
        { _id: 18, accountName: "Central European Time (CET) UTC+01:00" },
        { _id: 19, accountName: "Central Standard Time (CST) UTC-06:00" },
        { _id: 20, accountName: "Chile Standard Time (CLT) UTC-04:00" },
        { _id: 21, accountName: "Chile Summer Time (CLST) UTC-03:00" },
        { _id: 22, accountName: "China Standard Time (CST) UTC+08:00" },
        { _id: 23, accountName: "Coordinated Universal Time (UTC) UTC±00:00" },
        { _id: 24, accountName: "East Africa Time (EAT) UTC+03:00" },
        { _id: 25, accountName: "Eastern Daylight Time (EDT) UTC-04:00" },
        { _id: 26, accountName: "Eastern European Time (EET) UTC+02:00" },
        { _id: 27, accountName: "Eastern Standard Time (EST) UTC-05:00" },
        { _id: 28, accountName: "Fiji Time (FJT) UTC+12:00" },
        { _id: 29, accountName: "French Guiana Time (GFT) UTC-03:00" },
        { _id: 30, accountName: "Greenwich Mean Time (GMT) UTC±00:00" },
        { _id: 31, accountName: "Guyana Time (GYT) UTC-04:00" },
        { _id: 32, accountName: "Hawaii-Aleutian Standard Time (HST) UTC-10:00" },
        { _id: 33, accountName: "Indian Standard Time (IST) UTC+05:30" },
        { _id: 34, accountName: "Japan Standard Time (JST) UTC+09:00" },
        { _id: 35, accountName: "Korea Standard Time (KST) UTC+09:00" },
        { _id: 36, accountName: "Moscow Standard Time (UTC+03:00) UTC+03:00" },
        { _id: 37, accountName: "Moscow Time (MSK) UTC+03:00" },
        { _id: 38, accountName: "Mountain Daylight Time (MDT) UTC-06:00" },
        { _id: 39, accountName: "Mountain Standard Time (MST) UTC-07:00" },
        { _id: 40, accountName: "New Zealand Daylight Time (NZDT) UTC+13:00" },
        { _id: 41, accountName: "New Zealand Standard Time (NZST) UTC+12:00" },
        { _id: 42, accountName: "Nepal Time (NPT) UTC+05:45" },
        { _id: 43, accountName: "Pacific Daylight Time (PDT) UTC-07:00" },
        { _id: 44, accountName: "Pacific Standard Time (PST) UTC-08:00" },
        { _id: 45, accountName: "Tokelau Time (TKT) UTC+13:00" },
        { _id: 46, accountName: "Venezuelan Standard Time (VET) UTC-04:00" },
        { _id: 47, accountName: "Western European Time (WET) UTC±00:00" },
        { _id: 48, accountName: "Western Standard Time (WST) UTC+08:00" },
        { _id: 49, accountName: "Western European Time (WET) UTC±00:00" },
        { _id: 50, accountName: "Zulu Time (Z) UTC±00:00" }
    ];

    // Broker drop down
    const [brokerName, setBrokerName] = useState("MetaTrader 5");
    const [brokers, setBrokers] = useState([
        "MetaTrader 5",
        "MetaTrader 4",
        "Binance",
        "Zerodha",
        "Angel Broker",
        "Upstox",
    ]);

    // File upload
    const [fileName, setFileName] = useState("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    function extractTradeData(fileContent: string) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(fileContent, 'text/html');

        const positions: any[] = [];
        const positionsHeader = Array.from(doc.querySelectorAll('tr')).find(row =>
            row.textContent?.includes('Positions') && row.querySelector('th')
        );

        if (positionsHeader) {
            let currentRow = positionsHeader.nextElementSibling;
            if (currentRow) {
                currentRow = currentRow.nextElementSibling;
            }

            while (currentRow && currentRow.querySelector('td')) {
                const cells = currentRow.querySelectorAll('td');
                if (cells.length >= 5) {
                    const visibleCells = Array.from(cells).filter(cell => !cell.classList.contains('hidden'));
                    const [datePart, timePart] = cells[0]?.textContent?.trim().split(" ") || [];
                    const dateFormatted = datePart?.split(".").join("-") || '';

                    const position = {
                        date: dateFormatted,
                        time: timePart,
                        OpenTime: cells[0].textContent?.trim() ?? '',
                        Ticket: cells[1]?.textContent?.trim() ?? '',
                        Item: cells[2]?.textContent?.trim() ?? '',
                        Type: cells[3]?.textContent?.trim() ?? '',
                        Size: parseFloat(visibleCells[4]?.textContent?.trim() ?? '0') || 0,
                        OpenPrice: parseFloat(visibleCells[5]?.textContent?.trim() ?? '0') || 0,
                        StopLoss: parseFloat(visibleCells[6]?.textContent?.trim() ?? '0') || 0,
                        TakeProfit: parseFloat(visibleCells[7]?.textContent?.trim() ?? '0') || 0,
                        CloseTime: visibleCells[8]?.textContent?.trim() ?? '',
                        ClosePrice: parseFloat(visibleCells[9]?.textContent?.trim() ?? '0') || 0,
                        Commission: parseFloat(visibleCells[10]?.textContent?.trim() ?? '0') || 0,
                        Swap: parseFloat(visibleCells[11]?.textContent?.trim() ?? '0') || 0,
                        Profit: parseFloat(cells[cells.length - 1]?.textContent?.trim() ?? '0') || 0
                    };

                    positions.push(position);
                }
                currentRow = currentRow.nextElementSibling;
            }
        }

        return positions;
    }

    function handleFile(file: File) {
        const reader = new FileReader();

        reader.onload = function (event) {
            const fileContent = event.target?.result as string;
            const tradeData = extractTradeData(fileContent);
            setError("");
            setTradeDetails(JSON.stringify(tradeData, null, 2));
        };

        reader.readAsText(file);
    }

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        handleFile(file);
        setFileName(file.name);
    };

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
    };

    const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setFileName(file.name);
            handleFile(file);
        } else {
            setFileName("");
        }
    };

    const handleRemoveFile = () => {
        setFileName("");
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    // Broker btn open close
    const [isBrokerOpen, setBrokerBtn] = useState(false);

    // MT5 Upload Component
    const MT5Upload = () => {
        return (
            <div 
                className="w-[95%] h-auto min-h-[150px] flex flex-col items-center justify-center text-center mx-auto rounded-[25px] mt-[20px] mb-[15px] bg-[#ededed] border border-dashed border-[#4a4a4a]"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
            >
                <FontAwesomeIcon icon={faFileArrowUp} className="text-[20px] relative top-[-5px] text-black" />
                <p className="relative top-[5px] text-[14px] text-[#000]">Drag and Drop file or Upload from your computer (MT5)</p>
                <div className="text-center mt-[20px]">
                    <input
                        type="file"
                        accept=".html"
                        id="file-upload-dark"
                        ref={fileInputRef}
                        onChange={handleFileInputChange}
                        className="hidden"
                    />
                    <label
                        htmlFor="file-upload-dark"
                        className="inline-block px-[20px] py-[5px] bg-[#9d83dd] text-white rounded-[25px] cursor-pointer text-[12px] font-[550]"
                    >
                        + UPLOAD FILE
                    </label>

                    {fileName && (
                        <div className="mt-[5px] text-[12px] text-[#666]">
                            {fileName}{" "}
                            <FontAwesomeIcon
                                icon={faTrashCan}
                                onClick={handleRemoveFile}
                                className="ml-[10px] text-red-500 cursor-pointer text-[14px]"
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // MT4 Upload Component
    const handleFileMT4 = (file: File) => {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(e.target?.result as string, "text/html");
            const rows = Array.from(doc.querySelectorAll("tr"));
            const extractedData: any[] = [];
            let insideClosedTrades = false;

            rows.forEach((row) => {
                const cols = Array.from(row.children).map((col) => col.textContent?.trim() || "");
                if (cols[0] === "Closed Transactions:") {
                    insideClosedTrades = true;
                    return;
                }
                if (insideClosedTrades && cols[0] === "Open Trades:") {
                    insideClosedTrades = false;
                    return;
                }
                if (insideClosedTrades && cols.length === 14 && !cols.includes("Ticket")) {
                    extractedData.push({
                        Ticket: cols[0],
                        OpenTime: cols[1],
                        Type: cols[2],
                        Size: cols[3],
                        Item: cols[4],
                        OpenPrice: cols[5],
                        StopLoss: cols[6],
                        TakeProfit: cols[7],
                        CloseTime: cols[8],
                        ClosePrice: cols[9],
                        Commission: cols[10],
                        Taxes: cols[11],
                        Swap: cols[12],
                        Profit: cols[13],
                    });
                }
            });

            if (extractedData.length === 0) {
                setSuccess("");
                setError("Please upload a valid file (Refer the instructions for MT4 Terminal.)");
            } else {
                setSuccess("");
                setError("");
                setTradeDetails(extractedData);
            }
        };
        reader.readAsText(file);
    };

    const handleFileUploadMt4 = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileMT4(file);
            setFileName(file.name);
        }
    };

    const handleDropMT4 = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        setFileName(file.name);
        handleFileMT4(file);
    };

    const MT4Upload = () => {
        return (
            <div 
                className="w-[95%] h-auto min-h-[150px] flex flex-col items-center justify-center text-center mx-auto rounded-[25px] mt-[20px] mb-[15px] bg-[#ededed] border border-dashed border-[#4a4a4a]"
                onDragOver={handleDragOver}
                onDrop={handleDropMT4}
            >
                <FontAwesomeIcon icon={faFileArrowUp} className="text-[20px] relative top-[-5px]" />
                <p className="relative top-[5px] text-[14px]">Drag and Drop file or Upload from your computer (MT4)</p>
                <div className="text-center mt-[20px]">
                    <input
                        type="file"
                        accept=".htm, .html"
                        id="file-upload-dark-mt4"
                        onChange={handleFileUploadMt4}
                        className="hidden"
                    />
                    <label
                        htmlFor="file-upload-dark-mt4"
                        className="inline-block px-[20px] py-[5px] bg-[#9d83dd] text-white rounded-[25px] cursor-pointer text-[12px] font-[550]"
                    >
                        + UPLOAD FILE
                    </label>

                    {fileName && (
                        <div className="mt-[5px] text-[12px] text-[#666]">
                            {fileName}{" "}
                            <FontAwesomeIcon
                                icon={faTrashCan}
                                onClick={handleRemoveFile}
                                className="ml-[10px] text-red-500 cursor-pointer text-[14px]"
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Post data backend
    const [error, setError] = useState(" ");
    const [success, setSuccess] = useState(" ");

    const postData = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (!selectedAccount) {
                setError("Please Select an account");
                setSuccess("");
            } else if (!selectedTz) {
                setError("Please Select Time Zone");
                setSuccess("");
            } else if (!selectedFile) {
                setError("Please select file format");
                setSuccess("");
            } else {
                setError("");
                setSuccess("");
                const res = await fetch(`api/dashboard/post`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        accountName: selectedAccount.accountName, 
                        accountId: selectedAccount.accountId, 
                        brokerName, 
                        fileFormat: selectedFile, 
                        timeZone: selectedTz, 
                        tradeData: Array.isArray(tradeDetails) ? tradeDetails : JSON.parse(tradeDetails),
                        apiName:"postFileUpload"
                    })
                });

                const data = await res.json();

                if (res.status === 200) {
                    setSuccess(data.message);
                    setAccounts();
                } else {
                    if (data.error === "Invalid credentials") {
                        setError("Invalid credentials, please recheck the Email & Password");
                        setSuccess("");
                    } else if (data.error === "Enter all the details") {
                        setError("Fill all the entries");
                        setSuccess("");
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div>
            {/* Accounts */}
            <div className="flex items-center gap-[24px] mb-[12px] w-[90%] mx-auto mt-[15px]">
                <label className="min-w-[80px] text-[14px] font-[500] text-white">Account</label>
                <div className="relative w-full">
                    <button
                        className="w-full px-[16px] py-[12px] bg-[#2a2a2a] text-white border-none rounded-[8px] text-[14px] flex justify-between items-center cursor-pointer font-[500]"
                        onClick={toggleAccountDropdown}
                    >
                        <span className="flex items-center">
                            <FontAwesomeIcon icon={faDotCircle} className="text-[12px] mr-[8px]" />
                            <span>
                                {selectedAccount
                                    ? selectedAccount.accountName
                                    : "Choose Account To Upload"}
                            </span>
                        </span>
                        <FontAwesomeIcon icon={faChevronDown} className="text-[12px]" />
                    </button>
                    {showAccountDropdown && (
                        <div className="absolute top-full left-0 w-full bg-[#2a2a2a] rounded-[8px] mt-[4px] shadow-lg z-10">
                            {accounts.map((account: any) => (
                                <div
                                    key={account._id}
                                    onClick={() => handleAccountSelect(account)}
                                    className="px-[16px] py-[12px] cursor-pointer flex items-center border-b border-[#333333] text-[#cccccc] text-[12px]"
                                >
                                    <FontAwesomeIcon
                                        icon={selectedAccount?._id === account._id ? faCheck : faDotCircle}
                                        className={`text-[12px] mr-[8px] ${selectedAccount?._id === account._id ? "text-[#4d6aff]" : "text-[#cccccc]"}`}
                                    />
                                    {account.accountName}
                                </div>
                            ))}
                            <div className="px-[16px] py-[12px] cursor-pointer flex items-center border-b border-[#333333] text-[#cccccc] text-[12px] block">
                                <p className="text-center">
                                    <FontAwesomeIcon icon={faPlus} className="text-[12px] mr-[8px]" />
                                    Add Accounts
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* File format */}
            <div className="flex items-center gap-[24px] mb-[12px] w-[90%] mx-auto mt-[15px]">
                <label className="min-w-[80px] text-[14px] font-[500] text-white">File Format</label>
                <div className="relative w-full">
                    <button
                        className="w-full px-[16px] py-[12px] bg-[#2a2a2a] text-white border-none rounded-[8px] text-[14px] flex justify-between items-center cursor-pointer font-[500]"
                        onClick={toggleFileDropdown}
                    >
                        <span className="flex items-center">
                            <FontAwesomeIcon icon={faDotCircle} className="text-[12px] mr-[8px]" />
                            <span>
                                {selectedFile
                                    ? selectedFile.accountName
                                    : "Choose File Format"}
                            </span>
                        </span>
                        <FontAwesomeIcon icon={faChevronDown} className="text-[12px]" />
                    </button>
                    {showFileDropdown && (
                        <div className="absolute top-full left-0 w-full bg-[#2a2a2a] rounded-[8px] mt-[4px] shadow-lg z-10">
                            {fileFormatArr.map((account) => (
                                <div
                                    key={account._id}
                                    onClick={() => handleFileSelect(account)}
                                    className="px-[16px] py-[12px] cursor-pointer flex items-center border-b border-[#333333] text-[#cccccc] text-[12px]"
                                >
                                    <FontAwesomeIcon
                                        icon={selectedFile?._id === account._id ? faCheck : account.faLink}
                                        className={`text-[12px] mr-[8px] ${selectedFile?._id === account._id ? "text-[#4d6aff]" : "text-[#cccccc]"}`}
                                    />
                                    {account.accountName}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Broker */}
            <div className="flex items-center gap-[24px] mb-[12px] w-[90%] mx-auto mt-[15px]">
                <label className="min-w-[80px] text-[14px] font-[500] text-white">Select Broker</label>
                <div className="w-[150px] h-auto rounded-[25px] bg-[#f5f5f5] mt-[10px] transition-all duration-300 ease-in-out overflow-hidden mb-[40px] cursor-pointer">
                    <button 
                        onClick={() => {setBrokerBtn(!isBrokerOpen);console.log(isBrokerOpen);}} 
                        className="w-[150px] h-auto px-[15px] py-[5px] text-[11px] font-inter rounded-[25px] border-none font-[600] cursor-pointer text-white bg-[#9d83dd] flex flex-row items-center justify-between absolute"
                    >
                        <span>{brokerName}</span>
                        <FontAwesomeIcon icon={faChevronDown} />
                    </button>
                    <div 
                        style={{ height: isBrokerOpen ? `calc(${brokers.length * 28}px)` : "" }}
                        className={`w-[150px] text-[11px] font-inter border-none font-[600] cursor-pointer text-white bg-[#f5f5f5] text-[#555] flex items-start justify-between flex-col overflow-hidden mt-[30px] absolute rounded-[0px_0px_20px_20px] transition-all duration-300 ease-in-out z-[2] ${isBrokerOpen ? "block" : "hidden"}`}
                    >
                        {brokers.map((ele, index) => (
                            <span 
                                key={index} 
                                onClick={() => { setBrokerName(ele); setBrokerBtn(false); }}
                                className="w-full px-[15px] py-[5px] text-[#555555] hover:bg-[#e0e0e0]"
                            >
                                {ele}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Time Zone */}
            <div className="flex items-center gap-[24px] mb-[12px] w-[90%] mx-auto mt-[15px]">
                <label className="min-w-[80px] text-[14px] font-[500] text-white">Time Zone</label>
                <div className="relative w-full">
                    <button
                        className="w-full px-[16px] py-[12px] bg-[#2a2a2a] text-white border-none rounded-[8px] text-[14px] flex justify-between items-center cursor-pointer font-[500]"
                        onClick={toggleTZDropdown}
                    >
                        <span className="flex items-center">
                            <FontAwesomeIcon icon={faDotCircle} className="text-[12px] mr-[8px]" />
                            <span>
                                {selectedTz
                                    ? selectedTz.accountName
                                    : "SELECT TIMEZONE"}
                            </span>
                        </span>
                        <FontAwesomeIcon icon={faChevronDown} className="text-[12px]" />
                    </button>
                    {showTZDropdown && (
                        <div className="absolute top-full left-0 w-full bg-[#2a2a2a] rounded-[8px] mt-[4px] shadow-lg z-10 max-h-[200px] overflow-y-auto">
                            {timeZones.map((account) => (
                                <div
                                    key={account._id}
                                    onClick={() => handleTZSelect(account)}
                                    className="px-[16px] py-[12px] cursor-pointer flex items-center border-b border-[#333333] text-[#cccccc] text-[12px]"
                                >
                                    <FontAwesomeIcon
                                        icon={selectedTz?._id === account._id ? faCheck : faDotCircle}
                                        className={`text-[12px] mr-[8px] ${selectedTz?._id === account._id ? "text-[#4d6aff]" : "text-[#cccccc]"}`}
                                    />
                                    {account.accountName}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Drag and drop */}
            {(brokerName === "MetaTrader 5") ? <MT5Upload /> : (brokerName === "MetaTrader 4") ? <MT4Upload /> : <MT5Upload />}

            <p className="w-full text-center text-tomato text-[12px]">{error}</p>
            <p className="w-full text-center text-green-500 text-[12px]">{success}</p>

            <button
                onClick={postData}
                className="block px-[20px] py-[10px] bg-[#9d83dd] text-white rounded-[25px] cursor-pointer text-[12px] font-[550] border-none mx-auto my-[10px] mb-[20px]"
            >
                ADD TRADES
            </button>
        </div>
    );
};

export default FileUpload;