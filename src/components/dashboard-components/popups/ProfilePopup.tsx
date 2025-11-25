'use client';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faClose } from "@fortawesome/free-solid-svg-icons";
import calendarPopUp from "@/store/calendarPopUp";
interface ProfilePopupProps {
    deleteImg: () => void;
}

const ProfilePopup: React.FC<ProfilePopupProps> = ({ deleteImg }) => {
    const { showProImg, proImgUrl, setProImg } = calendarPopUp();

    const closePopup = () => {
        setProImg();
        document.body.classList.remove("no-scroll");
    };

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-40 z-50 flex flex-col items-center justify-center ${showProImg ? "flex" : "hidden"}`}>
            <div className="w-full h-screen flex items-center justify-center relative">
                <img 
                    src={proImgUrl} 
                    alt="profile" 
                    className="w-4/5 max-w-4xl mx-auto absolute"
                />
                <div className="absolute z-50 top-10 right-16 w-12 flex items-center justify-between">
                    <FontAwesomeIcon 
                        icon={faTrash} 
                        className="text-white text-xl cursor-pointer"
                        onClick={deleteImg}
                    />
                    <FontAwesomeIcon 
                        icon={faClose} 
                        className="text-white text-2xl cursor-pointer"
                        onClick={closePopup}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProfilePopup;