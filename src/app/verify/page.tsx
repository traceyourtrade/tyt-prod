// "use client";

// import { useEffect, useState } from 'react';
// import Image from 'next/image';
// import { useRouter, useSearchParams } from 'next/navigation';
// import "./Verifyemail.css";
// // import Logo from "../../../images/Logo.png";

// // stores
// import { useDataStore as store } from '@/store/store';

// const Verifyemail = () => {
//   console.log("Verify Email Page Loaded");
//     const { bkurl } = store();
//     const searchParams = useSearchParams();
//     const token = searchParams.get('t');
//     console.log("the token in verify page is ",token);

//     const [verified, setVerified] = useState(false);
//     const [err, setErr] = useState("")
//     const [dotFilled2, setDotFilled2] = useState(false);
//     const [dotFilled3, setDotFilled3] = useState(false);
//     const [tube1, setTube1] = useState(false);
//     const [tube2, setTube2] = useState(false);
//     const router = useRouter();

//     const sendVerify = async () => {
//         try {
//             const res = await fetch(`api/verify-mail`, {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify({
//                     token
//                 })
//             });

//             const data = await res.json();

//             if (res.status === 200) {
//                 setVerified(true)
//             } else {
//                 if (data.error) {
//                     setErr("Some problem occured while verifying your email... Please try again later.")
//                 }
//             }
//         } catch (error) {
//             // console.log(error)
//         }
//     }

//     useEffect(() => {
//         sendVerify();

//         setTimeout(() => {
//             setTube1(true)
//         }, 500);

//         setTimeout(() => {
//             setDotFilled2(true)
//         }, 1000);

//         setTimeout(() => {
//             setTube2(true)
//         }, 1500);

//         setTimeout(() => {
//             setDotFilled3(true)
//         }, 2000);

//         setTimeout(() => {
//             sendVerify();
//         }, 2500);
//     }, []);
//     const navigateToLogin = () => {
//         router.push("/login");
//     }

//     return (
//         <div className="w-screen min-h-screen grid place-content-center bg-[url('/images/loginbggradient.png')] bg-cover bg-center bg-no-repeat">
//             <div className="w-[90vw] max-w-[400px] h-[600px] shadow-[rgba(0,0,0,0.24)_0px_3px_8px,rgb(38,57,77)_0px_20px_30px_-10px,rgba(50,50,93,0.25)_0px_50px_100px_-20px,rgba(0,0,0,0.3)_0px_30px_60px_-30px] flex flex-col items-center justify-start rounded-[25px] bg-white font-[SF_Pro_Display]">
//                 <Image 
//                     className="mt-[15px]" 
//                     src="/images/Logo.png"
//                     alt="Logo" 
//                     width={100} 
//                     height={100}
//                 />
//                 <h1 className="text-[28px]">Email Verification</h1>
//                 <p className="py-[2px] text-[#817a7a] mx-[5px] text-[12px] font-[550]">Verifying your email...</p>

//                 <div className="mt-[20px] p-[20px] flex flex-col">
//                     <div className="verifyprogress-content">
//                         <div className="dot-ve"></div>
//                         <p className="verifyprogress-text">Verification Initiated</p>
//                     </div>
//                     <div className="tube-ve">
//                         <div className={tube1 ? "tube-ve-fill" : ""}></div>
//                     </div>

//                     <div className="verifyprogress-content">
//                         <div className={dotFilled2 ? "dot-ve" : "dot-ve-bg"}></div>
//                         <p className="verifyprogress-text">We're in Progress</p>
//                     </div>
//                     <div className="tube-ve">
//                         <div className={tube2 ? "tube-ve-fill" : ""}></div>
//                     </div>

//                     <div className="verifyprogress-content">
//                         <div className={dotFilled3 ? "dot-ve" : "dot-ve-bg"}></div>
//                         <p className="verifyprogress-text">Email Verified</p>
//                     </div>

//                     {verified ? (
//                         <button  onClick={navigateToLogin} className="verifyprogress_button">
//                             LOGIN
//                         </button>
//                     ) : (
//                         <button className="verify-disabled">
//                             LOGIN
//                         </button>
//                     )}
//                 </div>
//             </div>
//         </div>
//     )
// }

// export default Verifyemail;

const Verifyemail = () => {
    return (
        <>UNDER MAINTAINANCE</>
    )
}

export default Verifyemail;