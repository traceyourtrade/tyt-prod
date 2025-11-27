"use client";

import React, { useState, ChangeEvent, MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useGoogleLogin } from "@react-oauth/google";

// import Logo from "images/Logo.png";
// import GoogleLogo from "images/googlelogo.png";
// import PurpleBar from "images/purple-bar.png";

// zustand store
import {useDataStore as store} from "@/store/store";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

type CountryCode = { country: string; code: string };

type SignUpData = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  cpassword: string;
};

const SignUp: React.FC = () => {

  const countryPhoneCodes: CountryCode[] = [
    { country: "Afghanistan", code: "+93" },
    { country: "Albania", code: "+355" },
    { country: "Algeria", code: "+213" },
    { country: "Andorra", code: "+376" },
    { country: "Angola", code: "+244" },
    { country: "Argentina", code: "+54" },
    { country: "Armenia", code: "+374" },
    { country: "Australia", code: "+61" },
    { country: "Austria", code: "+43" },
    { country: "Azerbaijan", code: "+994" },
    { country: "Bahamas", code: "+1-242" },
    { country: "Bahrain", code: "+973" },
    { country: "Bangladesh", code: "+880" },
    { country: "Barbados", code: "+1-246" },
    { country: "Belarus", code: "+375" },
    { country: "Belgium", code: "+32" },
    { country: "Belize", code: "+501" },
    { country: "Benin", code: "+229" },
    { country: "Bhutan", code: "+975" },
    { country: "Bolivia", code: "+591" },
    { country: "Bosnia and Herzegovina", code: "+387" },
    { country: "Botswana", code: "+267" },
    { country: "Brazil", code: "+55" },
    { country: "Brunei", code: "+673" },
    { country: "Bulgaria", code: "+359" },
    { country: "Burkina Faso", code: "+226" },
    { country: "Burundi", code: "+257" },
    { country: "Cambodia", code: "+855" },
    { country: "Cameroon", code: "+237" },
    { country: "Canada", code: "+1" },
    { country: "Cape Verde", code: "+238" },
    { country: "Central African Republic", code: "+236" },
    { country: "Chad", code: "+235" },
    { country: "Chile", code: "+56" },
    { country: "China", code: "+86" },
    { country: "Colombia", code: "+57" },
    { country: "Comoros", code: "+269" },
    { country: "Congo (DRC)", code: "+243" },
    { country: "Congo (Republic)", code: "+242" },
    { country: "Costa Rica", code: "+506" },
    { country: "Croatia", code: "+385" },
    { country: "Cuba", code: "+53" },
    { country: "Cyprus", code: "+357" },
    { country: "Czech Republic", code: "+420" },
    { country: "Denmark", code: "+45" },
    { country: "Djibouti", code: "+253" },
    { country: "Dominica", code: "+1-767" },
    { country: "Dominican Republic", code: "+1-809, +1-829, +1-849" },
    { country: "Ecuador", code: "+593" },
    { country: "Egypt", code: "+20" },
    { country: "El Salvador", code: "+503" },
    { country: "Equatorial Guinea", code: "+240" },
    { country: "Eritrea", code: "+291" },
    { country: "Estonia", code: "+372" },
    { country: "Eswatini", code: "+268" },
    { country: "Ethiopia", code: "+251" },
    { country: "Fiji", code: "+679" },
    { country: "Finland", code: "+358" },
    { country: "France", code: "+33" },
    { country: "Gabon", code: "+241" },
    { country: "Gambia", code: "+220" },
    { country: "Georgia", code: "+995" },
    { country: "Germany", code: "+49" },
    { country: "Ghana", code: "+233" },
    { country: "Greece", code: "+30" },
    { country: "Grenada", code: "+1-473" },
    { country: "Guatemala", code: "+502" },
    { country: "Guinea", code: "+224" },
    { country: "Guinea-Bissau", code: "+245" },
    { country: "Guyana", code: "+592" },
    { country: "Haiti", code: "+509" },
    { country: "Honduras", code: "+504" },
    { country: "Hungary", code: "+36" },
    { country: "Iceland", code: "+354" },
    { country: "India", code: "+91" },
    { country: "Indonesia", code: "+62" },
    { country: "Iran", code: "+98" },
    { country: "Iraq", code: "+964" },
    { country: "Ireland", code: "+353" },
    { country: "Israel", code: "+972" },
    { country: "Italy", code: "+39" },
    { country: "Jamaica", code: "+1-876" },
    { country: "Japan", code: "+81" },
    { country: "Jordan", code: "+962" },
    { country: "Kazakhstan", code: "+7" },
    { country: "Kenya", code: "+254" },
    { country: "Kiribati", code: "+686" },
    { country: "Korea (North)", code: "+850" },
    { country: "Korea (South)", code: "+82" },
    { country: "Kuwait", code: "+965" },
    { country: "Kyrgyzstan", code: "+996" },
    { country: "Laos", code: "+856" },
    { country: "Latvia", code: "+371" },
    { country: "Lebanon", code: "+961" },
    { country: "Lesotho", code: "+266" },
    { country: "Liberia", code: "+231" },
    { country: "Libya", code: "+218" },
    { country: "Liechtenstein", code: "+423" },
    { country: "Lithuania", code: "+370" },
    { country: "Luxembourg", code: "+352" },
    { country: "Madagascar", code: "+261" },
    { country: "Malawi", code: "+265" },
    { country: "Malaysia", code: "+60" },
    { country: "Maldives", code: "+960" },
    { country: "Mali", code: "+223" },
    { country: "Malta", code: "+356" },
    { country: "Marshall Islands", code: "+692" },
    { country: "Mauritania", code: "+222" },
    { country: "Mauritius", code: "+230" },
    { country: "Mexico", code: "+52" },
    { country: "Micronesia", code: "+691" },
    { country: "Moldova", code: "+373" },
    { country: "Monaco", code: "+377" },
    { country: "Mongolia", code: "+976" },
    { country: "Montenegro", code: "+382" },
    { country: "Morocco", code: "+212" },
    { country: "Mozambique", code: "+258" },
    { country: "Myanmar", code: "+95" },
    { country: "Namibia", code: "+264" },
    { country: "Nauru", code: "+674" },
    { country: "Nepal", code: "+977" },
    { country: "Netherlands", code: "+31" },
    { country: "New Zealand", code: "+64" },
    { country: "Nicaragua", code: "+505" },
    { country: "Niger", code: "+227" },
    { country: "Nigeria", code: "+234" },
    { country: "North Macedonia", code: "+389" },
    { country: "Norway", code: "+47" },
    { country: "Oman", code: "+968" },
    { country: "Pakistan", code: "+92" },
    { country: "Palau", code: "+680" },
    { country: "Panama", code: "+507" },
    { country: "Papua New Guinea", code: "+675" },
    { country: "Paraguay", code: "+595" },
    { country: "Peru", code: "+51" },
    { country: "Philippines", code: "+63" },
    { country: "Poland", code: "+48" },
    { country: "Portugal", code: "+351" },
    { country: "Qatar", code: "+974" },
    { country: "Romania", code: "+40" },
    { country: "Russia", code: "+7" },
    { country: "Rwanda", code: "+250" },
    { country: "Saint Kitts and Nevis", code: "+1-869" },
    { country: "Saint Lucia", code: "+1-758" },
    { country: "Saint Vincent and the Grenadines", code: "+1-784" },
    { country: "Samoa", code: "+685" },
    { country: "San Marino", code: "+378" },
    { country: "Sao Tome and Principe", code: "+239" },
    { country: "Saudi Arabia", code: "+966" },
    { country: "Senegal", code: "+221" },
    { country: "Serbia", code: "+381" },
    { country: "Seychelles", code: "+248" },
    { country: "Sierra Leone", code: "+232" },
    { country: "Singapore", code: "+65" },
    { country: "Slovakia", code: "+421" },
    { country: "Slovenia", code: "+386" },
    { country: "Solomon Islands", code: "+677" },
    { country: "Somalia", code: "+252" },
    { country: "South Africa", code: "+27" },
    { country: "South Sudan", code: "+211" },
    { country: "Spain", code: "+34" },
    { country: "Sri Lanka", code: "+94" },
    { country: "Sudan", code: "+249" },
    { country: "Suriname", code: "+597" },
    { country: "Sweden", code: "+46" },
    { country: "Switzerland", code: "+41" },
    { country: "Syria", code: "+963" },
    { country: "Taiwan", code: "+886" },
    { country: "Tajikistan", code: "+992" },
    { country: "Tanzania", code: "+255" },
    { country: "Thailand", code: "+66" },
    { country: "Timor-Leste", code: "+670" },
    { country: "Togo", code: "+228" },
    { country: "Tonga", code: "+676" },
    { country: "Trinidad and Tobago", code: "+1-868" },
    { country: "Tunisia", code: "+216" },
    { country: "Turkey", code: "+90" },
    { country: "Turkmenistan", code: "+993" },
    { country: "Tuvalu", code: "+688" },
    { country: "Uganda", code: "+256" },
    { country: "Ukraine", code: "+380" },
    { country: "United Arab Emirates", code: "+971" },
    { country: "United Kingdom", code: "+44" },
    { country: "United States", code: "+1" },
    { country: "Uruguay", code: "+598" },
    { country: "Uzbekistan", code: "+998" },
    { country: "Vanuatu", code: "+678" },
    { country: "Vatican City", code: "+379" },
    { country: "Venezuela", code: "+58" },
    { country: "Vietnam", code: "+84" },
    { country: "Yemen", code: "+967" },
    { country: "Zambia", code: "+260" },
    { country: "Zimbabwe", code: "+263" },
  ];

  const [selectedCode, setSelectedCode] = useState<CountryCode>({
    code: "+91",
    country: "India",
  });
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = countryPhoneCodes
    .filter(
      (c) =>
        c.country.toLowerCase().includes(search.toLowerCase()) ||
        c.code.includes(search)
    )
    .filter((c) => c.code !== selectedCode.code);

  const handleSelect = (country: CountryCode) => {
    setSelectedCode(country);
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen((s) => !s);
  };

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const [signUpData, setSignUpData] = useState<SignUpData>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    cpassword: "",
  });

  const router = useRouter();
  const [error, setError] = useState<string>(" ");
  const [showPassword, setShowPassword] = useState(false);
  const [showConPassword, setShowConPassword] = useState(false);

  const setLoginVal = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignUpData((prev) => ({ ...prev, [name]: value }));
  };

  const signUpWithGoogle = useGoogleLogin({
    flow: "auth-code",
    ux_mode: "redirect",
    redirect_uri: "https://app.projournx.com/auth/google/callback",
  });

  const postSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const { email, fullName, phone, password, cpassword } = signUpData;

    try {
      const res = await fetch(`/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          fullName,
          phone,
          password,
          cpassword,
          countryCode: selectedCode.code,
          country: selectedCode.country,
        }),
      });

      const data = await res.json();

      if (res.status === 200) {
        Cookies.set("Trace Your Trades", data.message, {
          expires: 5,
          domain: ".traceyourtrade.com",
          path: "/",
        });

        router.push(`/verificationmail`);
      } else {
        if (data.error === "Invalid credentials") {
          setError("Invalid credentials, please recheck the Email & Password");
        } else if (data.error === "Enter all the details") {
          setError("Fill all the entries");
        } else {
          setError(data.error || "Signup failed");
        }
      }
    } catch (err) {
      // keep silent like original; you may log if needed
      // console.error(err);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[rgba(40,40,40,0.48)] absolute inset-0 flex items-center justify-center">
      <div className="w-[30%] h-[90vh] rounded-[25px] flex flex-col items-center justify-start
                      p-6
                      bg-gradient-to-br from-[rgba(23,25,29,0.622)] to-[rgba(30,33,36,0.474)]
                      shadow-[0_30px_60px_-30px_rgba(0,0,0,0.3),0_20px_30px_-10px_rgba(38,57,77,1)]
                      font-sans"
      >
        {/* Logo + Title */}
        <div className="w-full flex items-center justify-center relative -left-4 mt-2">
          <div className="flex items-center gap-3">
            <div className="w-20 h-auto">
              <Image src="/images/Logo.png"
                width={100}
                height={100}
                alt="Logo"
                data-aos="fade-up"
                data-aos-duration="1000" />
            </div>
            <h1 className="text-[25px] text-white/95 font-medium">Sign Up</h1>
          </div>
        </div>

        <p className="text-xs text-slate-400 mt-5 text-center">
          Your trades, your data, your edge -fully automated and optimized
        </p>

        {/* Google Sign-in */}
        <button
          type="button"
          onClick={() => signUpWithGoogle()}
          className="w-[90%] mt-5 px-3 py-2 rounded-[12px] bg-[#111] border border-[rgba(248,250,252,0.1)] text-slate-400
          cursor-pointer
                     flex items-center justify-center gap-3"
        >
          <div className="w-5 h-5 relative">
            <Image src="/images/googlelogo.png"
                width={100}
                height={100} alt="Google"  sizes="20px" style={{ objectFit: "contain" }} />
          </div>
          <span className="font-medium text-[13px]">Sign in with Google</span>
        </button>

        {/* Purple bar image */}
        <div className="w-[60%] mt-4">
          <Image
           src="/images/purple-bar.png"
                width={100}
                height={100} alt="purple" />
        </div>

        {/* Form */}
        <form className="w-full flex flex-col items-center mt-4" onSubmit={postSignUp}>
          <input
            required
            autoComplete="off"
            name="fullName"
            value={signUpData.fullName}
            onChange={setLoginVal}
            placeholder="Full Name"
            className="w-[85%] mb-5 px-3 py-2 rounded-[12px] bg-[#191D24] text-white outline-none border-none"
            type="text"
          />

          <input
            required
            autoComplete="off"
            name="email"
            value={signUpData.email}
            onChange={setLoginVal}
            placeholder="Email"
            className="w-[85%] mb-5 px-3 py-2 rounded-[12px] bg-[#191D24] text-white outline-none border-none"
            type="text"
          />

          {/* Phone row */}
          <div className="w-[90%] flex items-center justify-between mb-5">
            {/* Dropdown container */}
            <div
              className="relative"
              onMouseEnter={() => setIsOpen(true)}
              onMouseLeave={() => setIsOpen(false)}
            >
              <div
                className="w-[70px] flex items-center justify-evenly cursor-pointer text-[13px] font-medium px-2 py-2 rounded-[25px] bg-[#ededed] text-[#777]"
                onClick={toggleDropdown}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
              >
                <span>{selectedCode.code}</span>
                <i className="fa fa-chevron-down" />
              </div>

              {isOpen && (
                <div className="absolute z-20 mt-2 left-[-50px] w-[150px] bg-white rounded-[12px] shadow-md p-3">
                  <input
                    type="text"
                    placeholder="Search Country"
                    value={search}
                    onChange={handleSearchChange}
                    className="w-full px-2 py-2 rounded-md text-sm mb-2 border border-transparent focus:border-slate-200"
                  />

                  <div className="max-h-[150px] overflow-y-auto">
                    <div className="py-1 px-1">
                      <div className="text-[13px] text-[#9d83dd] py-1">
                        <span className="font-medium">
                          {selectedCode.code} {selectedCode.country}
                        </span>
                      </div>

                      {filteredOptions.map((country, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelect(country)}
                          className="py-1 px-1 cursor-pointer text-[13px] text-slate-600 hover:bg-slate-100 rounded"
                        >
                          <span className="font-medium">{country.code} {country.country}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <input
              required
              autoComplete="off"
              name="phone"
              value={signUpData.phone}
              onChange={setLoginVal}
              placeholder="Phone Number"
              className="w-[75%] px-3 py-2 rounded-[12px] bg-[#191D24] text-white outline-none border-none"
              type="number"
            />
          </div>

          {/* <input
            required
            autoComplete="off"
            name="password"
            value={signUpData.password}
            onChange={setLoginVal}
            placeholder="Password"
            className="w-[85%] mb-5 px-3 py-2 rounded-[12px] bg-[#191D24] text-white outline-none border-none"
            type="password"
          /> */}

         <div className="w-[85%] relative mb-5">
  <input
    type={showPassword ? "text" : "password"}
    name="password"
    required
    placeholder="Password"
    value={signUpData.password}
    onChange={setLoginVal}
    autoComplete="off"
    className="w-full rounded-xl bg-[#191D24] text-white px-4 py-3 outline-none text-sm "
  />

  <FontAwesomeIcon
    icon={showPassword ? faEyeSlash : faEye}
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
  />
</div>

         <div className="w-[85%] relative">
          <input
            required
            autoComplete="off"
            name="cpassword"
            value={signUpData.cpassword}
            onChange={setLoginVal}
            placeholder="Confirm your Password"
            className="w-full px-3 py-2 rounded-[12px] bg-[#191D24] text-white outline-none border-none"
            type="password"
          />
            <FontAwesomeIcon
    icon={showConPassword ? faEyeSlash : faEye}
    onClick={() => setShowConPassword(!showConPassword)}
    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer"
  />
          </div>

          <p className="text-red-600 relative top-3 font-sans">{error}</p>

          <button
            type="submit"
            className="w-[90%] mt-5 px-4 py-2 rounded-[12px] bg-[#DDDDDD] text-[#111] font-medium"
          >
            Sign Up
          </button>
        </form>

        <p className="mt-5 text-sm text-slate-300">
          Already have an account?{" "}
          <Link href="/login" className="text-sky-600 underline">
            Log In
          </Link>
        </p>

        <p className="mt-12 text-xs text-slate-400">
          Charts are powered by{" "}
          <a
            className="text-[rgb(52,117,171)] no-underline"
            href="https://www.tradingview.com/"
            target="_blank"
            rel="noreferrer"
          >
            TradingView
          </a>
        </p>
      </div>
    </div>
  );
};

export default SignUp;
