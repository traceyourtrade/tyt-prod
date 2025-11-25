"use client";
import { useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";

import MasterCard from "@/images/Mastercard-Logo.png";

const Subscription = () => {
  const [isOn, setIsOn] = useState<boolean>(false);

  return (
    <div className="flex flex-row items-center justify-between w-[98%] h-[80vh]">
      <div className="w-[400px] h-[80vh] flex flex-col font-inter">
        <h2 className="mt-[20px] ml-[20px] text-white">SUBSCRIPTION</h2>

        <div className="ml-[20px] mt-[30px]">
          <h4 className="w-[100px] bg-[rgba(122,122,122,0.214)] text-center text-white rounded-[25px] px-[5px] py-[2px] text-[13px] cursor-pointer">
            Your Plan
          </h4>
          <div className="w-[300px] p-[10px] bg-[rgba(122,122,122,0.214)] rounded-[15px] mt-[20px] pb-[25px]">
            <p className="text-[13px] font-[550] mt-[5px]">
              <FontAwesomeIcon icon={faChevronRight} className="mx-[10px] text-[#777]" />
              TYT Premium (Rs. 1400 / Month)
            </p>
            <p className="text-[13px] font-[550] mt-[5px]">
              <FontAwesomeIcon icon={faChevronRight} className="mx-[10px] text-[#777]" />
              Your Plan expires on 04/02/2025
            </p>
            <p className="text-[13px] font-[550] mt-[5px]">
              <FontAwesomeIcon icon={faChevronRight} className="mx-[10px] text-[#777]" />
              Your Subscription has ended
            </p>
            <span className="mx-[10px] mt-[25px] bg-[rgba(215,170,248,0.622)] text-[13px] px-[10px] py-[5px] rounded-[25px] font-[550] relative top-[10px] cursor-pointer">
              Renew
            </span>
          </div>
        </div>

        <div className="ml-[20px] mt-[30px]">
          <h4 className="w-[130px] bg-[rgba(122,122,122,0.214)] text-center text-white rounded-[25px] px-[5px] py-[2px] text-[13px] cursor-pointer">
            Billing Details
          </h4>
          <div className="w-[400px] p-[10px] bg-[rgba(122,122,122,0.214)] rounded-[15px] mt-[20px] pb-[25px]">
            <h5 className="text-[16px] text-white mt-[10px] ml-[10px]">Payment Details</h5>
            <span className="text-[12px] text-[#1abbe4] float-right relative top-[-20px] left-[-10px] font-[550] cursor-pointer">
              Edit
            </span>
            <div className="mt-[10px] w-[80%] flex items-center ml-[10px]">
              <Image 
                src={MasterCard} 
                alt="masterCard" 
                width={50}
                height={30}
                className="w-[50px] h-auto"
              />
              <div className="ml-[10px]">
                <p className="text-[13px] font-[700]">
                  <em className="text-[16px] relative top-[-3px] tracking-[1px]">.... .... ....</em> 6969
                </p>
                <p className="text-[10px] font-[700] text-[#bebebe] relative top-[-7px]">
                  MasterCard - Expired 05/27
                </p>
              </div>
            </div>
            <span className="text-[12px] text-[#bebebe] ml-[10px]">
              Billed on the first of every month.
            </span>
            <br />
            <span className="text-[12px] text-[#bebebe] ml-[10px] relative top-[-5px]">
              Next billing on <strong>March 01, 2025</strong>
            </span>
          </div>
        </div>
      </div>
      
      <div className="w-1/2 h-[80vh] flex flex-col items-center">
        <div className="w-[320px] h-auto flex items-center justify-center mx-auto mt-[50px] mb-[30px] bg-white text-black rounded-[25px] py-[10px] shadow-[rgba(0,0,0,0.24)_0px_3px_8px]">
          <h5 className="font-[550] text-[16px] font-['SF_Pro_Display'] mx-[20px]">Pay Monthly</h5>
          <div 
            className={`w-[50px] h-[20px] bg-[#5325c3] rounded-[15px] flex items-center justify-start p-[3px] cursor-pointer transition-colors duration-300 ease-in-out ${
              isOn ? "on" : ""
            }`} 
            onClick={() => setIsOn(!isOn)}
          >
            <div className={`w-[15px] h-[15px] bg-yellow-400 rounded-full transition-transform duration-300 ease-in-out ${
              isOn ? "translate-x-[30px]" : ""
            }`} />
          </div>
          <h5 className="font-[550] text-[16px] font-['SF_Pro_Display'] mx-[20px]">Pay Yearly</h5>
        </div>

        <div className="w-full flex items-center justify-center">
          <div className="w-[600px] h-[400px] bg-white flex flex-row items-center justify-evenly rounded-[20px] relative bottom-[-70px] shadow-[rgba(0,0,0,0.24)_0px_3px_8px]">
            {isOn ? (
              <>
                <div className="w-[250px] h-[460px] bg-[#7e30e1] rounded-[25px] relative top-[-60px] font-['SF_Pro_Display'] flex flex-col items-start justify-evenly">
                  <h2 className="text-[1.5em] font-bold ml-[20px] mt-[5px]">Basic</h2>
                  <p className="text-[1.2em] ml-[20px] font-[500] text-[#e0d4fc]">
                    <span className="font-bold">₹ </span>
                    <span className="font-bold text-[1.4em] text-white">599</span>/month
                  </p>
                  <ul className="ml-[20px] list-none p-0">
                    {["Demo Text is here", "Demo Text is here", "Demo Text is here", "Demo Text is here", "Demo Text is here"].map((feature, index) => (
                      <li key={index} className="text-[0.9em] my-[5px] mb-[20px] font-[600]">
                        <FontAwesomeIcon icon={faChevronRight} /> {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="w-[170px] px-[20px] text-black py-[10px] border-none rounded-[25px] text-[1em] cursor-pointer bg-[#f4f4f4] font-bold transition-colors duration-300 mx-auto hover:bg-[#d1d1d1]">
                    SELECT
                  </button>
                  <hr className="w-[50%] h-[0.5px] rounded-[25px] mx-auto my-[2px] bg-[#777]" />
                </div>

                <div className="w-[250px] h-[460px] bg-[#7e30e1] text-white rounded-[25px] relative top-[-60px] font-['SF_Pro_Display'] flex flex-col items-start justify-evenly">
                  <h2 className="text-[1.5em] font-bold ml-[20px] mt-[5px] text-[#fee500]">Premium</h2>
                  <p className="text-[1.2em] ml-[20px] font-[500] text-[#e0d4fc]">
                    <span className="font-bold">₹ </span>
                    <span className="font-bold text-[1.4em] text-white">1199</span>/month
                  </p>
                  <ul className="ml-[20px] list-none p-0">
                    {["Demo Text is here", "Demo Text is here", "Demo Text is here", "Demo Text is here", "Demo Text is here"].map((feature, index) => (
                      <li key={index} className="text-[0.9em] my-[5px] mb-[20px] font-[600]">
                        <FontAwesomeIcon icon={faChevronRight} /> {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="w-[170px] px-[20px] text-black py-[10px] border-none rounded-[25px] text-[1em] cursor-pointer bg-[#f4f4f4] font-bold transition-colors duration-300 mx-auto hover:bg-[#d1d1d1]">
                    SELECT
                  </button>
                  <hr className="w-[50%] h-[0.5px] rounded-[25px] mx-auto my-[2px] bg-white" />
                </div>
              </>
            ) : (
              <>
                <div className="w-[250px] h-[460px] bg-[#7e30e1] rounded-[25px] relative top-[-60px] font-['SF_Pro_Display'] flex flex-col items-start justify-evenly">
                  <h2 className="text-[1.5em] font-bold ml-[20px] mt-[5px]">Basic</h2>
                  <p className="text-[1.2em] ml-[20px] font-[500] text-[#e0d4fc]">
                    <span className="font-bold">₹ </span>
                    <span className="font-bold text-[1.4em] text-white">699</span>/month
                  </p>
                  <ul className="ml-[20px] list-none p-0">
                    {["Demo Text is here", "Demo Text is here", "Demo Text is here", "Demo Text is here", "Demo Text is here"].map((feature, index) => (
                      <li key={index} className="text-[0.9em] my-[5px] mb-[20px] font-[600]">
                        <FontAwesomeIcon icon={faChevronRight} /> {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="w-[170px] px-[20px]  py-[10px] text-black border-none rounded-[25px] text-[1em] cursor-pointer bg-[#f4f4f4] font-bold transition-colors duration-300 mx-auto hover:bg-[#d1d1d1]">
                    SELECT
                  </button>
                  <hr className="w-[50%] h-[0.5px] rounded-[25px] mx-auto my-[2px] bg-[#777]" />
                </div>

                <div className="w-[250px] h-[460px] bg-[#7e30e1] text-white rounded-[25px] relative top-[-60px] font-['SF_Pro_Display'] flex flex-col items-start justify-evenly">
                  <h2 className="text-[1.5em] font-bold ml-[20px] mt-[5px] text-[#fee500]">Premium</h2>
                  <p className="text-[1.2em] ml-[20px] font-[500] text-[#e0d4fc]">
                    <span className="font-bold">₹ </span>
                    <span className="font-bold text-[1.4em] text-white">1299</span>/month
                  </p>
                  <ul className="ml-[20px] list-none p-0">
                    {["Demo Text is here", "Demo Text is here", "Demo Text is here", "Demo Text is here", "Demo Text is here"].map((feature, index) => (
                      <li key={index} className="text-[0.9em] my-[5px] mb-[20px] font-[600]">
                        <FontAwesomeIcon icon={faChevronRight} /> {feature}
                      </li>
                    ))}
                  </ul>
                  <button className="w-[170px] px-[20px] text-black py-[10px] border-none rounded-[25px] text-[1em] cursor-pointer bg-[#f4f4f4] font-bold transition-colors duration-300 mx-auto hover:bg-[#d1d1d1]">
                    SELECT
                  </button>
                  <hr className="w-[50%] h-[0.5px] rounded-[25px] mx-auto my-[2px] bg-white" />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;