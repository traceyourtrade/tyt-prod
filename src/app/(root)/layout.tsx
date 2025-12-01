"use client"

import { useState } from "react"
import Sidebar from "@/components/dashboard/Sidebar"
import "../globals.css"
import DeleteAccPopup from "@/components/dashboard-components/popups/DeleteAccPopup"
import EditAccPopup from "@/components/dashboard-components/popups/EditAccPopup"
import AddAccPopup from "@/components/dashboard-components/popups/AddAccPopup"
import DashboardNav from "@/components/dashboard-components/DashboardNavbar"
import AddtradesMain from "@/components/trades-popup/add-trades/AddTradesMain"
import EditTradePopUp from "@/components/trades-popup/edit-trades/EditTradePopUp"
import CalendarPopup from "@/components/dashboard-components/popups/CalendarPopUp"
import AlertBox from "@/components/dashboard-components/popups/AlertBox"
import DjImgPopup from "@/components/dashboard-components/popups/DjImgPopup"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const [expanded, setExpanded] = useState<boolean>(false)

  return (
    <div className="flex h-screen bg-[#030303] ">

      <AddtradesMain />
      <Sidebar expanded={expanded} />

      <main className={`w-screen`}>
        <div className={`${expanded ? "w-[calc(100%-240px)]" : "w-[calc(100%-64px)]"} h-screen flex-1 bg-[#0e0e0e] rounded-tl-[20px] overflow-auto p-6 mt-2 border-[0.5px] border-[#242424] fixed right-0 transition-[width] duration-500 ease-in-out`} >
          <DashboardNav expanded={expanded} setExpanded={setExpanded} />
          <div className="absolute w-full h-px bg-[#1b1b1b] -mt-2.5" ></div>
          <DeleteAccPopup />
          <EditAccPopup />
          <AddAccPopup />
          <EditTradePopUp />
          <CalendarPopup />
          <AlertBox />
          <DjImgPopup />
          {children}
        </div>
      </main>

    </div>
  )
}
