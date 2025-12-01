'use client'

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import {
  LogOut,
  Settings,
  Headset,
  BookOpen,
  NotebookPen,
  Layers,
  BarChart2,
  PlusCircle
} from "lucide-react";
import DashHome from "./images/DashHome.png";

import { Poppins } from "next/font/google";
import { Inter } from "next/font/google";
import axios from "axios";
import useAccountDetails from "@/store/accountdetails";
import calendarPopUp from "@/store/calendarPopUp";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

interface SidebarProps {
  expanded: boolean;
}

export default function Sidebar({ expanded }: SidebarProps) {

  const pathname = usePathname();
  const { profileData } = useAccountDetails();
  const { setAddTrades } = calendarPopUp();

  const menuTop = [
    { name: "Dashboard", icon: <BookOpen size={15} />, url: "/" },
    { name: "Daily Journal", icon: <BookOpen size={15} />, url: "/daily-journal" },
    { name: "Notebook", icon: <NotebookPen size={15} />, url: "/notebook" },
    { name: "My Strategies", icon: <Layers size={15} />, url: "/strategies" },
    { name: "Reports", icon: <BarChart2 size={15} />, url: "/reports" },
  ]

  const menuBottom = [
    { name: "Support", icon: <Headset size={15} />, url: "/support" },
    { name: "Settings", icon: <Settings size={15} />, url: "/settings" },
  ]

  const handleLogout = async () => {
    console.log("Logout clicked");
    const resposne = await axios.post('/api/logout');
    console.log(resposne.data);
    if (resposne.data.success) {
      window.location.href = "/login";
    }
  }
  return (
    <>

      <div
        className={`${expanded ? "w-60" : "w-16"} transition-[width] duration-500 ease-in-out
      flex flex-col justify-between ${inter.className} overflow-hidden fixed h-screen`}
      >
        {/* Top */}
        <div>

          <div className={`w-[200px] flex items-center justify-center gap-2 p-4 h-[50px] overflow-hidden mt-3 ${expanded ? "visible" : "hidden"} mx-auto`}>
            <Image src={"/images/logo2.png"} width={150} height={50} alt="logo" />
          </div>
          <div className={`w-full flex items-center justify-center gap-2 p-4 h-[50px] overflow-hidden mt-3 ${expanded ? "hidden" : "visible"}`}>
            <Image src={"/pjLogo.png"} width={150} height={50} alt="logo" className="w-10" />
          </div>

          <div className="w-full h-px bg-[#1b1b1b] mt-1 mb-10" ></div>

          <button
            onClick={() => { setAddTrades(); document.body.classList.add("no-scroll"); }}
            className={`w-[70%] cursor-pointer mx-auto flex items-center gap-3 py-1 px-4 text-white bg-[#4a6aff] hover:bg-[#4a6aff]/80 rounded-lg transition-all mt-2`}
          >
            <div className="transition-none -ml-0.5">
              <PlusCircle size={18} />
            </div>
            <span className={`text-sm font-medium group-hover:text-white transition-colors ${expanded ? "ml-3" : "ml-5"} whitespace-nowrap `} >
              Add Trades
            </span>
          </button>
          <nav className="flex flex-col gap-1 mt-7 text-[#a6a6a6] ">
            {menuTop.map((item) => (
              <Link
                key={item.name}
                href={item.url}
                className={`w-[90%] flex items-center gap-3 py-1 px-1 hover:bg-[#2e2e2e] rounded-lg transition-all group mx-auto duration-300 pl-5 ${pathname === item.url ? "bg-[#2e2e2e] text-white" : "hover:bg-[#2e2e2e]"}`}
              >

                {item.name !== "Dashboard" ? <div className="transition-none">
                  {item.icon}
                </div> : ""}

                {item.name === "Dashboard" ? <Image src={DashHome} width={15} height={15} alt="dash" className="tranition-none" /> : ""}

                <span className={`text-sm font-medium group-hover:text-white transition-colors ${expanded ? "ml-0" : "ml-5"} whitespace-nowrap `} >
                  {item.name}
                </span>

              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom */}
        <div>

          <div className="w-full h-px bg-[#1b1b1b] mb-5" ></div>

          <nav className="mt-4 flex flex-col gap-1 text-[#a6a6a6] ">

            {menuBottom.map((item) => (
              <Link
                key={item.name}
                href={item.url}
                className={`w-[90%] flex items-center gap-3 py-1 px-1 hover:bg-[#2e2e2e] rounded-lg transition-all group mx-auto duration-300 pl-5 ${pathname === item.url ? "bg-[#2e2e2e] text-white" : "hover:bg-[#2e2e2e]"}`}
              >
                <div className="transition-none">
                  {item.icon}
                </div>

                <span className={`text-sm font-medium group-hover:text-white transition-colors ${expanded ? "ml-0" : "ml-5"} whitespace-nowrap`} >
                  {item.name}
                </span>
              </Link>
            ))}

            <button
              onClick={handleLogout}
              className={`w-[90%] mx-auto flex items-center gap-3 py-1 px-1 text-red-400 hover:bg-red-400/10 rounded-lg transition-all pl-5 `}
            >
              <div className="transition-none">
                <LogOut size={15} />
              </div>
              <span className={`text-sm font-medium group-hover:text-white transition-colors ${expanded ? "ml-0" : "ml-5"} whitespace-nowrap `} >
                Logout
              </span>
            </button>

            <div className="w-full h-px bg-[#1b1b1b] mt-5" ></div>

            <Link href="/settings" className={`text-center w-60 ${expanded ? "opacity-[1] my-5" : "opacity-0 my-5"}`} >
              <h1 className="text-sm font-semibold whitespace-nowrap ">{profileData.fullName ? `${profileData.fullName.charAt(0)}${profileData.fullName.split(" ")[1]?.charAt(0)}` : ""}</h1>
              <p className="text-xs text-gray-400 whitespace-nowrap ">{profileData.email ? (profileData.email).replace(/^(.{4}).*(@.*)$/, (_, a, b) => `${a}*****${b}`) : ""}</p>
            </Link>

          </nav>
        </div>
      </div>
    </>
  )
}
