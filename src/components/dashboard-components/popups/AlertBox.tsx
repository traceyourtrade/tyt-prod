'use client';

import { useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import notifications from "@/store/notifications";
const AlertBox = () => {
    const { alertType, alertBoxG, setAlertBoxG, polling } = notifications();

    const RenderBox = () => {
        if (alertType === "async-alert" && polling) {
            return (
                <div className={`w-80 h-24 fixed z-10 top-16 right-5 rounded-l-lg border-2 border-gray-700 items-center overflow-hidden text-white bg-gray-900 border-l-4 border-l-blue-600 ${alertType && alertBoxG?"flex":"hidden"}  `}>
                    <FontAwesomeIcon 
                        icon={faXmark} 
                        className="absolute top-2 right-2 cursor-pointer"
                        onClick={() => setAlertBoxG(null, null)}
                    />
                    <FontAwesomeIcon 
                        icon={faCircleExclamation} 
                        className="text-xl px-4 text-blue-600"
                    />
                    <div className="ab-div">
                        <p>{alertBoxG}</p>
                    </div>
                    <div 
                        className="w-80 h-1 bg-white bg-opacity-75 absolute bottom-0 left-0 animate-[loadPlain_12s_linear_forwards]" 
                    ></div>
                </div>
            );
        } else {
            return (
                <div className={`
                    w-80 h-24 fixed z-10 top-16 right-5 rounded-l-lg border-2 border-gray-700 flex items-center overflow-hidden text-white bg-gray-900 border-l-4
                    ${alertType === "success" ? "bg-green-950 border-l-green-500" : ""}
                    ${alertType === "error" ? "bg-red-950 border-l-red-600" : ""}
                    ${alertType && alertBoxG?"flex":"hidden"}
                `}>
                    <FontAwesomeIcon 
                        icon={faXmark} 
                        className="absolute top-2 right-2 cursor-pointer"
                        onClick={() => setAlertBoxG(null, null)}
                    />
                    <FontAwesomeIcon 
                        icon={faCircleExclamation} 
                        className={`
                            text-xl px-4
                            ${alertType === "success" ? "text-green-500" : ""}
                            ${alertType === "error" ? "text-red-600" : ""}
                            ${!alertType || alertType === "async-alert" ? "text-blue-600" : ""}
                        `}
                    />
                    <div className="ab-div">
                        <p>{alertBoxG}</p>
                    </div>
                    <div 
                        className={`
                            w-80 h-1 absolute bottom-0 left-0 animate-[loadPlain_5s_linear_forwards]
                            ${alertType === "success" ? "bg-green-500" : ""}
                            ${alertType === "error" ? "bg-red-600" : ""}
                            ${!alertType || alertType === "async-alert" ? "bg-white bg-opacity-75" : ""}
                        `}
                    ></div>
                </div>
            );
        }
    };

    useEffect(() => {
        if (alertType !== "async-alert") {
            setTimeout(() => {
                setAlertBoxG(null, null);
            }, 5500);
        }
    }, [alertType, setAlertBoxG]);

    return <RenderBox />;
};

export default AlertBox;