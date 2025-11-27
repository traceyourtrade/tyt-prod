'use client';

import { useState } from "react";

// Components
import FileUpload from "./components/file-upload/FileUpload";

// Store
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import calendarPopUp from "@/store/calendarPopUp";
import AutoSync from "./components/auto-sync/AutoSync";
import Manual from "./components/manual/Manual";

const AddtradesMain = () => {
    const { showAddTrades, setAddTrades } = calendarPopUp();
    const [selectedType, setSelectedType] = useState(1);

    const options = [
        { id: 1, type: "MANUAL" },
        { id: 2, type: "FILE UPLOAD" },
        { id: 3, type: "BROKER SYNC" }
    ];

    const handleClose = () => {
        setAddTrades();
        document.body.classList.remove("no-scroll");
    };

    return (
        <div className={` pt-[10vh] w-[100vw] h-[100vh] flex justify-center align-center fixed top-0 left-0 bg-[#00000067] z-100 ${showAddTrades ? "block" : "hidden"}`}>
            <div className="w-[90%] max-w-[500px] h-[85vh] rounded-[25px] bg-[rgba(34,33,33,0.379)] backdrop-blur-[30px] border-[0.5px] border-[#717171] font-inter overflow-y-auto">
                
                {/* Section 1 - Header */}
                <div className="w-full flex items-center justify-between pt-[25px]">
                    <p className="text-[25px] font-[550] text-white ml-[30px]">Add Trades</p>
                    <span 
                        className="text-[21px] float-right text-right block mr-[30px] text-white cursor-pointer"
                        onClick={handleClose}
                    >
                        <FontAwesomeIcon icon={faXmark} />
                    </span>
                </div>

                {/* Section 2 - Options */}
                <div className="w-full h-auto mt-[15px]">
                    {options.map((ele) => (
                        <span 
                            key={ele.id} 
                            className={`font-[550] text-[14px] mx-[5px] ml-[30px] text-white cursor-pointer pb-[2px] ${
                                selectedType === ele.id ? "border-b-[3px] border-[#5a33b6]" : ""
                            }`}
                            onClick={() => setSelectedType(ele.id)}
                        >
                            {ele.type}
                        </span>
                    ))}
                </div>

                {/* Section 3 - Content */}
                <div className="w-full">
                    {selectedType === 1 ? <Manual /> : selectedType === 2 ? <FileUpload /> : selectedType === 3 ? <AutoSync /> : ""}
                </div>
            </div>
        </div>
    );
};

export default AddtradesMain;