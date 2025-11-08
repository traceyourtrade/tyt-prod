"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Poppins } from "next/font/google";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGoogle, faApple } from "@fortawesome/free-brands-svg-icons";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function LoginPage() {


  const router = useRouter();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

  const postLoginDetails = async (e: FormEvent) => {
    e.preventDefault();
    const { email, password } = loginData;

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ this allows browser to store cookies from backend
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.status === 200) {
        router.push(`/welcome/${data.name}`);
      } else {
        if (data.error === "Invalid credentials") {
          setError("Invalid credentials, please recheck your Email & Password");
        } else if (data.error === "Enter all the details") {
          setError("Fill all the entries");
        } else {
          setError("Something went wrong. Please try again.");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Server error. Please try again later.");
    }
  };

  return (
    <div className={`flex min-h-screen w-full items-center justify-center bg-[#1e1e25] text-white overflow-hidden ${poppins.className}`} >
      {/* Background Overlay */}
      {/* <div className="absolute inset-0 z-0 opacity-30 bg-[url('/images/bg-pattern.png')] bg-repeat bg-center"></div>
      <div className="absolute inset-0 bg-[#2828287b] z-0"></div> */}

      <div className="w-[90%] max-w-[450px] border-[0.1px] border-[#464646] bg-[#09090963] shadow-2xl rounded-3xl flex flex-col items-center py-8 px-4 md:p-10">

        <Image
          width={100}
          height={100}
          src="/images/logoDarkFull.png"
          alt="Logo"
          className="w-55 md:w-56 mt-4 mb-6"
        />

        <h1 className="text-2xl font-medium">Welcome back</h1>
        <p className="text-gray-400 text-sm mt-2 mb-4">
          Login to your trading journal.
        </p>

        <form
          onSubmit={postLoginDetails}
          className="w-full flex flex-col items-center gap-4 mt-5"
        >
          <input
            type="text"
            name="email"
            placeholder="Email or Phone"
            value={loginData.email}
            onChange={handleInputChange}
            autoComplete={"off"}
            className="w-[95%] rounded-xl bg-[#191D24] text-white px-4 py-3 outline-none text-sm border-[0.1px] border-[#464646] "
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={loginData.password}
            onChange={handleInputChange}
            autoComplete={"off"}
            className="w-[95%] rounded-xl bg-[#191D24] text-white px-4 py-3 outline-none text-sm border-[0.1px] border-[#464646]"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-[95%] bg-[#DDDDDD] text-[#111] font-medium py-2 rounded-xl mt-2 hover:bg-white transition cursor-pointer"
          >
            Log In
          </button>

          <div className="w-11/12 flex justify-between text-xs mt-4 text-[#94A3B8]">
            <Link href="/forgotpassword" className="text-[#00E6B0]">
              Forgot Password?
            </Link>
            <Link href="/signup" className="text-[#94A3B8]">
              New to TYT? Create account
            </Link>
          </div>
        </form>

        <button
          className="w-11/12 flex items-center justify-center bg-black text-[#94A3B8] border border-[#F8FAFC1A] rounded-xl py-2 hover:bg-[#111] transition mt-10 cursor-pointer"
        >
           <FontAwesomeIcon icon={faGoogle} className="mr-2 relative top-[-1px]" />
          <span className=" text-sm" >Continue with Google</span>
        </button>

        <button
          className="w-11/12 flex items-center justify-center bg-black text-[#94A3B8] border border-[#F8FAFC1A] rounded-xl py-2 mt-3 hover:bg-[#111] transition mb-10 cursor-pointer"
        >
          <FontAwesomeIcon icon={faApple} className="mr-2 relative top-[-1px]" />
          <span className=" text-sm" >Continue with Apple</span>
        </button>

      </div>

    </div>
  );
}
