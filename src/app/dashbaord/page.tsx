"use client";

import { Suspense, lazy, useState, useEffect } from 'react';
import { useParams } from "next/navigation";
import Cookies from "js-cookie";
import Image from 'next/image';

// Importing files - these will need CSS conversion
import "./style/DashboardHome.css";
import "./style/DashWidgets.css";
import "./Daily Journal/DailyJournal.css";

// importing images
import LogoDark from "@/images/Logo Dark.png";
import Dashboard from "@/images/sidebar/menu.png";
import DailyJournalImg from "../../images/sidebar/pen.png";
import NotebookImg from "../../images/sidebar/notepad.png";
import Mentorship from "../../images/sidebar/mentoring.png";
import Backtesting from "../../images/sidebar/play.png";
import StrategyImg from "../../images/sidebar/strategy.png";
import Help from "../../images/sidebar/help.png";
import Settings from "../../images/attributes/Settings.png";
import Reports from "../../images/attributes/Reporting.png";

// stores
import { useDataStore } from '@/store/store';
import useAccountDetails from '@/store/accountdetails';
// import calendarPopUp from './Store/calendarPopUp';
// import notifications from './Store/notifications';

// Importing skeleton component
// import SettingSke from './Skeleton components dark/SettingSke';
// import DailyjrSke from './Skeleton components dark/DailyjrSke';
// import NotebookSke from './Notebook/components/skeleton/NotebookSke';

// // Importing components
// import DashboardNav from "./Dashboard Components/DashboardNav";
// import DashboardMain from "./DashboardMain";
// import AddTrades from "./Addtrades";

// // Popups
// import CalendarPopup from "./Dashboard Components/Popups/CalendarPopup";
// import AddtradesMain from '../Add trades/AddtradesMain';
// import AddAccPopup from '../add accounts/AddAccPopup';
// import DjImgPopup from './Dashboard Components/Popups/DjImgPopup';
// import EditTradePopUp from './Dashboard Components/Popups/Edit trades/EditTradePopUp';
// import AlertBox from './Dashboard Components/Popups/Alertbox';
// import EditAccPopup from './Dashboard Components/Popups/edit account/EditAccPopup';
// import DeleteAccPopup from './Dashboard Components/Popups/delete account/DeleteAccPopup';
// import ReportsMain from './Reports/ReportsMain';

// // Lazy-loaded components
// const Notebook = lazy(() => import('./Notebook/Notebook'));
// const DailyJournal = lazy(() => import('./Daily Journal/DailyJournal'));
// const Setting = lazy(() => import('./Dashboard Components/settings/Settings'));
// const Strategy = lazy(() => import('./Strategy/Strategy'));

