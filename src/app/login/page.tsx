"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import Cookies from "js-cookie";
import { useGoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { useDataStore } from "@/store/store";

export default function LoginPage() {
  const router = useRouter();
  const { bkurl } = useDataStore();

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData({ ...loginData, [name]: value });
  };

//   const logInWithGoogle = useGoogleLogin({
//     flow: "auth-code",
//     ux_mode: "redirect",
//     redirect_uri: "https://console.traceyourtrade.com/auth/google/callback",
//   });

  const postLoginDetails = async (e: FormEvent) => {
    e.preventDefault();
    const { email, password } = loginData;

    try {
      const res = await fetch(`${bkurl}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.status === 200) {
        Cookies.set("Trace Your Trades", data.message, {
          expires: 5,
          domain: ".traceyourtrade.com",
          path: "/",
        });

        router.push(`/welcome/${data.name}/${data.id}`);
      } else {
        if (data.error === "Invalid credentials") {
          setError("Invalid credentials, please recheck your Email & Password");
        } else if (data.error === "Enter all the details") {
          setError("Fill all the entries");
        }
      }
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-[#1A1A1A] text-white overflow-hidden">
      {/* Background Overlay */}
      <div className="absolute inset-0 z-0 opacity-30 bg-[url('/images/bg-pattern.png')] bg-repeat bg-center"></div>
      <div className="absolute inset-0 bg-[#2828287b] z-0"></div>

      <div className="relative z-10 flex w-full max-w-[1450px] flex-col md:flex-row items-center justify-center gap-10 px-6">
        {/* Left Section */}
        <div className="w-full md:w-2/3 space-y-8 p-4">
          <h3 className="text-4xl md:text-6xl font-bold ml-4">
            Let’s <span className="text-[#FFA734]">Signup</span>
          </h3>

          <div className="bg-[#1A1A1A] rounded-2xl p-8 md:p-12 text-white">
            <p className="w-fit px-4 py-1 text-sm text-orange-400 bg-[#388cfa24] border border-[#388cfa] rounded-full">
              ✨ Advanced Trade Analytics Platform
            </p>

            <h1 className="mt-6 text-3xl md:text-5xl font-semibold leading-tight">
              Data doesn’t lie — and neither will your{" "}
              <span className="text-[#FFAC5E]">trading journal</span>. Let’s get
              started.
            </h1>

            <p className="mt-6 text-gray-400 text-base md:text-lg w-full md:w-2/3">
              The most advanced trade journaling and performance analytics
              platform designed for serious traders. Auto-sync your trades,
              analyze your performance, and accelerate your growth.
            </p>

            <div className="flex justify-between mt-8 border-t border-gray-700 pt-6 flex-wrap gap-4">
              <div className="flex flex-col items-center">
                <h2 className="text-orange-400 text-2xl md:text-3xl font-semibold">
                  50K+
                </h2>
                <span className="text-gray-400 text-sm">Active Traders</span>
              </div>
              <div className="flex flex-col items-center">
                <h2 className="text-green-500 text-2xl md:text-3xl font-semibold">
                  98.2%
                </h2>
                <span className="text-gray-400 text-sm">Accuracy Rate</span>
              </div>
              <div className="flex flex-col items-center">
                <h2 className="text-orange-400 text-2xl md:text-3xl font-semibold">
                  $2.4B+
                </h2>
                <span className="text-gray-400 text-sm">Trades Analysed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="w-full md:w-1/3 bg-gradient-to-br from-[#17191d9f] to-[#1e212492] backdrop-blur-md shadow-2xl rounded-2xl flex flex-col items-center p-8 md:p-10">
          <img
            src="/images/logoDark.png"
            alt="Logo"
            className="w-40 md:w-56 mt-4 mb-6"
          />

          <h1 className="text-2xl font-medium">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-2 mb-4">
            Login to your trading journal.
          </p>

          <form
            onSubmit={postLoginDetails}
            className="w-full flex flex-col items-center gap-4"
          >
            <input
              type="text"
              name="email"
              placeholder="Email or Phone"
              value={loginData.email}
              onChange={handleInputChange}
              required
              className="w-11/12 rounded-xl bg-[#191D24] text-white px-4 py-3 outline-none text-sm"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={loginData.password}
              onChange={handleInputChange}
              required
              className="w-11/12 rounded-xl bg-[#191D24] text-white px-4 py-3 outline-none text-sm"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-11/12 bg-[#DDDDDD] text-[#111] font-medium py-3 rounded-xl mt-2 hover:bg-white transition"
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
            // onClick={() => logInWithGoogle()}
            className="w-11/12 flex items-center justify-center bg-black text-[#94A3B8] border border-[#F8FAFC1A] rounded-xl py-2 mt-6 hover:bg-[#111] transition"
          >
            <i className="fa-brands fa-google mr-2"></i>
            <span>Sign in with Google</span>
          </button>

          <button
            // onClick={() => logInWithGoogle()}
            className="w-11/12 flex items-center justify-center bg-black text-[#94A3B8] border border-[#F8FAFC1A] rounded-xl py-2 mt-3 hover:bg-[#111] transition"
          >
            <i className="fa-brands fa-apple mr-2"></i>
            <span>Sign in with Apple</span>
          </button>

          <div className="w-2/3 mt-4">
            <img src="/images/purple-bar.png" alt="Bar" className="w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
