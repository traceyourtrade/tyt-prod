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
  BarChart2
} from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import DashHome from "./images/DashHome.png";

import { Poppins } from "next/font/google";
import { Inter } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",        // optional CSS variable
});

interface SidebarProps {
  expanded: boolean;
  setExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Sidebar({ expanded, setExpanded }: SidebarProps) {

  const pathname = usePathname();

  const menuTop = [
    { name: "Dashboard", icon: <BookOpen size={18} />, url: "/" },
    { name: "Daily Journal", icon: <BookOpen size={18} />, url: "/daily-journal" },
    { name: "Notebook", icon: <NotebookPen size={18} />, url: "/notebook" },
    { name: "My Strategies", icon: <Layers size={18} />, url: "/strategies" },
    { name: "Reports", icon: <BarChart2 size={18} />, url: "/reports" },
  ]

  const menuBottom = [
    { name: "Support", icon: <Headset size={18} />, url: "/support" },
    { name: "Settings", icon: <Settings size={18} />, url: "/settings" },
  ]

  return (
    <>

      <button
        onClick={() => setExpanded(!expanded)}
        className={`text-white hover:text-white transition-all cursor-pointer flex justify-center outline-none bg-[#864cd2] w-5 rounded-4xl absolute z-50 top-10 ease-in-out duration-500 ${expanded ? "left-[230px]" : "left-[55px]"}`}
      >
        {expanded ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </button>

      <div
        className={`${expanded ? "w-60" : "w-16"
          } transition-[width] duration-500 ease-in-out
      flex flex-col justify-between ${inter.className} overflow-hidden fixed h-screen`}
      >
        {/* Top */}
        <div>

          <div className={`w-[200px] flex items-center justify-center gap-2 p-4 h-[50px] overflow-hidden mt-2 ${expanded ? "visible" : "hidden"} mx-auto`}>
            <Image src={"/images/logo2.png"} width={150} height={50} alt="logo" />
          </div>
          <div className={`w-full flex items-center justify-center gap-2 p-4 h-[50px] overflow-hidden mt-2 ${expanded ? "hidden" : "visible"}`}>
            <Image src={"/images/logos1.png"} width={150} height={50} alt="logo" className="w-10" />
          </div>

          <nav className="mt-4 flex flex-col gap-1">
            {menuTop.map((item) => (
              <Link
                key={item.name}
                href={item.url}
                className={`w-[90%] flex items-center gap-3 py-2 px-4 hover:bg-[#2e2e2e] rounded-lg transition-all group mx-auto duration-300 pl-5 ${pathname === item.url ? "bg-[#2e2e2e] text-white" : "hover:bg-[#2e2e2e]"}`}
              >

                {item.name !== "Dashboard" ? <div className="transition-none">
                  {item.icon}
                </div> : ""}

                {item.name === "Dashboard" ? <Image src={DashHome} width={18} height={18} alt="dash" className="tranition-none" /> : ""}

                <span className={`text-sm font-medium group-hover:text-white transition-colors ${expanded ? "ml-0" : "ml-5"} whitespace-nowrap `} >
                  {item.name}
                </span>

              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom */}
        <div>

          <nav className="mt-4 flex flex-col gap-1">

            {menuBottom.map((item) => (
              <Link
                key={item.name}
                href={item.url}
                className={`w-[90%] flex items-center gap-3 py-2 px-4 hover:bg-[#2e2e2e] rounded-lg transition-all group mx-auto duration-300 pl-5 ${pathname === item.url ? "bg-[#2e2e2e] text-white" : "hover:bg-[#2e2e2e]"}`}
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
              onClick={() => console.log("Logout clicked")}
              className={`w-[90%] mx-auto flex items-center gap-3 py-2 px-4 text-red-400 hover:bg-red-400/10 rounded-lg transition-all mt-2 pl-5 `}
            >
              <div className="transition-none">
                <LogOut size={18} />
              </div>
              <span className={`text-sm font-medium group-hover:text-white transition-colors ${expanded ? "ml-0" : "ml-5"} whitespace-nowrap `} >
                Logout
              </span>
            </button>

            <Link href="/settings" className={`text-center w-60 ${expanded ? "opacity-[1] my-5" : "opacity-0 my-5"}`} >
              <h1 className="text-sm font-semibold whitespace-nowrap ">Tanmay Mundada</h1>
              <p className="text-xs text-gray-400 whitespace-nowrap ">tan****@gmail.com</p>
            </Link>

          </nav>
        </div>
      </div>
    </>
  )
}
