"use client";
import { useState, ChangeEvent, DragEvent, FormEvent, useEffect } from "react";
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import html2canvas from "html2canvas";

// import useDataStore from "@store/store";
// import calendarPopUp from "@store/calendarPopUp";

// import notebookStore from "@store/notebookStore";
// import notifications from "@store/notifications";
import useAccountDetails from "@/store/accountdetails";
import { useDataStore } from "@/store/store";
import notebookStore from "@/store/notebookStore";
import notifications from "@/store/notifications";
import calendarPopUp from "@/store/calendarPopUp";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTrashCan,
  faShareNodes,
  faCloudArrowUp,
  faStopwatch,
  faGripLines,
  faChevronDown,
  faTrash,
  faCaretDown,
  faCircleDot
} from "@fortawesome/free-solid-svg-icons";
interface Trade {
  id: string;
  date: string;
  Profit: number;
  noteName?: string;
  Item: string;
  time: string;
  accountType: string;
  strategy: string;
  Quality: Record<string, boolean>;
  beforeURL?: string;
  afterURL?: string;
  OpenTime: string;
  Type: string;
  Size: string;
  Commission?: string;
  rfe: string;
  btm: string;
  dtm: string;
  atm: string;
  jrData?: any;
}

interface ProfileData {
  otherData: {
    strategy: Record<string, string>;
    rfe: Record<string, string>;
    btm: Record<string, string>;
    dtm: Record<string, string>;
    atm: Record<string, string>;
  };
}

interface JRContentProps {
  dailyData: any[];
}

