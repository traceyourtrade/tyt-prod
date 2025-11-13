// import  { useState } from "react";
// import "../style/dateRangePicker.css";

// const DateRangePicker = () => {
//   const today = new Date();
//   const [fromDate, setFromDate] = useState(null);
//   const [toDate, setToDate] = useState(null);
//   const [hoverDate, setHoverDate] = useState(null);

//   const generateCalendarDays = (monthOffset) => {
//     const date = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
//     const days = [];
//     while (date.getMonth() === today.getMonth() + monthOffset) {
//       days.push(new Date(date));
//       date.setDate(date.getDate() + 1);
//     }
//     return days;
//   };

//   const prevMonth = generateCalendarDays(-1);
//   const currentMonth = generateCalendarDays(0);

//   const isInRange = (day) => {
//     if (!fromDate || (!toDate && !hoverDate)) return false;
//     const end = toDate || hoverDate;
//     return day > fromDate && day < end;
//   };

//   const handleSelect = (day) => {
//     if (!fromDate || (fromDate && toDate)) {
//       setFromDate(day);
//       setToDate(null);
//     } else {
//       if (day > fromDate) {
//         setToDate(day);
//         alert(`From: ${fromDate.toISOString().split("T")[0]} To: ${day.toISOString().split("T")[0]}`);
//       }
//     }
//   };

//   const isDisabled = (day) => day > today;

//   const renderCalendar = (monthDays, title) => (
//     <div className="calendar">
//       <h4>{title}</h4>
//       <div className="calendar-grid">
//         {monthDays.map((day) => {
//           const isFrom = fromDate && day.toDateString() === fromDate.toDateString();
//           const isTo = toDate && day.toDateString() === toDate.toDateString();
//           const disabled = isDisabled(day);

//           return (
//             <div
//               key={day.toISOString()}
//               className={`day ${isFrom ? "from" : ""} ${isTo ? "to" : ""} ${isInRange(day) ? "in-range" : ""} ${
//                 disabled ? "disabled" : ""
//               }`}
//               onClick={() => !disabled && handleSelect(day)}
//               onMouseEnter={() => !disabled && setHoverDate(day)}
//             >
//               {day.getDate()}
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );

//   return (
//     <div className="date-range-picker">
//       {renderCalendar(prevMonth, "Previous Month")}
//       {renderCalendar(currentMonth, "Current Month")}
//     </div>
//   );
// };

// export default DateRangePicker;
