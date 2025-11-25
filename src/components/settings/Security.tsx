"use client";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faEnvelope } from "@fortawesome/free-solid-svg-icons";

const Security = () => {
  const [showCurr, setShowCurr] = useState<boolean>(false);
  const [showNew, setShowNew] = useState<boolean>(false);
  const [showRe, setShowRe] = useState<boolean>(false);

  return (
    <div className="flex flex-row items-center justify-between w-[98%] h-[80vh]">
      <div className="w-1/2 h-[80vh]">
        <h2 className="ml-[5%] mt-[20px] text-white">PASSWORD & SECURITY</h2>
        <h5 className="inline ml-[5%] text-white bg-[rgba(122,122,122,0.214)] px-[10px] py-[5px] rounded-[25px] relative top-[50px] text-[12px]">CHANGE PASSWORD</h5>
        
        <div className="w-[90%] ml-[5%] h-auto bg-[rgba(122,122,122,0.214)] relative top-[70px] rounded-[25px] p-[10px] flex flex-col items-center pb-[20px]">
          <div className="w-[90%] flex flex-col my-[10px]">
            <label className="text-[12px] text-white font-[550] ml-[10px]">Current Password</label>
            <div className="w-full flex flex-row mt-[5px]">
              <input 
                type={showCurr ? "text" : "password"} 
                className="w-full h-auto text-[14px] px-[10px] py-[5px] rounded-[25px] bg-[#b6b6b657] text-white outline-none border-none"
              />
              <FontAwesomeIcon 
                icon={showCurr ? faEyeSlash : faEye} 
                onClick={() => setShowCurr(!showCurr)}
                className="relative cursor-pointer left-[-30px] top-[5px]"
              />
            </div>
          </div>
          
          <hr className="w-[90%] h-[1px] bg-[#ededed] border-none rounded-[25px] mx-auto my-[20px]" />
          
          <div className="w-[90%] flex flex-col my-[10px]">
            <label className="text-[12px] text-white font-[550] ml-[10px]">New Password</label>
            <div className="w-full flex flex-row mt-[5px]">
              <input 
                type={showNew ? "text" : "password"} 
                className="w-full h-auto text-[14px] px-[10px] py-[5px] rounded-[25px] bg-[#b6b6b657] text-white outline-none border-none"
              />
              <FontAwesomeIcon 
                icon={showNew ? faEyeSlash : faEye} 
                onClick={() => setShowNew(!showNew)}
                className="relative cursor-pointer left-[-30px] top-[5px]"
              />
            </div>
          </div>
          
          <div className="w-[90%] flex flex-col my-[10px]">
            <label className="text-[12px] text-white font-[550] ml-[10px]">Re-enter New Password</label>
            <div className="w-full flex flex-row mt-[5px]">
              <input 
                type={showRe ? "text" : "password"} 
                className="w-full h-auto text-[14px] px-[10px] py-[5px] rounded-[25px] bg-[#b6b6b657] text-white outline-none border-none"
              />
              <FontAwesomeIcon 
                icon={showRe ? faEyeSlash : faEye} 
                onClick={() => setShowRe(!showRe)}
                className="relative cursor-pointer left-[-30px] top-[5px]"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="w-1/2 h-[80vh]">
        <h5 className="inline ml-[5%] text-white bg-[rgba(122,122,122,0.214)] px-[10px] py-[5px] rounded-[25px] relative top-[105px] z-[2] text-[12px]">FORGOT PASSWORD</h5>
        
        <div className="w-[85%] ml-[5%] h-auto bg-[rgba(122,122,122,0.214)] relative top-[125px] rounded-[25px] p-[10px] flex flex-col items-center pb-[20px]">
          <p className="w-[90%] text-[13px] font-[550] text-left text-white mt-[10px]">
            Please enter your registered email ID, and we will send you a password reset link.
          </p>
          <p className="w-[90%] text-[13px] font-[550] text-left text-white mt-[10px]">
            Follow the instructions in the email to reset your password.
          </p>
          <div className="w-full flex items-center justify-center mt-[20px] mb-[20px]">
            <input 
              placeholder="Enter your Email Address" 
              className="w-[85%] h-auto text-[12px] p-[10px] rounded-[25px] bg-[#b6b6b657] outline-none border-none font-[550] text-white"
            />
            <FontAwesomeIcon icon={faEnvelope} className="relative left-[-35px]" />
          </div>
          <button className="text-[12px] px-[10px] py-[5px] rounded-[25px] bg-[#555] border-none text-white font-[550] cursor-pointer mx-auto my-[5px]">
            SEND RESET LINK
          </button>
        </div>
      </div>
    </div>
  );
};

export default Security;
