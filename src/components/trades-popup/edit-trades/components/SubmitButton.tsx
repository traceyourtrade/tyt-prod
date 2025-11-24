'use client';

import React from "react";

interface SubmitButtonProps {
  handleSubmit: (e: React.FormEvent) => void;
  disabled: boolean;
  isSubmitting: boolean;
}

const SubmitButton: React.FC<SubmitButtonProps> = ({ 
  handleSubmit, 
  disabled, 
  isSubmitting 
}) => {
  return (
    <div className="mt-[32px]">
      <button
        className="w-full px-[16px] py-[16px] bg-[#4d6aff] text-white text-[1rem] font-bold border-none rounded-[8px] cursor-pointer disabled:bg-[#555555] disabled:cursor-not-allowed"
        disabled={disabled || isSubmitting}
        onClick={handleSubmit}
      >
        {isSubmitting ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
};

export default SubmitButton;