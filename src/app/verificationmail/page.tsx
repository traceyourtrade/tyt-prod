"use client";
import { useState, useEffect } from "react";
import "./verifymail.css";

const VerifyEmailScreen = () => {
  const [status, setStatus] = useState(false);
  const [startAnimation, setStartAnimation] = useState(false);

  const loadingMessage = "Sending Verification Mail";

  useEffect(() => {
    const statusTimer = setTimeout(() => {
      setStatus(true);
      setStartAnimation(false);
    }, 1800);

    const animationTimer = setTimeout(() => {
      if (!status) setStartAnimation(true);
    }, 100);

    return () => {
      clearTimeout(statusTimer);
      clearTimeout(animationTimer);
    };
  }, []);

  const loadingCharacters = loadingMessage.split("").map((char, index) => (
    <span
      key={index}
      style={{ animationDelay: `${0.5 + index * 0.03}s` }}
    >
      {char === " " ? "\u00A0" : char}
    </span>
  ));

  return (
    <div className="w-screen min-h-screen grid place-content-center bg-[url('/images/loginbggradient.png')] bg-cover bg-center bg-no-repeat font-[SF_Pro_Display]">
      <div className="w-[90vw] max-w-[450px] min-h-[300px] pb-[30px] shadow-[rgba(50,50,93,0.25)_0px_13px_27px_-5px,rgba(0,0,0,0.3)_0px_8px_16px_-8px] flex flex-col items-center justify-start rounded-[25px] bg-white text-center">
        
        <img
          src="images/Logo.png"
          alt="Company Logo"
          width={100}
          height={100}
          className="mt-[25px] w-[100px] h-auto"
        />

        <h1 className="text-[28px] mt-[20px] mb-[10px] text-[#333]">Email Verification</h1>

        {status ? (
          <p className="fadein-txt px-[15px] text-[#817a7a] mb-[15px] text-[13px] font-medium max-w-[80%]">
            Kindly check your Inbox / Spam folder for the Verification Mail
          </p>
        ) : (
          <p className="px-[15px] text-[#817a7a] mb-[15px] text-[13px] font-medium max-w-[80%]">
            Your trades, your data, your edge — fully automated and optimized
          </p>
        )}

        {status ? (
          <div className="verifynotification success bg-[#803dca] flex items-center justify-between rounded-[50px] font-[SF_Pro_Display] text-[16px] mt-[15px] w-[300px] min-h-[70px] relative overflow-hidden">
            <p className="verify-msg fadein-txt text-white font-semibold ml-[20px] whitespace-nowrap">
              Verification Mail Sent
            </p>
            <div className="verifyicon-purple flex items-center justify-center bg-white w-[50px] h-[50px] rounded-full flex-shrink-0">
              <img
                src="images/checkmark.png"
                alt="Success"
                width={35}
                height={35}
                className="verifycheckmark fadein-txt object-contain"
              />
            </div>
          </div>
        ) : (
          <div
            className={`verifynotification loading ${
              startAnimation ? "animate" : ""
            } bg-[#525252] flex items-center rounded-[50px] font-[SF_Pro_Display] text-[16px] mt-[15px] w-[300px] min-h-[70px] relative overflow-hidden pl-[70px] pr-[10px] py-[10px] box-border`}
          >
            <div className="verifyicon flex items-center justify-center bg-white w-[50px] h-[50px] rounded-full absolute left-[10px] top-1/2 -translate-y-1/2 z-[2]">
              <img
                src="images/loader.gif"
                alt="Loading"
                width={30}
                height={30}
                className="verifyloader object-contain"
              />
            </div>
            <p className="verify-msg text-white font-semibold m-0 p-0 relative z-[1] inline-block whitespace-nowrap">
              {loadingCharacters}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailScreen;
