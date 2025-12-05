"use client"
import { useState, useRef, useEffect, useMemo, MouseEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faFilter, 
  faChevronRight, 
  faBan, 
  faCalendarDays, 
  faCaretLeft, 
  faCaretRight, 
  faCaretDown 
} from "@fortawesome/free-solid-svg-icons";
import useAccountDetails from "@/store/accountdetails";
import QuickStats from "@/components/daily-journal/QuickStat";
import JRContent from "@/components/daily-journal/JRContent";
interface Trade {
  date: string;
  time: string;
  Profit: number;
  [key: string]: any;
}

interface Account {
  tradeData?: Trade[];
  [key: string]: any;
}

interface DJCalendarProps {
  currentYearLeft: number;
  setCurrentYearLeft: (year: number) => void;
  currentMonthLeft: number;
  setCurrentMonthLeft: (month: number) => void;
  currentYearRight: number;
  setCurrentYearRight: (year: number) => void;
  currentMonthRight: number;
  setCurrentMonthRight: (month: number) => void;
  fromDate: string;
  toDate: string;
  tempStartDate: Date | null;
  tempEndDate: Date | null;
  today: Date;
  isSelectedDate: (day: number | null, month: number, year: number) => boolean | null;
  isInRange: (day: number | null, month: number, year: number) => boolean;
  handleDateClick: (day: number, month: number, year: number) => void;
  handleHover: (day: number, month: number, year: number) => void;
  handleSelect: () => void;
  generateCalendar: (year: number, month: number) => (number | null)[];
}

