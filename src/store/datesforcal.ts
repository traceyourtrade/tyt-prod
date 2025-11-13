import { create } from "zustand";

interface DatesForCalStore {
  calMonth: number;
  setcalMonth: (newData: number) => void;
  calYear: number;
  setcalYear: (newData: number) => void;
}

const datesforcal = create<DatesForCalStore>((set) => ({
  calMonth: new Date().getMonth() + 1, 
  setcalMonth: (newData: number) => set({ calMonth: newData }),

  calYear: new Date().getFullYear(),
  setcalYear: (newData: number) => set({ calYear: newData }),
}));

export default datesforcal;