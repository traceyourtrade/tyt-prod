import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Font Awesome imports
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faCaretLeft, 
  faCaretRight, 
  faChevronDown, 
  faCaretDown,
  faCircleXmark,
  faCircleLeft,
  faCircleRight,
  faShareNodes
} from "@fortawesome/free-solid-svg-icons";

import useAccountDetails from "@/store/accountdetails";
import calendarPopUp from "@/store/calendarPopUp";
import datesforcal from "@/store/datesforcal";


const Calendar = () => {
  const router = useRouter();

  // Trade details opening and closing
  const { setShowTr, setDataDate } = calendarPopUp();
  const { setcalMonth, setcalYear } = datesforcal();

  const { selectedAccounts } = useAccountDetails();

  const groupedTrades = selectedAccounts.flatMap((acc: any) => acc.tradeData)
    .reduce((acc: any, trade: any) => {
      if (!acc[trade.date]) acc[trade.date] = { date: trade.date, trades: [], profit: 0, tradeLength: 0 };

      acc[trade.date].trades.push(trade);
      acc[trade.date].profit += trade.Profit; // Sum up profit
      acc[trade.date].tradeLength += 1; // Count trades

      return acc;
    }, {});

  // Convert grouped object to array format
  const calendarData = Object.values(groupedTrades);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [dropdownYear, setDropdownYear] = useState(true);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);

  const getBackgroundClass = (profit: number) => {
    if (profit > 0) return "bg-[rgba(21,147,132,0.43)]";
    if (profit < 0) return "bg-[rgba(255,119,119,0.32)]";
    return "bg-[#323577ff]";
  };

  // Years should start from selected year
  // Ref for the year container
  const yearContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to the active year when the dropdown is opened
  useEffect(() => {
    if (isDropdownVisible && !dropdownYear && yearContainerRef.current) {
      const activeYearElement = yearContainerRef.current.querySelector(".year-select.activee");
      if (activeYearElement) {
        yearContainerRef.current.scrollTop =
          (activeYearElement as HTMLElement).offsetTop - yearContainerRef.current.offsetTop;
      }
    }
  }, [isDropdownVisible, dropdownYear]);

  // Rendering calendar contents
  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

  // calculating weekly profits
  const calculateWeeklyProfits = (year: number, month: number) => {
    const days = daysInMonth(year, month);
    const weeks: number[] = [];
    let weekProfit = 0;

    for (let day = 1; day <= days; day++) {
      const dateStr = `${year}-${(month + 1).toString().padStart(2, "0")}-${day
        .toString()
        .padStart(2, "0")}`;
      const dayData = calendarData.find((d: any) => d.date === dateStr);

      if (dayData) {
        weekProfit += dayData.profit;
      }

      // If it's the end of the week or the end of the month
      if (new Date(year, month, day).getDay() === 6 || day === days) {
        weeks.push(weekProfit);
        weekProfit = 0;
      }
    }
    return weeks;
  };

  // Rendering the dates acc to days
  const renderCalendar = () => {
    const days = daysInMonth(selectedYear, selectedMonth);
    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();

    const calendarCells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      calendarCells.push(
        <div key={`empty-${i}`} className="h-20 rounded-lg bg-transparent border-none"></div>
      );
    }

    for (let day = 1; day <= days; day++) {
      const dateStr = `${selectedYear}-${(selectedMonth + 1)
        .toString()
        .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const dayData = calendarData.find((d: any) => d.date === dateStr);

      calendarCells.push(
        <div
          key={day}
          className={`h-20 rounded-lg flex flex-col justify-center items-center relative cursor-pointer transition-all duration-200 hover:scale-105 hover:bg-[rgba(122,122,122,0.551)] hover:saturate-160 ${
            dayData ? getBackgroundClass(dayData.profit) : "bg-[rgba(122,122,122,0.214)]"
          }`}
          onClick={() => { setShowTr(); document.body.classList.add("no-scroll"); setDataDate(selectedYear, selectedMonth, day) }}
        >
          <div className="text-white text-base font-bold">{day}</div>
          {dayData && (
            <div className="mt-1 text-center text-base font-inter font-600 relative bottom-[10px]">
              <div>
                ${new Intl.NumberFormat('en', {
                  notation: "compact",
                  compactDisplay: "short",
                  maximumFractionDigits: 1
                }).format(dayData.profit)}
              </div>
              <div className="text-white">{dayData.tradeLength}</div>
            </div>
          )}
        </div>
      );
    }

    return calendarCells;
  };

  const weeklyProfits = calculateWeeklyProfits(selectedYear, selectedMonth);

  const handleYearMonthClick = () => {
    setIsDropdownVisible((prev) => !prev);
  };

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    setIsDropdownVisible(false); // Switch to year view after selecting month
  };

  const handleYearSelect = (year: number) => {
    console.log("Selected year:", year);
    setSelectedYear(year);
    setDropdownYear(true); // Switch back to month view
  };

  const handlePrevMonth = () => {
    setIsDropdownVisible(false)
    if (selectedMonth === 0) {
      setSelectedYear((prevYear) => prevYear - 1);
      setSelectedMonth(11);
      setcalYear(selectedYear - 1)
      setcalMonth(12)
    } else {
      setSelectedMonth((prevMonth) => prevMonth - 1);
      setcalYear(selectedYear)
      setcalMonth(selectedMonth)
    }
  };

  const handleNextMonth = () => {
    setIsDropdownVisible(false)
    if (selectedMonth === 11) {
      setSelectedYear((prevYear) => prevYear + 1);
      setSelectedMonth(0);
      setcalYear(selectedYear + 1)
      setcalMonth(1)
    } else {
      setSelectedMonth((prevMonth) => prevMonth + 1);
      setcalYear(selectedYear)
      setcalMonth(selectedMonth + 2)
    }
  };

  return (
    <>
      <div className="w-3/5 max-w-930 h-auto flex flex-col rounded-xl mt-5 ml-2.5 p-2.5 pb-2.5 bg-[rgba(114,113,113,0.134)] shadow-[0_25px_45px_rgba(0,0,0,0.1)] border-b border-[rgba(255,255,255,0.2)] backdrop-blur-sm shadow-lg">

        <div className="flex justify-between items-center mb-4 cursor-pointer">

          <button className="bg-[#7c51e1] text-white border-none py-1 px-2.5 text-sm rounded cursor-pointer mx-2.5 hover:bg-[#553b91]" onClick={handlePrevMonth}>
            <FontAwesomeIcon icon={faCaretLeft} />
          </button>

          <div>

            <h1 onClick={handleYearMonthClick} className="m-0 text-2xl text-white">
              {new Date(selectedYear, selectedMonth).toLocaleString("default", {
                month: "long",
              })}{" "}
              {selectedYear} <FontAwesomeIcon icon={faChevronDown} className="text-xs relative top-[-5px] left-1" />
            </h1>
            {isDropdownVisible && (
              <div>
                <div className="absolute top-15 -ml-18 bg-[#2d2d2d] rounded-lg shadow-lg z-1000 p-1 px-4 w-70 max-h-100 overflow-y-hidden block animate-fadeIn">

                  <div className="w-full h-auto flex items-center justify-center mt-2.5">
                    <p onClick={() => setDropdownYear((prev) => !prev)} className="w-25 h-auto flex flex-row items-center justify-center cursor-pointer font-inter text-sm">
                      {dropdownYear
                        ? selectedYear
                        : new Date(selectedYear, selectedMonth).toLocaleString("default", {
                          month: "long",
                        })}
                      <FontAwesomeIcon icon={faCaretDown} className="text-sm relative right-[-20px]" />
                    </p>
                  </div>

                  {dropdownYear ? (
                    <div className="grid grid-cols-3 gap-2 my-2.5">
                      {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                        <div
                          key={month}
                          className={`p-[8px] text-[12px] text-center rounded-lg cursor-pointer transition-all duration-200 bg-[#2d2d2d] hover:bg-[#e3f2fd] hover:text-[#5a33b6] hover:scale-105 ${
                            month === selectedMonth ? "activee bg-[#5a33b6] text-white" : ""
                          }`}
                          onClick={() => handleMonthSelect(month)}
                        >
                          {new Date(0, month).toLocaleString("default", {
                            month: "long",
                          })}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      className="grid grid-cols-3 gap-2 my-4 mb-3 max-h-44 overflow-y-auto"
                      ref={yearContainerRef}
                    >
                      {Array.from({ length: new Date().getFullYear() - 2000 + 1 }, (_, i) => 2000 + i).map(
                        (year) => (
                          <div
                            key={year}
                            className={`text-base p-2 rounded-lg cursor-pointer bg-[#7a7a7a37] transition-all duration-200 hover:bg-[#eef6f9] hover:text-[#5a33b6] text-xs ${
                              year === selectedYear ? "activee bg-[#5a33b6] text-white" : ""
                            }`}
                            onClick={() => handleYearSelect(year)}
                          >
                            {year}
                          </div>
                        )
                      )}
                    </div>
                  )}

                  <div className="w-full h-auto flex flex-col items-center justify-center">
                    <button 
                      onClick={() => setIsDropdownVisible(false)} 
                      className="w-17 h-auto py-1 bg-[#5a33b6] border-none outline-none text-white rounded-xl text-xs font-inter font-600 cursor-pointer transition-all duration-500 ease-in-out -mt-1 hover:bg-[#b386e5]"
                    >
                      OK
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>

          <button className="bg-[#7c51e1] text-white border-none py-1 px-2.5 text-sm rounded cursor-pointer mx-2.5 hover:bg-[#553b91]" onClick={handleNextMonth}>
            <FontAwesomeIcon icon={faCaretRight} />
          </button>

        </div>

        <div className="w-full max-w-900 mx-auto rounded-xl font-sans flex flex-row justify-center">

          <div className="w-95/100 h-auto grid grid-cols-7 gap-1.75">

            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center font-bold text-white py-2">
                {day}
              </div>
            ))}

            {renderCalendar()}

          </div>

          {weeklyProfits.length === 6 ? (
            <div className="w-15/100 h-auto flex flex-col items-center justify-start relative top-10.5 pr-2">
              {weeklyProfits.map((profit, index) => (
                <div
                  key={index}
                  className="w-90/100 h-20 rounded-xl flex flex-col items-center justify-around relative right-[-10px] bg-[#b6b6b657] font-inter font-600 transition-all duration-300 ease-in-out cursor-pointer text-white mt-[7px] hover:scale-105"
                  style={{
                    background: profit > 0
                      ? "rgba(21, 147, 132, 0.43)"
                      : profit < 0
                        ? "rgba(255, 119, 119, 0.32)"
                        : "",
                  }}
                >
                  Week {index + 1}{" "}
                  <span
                    className="profit-value -mt-7.5"
                    style={{
                      color: profit > 0
                        ? "#3cffb5"
                        : profit < 0
                          ? "rgb(255, 99, 99)"
                          : "rgb(31, 31, 31)",
                    }}
                  >
                    ${new Intl.NumberFormat('en', {
                      notation: "compact",
                      compactDisplay: "short",
                      maximumFractionDigits: 1
                    }).format(profit)}
                  </span>
                </div>
              ))}
            </div>
          ) : weeklyProfits.length === 5 ? (
            <div className="w-15/100 h-auto flex flex-col items-center justify-start relative top-9 pr-2">
              {weeklyProfits.map((profit, index) => (
                <div
                  key={index}
                  className="w-90/100 h-20 rounded-xl flex flex-col items-center justify-around relative right-[-10px] bg-[#b6b6b657] font-inter font-600 transition-all duration-300 ease-in-out cursor-pointer text-white mt-[7px] hover:scale-105"
                  style={{
                    background: profit > 0
                      ? "rgba(21, 147, 132, 0.43)"
                      : profit < 0
                        ? "rgba(255, 119, 119, 0.32)"
                        : "",
                  }}
                >
                  Week {index + 1}{" "}
                  <span
                    className="profit-value -mt-7.5"
                    style={{
                      color: profit > 0
                        ? "#3cffb5"
                        : profit < 0
                          ? "rgb(255, 99, 99)"
                          : "rgb(31, 31, 31)",
                    }}
                  >
                    ${new Intl.NumberFormat('en', {
                      notation: "compact",
                      compactDisplay: "short",
                      maximumFractionDigits: 1
                    }).format(profit)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="w-15/100 h-auto flex flex-col items-center justify-start relative top-9 pr-2">
              {weeklyProfits.map((profit, index) => (
                <div
                  key={index}
                  className="w-90/100 h-20 rounded-xl flex flex-col items-center justify-around relative right-[-10px] bg-[#b6b6b657] font-inter font-600 transition-all duration-300 ease-in-out cursor-pointer text-white mt-[7px] hover:scale-105"
                  style={{
                    background: profit > 0
                      ? "rgba(21, 147, 132, 0.43)"
                      : profit < 0
                        ? "rgba(255, 119, 119, 0.32)"
                        : "",
                  }}
                >
                  Week {index + 1}{" "}
                  <span
                    className="profit-value -mt-7.5"
                    style={{
                      color: profit > 0
                        ? "#3cffb5"
                        : profit < 0
                          ? "rgb(255, 99, 99)"
                          : "rgb(31, 31, 31)",
                    }}
                  >
                    ${new Intl.NumberFormat('en', {
                      notation: "compact",
                      compactDisplay: "short",
                      maximumFractionDigits: 1
                    }).format(profit)}
                  </span>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            max-height: 0px;
          }
          to {
            max-height: 400px;
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-in-out forwards;
        }
      `}</style>
    </>
  );
};

export default Calendar;