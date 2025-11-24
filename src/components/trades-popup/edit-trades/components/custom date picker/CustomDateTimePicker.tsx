'use client';

import React, { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faClose,
} from "@fortawesome/free-solid-svg-icons";

interface CustomDateTimePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (date: Date) => void;
}

// Helper function to get an array of hours (0-23) and minutes (0-59)
const getHours = () => Array.from({ length: 24 }, (_, i) => i);
const getMinutes = () => Array.from({ length: 60 }, (_, i) => i);

const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({ 
  isOpen, 
  onClose, 
  onApply 
}) => {
  // State for the currently viewed month in the calendar
  const [viewDate, setViewDate] = useState(new Date());
  // State for the user's selected date and time
  const [selectedDateTime, setSelectedDateTime] = useState(new Date());

  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  // Effect to scroll the selected time into view when the dialog opens
  useEffect(() => {
    if (isOpen) {
      const selectedHour = selectedDateTime.getHours();
      const selectedMinute = selectedDateTime.getMinutes();

      // Scroll the hour wheel
      if (hourRef.current) {
        const hourElement = hourRef.current.children[selectedHour];
        if (hourElement) {
          hourElement.scrollIntoView({ block: "center" });
        }
      }

      // Scroll the minute wheel
      if (minuteRef.current) {
        const minuteElement = minuteRef.current.children[selectedMinute];
        if (minuteElement) {
          minuteElement.scrollIntoView({ block: "center" });
        }
      }
    }
  }, [isOpen, selectedDateTime]);

  if (!isOpen) {
    return null;
  }

  // Handlers for month navigation
  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // Handlers for selecting date and time
  const handleDateSelect = (day: number) => {
    const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setSelectedDateTime(
      new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate(),
        selectedDateTime.getHours(),
        selectedDateTime.getMinutes()
      )
    );
  };

  const handleTimeSelect = (type: "hour" | "minute", value: number) => {
    const newDate = new Date(selectedDateTime);
    if (type === "hour") {
      newDate.setHours(value);
    }
    if (type === "minute") {
      newDate.setMinutes(value);
    }
    setSelectedDateTime(newDate);
  };

  const handleSetToday = () => {
    const today = new Date();
    setSelectedDateTime(today);
    setViewDate(today);
  };

  const handleApply = () => {
    onApply(selectedDateTime);
    onClose();
  };

  // Calendar grid generation logic
  const generateCalendarGrid = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Get today's date for comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time part for accurate date comparison

    // Adjust for Sunday being 0
    const startDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const grid: JSX.Element[] = [];
    // Add empty cells for days before the start of the month
    for (let i = 0; i < startDay; i++) {
      grid.push(
        <div 
          key={`empty-${i}`} 
          className="bg-transparent border border-[#333333] text-white p-1 cursor-pointer aspect-square invisible" 
        />
      );
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(year, month, day);
      const isSelected =
        day === selectedDateTime.getDate() &&
        month === selectedDateTime.getMonth() &&
        year === selectedDateTime.getFullYear();

      // Check if the date is in the future
      const isFutureDate = currentDate > today;

      grid.push(
        <button
          key={day}
          className={`
            text-sm bg-transparent border border-[#333333] text-white p-1 cursor-pointer transition-colors duration-200 aspect-square
            ${isSelected 
              ? "bg-[#4d6aff] text-white border-[#4d6aff]" 
              : "hover:bg-[#333333]"
            }
            ${isFutureDate 
              ? "opacity-50 cursor-not-allowed pointer-events-none" 
              : ""
            }
          `}
          onClick={() => !isFutureDate && handleDateSelect(day)}
          disabled={isFutureDate}
        >
          {day}
        </button>
      );
    }
    return grid;
  };

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const monthName = viewDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const todayFormatted = selectedDateTime.toLocaleString("default", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <div 
      className="fixed inset-0 bg-[rgba(0,0,0,0.7)] z-[1000] flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-[rgba(34,33,33,0.379)] backdrop-blur-[30px] rounded-2xl shadow-2xl p-8 max-w-[650px] text-white animate-[contentShow_150ms_cubic-bezier(0.16,1,0.3,1)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center w-full">
          <h2 className="text-2xl font-bold m-0">Choose date and time</h2>
          <button
            className="bg-none border-none text-[#aaaaaa] cursor-pointer flex items-center justify-center w-8 h-8 p-2 rounded-xl hover:bg-[#333333]"
            aria-label="Close"
            onClick={onClose}
          >
            <FontAwesomeIcon icon={faClose} className="text-xl" />
          </button>
        </div>

        {/* Main Content */}
        <div className="p-6 mt-2 border border-[#333333] rounded-xl">
          <div className="flex gap-6">
            {/* Calendar Section */}
            <div className="flex-1 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div className="text-xl font-bold">{monthName}</div>
                <div className="flex gap-4">
                  <button 
                    onClick={handlePrevMonth}
                    className="bg-none border-none text-white cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faChevronLeft} className="text-xl" />
                  </button>
                  <button 
                    onClick={handleNextMonth}
                    className="bg-none border-none text-white cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="text-xl" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-0.5">
                {daysOfWeek.map((day) => (
                  <div key={day} className="text-sm text-[#aaaaaa] font-semibold text-center py-2">
                    {day}
                  </div>
                ))}
                {generateCalendarGrid()}
              </div>
            </div>

            {/* Time Picker Section */}
            <div className="flex gap-4">
              <div className="text-center">
                <div className="font-semibold mb-4">Hour</div>
                <div 
                  className="max-h-[350px] overflow-y-auto flex flex-col gap-2 scrollbar-hide scroll-snap-y-mandatory px-2"
                  ref={hourRef}
                >
                  {getHours().map((hour) => {
                    const isSelected = hour === selectedDateTime.getHours();
                    return (
                      <button
                        key={hour}
                        className={`
                          bg-none border-none text-[#aaaaaa] font-semibold text-[0.55rem] px-2 py-1 rounded transition-all duration-200 ease-in-out scroll-snap-align-center
                          ${isSelected 
                            ? "text-white font-bold text-base bg-[#333333]" 
                            : ""
                          }
                        `}
                        onClick={() => handleTimeSelect("hour", hour)}
                      >
                        {String(hour).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="text-center">
                <div className="font-semibold mb-4">Minute</div>
                <div 
                  className="max-h-[350px] overflow-y-auto flex flex-col gap-2 scrollbar-hide scroll-snap-y-mandatory px-2"
                  ref={minuteRef}
                >
                  {getMinutes().map((minute) => {
                    const isSelected = minute === selectedDateTime.getMinutes();
                    return (
                      <button
                        key={minute}
                        className={`
                          bg-none border-none text-[#aaaaaa] font-semibold text-[0.55rem] px-2 py-1 rounded transition-all duration-200 ease-in-out scroll-snap-align-center
                          ${isSelected 
                            ? "text-white font-bold text-base bg-[#333333]" 
                            : ""
                          }
                        `}
                        onClick={() => handleTimeSelect("minute", minute)}
                      >
                        {String(minute).padStart(2, "0")}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="flex justify-between items-center text-lg font-bold mt-6">
            <button 
              className="bg-none border-none text-[#4d6aff] cursor-pointer text-base font-bold p-0"
              onClick={handleSetToday}
            >
              Today
            </button>
            <div className="text-base font-normal">{todayFormatted}</div>
          </div>
        </div>

        {/* Apply Button */}
        <button 
          className="h-14 w-full rounded-lg bg-[#4d6aff] text-white font-bold border-none cursor-pointer mt-4 transition-all duration-200 hover:brightness-110"
          onClick={handleApply}
        >
          Apply
        </button>
      </div>
    </div>
  );
};

export default CustomDateTimePicker;