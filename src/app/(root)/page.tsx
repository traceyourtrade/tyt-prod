"use client";

import { Suspense, lazy, useState, useEffect } from 'react';
import { useParams,usePathname,useRouter } from "next/navigation";
import Cookies from "js-cookie";
import Image from 'next/image';

// Importing images
import LogoDark from "/images/Logo Dark.png";
import Dashboard from "/images/sidebar/menu.png";
import DailyJournalImg from "/images/sidebar/pen.png";
import NotebookImg from "/images/sidebar/notepad.png";
import StrategyImg from "/images/sidebar/strategy.png";
import Help from "/images/sidebar/help.png";
import Settings from "/images/attributes/Settings.png";
import Reports from "/images/attributes/Reporting.png";

// stores
import useAccountDetails from '@/store/accountdetails';
import calendarPopUp from '@/store/calendarPopUp';
import { useDataStore } from '@/store/store';
import DashboardNav from '@/components/dashboard-components/DashboardNavbar';
import Sidebar from '@/components/dashboard-components/Sidebar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
// Import other stores as needed
// import calendarPopUp from './Store/calendarPopUp';
// import notifications from './Store/notifications';

// Importing skeleton component
// import SettingSke from './Skeleton components dark/SettingSke';
// import DailyjrSke from './Skeleton components dark/DailyjrSke';
// import NotebookSke from './Notebook/components/skeleton/NotebookSke';

// Importing components
// import DashboardNav from "./Dashboard Components/DashboardNav";
// import DashboardMain from "./DashboardMain";
// import AddTrades from "./Addtrades";

// Popups
// import CalendarPopup from "./Dashboard Components/Popups/CalendarPopup";
// import AddtradesMain from '../Add trades/AddtradesMain';
// import AddAccPopup from '../add accounts/AddAccPopup';
// import DjImgPopup from './Dashboard Components/Popups/DjImgPopup';
// import EditTradePopUp from './Dashboard Components/Popups/Edit trades/EditTradePopUp';
// import AlertBox from './Dashboard Components/Popups/Alertbox';
// import EditAccPopup from './Dashboard Components/Popups/edit account/EditAccPopup';
// import DeleteAccPopup from './Dashboard Components/Popups/delete account/DeleteAccPopup';
// import ReportsMain from './Reports/ReportsMain';

// Lazy-loaded components
// const Notebook = lazy(() => import('./Notebook/Notebook'));
// const DailyJournal = lazy(() => import('./Daily Journal/DailyJournal'));
// const Setting = lazy(() => import('./Dashboard Components/settings/Settings'));
// const Strategy = lazy(() => import('./Strategy/Strategy'));