const DJCalendar = ({
  currentYearLeft,
  setCurrentYearLeft,
  currentMonthLeft,
  setCurrentMonthLeft,
  currentYearRight,
  setCurrentYearRight,
  currentMonthRight,
  setCurrentMonthRight,
  fromDate,
  toDate,
  tempStartDate,
  tempEndDate,
  today,
  isSelectedDate,
  isInRange,
  handleDateClick,
  handleHover,
  handleSelect,
  generateCalendar
}: DJCalendarProps) => {
  return (
    <div className="w-full h-auto flex flex-col items-center justify-start mt-5 absolute z-10 top-17.5">
      <div className="w-auto h-auto flex flex-col items-center justify-evenly bg-gray-600/50 backdrop-blur-sm text-gray-300 p-2.5 shadow-lg rounded-[12px]">
        <div className="flex gap-5 justify-center items-start flex-wrap font-poppins">
          {[
            { year: currentYearLeft, setYear: setCurrentYearLeft, month: currentMonthLeft, setMonth: setCurrentMonthLeft, heading: fromDate },
            { year: currentYearRight, setYear: setCurrentYearRight, month: currentMonthRight, setMonth: setCurrentMonthRight, heading: toDate }
          ].map(({ year, setYear, month, setMonth, heading }, index) => (
            <div key={index} className="w-[300px] min-h-[265px] p-1.25 rounded-[8px]">
              <h2 className="text-white text-sm font-semibold text-center">{heading}</h2>
              <div className="flex justify-between mb-2">
                <select 
                  className="appearance-none bg-[#985ace8a] text-white border-none rounded-[4px] px-2.5 py-0.75 text-xs cursor-pointer outline-none w-[150px] mt-2.5 mr-2.5 relative top-0.5 font-sans font-medium"
                  value={year} 
                  onChange={(e) => setYear(parseInt(e.target.value))}
                >
                  {Array.from({ length: 131 }, (_, i) => 1970 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
                <select 
                  value={month} 
                  onChange={(e) => setMonth(parseInt(e.target.value))}
                  className="px-1.25 py-1.25 text-xs border border-gray-300 rounded-[4px] outline-none cursor-pointer bg-white text-gray-900 font-sans font-medium"
                >
                  {Array.from({ length: 12 }, (_, i) => i).map((m) => (
                    <option key={m} value={m}>{new Date(0, m).toLocaleString('default', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
                  <div key={d} className="font-bold p-0.25 text-white">{d}</div>
                ))}
                {generateCalendar(year, month).map((day, index) => {
                  const date = day ? new Date(year, month, day) : null;
                  const isDisabled = date && date > today;
                  return (
                    <div
                      key={index}
                      className={`p-2 cursor-pointer rounded-[4px] transition-colors duration-300 ${
                        day === null ? "empty" : ""
                      } ${
                        tempStartDate && date && day === tempStartDate.getDate() && month === tempStartDate.getMonth() && year === tempStartDate.getFullYear() 
                          ? "bg-purple-600/70 text-white" 
                          : ""
                      } ${
                        tempEndDate && date && day === tempEndDate.getDate() && month === tempEndDate.getMonth() && year === tempEndDate.getFullYear() 
                          ? "bg-purple-600/70 text-white" 
                          : ""
                      } ${
                        isSelectedDate(day, month, year) ? "selected-date" : ""
                      } ${
                        date && isInRange(day, month, year) ? "bg-gray-300 text-gray-900" : ""
                      } ${
                        isDisabled ? "text-gray-500/70 pointer-events-none bg-transparent border border-gray-500/70" : "hover:bg-gray-300 hover:text-gray-900"
                      }`}
                      onClick={() => {
  if (date && !isDisabled && day != null && month != null && year != null) {
    handleDateClick(day, month, year);
  }
}}
                      onMouseEnter={() => {
  if (date && !isDisabled && day != null && month != null && year != null) {
    handleHover(day, month, year);
  }
}}
                    >
                      {day || ""}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <button
          className="w-24 h-auto mx-auto mt-1.25 mb-2.5 px-3 py-2 border-none bg-purple-600/50 text-white cursor-pointer rounded-[4px] transition-colors duration-300 hover:bg-purple-600/70 disabled:opacity-50"
          onClick={handleSelect}
          disabled={!tempStartDate || !tempEndDate}
        >
          Select
        </button>
      </div>
    </div>
  );
};

const DailyJournal = () => {
  const { selectedAccounts } = useAccountDetails();
  
  const [dailyData, setDailyData] = useState<Trade[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [dropdownYear, setDropdownYear] = useState(true);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [showDateRangePicker, setShowDateRangePicker] = useState(false);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const today = new Date();
  const [currentYearRight, setCurrentYearRight] = useState(today.getFullYear());
  const [currentMonthRight, setCurrentMonthRight] = useState(today.getMonth());
  const [currentYearLeft, setCurrentYearLeft] = useState(
    today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear()
  );
  const [currentMonthLeft, setCurrentMonthLeft] = useState(
    today.getMonth() === 0 ? 11 : today.getMonth() - 1
  );
  const [tempStartDate, setTempStartDate] = useState<Date | null>(null);
  const [tempEndDate, setTempEndDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [fromDate, setFromDate] = useState('From Date');
  const [toDate, setToDate] = useState('To Date');
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);

  const yearContainerRef = useRef<HTMLDivElement>(null);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const processData = () => {
      const allTrades = (selectedAccounts as Account[]).flatMap(account => account.tradeData || []);
      const sortedTrades = allTrades.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime();
      });
      setDailyData(sortedTrades);
    };
    if (selectedAccounts?.length) processData();
  }, [selectedAccounts]);

  const filteredDailyData = useMemo(() => {
    let data = dailyData;

    switch (selectedFilter) {
      case 'profitHighToLow':
        data = [...data].sort((a, b) => b.Profit - a.Profit);
        break;
      case 'profitLowToHigh':
        data = [...data].sort((a, b) => a.Profit - b.Profit);
        break;
      case 'lossHighToLow':
        data = [...data].sort((a, b) => a.Profit - b.Profit);
        break;
      case 'onlyProfit':
        data = data.filter(trade => trade.Profit > 0);
        break;
      case 'onlyLoss':
        data = data.filter(trade => trade.Profit < 0);
        break;
      case 'all':
      default:
        break;
    }

    if (selectedStartDate && selectedEndDate) {
      data = data.filter(trade => {
        const tradeDate = new Date(trade.date);
        const tradeDay = new Date(tradeDate.getFullYear(), tradeDate.getMonth(), tradeDate.getDate());
        return tradeDay >= selectedStartDate && tradeDay <= selectedEndDate;
      });
    }

    return data;
  }, [dailyData, selectedFilter, selectedStartDate, selectedEndDate]);

  const updateDailyData = (selectedDate: string) => {
    const filteredTrades = (selectedAccounts as Account[]).flatMap(account =>
      account.tradeData?.filter(trade => trade.date === selectedDate) || []
    );
    const sortedTrades = filteredTrades.sort((a, b) => {
      const timeA = new Date(`1970-01-01T${a.time}`);
      const timeB = new Date(`1970-01-01T${b.time}`);
      return timeB.getTime() - timeA.getTime();
    });
    setDailyData(sortedTrades);
  };

  const groupedTrades = (selectedAccounts as Account[]).flatMap(acc => acc.tradeData || [])
    .reduce((acc: { [key: string]: { date: string; trades: Trade[]; profit: number; tradeLength: number } }, trade) => {
      if (!acc[trade.date]) acc[trade.date] = { date: trade.date, trades: [], profit: 0, tradeLength: 0 };
      acc[trade.date].trades.push(trade);
      acc[trade.date].profit += trade.Profit;
      acc[trade.date].tradeLength += 1;
      return acc;
    }, {});

  const calendarData = Object.values(groupedTrades);

  const getBackgroundClass = (profit: number) => {
    if (profit > 0) return "bg-green-500/45 text-green-400";
    if (profit < 0) return "bg-red-400/35 text-red-400";
    return "bg-transparent";
  };

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

  const renderCalendar = () => {
    const days = daysInMonth(selectedYear, selectedMonth);
    const firstDayIndex = new Date(selectedYear, selectedMonth, 1).getDay();
    const calendarCells = [];

    for (let i = 0; i < firstDayIndex; i++) {
      calendarCells.push(
        <div key={`empty-${i}`} className="text-center bg-transparent border-none h-8.75"></div>
      );
    }

    for (let day = 1; day <= days; day++) {
      const dateStr = `${selectedYear}-${(selectedMonth + 1)
        .toString()
        .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
      const dayData = calendarData.find((d) => d.date === dateStr);
      
      calendarCells.push(
        <div
          key={day}
          className={`text-center text-white bg-gray-500/20 relative cursor-pointer flex flex-col justify-center items-center h-8.75 rounded-[8px] transition-all duration-200 hover:scale-105 hover:bg-gray-500/55 ${
            dayData ? getBackgroundClass(dayData.profit) : ""
          }`}
          onClick={() => {
            const formattedMonth = String(selectedMonth + 1).padStart(2, '0');
            const formattedDay = String(day).padStart(2, '0');
            const selectedDate = `${selectedYear}-${formattedMonth}-${formattedDay}`;
            updateDailyData(selectedDate);
          }}
        >
          <div className="text-xs font-semibold">{day}</div>
        </div>
      );
    }
    return calendarCells;
  };

  const generateCalendar = (year: number, month: number) => {
    const daysInMonthCal = new Date(year, month + 1, 0).getDate();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const calendarDays = [];

    for (let i = 0; i < firstDayIndex; i++) {
      calendarDays.push(null);
    }

    for (let day = 1; day <= daysInMonthCal; day++) {
      calendarDays.push(day);
    }

    return calendarDays;
  };

  const isSelectedDate = (day: number | null, month: number, year: number) => {
    if (!day) return false;
    const date = new Date(year, month, day);
    return (
      (tempStartDate && date.getTime() === tempStartDate.getTime()) ||
      (tempEndDate && date.getTime() === tempEndDate.getTime())
    );
  };

  const isInRange = (day: number | null, month: number, year: number) => {
    if (!day || !tempStartDate || (!tempEndDate && !hoverDate)) return false;
    const date = new Date(year, month, day);

    if (tempStartDate && !tempEndDate && hoverDate) {
      const startDate = new Date(tempStartDate.getFullYear(), tempStartDate.getMonth(), tempStartDate.getDate());
      const endDate = new Date(hoverDate.getFullYear(), hoverDate.getMonth(), hoverDate.getDate());
      const [actualStart, actualEnd] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
      return date >= actualStart && date <= actualEnd;
    }

    if (tempStartDate && tempEndDate) {
      const startDate = new Date(tempStartDate.getFullYear(), tempStartDate.getMonth(), tempStartDate.getDate());
      const endDate = new Date(tempEndDate.getFullYear(), tempEndDate.getMonth(), tempEndDate.getDate());
      const [actualStart, actualEnd] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
      return date >= actualStart && date <= actualEnd;
    }

    return false;
  };

  const handleDateClick = (day: number, month: number, year: number) => {
    const clickedDate = new Date(year, month, day);

    if (clickedDate > today) return;

    if (!tempStartDate || (tempStartDate && tempEndDate)) {
      setTempStartDate(clickedDate);
      setTempEndDate(null);
      setHoverDate(null);
    } else if (tempStartDate && !tempEndDate) {
      if (clickedDate < tempStartDate) {
        setTempEndDate(tempStartDate);
        setTempStartDate(clickedDate);
      } else {
        setTempEndDate(clickedDate);
      }
      setHoverDate(null);
    }
  };

  const handleHover = (day: number, month: number, year: number) => {
    if (tempStartDate && !tempEndDate) {
      const hoveredDate = new Date(year, month, day);
      if (hoveredDate <= today && hoveredDate.getTime() !== tempStartDate.getTime()) {
        setHoverDate(hoveredDate);
      } else {
        setHoverDate(null);
      }
    }
  };

  const handleSelectRange = () => {
    if (tempStartDate && tempEndDate) {
      const finalStartDate = tempStartDate <= tempEndDate ? tempStartDate : tempEndDate;
      const finalEndDate = tempStartDate <= tempEndDate ? tempEndDate : tempStartDate;

      setSelectedStartDate(finalStartDate);
      setSelectedEndDate(finalEndDate);
      setFromDate(finalStartDate.toLocaleDateString('en-GB'));
      setToDate(finalEndDate.toLocaleDateString('en-GB'));
      setShowDateRangePicker(false);
    }
  };

  const handleYearMonthClick = () => {
    setIsDropdownVisible((prev) => !prev);
  };

  const handleMonthSelect = (month: number) => {
    setSelectedMonth(month);
    setIsDropdownVisible(false);
  };

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setDropdownYear(true);
  };

  const handlePrevMonth = () => {
    setIsDropdownVisible(false);
    if (selectedMonth === 0) {
      setSelectedYear((prevYear) => prevYear - 1);
      setSelectedMonth(11);
    } else {
      setSelectedMonth((prevMonth) => prevMonth - 1);
    }
  };

  const handleNextMonth = () => {
    setIsDropdownVisible(false);
    if (selectedMonth === 11) {
      setSelectedYear((prevYear) => prevYear + 1);
      setSelectedMonth(0);
    } else {
      setSelectedMonth((prevMonth) => prevMonth + 1);
    }
  };

  const handleFilterSelect = (filterValue: string) => {
    setIsFilterDropdownOpen(false);
    setSelectedFilter(filterValue);
  };

  const handleRemoveFilters = () => {
    setSelectedFilter('all');
    setIsFilterDropdownOpen(false);
  };

  const handleClickOutside = (event: globalThis.MouseEvent) => {
    if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target as Node)) {
      setIsFilterDropdownOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFilterDropDownOpenClose = () => {
    setIsFilterDropdownOpen(!isFilterDropdownOpen);
  };

  const filterOptions = [
    { value: 'all', label: 'All Trades' },
    { value: 'profitHighToLow', label: 'Profit: High to Low' },
    { value: 'profitLowToHigh', label: 'Profit: Low to High' },
    { value: 'lossHighToLow', label: 'Loss: High to Low' },
    { value: 'onlyProfit', label: 'Only Profit' },
    { value: 'onlyLoss', label: 'Only Loss' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Toolbar */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div 
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
            onClick={handleFilterDropDownOpenClose}
          >
            <FontAwesomeIcon icon={faFilter} className="text-primary text-sm" />
            <span className="text-sm font-medium text-foreground">
              {selectedFilter === 'all'
                ? 'Filter'
                : filterOptions.find(opt => opt.value === selectedFilter)?.label || 'Filter'}
            </span>
            <FontAwesomeIcon icon={faChevronRight} className="text-muted-foreground text-xs" />
          </div>

          <div 
            className={`absolute top-16 left-6 w-56 bg-card border border-border rounded-xl shadow-lg overflow-hidden transition-all duration-200 ${
              isFilterDropdownOpen ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
            }`}
            ref={filterDropdownRef}
          >
            <div className="py-2">
              {filterOptions.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                    selectedFilter === option.value 
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary" 
                      : "text-foreground hover:bg-muted"
                  }`}
                  onClick={() => handleFilterSelect(option.value)}
                >
                  <span>{option.label}</span>
                </div>
              ))}
            </div>
            {selectedFilter !== 'all' && (
              <div
                className="py-2.5 px-4 border-t border-border flex items-center text-muted-foreground hover:text-foreground cursor-pointer text-sm"
                onClick={handleRemoveFilters}
              >
                <FontAwesomeIcon icon={faBan} className="mr-2" />
                <span>Remove Filters</span>
              </div>
            )}
          </div>

          <div 
            className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg cursor-pointer hover:bg-muted transition-colors"
            onClick={() => setShowDateRangePicker(!showDateRangePicker)}
          >
            <FontAwesomeIcon icon={faCalendarDays} className="text-primary text-sm" />
            <span className="text-sm font-medium text-foreground">Date Range</span>
            <FontAwesomeIcon icon={faChevronRight} className="text-muted-foreground text-xs" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex">
        <div className="flex-1 p-6">
          <JRContent dailyData={filteredDailyData} />
        </div>

        <div className="w-80 xl:w-96 flex-shrink-0 p-6 border-l border-border sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
          <h2 className="text-lg font-semibold text-foreground mb-4">Calendar</h2>

          {showDateRangePicker ? (
            <DJCalendar  
              currentYearLeft={currentYearLeft}
              setCurrentYearLeft={setCurrentYearLeft}
              currentMonthLeft={currentMonthLeft}
              setCurrentMonthLeft={setCurrentMonthLeft}
              currentYearRight={currentYearRight}
              setCurrentYearRight={setCurrentYearRight}
              currentMonthRight={currentMonthRight}
              setCurrentMonthRight={setCurrentMonthRight}
              fromDate={fromDate}
              toDate={toDate}
              tempStartDate={tempStartDate}
              tempEndDate={tempEndDate}
              today={today}
              isSelectedDate={isSelectedDate}
              isInRange={isInRange}
              handleDateClick={handleDateClick}
              handleHover={handleHover}
              handleSelect={handleSelectRange}
              generateCalendar={generateCalendar}
            />
          ) : (
            <div className="space-y-6">
              <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex justify-between items-center mb-4">
                  <button 
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={handlePrevMonth}
                  >
                    <FontAwesomeIcon icon={faCaretLeft} className="text-muted-foreground" />
                  </button>
                  <button 
                    className="text-sm font-medium text-foreground hover:text-primary"
                    onClick={handleYearMonthClick}
                  >
                    {new Date(selectedYear, selectedMonth).toLocaleString("default", {
                      month: "long",
                    })}{" "}
                    {selectedYear}
                    <FontAwesomeIcon icon={faCaretDown} className="ml-2 text-xs" />
                  </button>
                  <button 
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={handleNextMonth}
                  >
                    <FontAwesomeIcon icon={faCaretRight} className="text-muted-foreground" />
                  </button>
                </div>

                {isDropdownVisible && (
                  <div className="absolute z-20 bg-card border border-border rounded-xl shadow-lg p-4 mt-2 w-64 animate-fade-in">
                    <div className="text-center mb-4">
                      <button 
                        className="text-sm font-medium text-muted-foreground hover:text-foreground"
                        onClick={() => setDropdownYear((prev) => !prev)}
                      >
                        {dropdownYear
                          ? selectedYear
                          : new Date(selectedYear, selectedMonth).toLocaleString("default", {
                            month: "long",
                          })}
                        <FontAwesomeIcon icon={faCaretDown} className="ml-2 text-xs" />
                      </button>
                    </div>

                    {dropdownYear ? (
                      <div className="grid grid-cols-3 gap-2">
                        {Array.from({ length: 12 }, (_, i) => i).map((month) => (
                          <div
                            key={month}
                            className={`p-2 text-center cursor-pointer rounded-lg text-xs transition-colors ${
                              month === selectedMonth 
                                ? "bg-primary text-primary-foreground" 
                                : "hover:bg-muted text-foreground"
                            }`}
                            onClick={() => handleMonthSelect(month)}
                          >
                            {new Date(0, month).toLocaleString("default", { month: "short" })}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div
                        className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto"
                        ref={yearContainerRef}
                      >
                        {Array.from({ length: new Date().getFullYear() - 2000 + 1 }, (_, i) => 2000 + i).map(
                          (year) => (
                            <div
                              key={year}
                              className={`p-2 text-center cursor-pointer rounded-lg text-xs transition-colors ${
                                year === selectedYear 
                                  ? "bg-primary text-primary-foreground" 
                                  : "hover:bg-muted text-foreground"
                              }`}
                              onClick={() => handleYearSelect(year)}
                            >
                              {year}
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div className="mt-4 text-center">
                      <button 
                        onClick={() => setIsDropdownVisible(false)}
                        className="px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                      >
                        Select
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-7 gap-1">
                  {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
                      {day}
                    </div>
                  ))}
                  {renderCalendar()}
                </div>
              </div>

              <QuickStats dailyData={filteredDailyData} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyJournal;