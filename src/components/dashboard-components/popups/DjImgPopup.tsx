'use client';

import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faClose } from "@fortawesome/free-solid-svg-icons";
import useAccountDetails from "@/store/accountdetails";
import calendarPopUp from "@/store/calendarPopUp";

const DjImgPopup = () => {
    const { showDjImg, djImgUrl, setDjImg } = calendarPopUp();
    const { setAccounts } = useAccountDetails();


    const deleteImg = async (e: React.MouseEvent) => {
        e.preventDefault();

        try {
            const res = await fetch(`/api/daily-journal/delete`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    url: djImgUrl,apiName:'deleteImage'
                })
            });

            const data = await res.json();

            if (res.status === 200) {
                document.body.classList.remove("no-scroll");
                setAccounts();
                setDjImg();
            } else {
                console.log(data.error);
            }
        } catch (error) {
            console.log(error);
        }
    };

    const closePopup = () => {
        setDjImg();
        document.body.classList.remove("no-scroll");
    };

    return (
        <div className={`fixed inset-0 bg-black bg-opacity-40 z-50 flex flex-col items-center justify-center ${showDjImg ? "flex" : "hidden"}`}>
            <div className="w-full h-screen flex items-center justify-center relative">
                <img 
                    src={djImgUrl} 
                    alt="djImg" 
                    className="w-4/5 max-w-4xl mx-auto"
                />
                <div className="absolute z-10 top-10 right-16 w-12 flex items-center justify-between">
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

export default DjImgPopup;