const DashboardHome = () => {
    const { profileData } = useAccountDetails();
    // const { setAddTrades } = calendarPopUp();
    const { bkurl, currentUrl, setCurrentUrl } = useDataStore();
    // const { alertType, alertBoxG } = notifications();

    const params = useParams();
    const userId = params.userId as string;

    const menuItems = [
        { icon: "fa-solid fa-chart-pie", img: Dashboard, name: "Dashboard", url: `/d/${userId}` },
        { icon: "fa-solid fa-pen-fancy", img: DailyJournalImg, name: "Daily Journal", url: `/d/${userId}` },
        { icon: "fa-solid fa-pen-to-square", img: NotebookImg, name: "Notebook", url: `/d/${userId}` },
        { icon: "fa-solid fa-circle-play", img: StrategyImg, name: "My Strategies", url: `/d/${userId}` },
        { icon: "fa-solid fa-circle-play", img: Reports, name: "Reports", url: `/d/${userId}` },
    ];

    const [sideExpand, setsideExpand] = useState(false);

    const expandFun = () => {
        setsideExpand(!sideExpand);
    }

    useEffect(() => {
        document.title = currentUrl;
    }, [currentUrl]);

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
            <div className="dash-main-dark">
                <div className="dash-body-dark">
                    <div className="dash-sidebar-dark-main">
                        <div 
                            onClick={expandFun} 
                            className={`sidebar-open-btn ${sideExpand ? "hidden" : ""}`}
                        >
                            <i className="fa-solid fa-chevron-right"></i>
                        </div>

                        <div className={`dash-sidebar-dark ${sideExpand ? "dash-sidebar-dark-hover" : ""}`}>
                            <div className="dash-sidebar-dark-sub">
                                <Image 
                                    className="side-logo" 
                                    src={LogoDark} 
                                    alt="logo" 
                                    width={120} 
                                    height={40}
                                />
                                <div 
                                    style={{ background: "rgba(122, 122, 122, 0.31)", color: "white", borderRadius: "12px", marginBottom: "20px" }} 
                                    onClick={() => { 
                                        // setAddTrades();
                                         document.body.classList.add("no-scroll"); }} 
                                    className="dash-add-trade cursor-pointer"
                                >
                                    <span style={{ fontSize: "15px", position: "relative", left: "-14px", color: "white", padding: "0px 7px" }}>+</span>
                                    <span>ADD TRADES</span>
                                </div>
                                {menuItems.map((ele) => (
                                    <div 
                                        onClick={() => setCurrentUrl(ele.name)} 
                                        style={{ backgroundColor: (currentUrl === ele.name) ? "rgba(122, 122, 122, 0.31)" : "" }} 
                                        className="dash-sidebar-dark-div cursor-pointer" 
                                        key={ele.name}
                                    >
                                        <i>
                                            <Image 
                                                className="side-img" 
                                                src={ele.img} 
                                                alt={ele.name} 
                                                width={20} 
                                                height={20}
                                            />
                                        </i>
                                        <span>{ele.name}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="dash-sidebar-dark-sub">
                                <div 
                                    onClick={() => setCurrentUrl("Support")} 
                                    style={{ backgroundColor: (currentUrl === "Support") ? "#d8d8d845" : "" }} 
                                    className="dash-sidebar-dark-div cursor-pointer"
                                >
                                    <i>
                                        <Image 
                                            className="side-img" 
                                            src={Help} 
                                            alt="Help" 
                                            width={20} 
                                            height={20}
                                        />
                                    </i>
                                    <span>Support</span>
                                </div>
                                <div 
                                    onClick={() => setCurrentUrl("Settings")} 
                                    style={{ backgroundColor: (currentUrl === "Settings") ? "#d8d8d845" : "" }} 
                                    className="dash-sidebar-dark-div cursor-pointer"
                                >
                                    <i>
                                        <Image 
                                            className="side-img" 
                                            src={Settings} 
                                            alt="Settings" 
                                            width={20} 
                                            height={20}
                                        />
                                    </i>
                                    <span>Settings</span>
                                </div>

                                <div style={{ width: "100%", height: "2px", borderTop: "1px dashed #fff", marginTop: "15px" }}></div>

                                <div 
                                    onClick={() => setCurrentUrl("Profile")} 
                                    className="dash-sidebar-dark-div-img cursor-pointer"
                                >
                                    <div className="side-profile">
                                        <p className="user-profiele-text-dark">
                                            {getInitials()}
                                        </p>
                                    </div>
                                    <span>
                                        <p>{profileData.fullName || ""}</p>
                                        <div style={{ fontSize: "10px" }}>
                                            {profileData.email ? maskEmail(profileData.email) : ""}
                                        </div>
                                    </span>
                                </div>

                                {sideExpand ? (
                                    <button onClick={logoutFun} className="side-logout-dark">LOGOUT</button>
                                ) : (
                                    <button className="side-logout-dark-clone">L</button>
                                )}
                            </div>
                        </div>
                    </div>
{/* 
                    <div className={`dash-side-dark ${sideExpand ? "dash-sideExpand" : ""}`}>
                        <div className={`dash-navbar-dark ${sideExpand ? "dash-navbar-dark-expand" : ""}`}>
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
                        )}
                    </div>

                    <CalendarPopup />
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