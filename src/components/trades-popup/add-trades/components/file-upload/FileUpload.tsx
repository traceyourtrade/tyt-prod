'use client';

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  FileText, 
  Trash2, 
  ChevronDown, 
  Check, 
  Building2, 
  Clock, 
  Folder,
  AlertCircle,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import useAccountDetails from "@/store/accountdetails";

interface DropdownOption {
  id: string | number;
  label: string;
  icon?: React.ReactNode;
}

interface ModernDropdownProps {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  options: DropdownOption[];
  value: DropdownOption | null;
  onChange: (option: DropdownOption) => void;
}

const ModernDropdown = ({ label, icon, placeholder, options, value, onChange }: ModernDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </label>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-xl",
            "flex items-center justify-between gap-2",
            "text-sm font-medium transition-all duration-200",
            "hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20",
            isOpen && "border-primary/50 ring-2 ring-primary/20",
            value ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <span className="truncate">{value ? value.label : placeholder}</span>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform duration-200 flex-shrink-0",
            isOpen && "rotate-180"
          )} />
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-60 overflow-y-auto"
            >
              {options.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "w-full px-4 py-3 flex items-center gap-3 text-left text-sm",
                    "transition-colors duration-150",
                    "hover:bg-muted/50",
                    value?.id === option.id && "bg-primary/10 text-primary"
                  )}
                >
                  {option.icon}
                  <span className="flex-1 truncate">{option.label}</span>
                  {value?.id === option.id && (
                    <Check className="w-4 h-4 text-primary" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const FileUpload = () => {
  const { accounts, setAccounts } = useAccountDetails();
  
  const fileUploadAccounts = accounts.filter((ele: any) => ele.accountType === "File Upload");

  // Dropdowns state
  const [selectedAccount, setSelectedAccount] = useState<DropdownOption | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<DropdownOption | null>(null);
  const [selectedBroker, setSelectedBroker] = useState<DropdownOption | null>(null);
  const [selectedTimezone, setSelectedTimezone] = useState<DropdownOption | null>(null);

  // File state
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [tradeDetails, setTradeDetails] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Status
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Options
  const accountOptions: DropdownOption[] = fileUploadAccounts.map((acc: any) => ({
    id: acc._id || acc.accountId,
    label: acc.accountName,
    icon: <Building2 className="w-4 h-4 text-muted-foreground" />
  }));

  const formatOptions: DropdownOption[] = [
    { id: "html", label: "HTML (MetaTrader)", icon: <FileText className="w-4 h-4 text-orange-400" /> },
    { id: "xml", label: "XML", icon: <FileText className="w-4 h-4 text-blue-400" /> },
  ];

  const brokerOptions: DropdownOption[] = [
    { id: "mt5", label: "MetaTrader 5" },
    { id: "mt4", label: "MetaTrader 4" },
    { id: "binance", label: "Binance" },
    { id: "zerodha", label: "Zerodha" },
    { id: "angel", label: "Angel Broker" },
    { id: "upstox", label: "Upstox" },
  ];

  const timezoneOptions: DropdownOption[] = [
    { id: "utc", label: "UTC (Coordinated Universal Time)" },
    { id: "est", label: "EST (Eastern Standard Time) UTC-05:00" },
    { id: "pst", label: "PST (Pacific Standard Time) UTC-08:00" },
    { id: "gmt", label: "GMT (Greenwich Mean Time)" },
    { id: "ist", label: "IST (Indian Standard Time) UTC+05:30" },
    { id: "jst", label: "JST (Japan Standard Time) UTC+09:00" },
    { id: "aest", label: "AEST (Australian Eastern) UTC+10:00" },
    { id: "cet", label: "CET (Central European Time) UTC+01:00" },
  ];

  // File parsing functions
  function extractMT5TradeData(fileContent: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(fileContent, 'text/html');
    const positions: any[] = [];
    
    const positionsHeader = Array.from(doc.querySelectorAll('tr')).find(row =>
      row.textContent?.includes('Positions') && row.querySelector('th')
    );

    if (positionsHeader) {
      let currentRow = positionsHeader.nextElementSibling;
      if (currentRow) currentRow = currentRow.nextElementSibling;

      while (currentRow && currentRow.querySelector('td')) {
        const cells = currentRow.querySelectorAll('td');
        if (cells.length >= 5) {
          const visibleCells = Array.from(cells).filter(cell => !cell.classList.contains('hidden'));
          const [datePart, timePart] = cells[0]?.textContent?.trim().split(" ") || [];
          const dateFormatted = datePart?.split(".").join("-") || '';

          positions.push({
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
          });
        }
        currentRow = currentRow.nextElementSibling;
      }
    }
    return positions;
  }

  function extractMT4TradeData(fileContent: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(fileContent, "text/html");
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
    return extractedData;
  }

  const handleFile = (file: File) => {
    if (!selectedBroker) {
      setError("Please select a broker first before uploading a file");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError("");
    setSuccess("");
    
    const reader = new FileReader();
    
    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 100);

    reader.onload = function (event) {
      clearInterval(progressInterval);
      const fileContent = event.target?.result as string;
      
      let tradeData: any[] = [];
      if (selectedBroker?.id === "mt4") {
        tradeData = extractMT4TradeData(fileContent);
      } else {
        tradeData = extractMT5TradeData(fileContent);
      }

      if (tradeData.length === 0) {
        setError("No trades found in file. Please check the file format matches your broker.");
      } else {
        setTradeDetails(tradeData);
        setSuccess(`Found ${tradeData.length} trades`);
      }
      
      setUploadProgress(100);
      setTimeout(() => setIsUploading(false), 500);
    };

    reader.onerror = () => {
      clearInterval(progressInterval);
      setError("Failed to read file");
      setIsUploading(false);
    };

    reader.readAsText(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) {
      setFileName(file.name);
      handleFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      handleFile(file);
    }
  };

  const handleRemoveFile = () => {
    setFileName("");
    setTradeDetails([]);
    setSuccess("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedAccount) {
      setError("Please select an account");
      return;
    }
    if (!selectedBroker) {
      setError("Please select a broker");
      return;
    }
    if (!selectedTimezone) {
      setError("Please select a timezone");
      return;
    }
    if (!selectedFormat) {
      setError("Please select a file format");
      return;
    }
    if (tradeDetails.length === 0) {
      setError("Please upload a valid trade file");
      return;
    }

    try {
      const res = await fetch(`/api/dashboard/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountName: selectedAccount.label,
          accountId: selectedAccount.id,
          brokerName: selectedBroker.label,
          fileFormat: { _id: selectedFormat.id, accountName: selectedFormat.label },
          timeZone: { _id: selectedTimezone.id, accountName: selectedTimezone.label },
          tradeData: tradeDetails,
          apiName: "postFileUpload"
        })
      });

      const data = await res.json();

      if (res.status === 200) {
        setSuccess(data.message || "Trades imported successfully!");
        setAccounts();
        handleRemoveFile();
      } else {
        setError(data.error || "Failed to import trades");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-1"
    >
      {/* Dropdowns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ModernDropdown
          label="Account"
          icon={<Building2 className="w-4 h-4" />}
          placeholder="Select account"
          options={accountOptions}
          value={selectedAccount}
          onChange={setSelectedAccount}
        />
        
        <ModernDropdown
          label="Broker"
          icon={<Folder className="w-4 h-4" />}
          placeholder="Select broker"
          options={brokerOptions}
          value={selectedBroker}
          onChange={setSelectedBroker}
        />
        
        <ModernDropdown
          label="File Format"
          icon={<FileText className="w-4 h-4" />}
          placeholder="Select format"
          options={formatOptions}
          value={selectedFormat}
          onChange={setSelectedFormat}
        />
        
        <ModernDropdown
          label="Timezone"
          icon={<Clock className="w-4 h-4" />}
          placeholder="Select timezone"
          options={timezoneOptions}
          value={selectedTimezone}
          onChange={setSelectedTimezone}
        />
      </div>

      {/* Drag & Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => selectedBroker && fileInputRef.current?.click()}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300",
          "flex flex-col items-center justify-center py-12 px-6",
          !selectedBroker 
            ? "border-border/30 bg-muted/10 cursor-not-allowed opacity-60" 
            : isDragging 
              ? "border-primary bg-primary/5 scale-[1.02] cursor-pointer" 
              : "border-border/50 hover:border-primary/50 hover:bg-muted/30 cursor-pointer",
          fileName && selectedBroker && "border-profit/50 bg-profit/5"
        )}
      >
        <input
          type="file"
          accept=".html,.htm,.xml"
          ref={fileInputRef}
          onChange={handleFileInputChange}
          className="hidden"
        />

        {isUploading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
            <div className="w-48 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${uploadProgress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <p className="text-sm text-muted-foreground">Processing file...</p>
          </motion.div>
        ) : fileName ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="w-16 h-16 rounded-2xl bg-profit/10 flex items-center justify-center">
              <FileText className="w-8 h-8 text-profit" />
            </div>
            <div className="text-center">
              <p className="font-medium text-foreground">{fileName}</p>
              {tradeDetails.length > 0 && (
                <p className="text-sm text-profit mt-1">
                  {tradeDetails.length} trades found
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFile();
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-loss hover:bg-loss/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </motion.div>
        ) : (
          <>
            <motion.div
              animate={{ y: isDragging ? -5 : 0 }}
              transition={{ duration: 0.2 }}
              className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4"
            >
              <Upload className={cn(
                "w-8 h-8 transition-colors duration-200",
                isDragging ? "text-primary" : "text-muted-foreground"
              )} />
            </motion.div>
            {selectedBroker ? (
              <>
                <p className="text-foreground font-medium mb-1">
                  Drop your trade file here
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse (HTML, XML)
                </p>
              </>
            ) : (
              <>
                <p className="text-foreground font-medium mb-1">
                  Select a broker first
                </p>
                <p className="text-sm text-muted-foreground">
                  Choose your broker above to enable file upload
                </p>
              </>
            )}
          </>
        )}

        {/* Animated border gradient */}
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.1), transparent)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.5s infinite"
            }}
          />
        )}
      </div>

      {/* Status Messages */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-loss/10 border border-loss/20 rounded-xl"
          >
            <AlertCircle className="w-5 h-5 text-loss flex-shrink-0" />
            <p className="text-sm text-loss">{error}</p>
          </motion.div>
        )}
        
        {success && !error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-3 p-4 bg-profit/10 border border-profit/20 rounded-xl"
          >
            <CheckCircle2 className="w-5 h-5 text-profit flex-shrink-0" />
            <p className="text-sm text-profit">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <motion.button
        type="button"
        onClick={handleSubmit}
        disabled={!fileName || tradeDetails.length === 0}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          "w-full py-4 rounded-xl font-semibold text-white transition-all duration-200",
          "flex items-center justify-center gap-2",
          fileName && tradeDetails.length > 0
            ? "bg-primary hover:bg-primary-dark shadow-lg shadow-primary/20"
            : "bg-muted/50 text-muted-foreground cursor-not-allowed"
        )}
      >
        <Upload className="w-5 h-5" />
        Import {tradeDetails.length > 0 ? `${tradeDetails.length} Trades` : "Trades"}
      </motion.button>

      {/* Instructions */}
      <div className="p-4 bg-muted/20 rounded-xl border border-border/30">
        <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          How to export trades
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li>• <strong>MT5:</strong> Account History → Right-click → Report → HTML</li>
          <li>• <strong>MT4:</strong> Account History → Right-click → Save as Report</li>
          <li>• Make sure to select the time period you want to import</li>
        </ul>
      </div>
    </motion.div>
  );
};

export default FileUpload;