const DashboardHome = () => {
    const { profileData, setAccounts } = useAccountDetails();
    const { setAddTrades } = calendarPopUp();
    const { bkurl, currentUrl, setCurrentUrl } = useDataStore();
    // const { alertType, alertBoxG } = notifications();
  const pathname = usePathname();
  const router = useRouter();
  console.log("Current Pathname:", pathname);

    const params = useParams();
    const userId = params.userId as string;

    const menuItems = [
        { icon: "fa-solid fa-chart-pie", img: "/images/sidebar/menu.png", name: "Dashboard", url: `/` },
        { icon: "fa-solid fa-pen-fancy", img: "/images/sidebar/pen.png", name: "Daily Journal", url: `/daily-journal` },
        { icon: "fa-solid fa-pen-to-square", img: "/images/sidebar/notepad.png", name: "Notebook", url: `/notebook` },
        { icon: "fa-solid fa-circle-play", img: "/images/sidebar/strategy.png", name: "My Strategies", url: `/strategy` },
        { icon: "fa-solid fa-circle-play", img: "/images/attributes/Reporting.png", name: "Reports", url: `/reports` },
    ];

    const [sideExpand, setsideExpand] = useState(false);

    const expandFun = () => {
        setsideExpand(!sideExpand);
    }

    useEffect(() => {
        document.title = currentUrl;
    }, [currentUrl]);

    // Fetch accounts on component mount
    useEffect(() => {
        const token = Cookies.get('Trace Your Trades');
        if (userId && token) {
            console.log('Root page: Calling setAccounts with userId:', userId);
            setAccounts(userId, token);
        } else {
            console.warn('Root page: Missing userId or token', { userId, token: token ? '***' : 'missing' });
        }
    }, [userId, setAccounts]);


    const logoutFun = async () => {
        try {
            const token = Cookies.get('Trace Your Trades');

            await fetch(`${bkurl}/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            Cookies.remove('Trace Your Trades', {
                domain: '.traceyourtrade.com',
                path: '/'
            });

            window.location.href = 'https://traceyourtrade.com/login';
        } catch (error) {
            console.error('Logout failed:', error);
            window.location.href = 'https://traceyourtrade.com/login';
        }
    };
const updatePath = (url: string) => {
    router.push(url);
}
    const getInitials = () => {
        if (!profileData.fullName) return "";
        const names = profileData.fullName.split(' ');
        return `${names[0].charAt(0)}${names[1]?.charAt(0) || ''}`;
    };

    const maskEmail = (email: string) => {
        return email.replace(/^(.{4}).*(@.*)$/, (_, a, b) => `${a}*****${b}`);
    };

    return (
        <>
            <div className="w-screen h-auto bg-black">
                <div className="w-screen h-auto min-h-[90vh] flex mt-5 bg-black">
                    <div 
  onClick={expandFun} 
  className={`fixed text-white z-20 top-24 rounded-full bg-[#ffffff47] flex items-center justify-center cursor-pointer transition-all duration-500 ease-in-out ${
    sideExpand ? "left-50" : "left-15"
  } w-5 h-5`}
>
  <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
</div>
                    <Sidebar 
  sideExpand={sideExpand}
  expandFun={expandFun}
  menuItems={menuItems}
  currentUrl={currentUrl}
  setCurrentUrl={setCurrentUrl}
  getInitials={getInitials}
  profileData={{fullName:"", email:""}}
  maskEmail={maskEmail}
  logoutFun={logoutFun}
  setAddTrades={setAddTrades}
  updatePath={updatePath}
/>

                    {/* Main Content Area */}
                    <div className={`absolute right-2 z-0 transition-all duration-500 ease-in-out p-2 ${
                        sideExpand ? "w-[calc(99vw-240px)]" : "w-[calc(99vw-120px)]"
                    } h-auto min-h-[90vh]`}>
                        {/* Navigation and Content will go here */}
                        {/* <div className={`dash-navbar-dark ${sideExpand ? "dash-navbar-dark-expand" : ""}`}>
                            <DashboardNav heading={currentUrl} />
                        </div>

                        {alertType && alertBoxG && <AlertBox />}

                        {currentUrl === "Dashboard" && <DashboardMain />}
                        {currentUrl === "Add Trades" && <AddTrades />}
                        {currentUrl === "Notebook" && (
                            <Suspense fallback={<NotebookSke />}>
                                <Notebook />
                            </Suspense>
                        )}
                        {currentUrl === "Daily Journal" && (
                            <Suspense fallback={<DailyjrSke />}>
                                <DailyJournal />
                            </Suspense>
                        )}
                        {(currentUrl === "Settings" || currentUrl === "Profile") && (
                            <Suspense fallback={<SettingSke />}>
                                <Setting />
                            </Suspense>
                        )}
                        {currentUrl === "My Strategies" && (
                            <Suspense fallback={<SettingSke />}>
                                <Strategy />
                            </Suspense>
                        )}
                        {currentUrl === "Reports" && (
                            <Suspense fallback={<SettingSke />}>
                                <ReportsMain />
                            </Suspense>
                        )} */}

                        {/* Placeholder Content */}
                        <div className="text-white p-8">
                            <DashboardNav heading='qwerty'/>
                            </div>
                    </div>

                    {/* Popups - Commented out for now */}
                    {/* <CalendarPopup />
                    <AddtradesMain />
                    <EditTradePopUp />
                    <AddAccPopup />
                    <EditAccPopup />
                    <DeleteAccPopup />
                    <DjImgPopup /> */}
                </div>
            </div>
        </>
    );
}

export default DashboardHome;