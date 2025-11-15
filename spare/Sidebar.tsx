"use client";

import Image from "next/image";
import { StaticImageData } from "next/image";
import { useState } from "react";

import Dashboard from "./images/menu.png";
import DailyJournalImg from "./images/pen.png";
import NotebookImg from "./images/notepad.png";
import Mentorship from "./images/mentoring.png";
import Backtesting from "./images/play.png";
import Help from "./images/help.png";
import Settings from "./images/Settings.png";

export default function Sidebar() {

    const [sideExpand, setsideExpand] = useState<boolean>(false);

    type MenuItem = { name: string; img: StaticImageData, url: string };

    const menuItems: MenuItem[] = [
        { img: Dashboard, name: "Dashboard", url: `/` },
        { img: DailyJournalImg, name: "Daily Journal", url: `/dailyjournal` },
        { img: NotebookImg, name: "Notebook", url: `/notebook` },
        { img: Mentorship, name: "Mentors Desk", url: `/mentors-desk` },
        { img: Backtesting, name: "Backtesting", url: `/backtesting` },
    ];

    const expandFun = () => {
        setsideExpand(!sideExpand)
    }

    return <div
    // className="w-[90px] flex-row align-middle justify-center"
    >

        <div
            className={`w-[45px]  h-[calc(100vh-100px)] rounded-[30px] flex-col align-middle justify-between text-white fixed z-2 top-[65px] left-5 transition-all duration-500 ease-in-out overflow-hidden pt-2.5 
                       bg-[linear-gradient(179deg,rgba(144,84,249,0.25)_0%,rgba(162,97,193,0)_31%,rgba(212,132,40,0)_75%,rgba(224,140,4,0.18)_100%)]
                       bg-cover bg-center bg-no-repeat
                       backdrop-blur-[25px] 
                       border border-[rgba(255,255,255,0.347)] border-x-[rgba(255,255,255,0.2)]
                       shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]`}
        >

        </div>

    </div>

}