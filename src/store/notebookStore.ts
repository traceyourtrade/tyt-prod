"use clients"
import { create } from "zustand";

// 🔹 API URLs (Replace with actual endpoints)
const API_NOTEBOOK_URL = "https://tyt-backend2-473812.el.r.appspot.com/tytusersasqwzxerdfcv/get/notes";
// const API_NOTEBOOK_URL = "http://localhost:5000/tytusersasqwzxerdfcv/get/notes";

interface NotebookStore {
  notes: any[];
  setNotes: (userId: string, tokenn: string) => Promise<void>;
  selectedFolder: string;
  setFolder: (folderName: string) => void;
  selectedFile: string;
  setFile: (fileName: string) => void;
}

const notebookStore = create<NotebookStore>((set) => ({
  notes: [], //all accounts 

  setNotes: async (userId: string, tokenn: string) => {
    try {
      const res = await fetch(API_NOTEBOOK_URL, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId, tokenn
        })
      })

      const data = await res.json();

      // console.log(data);

      if (data.error) {
        // console.log(data.error);
      } else if (res.status === 200) {
        set({ notes: data.data });
      }

    } catch (error) {
      // console.log(error);
    }
  },

  // Folder, files select

  selectedFolder: "Daily Journal",

  setFolder: (folderName: string) => set({ selectedFolder: folderName }),

  selectedFile: "",

  setFile: (fileName: string) => set({ selectedFile: fileName }),

}));

export default notebookStore;