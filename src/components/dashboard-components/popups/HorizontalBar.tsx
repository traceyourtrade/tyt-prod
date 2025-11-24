'use client';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation, faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import notifications from "@/store/notifications";

interface HorizontalBarProps {}

const HorizontalBar: React.FC<HorizontalBarProps> = () => {
    const { hrBarTxt, hrBarType } = notifications();

    if (!hrBarTxt || !hrBarType) return null;

    const getBarStyles = () => {
        switch (hrBarType) {
            case "Alert":
                return "bg-yellow-900 bg-opacity-40 border-yellow-600 text-yellow-400";
            case "Danger":
                return "bg-red-900 bg-opacity-40 border-red-600 text-red-500";
            case "Normal":
            default:
                return "bg-gray-900 bg-opacity-60 border-gray-700 text-white";
        }
    };

    const getIcon = () => {
        switch (hrBarType) {
            case "Alert":
                return faCircleExclamation;
            case "Danger":
                return faTriangleExclamation;
            case "Normal":
            default:
                return faCircleExclamation;
        }
    };

    return (
        <div className={`w-full min-h-12 rounded-xl flex items-center cursor-pointer border ${getBarStyles()}`}>
            <FontAwesomeIcon 
                icon={getIcon()} 
                className="text-xl ml-5"
            />
            <p 
                className="text-sm ml-2 py-2 -mt-1"
                dangerouslySetInnerHTML={{ __html: hrBarTxt }} 
            />
        </div>
    );
};

export default HorizontalBar;