// GoogleSignup.tsx
'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import axios from "axios";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

// Assuming these images are in your public folder or you'll handle them differently in Next.js
// import Logo from "../../../images/Logo.png";
// import PurpleBar from "../../../images/purple-bar.png";

// stores - you'll need to adapt this for Next.js
// import store from "../../dashboard/Store/store";

// Define types
interface CountryPhoneCode {
  country: string;
  code: string;
}

interface SignUpData {
  fullName: string;
  phone: string;
  password: string;
  cpassword: string;
}

const GoogleSignUp = () => {
  // Country code selection
  const [show, setShow] = useState(false);

  const countryPhoneCodes: CountryPhoneCode[] = [
    { country: "Afghanistan", code: "+93" },
    { country: "Albania", code: "+355" },
    // ... (rest of the country codes remain the same)
    { country: "Zimbabwe", code: "+263" },
  ];

  const [selectedCode, setSelectedCode] = useState<CountryPhoneCode>({ code: "+91", country: "India" });
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filter out the selected country from the available options
  const filteredOptions = countryPhoneCodes.filter(country =>
    country.country.toLowerCase().includes(search.toLowerCase()) || country.code.includes(search)
  ).filter(country => country.code !== selectedCode.code); // Exclude the selected code

  // Handle the selection of a country
  const handleSelect = (country: CountryPhoneCode) => {
    setSelectedCode(country);
    setIsOpen(false); // Close the dropdown after selection
  };

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsOpen(prevState => !prevState);
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
  };

  // Sign up data 
  const [signUpData, setSignUpData] = useState<SignUpData>({
    fullName: "",
    phone: "",
    password: "",
    cpassword: "",
  });

  const [email, setEmail] = useState("Email");
  const [fName, setFname] = useState("");

  const router = useRouter();
  const [error, setError] = useState(" ");

  const setLoginVal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignUpData({ ...signUpData, [name]: value });
  }

  const postSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const { phone, password, cpassword } = signUpData;

    try {
      const res = await fetch(`/api/registerggl`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email, fullName: fName, phone, password, cpassword, countryCode: selectedCode.code, country: selectedCode.country
        })
      });

      const data = await res.json();

      if (res.status === 200) {
        alert(`got message ${data.message}`);
        // Cookies.set('Trace Your Trades', data.message, {
        //   expires: 5,
        //   domain: '.traceyourtrade.com',
        //   path: '/'
        // });

        router.push(`/welcome/${data.name}`);
      } else {
        if (data.error === "Invalid credentials") {
          setError("Invalid credentials, please recheck the Email & Password")
        } else if (data.error === "Enter all the details") {
          setError("Fill all the entries")
        } else if (data.error === "email already registered") {
          setError("Email already registered... please login")
        } else if (data.error === "Passwords doesnt match") {
          setError("Passwords doesn't match, kindly recheck")
        }
      }
    } catch (error) {
      console.error("Signup error:", error);
    }
  }

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (!code) {
      return;
    }

    // Remove code from URL to prevent duplicate requests
    const cleanUrl = window.location.pathname + window.location.hash;
    window.history.replaceState({}, document.title, cleanUrl);

    axios.post(`/api/registerggl-getmail`,
      { code },
      {
        headers: { 'Content-Type': 'application/json' }
      }
    )
      .then(response => {
        if (response.data.msg === "unregistered user") {
          setEmail(response.data.email)
          setFname(response.data.name)
          setShow(true)
          Cookies.set('google_token', response.data.access_token, { secure: true, sameSite: 'strict' });
        } else if (response.data.msg === "registered user") {
       
          router.push(`/welcome/${response.data.name}`);
        }
      })
      .catch(err => {
        if (!axios.isCancel(err)) {
          console.error('Authentication failed:', err);
        }
      });
  }, [router]);

  return (
    <>
      {show ? (
        <div className="min-h-screen w-full flex items-center justify-center bg-white">
          <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 relative" style={{ height: "400px" }}>
            <div className="flex justify-center mb-4">
              {/* Replace with your Logo component or image */}
              {/* <img className="h-12" src={Logo} alt="Logo" /> */}
              <div className="h-12 w-12 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-bold">TYT</span>
              </div>
            </div>

            <p className="text-center text-lg font-semibold text-gray-800 mb-4">Complete Signing-Up</p>

            <div className="flex justify-center mb-6">
              {/* Replace with your PurpleBar component or image */}
              {/* <img src={PurpleBar} alt="" className="h-1 w-20" /> */}
              <div className="h-1 w-20 bg-purple-600 rounded"></div>
            </div>

            <form className="space-y-4">
              <div className="flex space-x-2">
                <div 
                  className="relative w-1/3"
                  onMouseEnter={toggleDropdown}
                  onMouseLeave={toggleDropdown}
                >
                  <div className="w-full p-2 border border-gray-300 rounded-lg bg-gray-800 text-white flex justify-between items-center cursor-pointer">
                    <span>{selectedCode.code}</span>
                    <FontAwesomeIcon icon={faChevronDown} className="text-sm" />
                  </div>

                  {isOpen && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                      <input
                        type="text"
                        placeholder="Search Country"
                        className="w-full p-2 border-b border-gray-300 focus:outline-none"
                        value={search}
                        onChange={handleSearchChange}
                      />
                      <div className="max-h-60 overflow-y-auto">
                        <div className="p-2 bg-gray-100 text-gray-800">
                          <span className="text-sm font-medium">{selectedCode.code} {selectedCode.country}</span>
                        </div>
                        {filteredOptions.map((country, index) => (
                          <div
                            key={index}
                            className="p-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => handleSelect(country)}
                          >
                            <span className="text-sm">{country.code} {country.country}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <input
                  className="w-2/3 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                  autoComplete="off"
                  type="number"
                  name="phone"
                  placeholder="Phone Number"
                  value={signUpData.phone}
                  onChange={setLoginVal}
                />
              </div>

              <input
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
                autoComplete="off"
                type="password"
                name="password"
                placeholder="Password"
                value={signUpData.password}
                onChange={setLoginVal}
              />
              
              <input
                className="w-full p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
                autoComplete="off"
                type="password"
                name="cpassword"
                placeholder="Confirm your Password"
                value={signUpData.cpassword}
                onChange={setLoginVal}
              />
              
              <p className="text-red-500 text-sm text-center">{error}</p>
              
              <button
                className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition duration-200"
                type="submit"
                onClick={postSignUp}
              >
                Sign Up
              </button>
            </form>
          </div>
        </div>
      ) : (
        <Authenticating />
      )}
    </>
  );
};

export default GoogleSignUp;


// Authenticate.tsx
const Authenticating = () => {
  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
};