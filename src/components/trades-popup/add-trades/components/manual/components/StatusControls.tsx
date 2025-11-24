'use client';

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faClock,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";

interface StatusControlsProps {
  status: string;
  value: string;
  onSetStatusStarted: () => void;
  onSetStatusPending: () => void;
  onDelete: () => void;
}

const StatusControls: React.FC<StatusControlsProps> = ({
  status,
  value,
  onSetStatusStarted,
  onSetStatusPending,
  onDelete,
}) => {

  return (
    <div className="flex justify-between items-center mt-[16px] mb-[16px]">
      <div>
        <div className="text-[0.75rem] text-white">Status</div>
        <div className="text-[0.9rem] font-bold text-[#aaaaaa]">
          {status === "completed"
            ? "Completed"
            : status === "pending"
              ? "Pending"
              : "Waiting for entry"}
        </div>
      </div>
      <div className="flex gap-[8px]">
        <button
          className={`bg-[#2a2a2a] border-none rounded-[50%] p-[8px_12px] cursor-pointer w-[35px] h-[35px] flex items-center justify-center ${
            !value ? "cursor-not-allowed text-[#555555]" : ""
          }`}
          onClick={onSetStatusStarted}
          disabled={!value}
          style={{
            color: status === "completed" ? "#66ff66" : "#474747",
            cursor: !value ? "not-allowed" : "pointer",
          }}
        >
          <FontAwesomeIcon icon={faCheckCircle} />
        </button>
        <button
          className={`bg-[#2a2a2a] border-none rounded-[50%] p-[8px_12px] cursor-pointer w-[35px] h-[35px] flex items-center justify-center ${
            !value ? "cursor-not-allowed text-[#555555]" : ""
          }`}
          onClick={onSetStatusPending}
          disabled={!value}
          style={{
            color: status === "pending" ? "#4d6aff" : "#474747",
          }}
        >
          <FontAwesomeIcon icon={faClock} />
        </button>
        <button
          className="bg-[#2a2a2a] border-none rounded-[50%] p-[8px_12px] cursor-pointer w-[35px] h-[35px] text-[lightgrey] flex items-center justify-center"
          onClick={onDelete}
        >
          <FontAwesomeIcon icon={faTrash} />
        </button>
      </div>
    </div>
  );
};

export default StatusControls;