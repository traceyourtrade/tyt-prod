"use client"

import { useState } from "react"
import Sidebar from "@/components/dashboard/Sidebar"
import "../globals.css"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const [expanded, setExpanded] = useState<boolean>(false)

  return (
    <div className="flex h-screen bg-[#0e0e0e] ">

      <Sidebar expanded={expanded} setExpanded={setExpanded} />

      <main className={`w-screen`}>
        <div className={`${expanded ? "w-[calc(100%-240px)]" : "w-[calc(100%-64px)]"} h-screen flex-1 bg-[#080808] rounded-tl-[20px] overflow-auto p-6 mt-2 border-[0.5px] border-[#242424] fixed right-0 transition-[width] duration-500 ease-in-out`} >
          {children}
        </div>
      </main>

    </div>
  )
}