const JRContent = ({ dailyData }: JRContentProps) => {
  const userId = Cookies.get("userId") || "";

  const { setAccounts, profileData } = useAccountDetails();
  const { bkurl, setCurrentUrl } = useDataStore();
  const { setDjImg, setDjUrl } = calendarPopUp();
  const { setFolder, setFile, setNotes } = notebookStore();
  const { setAlertBoxG } = notifications();

  // Uploading img
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (
    file: File,
    id: string,
    imgType: string,
    accountType?: string
  ) => {
    if (!file || !file.type.startsWith("image/")) {
      console.error("Invalid file type or no file selected");
      return;
    }
    compressAndUploadImage(file, id, imgType, accountType);
  };

  const tokenn = Cookies.get("Trace Your Trades") || "";
  useEffect(() => {
    setAccounts(userId, tokenn);
  }, [userId, tokenn, setAccounts]);

  const compressAndUploadImage = (
    file: File,
    id: string,
    imgType: string,
    accountType: string
  ) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        let width = img.width;
        let height = img.height;
        const maxSize = 1024;

        if (width > height) {
          height = Math.round(height * (maxSize / width));
          width = maxSize;
        } else {
          width = Math.round(width * (maxSize / height));
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        let dataUrl;

        while (
          (dataUrl = canvas.toDataURL("image/jpeg", quality)).length >
            100 * 1024 &&
          quality > 0.2
        ) {
          quality -= 0.1;
        }

        fetch(dataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const formData = new FormData();

            formData.append("image", blob, file.name);
            formData.append("id", id);
            formData.append("imgType", imgType);
            formData.append("tokenn", tokenn || "");
            formData.append("accountType", accountType);
        formData.append('apiName', 'uploadImage');
console.log('Form Data Entries:',formData );
            fetch(`/api/daily-journal/post`, {
              method: "POST",
              body: formData,
            })
              .then((response) => {
                if (!response.ok) {
                  throw new Error("Network response was not ok");
                }
                setAccounts(userId as string, tokenn || "");
                return response.json();
              })
              .then((data) => {
                // console.log('Image URL:', data.imageUrl);
              })
              .catch((error) => {
                console.error("Upload failed:", error);
              });
          });
      };

      img.src = e.target?.result as string;
    };

    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (
    e: DragEvent<HTMLLabelElement>,
    id: string,
    imgType: string
  ) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0], id, imgType);
    }
  };

  // JR CONTENT BOX
  const [expandedId, setexpandedId] = useState<string | null>(null);
  const [expSelect, setExpSelect] = useState<string | null>(null);
  const [expStra, setExpStra] = useState<string | null>(null);
  const [expRFE, setExpRfe] = useState<string | null>(null);
  const [expBtm, setExpBtm] = useState<string | null>(null);
  const [expDtm, setExpDtm] = useState<string | null>(null);
  const [expAtm, setExpAtm] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const toggleItem = (e: FormEvent, id: string) => {
    e.preventDefault();
    setexpandedId(expandedId === id ? null : id);

    setExpStra(null);
    setExpSelect(null);
    setExpRfe(null);
    setExpBtm(null);
    setExpDtm(null);
    setExpAtm(null);
  };

  const toggleStra = (id: string) => {
    setExpStra(expStra === id ? null : id);
    setExpSelect(null);
    setExpRfe(null);
    setExpBtm(null);
    setExpDtm(null);
    setExpAtm(null);
  };

  const toggleSelect = (id: string) => {
    setExpSelect(expSelect === id ? null : id);
    setExpStra(null);
    setExpRfe(null);
    setExpBtm(null);
    setExpDtm(null);
    setExpAtm(null);
  };

  const toggleRFE = (id: string) => {
    setExpRfe(expRFE === id ? null : id);
    setExpStra(null);
    setExpSelect(null);
    setExpBtm(null);
    setExpDtm(null);
    setExpAtm(null);
  };

  const toggleBtm = (id: string) => {
    setExpBtm(expBtm === id ? null : id);
    setExpStra(null);
    setExpSelect(null);
    setExpRfe(null);
    setExpDtm(null);
    setExpAtm(null);
  };

  const toggleDtm = (id: string) => {
    setExpDtm(expDtm === id ? null : id);
    setExpStra(null);
    setExpSelect(null);
    setExpRfe(null);
    setExpBtm(null);
    setExpAtm(null);
  };

  const toggleAtm = (id: string) => {
    setExpAtm(expAtm === id ? null : id);
    setExpStra(null);
    setExpSelect(null);
    setExpRfe(null);
    setExpBtm(null);
    setExpDtm(null);
  };

  const StrategyAdd = () => {
    const [showStraInput, setShowStra] = useState(false);
    const [strategy, setStrategy] = useState("");

    return (
      <>
        {showStraInput ? (
          <p className="flex items-center justify-between">
            <input
              autoComplete="off"
              name="strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="border-none border-b border-border outline-none text-foreground px-1 bg-transparent"
            />
            <span
              onClick={(e) => addOtherData(e, "strategy", strategy)}
              className="cursor-pointer"
            >
              +
            </span>
          </p>
        ) : (
          <p onClick={() => setShowStra(true)}>
            <span className="text-xs text-center block mt-3 text-primary cursor-pointer hover:text-primary-dark">
              + ADD STRATEGY
            </span>
          </p>
        )}
      </>
    );
  };

  const RfeAdd = () => {
    const [showStraInput, setShowStra] = useState(false);
    const [strategy, setStrategy] = useState("");

    return (
      <>
        {showStraInput ? (
          <p className="flex items-center justify-between">
            <input
              autoComplete="off"
              name="strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="border-none border-b border-border outline-none text-foreground px-1 bg-transparent"
            />
            <span
              onClick={(e) => addOtherData(e, "rfe", strategy)}
              className="cursor-pointer"
            >
              +
            </span>
          </p>
        ) : (
          <p onClick={() => setShowStra(true)}>
            <span className="text-xs text-center block mt-3 text-primary cursor-pointer hover:text-primary-dark">
              + ADD
            </span>
          </p>
        )}
      </>
    );
  };

  const BtmAdd = () => {
    const [showStraInput, setShowStra] = useState(false);
    const [strategy, setStrategy] = useState("");

    return (
      <>
        {showStraInput ? (
          <p className="flex items-center justify-between">
            <input
              autoComplete="off"
              name="strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="border-none border-b border-border outline-none text-foreground px-1 bg-transparent"
            />
            <span
              onClick={(e) => addOtherData(e, "btm", strategy)}
              className="cursor-pointer"
            >
              +
            </span>
          </p>
        ) : (
          <p onClick={() => setShowStra(true)}>
            <span className="text-xs text-center block mt-3 text-primary cursor-pointer hover:text-primary-dark">
              + ADD
            </span>
          </p>
        )}
      </>
    );
  };

  const DtmAdd = () => {
    const [showStraInput, setShowStra] = useState(false);
    const [strategy, setStrategy] = useState("");

    return (
      <>
        {showStraInput ? (
          <p className="flex items-center justify-between">
            <input
              autoComplete="off"
              name="strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="border-none border-b border-border outline-none text-foreground px-1 bg-transparent"
            />
            <span
              onClick={(e) => addOtherData(e, "dtm", strategy)}
              className="cursor-pointer"
            >
              +
            </span>
          </p>
        ) : (
          <p onClick={() => setShowStra(true)}>
            <span className="text-primary">+ ADD</span>
          </p>
        )}
      </>
    );
  };

  const AtmAdd = () => {
    const [showStraInput, setShowStra] = useState(false);
    const [strategy, setStrategy] = useState("");

    return (
      <>
        {showStraInput ? (
          <p className="flex items-center justify-between">
            <input
              autoComplete="off"
              name="strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              className="border-none border-b border-border outline-none text-foreground px-1 bg-transparent"
            />
            <span
              onClick={(e) => addOtherData(e, "atm", strategy)}
              className="cursor-pointer"
            >
              +
            </span>
          </p>
        ) : (
          <p onClick={() => setShowStra(true)}>
            <span className="text-xs text-center block mt-3 text-primary cursor-pointer hover:text-primary-dark">
              + ADD
            </span>
          </p>
        )}
      </>
    );
  };

  const addOtherData = async (e: FormEvent, type: string, value: string) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `/api/daily-journal/post`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type,
            value,
            tokenn,
            apiName:'addOtherData'
          }),
        }
      );

      const data = await res.json();

      if (res.status === 200) {
        setExpStra(null);
        setAccounts(userId as string, tokenn || "");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteOption = async (e: FormEvent, value: string, type: string) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `/api/daily-journal/post`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tokenn,
            value,
            type,
            apiName:"deleteOtherData"
          }),
        }
      );

      const data = await res.json();

      if (res.status === 200) {
        setExpSelect(null);
        setAccounts(userId as string, tokenn || "");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const postSelect = async (
    e: FormEvent,
    id: string,
    option: string,
    accountType: string
  ) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `/api/daily-journal/post`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            option,
            tokenn,
            accountType,
            apiName:"changeSelectQuality",
          }),
        }
      );

      const data = await res.json();

      if (res.status === 200) {
        setExpSelect(null);
        setAccounts(userId as string, tokenn || "");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const postDropOptions = async (
    e: FormEvent,
    id: string,
    value: string,
    type: string,
    accountType: string
  ) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `/api/daily-journal/post`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            type,
            value,
            tokenn,
            accountType,
            apiName:"editDropdowns",
          }),
        }
      );

      const data = await res.json();

      if (res.status === 200) {
        setExpStra(null);
        setExpRfe(null);
        setExpBtm(null);
        setExpDtm(null);
        setExpAtm(null);
        setAccounts(userId as string, tokenn || "");
      }
    } catch (error) {
      console.error(error);
    }
  };

  interface JrData {
    rfe: string;
    widw: string;
    wni: string;
    lfnt: string;
  }

  const [jrData, setJrArray] = useState<JrData>({
    rfe: "",
    widw: "",
    wni: "",
    lfnt: "",
  });

  const settingJrData = (array: JrData) => {
    setJrArray(array);
  };

  const changeJrArray = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setJrArray({ ...jrData, [name]: value });
  };

  const submitJrData = async (
    e: FormEvent,
    id: string,
    accountType: string
  ) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `/api/daily-journal/post`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id,
            tokenn,
            jrData,
            accountType,
            apiName:'uploadJournalData'
          }),
        }
      );

      const data = await res.json();

      if (res.status === 200) {
        setexpandedId(null);
        setAccounts(userId as string, tokenn || "");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const itemsPerPage = 6;
  const totalPages = Math.ceil(dailyData.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = dailyData.slice(indexOfFirstItem, indexOfLastItem);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const handleShareSelected = async (index: number) => {
    const element = document.getElementById(`trade-${index}`);
    if (!element) return;

    const originalOverflow = element.style.overflow;
    const originalHeight = element.style.height;
    const originalBackground = element.style.background;
    const originalBackdrop = element.style.backdropFilter;

    try {
      element.style.overflow = "visible";
      element.style.height = `${element.scrollHeight}px`;
      element.style.background = "#1e1e1e";
      element.style.backdropFilter = "none";

      await new Promise((resolve) => setTimeout(resolve, 500));

      const canvas = await html2canvas(element, {
  backgroundColor: "#1e1e1e",
  useCORS: true,
  allowTaint: false,
  scale: 2,
  scrollY: 0,
  windowHeight: element.scrollHeight,
});

const blob = await new Promise<Blob | null>((resolve) =>
  canvas.toBlob(resolve, "image/png")
);
      if (!blob) return;

      const file = new File([blob], `trade-${index}.png`, {
        type: "image/png",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Trade ${index + 1}`,
          text: "Here's the trade detail I wanted to share.",
        });
      } else {
        setAlertBoxG("Sharing not supported on this device.", "error");
      }
    } catch (error) {
      console.error("Error sharing selected trade:", error);
    } finally {
      element.style.overflow = originalOverflow;
      element.style.height = originalHeight;
      element.style.background = originalBackground;
      element.style.backdropFilter = originalBackdrop;
    }
  };

  const addNotes = async (
    e: FormEvent,
    tradeId: string,
    symbol: string,
    time: string,
    date: string,
    accountType: string
  ) => {
    e.preventDefault();

    try {
      const res = await fetch(
        `/api/notebook/post`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tradeId,
            tokenn,
            userId,
            symbol,
            time,
            date,
            accountType,
            apiName:'addNotesFromDailyJournal'
          }),
        }
      );

      const data = await res.json();

      if (res.status === 200) {
        setExpStra(null);
        setAccounts(userId as string, tokenn || "");
        setNotes(userId as string, tokenn || "");
        setCurrentUrl("Notebook");
        setFolder("Daily Journal");
        setFile(data.data.finalFileName);
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div>
      {currentItems.map((ele, index) => (
        <div
          key={index}
          id={`trade-${index}`}
          className="w-full h-fit mt-5 rounded-xl flex flex-col items-center justify-start bg-card border border-border pt-5 overflow-hidden"
        >
          <div className="w-[90%] flex flex-row items-center justify-between mb-2.5">
            <div className="w-fit h-7 flex items-center justify-center rounded-full bg-muted text-xs px-3.5 text-foreground font-semibold">
              <span>
                {new Date(ele.date)
                  .toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                  .replace(/,(\s\d)/, "$1")
                  .toUpperCase()}
              </span>
            </div>
            <div className="w-[70%] h-auto flex flex-row items-center justify-end font-sans mt-3.5">
              {ele.noteName ? (
                <button
                  onClick={() => {
                    setCurrentUrl("Notebook");
                    setFolder("Daily Journal");
                    setFile(ele.noteName!);
                  }}
                  className="w-28 h-auto px-2 py-1 font-sans text-xs rounded-full bg-primary text-white border border-primary/20 shadow-sm transition-all duration-300 hover:bg-primary-dark"
                >
                  VIEW NOTES
                </button>
              ) : (
                <button
                  onClick={(e) =>
                    addNotes(
                      e,
                      ele.id,
                      ele.Item,
                      ele.time,
                      ele.date,
                      ele.accountType
                    )
                  }
                  className="w-28 h-auto px-2 py-1 font-sans text-xs rounded-full bg-primary text-white border border-primary/20 shadow-sm transition-all duration-300 hover:bg-primary-dark"
                >
                  ADD NOTES +
                </button>
              )}
              <FontAwesomeIcon
                icon={faShareNodes}
                onClick={() => handleShareSelected(index)}
                className="text-lg text-muted-foreground cursor-pointer mr-5 font-semibold hover:text-foreground transition-colors"
              />
            </div>
          </div>

          <div className="w-[90%] h-auto flex flex-row items-start justify-start mt-6 gap-4">
            <div className="w-full flex items-start justify-between flex-wrap gap-4">
              <div className="w-[32%] min-w-[280px] flex flex-col items-start justify-start text-foreground">
                <div className="w-full bg-muted/50 rounded-xl h-auto p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-foreground">
                      {ele.Item}
                    </span>
                    {ele.Profit >= 0 ? (
                      <span className="bg-profit/20 text-profit px-2.5 py-1 rounded-lg font-semibold uppercase text-xs">
                        WIN
                      </span>
                    ) : (
                      <span className="bg-loss/20 text-loss px-2.5 py-1 rounded-lg font-semibold uppercase text-xs">
                        LOSS
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-1">P&L</span>
                      <span
                        className={`text-lg font-bold ${
                          ele.Profit < 0 ? "text-loss" : "text-profit"
                        }`}
                      >
                        {ele.Profit >= 0
                          ? `+$${Math.abs(ele.Profit).toFixed(2)}`
                          : `-$${Math.abs(ele.Profit).toFixed(2)}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-xs uppercase tracking-wide block mb-1">Risk:Reward</span>
                      <span className="text-primary text-lg font-bold">
                        1:3
                      </span>
                    </div>
                  </div>
                </div>

                <div className="w-full rounded-xl mt-4 bg-muted/30 overflow-hidden">
                  <div className="w-full flex items-center justify-between font-medium border-b border-border">
                    <span className="w-1/2 text-center py-2.5 text-xs text-muted-foreground uppercase tracking-wide">
                      STRATEGY
                    </span>
                    <span className="w-1/2 text-center py-2.5 text-xs text-muted-foreground uppercase tracking-wide border-l border-border">
                      QUALITY
                    </span>
                  </div>
                  <div className="w-full flex items-center justify-between py-3">
                    <div className="w-1/2 flex justify-center relative">
                      <span
                        onClick={() => toggleStra(ele.id)}
                        className="text-xs w-fit px-3 py-1.5 rounded-full capitalize bg-primary text-white cursor-pointer"
                      >
                        {ele.strategy} <FontAwesomeIcon icon={faChevronDown} />
                      </span>
                      <div
                        className={`${
                          expStra === ele.id
                            ? "w-28 h-auto flex flex-col items-center justify-evenly absolute top-full left-1/2 -translate-x-1/2 rounded-lg overflow-hidden bg-card border border-border mt-2 p-2.5 visible opacity-100 z-20 shadow-lg"
                            : "w-28 h-0 flex flex-col items-center justify-evenly absolute top-full left-1/2 -translate-x-1/2 rounded-lg overflow-hidden bg-card border border-border mt-2 p-2.5 invisible opacity-0 z-20"
                        }`}
                      >
                        {Object.entries(
                          (profileData as ProfileData).otherData.strategy
                        )
                          .slice(1)
                          .map(([key, value]) => (
                            <p
                              className="w-full text-foreground border-none bg-transparent hover:bg-muted transition-all duration-200 px-1.5 py-1 text-xs capitalize flex items-center justify-between rounded-lg cursor-pointer"
                              key={key}
                            >
                              <span
                                onClick={(e) =>
                                  postDropOptions(
                                    e,
                                    ele.id,
                                    value,
                                    "strategy",
                                    ele.accountType
                                  )
                                }
                              >
                                {value}
                              </span>
                            </p>
                          ))}
                        <StrategyAdd />
                      </div>
                    </div>
                    <div className="w-1/2 flex justify-center relative border-l border-border">
                      {Object.entries(ele.Quality).map(([key, value]) =>
                        value === true ? (
                          <span
                            key={key}
                            onClick={() => toggleSelect(ele.id)}
                            className="text-xs w-fit px-3 py-1.5 rounded-full capitalize bg-primary text-white cursor-pointer"
                          >
                            {key} <FontAwesomeIcon icon={faChevronDown} />
                          </span>
                        ) : (
                          ""
                        )
                      )}
                      <div
                        className={`${
                          expSelect === ele.id
                            ? "w-28 h-auto flex flex-col items-center justify-evenly absolute top-full left-1/2 -translate-x-1/2 rounded-lg overflow-hidden bg-card border border-border mt-2 p-2.5 visible opacity-100 z-20 shadow-lg"
                            : "w-28 h-0 flex flex-col items-center justify-evenly absolute top-full left-1/2 -translate-x-1/2 rounded-lg overflow-hidden bg-card border border-border mt-2 p-2.5 invisible opacity-0 z-20"
                        }`}
                      >
                        {Object.entries(ele.Quality)
                          .slice(1)
                          .map(([key, value]) => (
                            <p
                              onClick={(e) =>
                                postSelect(e, ele.id, key, ele.accountType)
                              }
                              className="w-full text-foreground border-none bg-transparent hover:bg-muted transition-all duration-200 px-1.5 py-1 text-xs capitalize flex items-center justify-between rounded-lg cursor-pointer"
                              key={key}
                            >
                              {key}
                            </p>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {ele.beforeURL ? (
                <div
                  className="w-[32%] h-52 rounded-xl mt-[-9px] flex flex-col items-center justify-center text-foreground cursor-pointer overflow-hidden relative bg-card border border-border"
                  onClick={() => {
                    setDjImg();
                    document.body.classList.add("no-scroll");
                    setDjUrl(ele.beforeURL!);
                  }}
                >
                  <p className="text-xs font-semibold bg-primary/30 text-primary px-2 py-0.5 rounded-lg absolute mt-[-260px] ml-[-22%]">
                    BEFORE
                  </p>
                  <img
                    src={ele.beforeURL}
                    alt="before-img"
                    crossOrigin="anonymous"
                    className="absolute top-0 left-0 w-full h-full object-cover object-center"
                  />
                </div>
              ) : (
                <label
                  htmlFor={`file-upload-bf-${ele.id}`}
                  className={`w-[32%] h-52 rounded-xl mt-[-9px] flex flex-col items-center justify-center text-muted-foreground cursor-pointer overflow-hidden relative border border-dashed border-border hover:border-primary/50 transition-colors ${
                    isDragging ? "dragging" : ""
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, ele.id, "beforeURL")}
                >
                  <p className="text-xs font-semibold bg-primary/30 text-primary px-2 py-0.5 rounded-lg absolute mt-[-260px] ml-[-22%]">
                    BEFORE
                  </p>
                  <FontAwesomeIcon icon={faCloudArrowUp} />
                  <p className="text-xs mb-[-20px]">Upload Before Image</p>
                  <input
                    id={`file-upload-bf-${ele.id}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileSelect(
                          file,
                          ele.id,
                          "beforeURL",
                          ele.accountType
                        );
                      }
                    }}
                    className="hidden"
                  />
                </label>
              )}

              {ele.afterURL ? (
                <div
                  className="w-[32%] h-52 rounded-xl mt-[-9px] flex flex-col items-center justify-center text-foreground cursor-pointer overflow-hidden relative bg-card border border-border"
                  onClick={() => {
                    setDjImg();
                    document.body.classList.add("no-scroll");
                    setDjUrl(ele.afterURL!);
                  }}
                >
                  <p className="text-xs font-semibold bg-profit/30 text-profit px-2 py-0.5 rounded-lg absolute mt-[-260px] ml-[-22%]">
                    AFTER
                  </p>
                  <img
                    src={ele.afterURL}
                    alt="after-img"
                    crossOrigin="anonymous"
                    className="absolute top-0 left-0 w-full h-full object-cover object-center"
                  />
                </div>
              ) : (
                <label
                  htmlFor={`file-upload-af-${ele.id}`}
                  className={`w-[32%] h-52 rounded-xl mt-[-9px] flex flex-col items-center justify-center text-muted-foreground cursor-pointer overflow-hidden relative border border-dashed border-border hover:border-primary/50 transition-colors ${
                    isDragging ? "dragging" : ""
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, ele.id, "afterURL")}
                >
                  <p className="text-xs font-semibold bg-profit/30 text-profit px-2 py-0.5 rounded-lg absolute mt-[-260px] ml-[-22%]">
                    AFTER
                  </p>
                  
                  <FontAwesomeIcon icon={faCloudArrowUp} />
                  <p className="text-xs mb-[-20px]">Upload After Image</p>
                  <input
                    id={`file-upload-af-${ele.id}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleFileSelect(
                          file,
                          ele.id,
                          "afterURL",
                          ele.accountType
                        );
                      }
                    }}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="w-[90%] mt-5 overflow-x-auto">
            <table className="w-full text-foreground text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">OPEN TIME</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">SYMBOL</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">LONG / SHORT</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">QTY</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">NET P&L</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">NET ROI</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">RR RATIO</th>
                  <th className="px-3 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">COMMISSION</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">{ele.OpenTime}</td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">{ele.Item}</td>
                  <td className="px-3 py-2.5 text-center uppercase whitespace-nowrap">{ele.Type}</td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">{ele.Size}</td>
                  <td
                    className={`px-3 py-2.5 text-center font-semibold whitespace-nowrap ${
                      ele.Profit < 0 ? "text-loss" : "text-profit"
                    }`}
                  >
                    {ele.Profit > 0
                      ? `$${Math.abs(ele.Profit)}`
                      : `-$${Math.abs(ele.Profit)}`}
                  </td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">-</td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">-</td>
                  <td className="px-3 py-2.5 text-center whitespace-nowrap">
                    {ele.Commission ? ele.Commission : "-"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div
            className={`w-[90%]  transition-all duration-500 
              ${expandedId === ele.id ? "h-90" : "h-0"}`
          }
          >
            <h2 className="text-foreground w-fit px-2.5 py-1.5 rounded-xl ml-5 mt-6 text-base font-semibold">
              LET'S JOURNAL THIS TRADE
            </h2>

            <div className="w-full h-fit flex rounded-xl border border-border overflow-hidden mt-2.5 mb-5">
              <div className="w-[30%] h-auto flex flex-col items-start justify-between bg-muted/30">
                {[
                  "Reason for Entry",
                  "Reason for Exit",
                  "Emotion Check",
                  "What I Did Well",
                  "What Needs Improvement",
                  "Learning for Next Time",
                ].map((text, idx) => (
                  <div
                    key={idx}
                    className="w-full flex h-10 items-center justify-start text-foreground"
                  >
                    <FontAwesomeIcon icon={faCircleDot} className="text-xs mr-5 ml-5 text-primary" />
                    <p className="text-sm text-primary">{text}</p>
                  </div>
                ))}
              </div>

              <div className="w-[70%] h-auto flex flex-col items-start justify-between">
                <input
                  placeholder="(Setup Logic)"
                  value={jrData.rfe}
                  name="rfe"
                  onChange={changeJrArray}
                  className="w-full h-10 flex items-center justify-start text-foreground bg-transparent border-none outline-none pl-5 font-sans placeholder:text-muted-foreground"
                />
                <div className="w-full flex h-10 items-start justify-start text-foreground">
                  <span
                    onClick={() => toggleRFE(ele.id)}
                    className="bg-profit/30 text-profit ml-5 text-xs px-2 py-1 rounded-lg cursor-pointer font-semibold mt-2.5"
                  >
                    {ele.rfe} <FontAwesomeIcon icon={faChevronDown} />
                  </span>
                  <div
                    className={`mt-10 w-fit ${
                      expRFE === ele.id
                        ? "w-28 h-auto flex flex-col items-center justify-evenly absolute rounded-lg overflow-hidden bg-card border border-border p-2.5 visible opacity-100 z-20 shadow-lg"
                        : "w-28 h-0 flex flex-col items-center justify-evenly absolute rounded-lg overflow-hidden bg-card border border-border p-2.5 invisible opacity-0 z-20"
                    }`}
                  >
                    {Object.entries((profileData as ProfileData).otherData.rfe)
                      .slice(1)
                      .map(([key, value]) => (
                        <p
                          className="w-full text-foreground border-none bg-transparent hover:bg-muted transition-all duration-200 px-1.5 py-1 text-xs capitalize flex items-center justify-between rounded-lg cursor-pointer"
                          key={key}
                        >
                          <span
                            onClick={(e) =>
                              postDropOptions(
                                e,
                                ele.id,
                                value,
                                "rfe",
                                ele.accountType
                              )
                            }
                          >
                            {value}
                          </span>
                          <FontAwesomeIcon
                            icon={faTrash}
                            onClick={(e) => deleteOption(e, value, "rfe")}
                            className="text-xs mr-1.25"
                          />
                        </p>
                      ))}
                    <RfeAdd />
                  </div>
                </div>

                <div className="w-full flex">
                  {[
                    {
                      time: "Before Trade",
                      state: expBtm,
                      value: ele.btm,
                      type: "btm",
                      toggle: toggleBtm,
                      color: "bg-primary/30",
                    },
                    {
                      time: "During Trade",
                      state: expDtm,
                      value: ele.dtm,
                      type: "dtm",
                      toggle: toggleDtm,
                      color: "bg-profit/30",
                    },
                    {
                      time: "After Trade",
                      state: expAtm,
                      value: ele.atm,
                      type: "atm",
                      toggle: toggleAtm,
                      color: "bg-loss/30",
                    },
                  ].map((mood, idx) => (
                    <div
                      key={idx}
                      className="w-1/3 flex items-start justify-evenly mt-2.5"
                    >
                      <div className="flex flex-col items-start justify-evenly">
                        <p className="text-xs text-muted-foreground p-0 m-0">
                          <FontAwesomeIcon icon={faStopwatch} /> {mood.time}
                        </p>
                        <p
                          onClick={() => mood.toggle(ele.id)}
                          className={`text-xs px-2 py-1 rounded-lg cursor-pointer font-semibold text-foreground mt-1 ${mood.color}`}
                        >
                          {mood.value === "Select" ? "MOOD" : mood.value}{" "}
                          <FontAwesomeIcon icon={faCaretDown}/>
                        </p>
                        <div
                          className={`mt-12 w-fit ${
                            mood.state === ele.id
                              ? "w-28 h-auto flex flex-col items-center justify-evenly absolute rounded-lg overflow-hidden bg-card border border-border p-2.5 visible opacity-100 z-20 shadow-lg"
                              : "w-28 h-0 flex flex-col items-center justify-evenly absolute rounded-lg overflow-hidden bg-card border border-border p-2.5 invisible opacity-0 z-20"
                          }`}
                        >
                          {Object.entries(
                            (profileData as ProfileData).otherData[
                              mood.type as keyof ProfileData["otherData"]
                            ]
                          )
                            .slice(1)
                            .map(([key, value]) => (
                              <p
                                className="w-full text-foreground border-none bg-transparent hover:bg-muted transition-all duration-200 px-1.5 py-1 text-xs capitalize flex items-center justify-between rounded-lg cursor-pointer"
                                key={key}
                              >
                                <span
                                  onClick={(e) =>
                                    postDropOptions(
                                      e,
                                      ele.id,
                                      value,
                                      mood.type,
                                      ele.accountType
                                    )
                                  }
                                >
                                  {value}
                                </span>
                                <FontAwesomeIcon
                                  icon={faTrash}
                                  onClick={(e) =>
                                    deleteOption(e, value, mood.type)
                                  }
                                  className=" text-xs mr-1.25"
                                />
                              </p>
                            ))}
                          {mood.type === "btm" && <BtmAdd />}
                          {mood.type === "dtm" && <DtmAdd />}
                          {mood.type === "atm" && <AtmAdd />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <input
                  placeholder="Add Comments"
                  value={jrData.widw}
                  name="widw"
                  onChange={changeJrArray}
                  className="w-full h-10 flex items-center justify-start text-foreground bg-transparent border-none outline-none pl-5 font-sans placeholder:text-muted-foreground"
                />
                <input
                  placeholder="Add Comments"
                  value={jrData.wni}
                  name="wni"
                  onChange={changeJrArray}
                  className="w-full h-10 flex items-center justify-start text-foreground bg-transparent border-none outline-none pl-5 font-sans placeholder:text-muted-foreground"
                />
                <input
                  placeholder="Add Comments"
                  value={jrData.lfnt}
                  name="lfnt"
                  onChange={changeJrArray}
                  className="w-full h-10 flex items-center justify-start text-foreground bg-transparent border-none outline-none pl-5 font-sans placeholder:text-muted-foreground"
                />
              </div>
            </div>

            <button
              onClick={(e) => submitJrData(e, ele.id, ele.accountType)}
              className="w-24 h-auto text-base float-right rounded-lg px-2.5 py-1.5 border border-primary/20 cursor-pointer mr-5 bg-primary hover:bg-primary-dark text-white transition-colors"
            >
              SAVE
            </button>
          </div>

          <center>
            <FontAwesomeIcon
              icon={faGripLines}
              className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              onClick={(e) => {
                settingJrData(
                  ele.jrData || { rfe: "", widw: "", wni: "", lfnt: "" }
                );
                toggleItem(e, ele.id);
              }}
            />
          </center>
        </div>
      ))}

      {/* Pagination controls */}
      <div className="flex justify-center items-center gap-2.5 my-5 py-2.5 border-t border-border">
        <button
          onClick={() => paginate(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-1.5 border-none rounded-lg text-sm ${
            currentPage === 1
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-white cursor-pointer hover:bg-primary-dark"
          }`}
        >
          Previous
        </button>

        <span className="text-muted-foreground text-sm">
          Page {currentPage} of {totalPages}
        </span>

        <button
          onClick={() => paginate(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-1.5 border-none rounded-lg text-sm ${
            currentPage === totalPages
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-white cursor-pointer hover:bg-primary-dark"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default JRContent;
