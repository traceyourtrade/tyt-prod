import { create } from "zustand";
import axios from "axios";

// const API_POLLING_URL = "http://localhost:5000/tytusersasqwzxerdfcv/poll/autosync/account"
const API_POLLING_URL = "https://tyt-backend2-473812.el.r.appspot.com/tytusersasqwzxerdfcv/poll/autosync/account"

interface NotificationsStore {
  hrBarType: string | null;
  hrBarTxt: string | null;
  setHrBarTxt: (data1: string | null, data2: string | null) => void;
  alertType: string | null;
  alertBoxG: string | null;
  setAlertBoxG: (data1: string | null, data2: string | null) => void;
  polling: boolean;
  pollResult: any;
  accStatusPolling: (accountName: string, uniqueId: string, tokenn: string) => Promise<void>;
}

const notifications = create<NotificationsStore>((set, get) => ({
  // horizontal bar
  hrBarType: null, // ALert, Danger, Normal
  hrBarTxt: null,
  // hrBarTxt: `Fetching your account <span style="font-weight:bold" >Account Name</span> has been stopped due to invalid credentials, kindly enter correct details`,
  setHrBarTxt: (data1: string | null, data2: string | null) => set({ hrBarTxt: data1, hrBarType: data2 }),

  // Alert bar
  alertType: null, // async-alert, success, error, normal
  alertBoxG: null,
  // alertBoxG: "Your account details are being fetched, this may take few seconds",
  setAlertBoxG: (data1: string | null, data2: string | null) => set({ alertBoxG: data1, alertType: data2 }),

  // 1000ms Polling Function
  polling: false,
  pollResult: null,

  accStatusPolling: async (accountName: string, uniqueId: string, tokenn: string) => {
    if (get().polling) return;
    set({ polling: true });

    try {
      let success = false;

      while (!success) {
        try {
          const res = await axios.post(API_POLLING_URL, {
            accountName,
            uniqueId,
            tokenn,
          });

          // Only 2xx responses reach here
          if (res.data.status === "green") {
            set({ pollResult: res.data, polling: false, alertType: null, alertBoxG: null });
            success = true;
            window.location.reload();
            break;
          }

        } catch (err: any) {
          // For non-2xx like 403/red or 406/yellow
          const data = err.response?.data;
          // console.log("Polling response (non-2xx):", data);

          if (data?.status === "red") {
            set({ pollResult: { error: true }, polling: false, alertType: "error", alertBoxG: "Invalid Credentials, please reset Investor ID & Password" });
            break; // stop polling
          } else if (data?.status === "yellow") {
            await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1s and retry
          } else {
            // unknown error
            console.warn("Unexpected polling error:", err.response?.status);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

    } catch (error) {
      console.error("Polling stopped due to unexpected error:", error);
      set({ pollResult: { error: true }, polling: false });
    }
  }
}));

export default notifications;