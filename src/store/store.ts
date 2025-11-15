"use client"

import { create } from "zustand";

interface DataState {
    bkurl: string;
    sideExpand: string;
    currentUrl:string;
    setsideExpand: (newData: string) => void;
    setCurrentUrl:(newData:string)=>void;
}

export const useDataStore = create<DataState>((set) => ({

    // bkurl: "http://localhost:5000",
    bkurl: "https://tyt-backend2-473812.el.r.appspot.com",
    sideExpand: "",
    setsideExpand: (newData) => set({ sideExpand: newData }),
    currentUrl: "Dashboard",

    setCurrentUrl: (newData) => set({ currentUrl: newData })

}));
