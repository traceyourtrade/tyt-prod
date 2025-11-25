"use client";
import { useState } from "react";
import Cookies from "js-cookie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import useAccountDetails from "@/store/accountdetails";

// store
import {useDataStore} from "@/store/store";
import calendarPopUp from "@/store/calendarPopUp";
import ProfilePopup from "../dashboard-components/popups/ProfilePopup";

// import ProfilePopup from "@components/popups/ProfilePopup";

interface ProfileDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: number | string;
  country: string;
}

const Profile = () => {
  const { setAccounts, profileData } = useAccountDetails();
  const { setProImg, setProUrl, proImgUrl } = calendarPopUp();
  const { bkurl } = useDataStore();

  const [profilePicture, setProfilePic] = useState<string>(profileData.profilePicture 
    || ""
  );

  const [profileDetails, setProfileDetails] = useState<ProfileDetails>({
    firstName: profileData.fullName ? profileData.fullName.split(" ")[0] : "",
    lastName: profileData.fullName ? profileData.fullName.split(" ")[1] : "",
    email: profileData.email || "",
    phone: profileData.phone ||"",
    country: profileData.country ||"",
  });

  const [bio, setBio] = useState<string>(profileData?.bio || "");
  const [error, setError] = useState<string>("");

  const setProfileVal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileDetails({ ...profileDetails, [name]: value });
  };

  const updateData = async (e: React.FormEvent) => {
    e.preventDefault();

    const { firstName, lastName, phone, country } = profileDetails;
    const tokenn = Cookies.get("Trace Your Trades");

    try {
      const res = await fetch(`/api/user-profile/put`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: `${firstName} ${lastName}`, phone, bio, tokenn,apiName:'editProfile'
        })
      });

      const data = await res.json();

      if (res.status === 200) {
        setError("");
      } else {
        setError("Failed, please try later");
      }

    } catch (error) {
      console.error(error);
    }
  };

  // Uploading img

  const handleFileSelect = (file: File) => {
    if (!file || !file.type.startsWith('image/')) {
      console.error("Invalid file type or no file selected");
      return;
    }
    compressAndUploadImage(file);
  };

  const tokenn = Cookies.get("Trace Your Trades");

  const compressAndUploadImage = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        let width = img.width;
        let height = img.height;
        const maxSize = 1024;

        if (width > height) {
          height = Math.round(height * (maxSize / width));
          width = maxSize;
        } else {
          width = Math.round(width * (maxSize / height));
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.9;
        let dataUrl: string;

        while ((dataUrl = canvas.toDataURL('image/jpeg', quality)).length > 100 * 1024 && quality > 0.2) {
          quality -= 0.1;
        }

        fetch(dataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const formData = new FormData();
            formData.append('image', blob, file.name);
            formData.append('tokenn', tokenn!);
            formData.append('apiName', 'uploadProfilePicture');

            fetch(`/api/user-profile/post`, {
              method: 'POST',
              body: formData,
            })
              .then((response) => {
                if (!response.ok) {
                  throw new Error('Network response was not ok');
                }
                console.log('Response received:', response);
                setAccounts();
                return response.json();
              })
              .then((data) => {
                setProfilePic(data.imageUrl);
              })
              .catch((error) => {
                console.error('Upload failed:', error);
              });
          });
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  };

  const deleteImg = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`/api/user-profile/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          url: proImgUrl, tokenn,apiName:"deleteProfilePicture"
        })
      });

      const data = await res.json();

      if (res.status === 200) {
        document.body.classList.remove("no-scroll");
        setAccounts();
        setProImg();
        setProfilePic("");
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="w-[98%] h-[80vh] flex">
        <div className="w-[90%] h-[80vh] flex flex-col items-start justify-between">
          <div className="w-full h-auto flex items-start justify-between">
            <div className="flex flex-col mt-[20px] ml-[20px] items-start w-[30%] h-auto">
              {profilePicture ? (
                <div 
                  className="w-full h-[35vh] overflow-hidden rounded-[25px] bg-cover bg-center bg-no-repeat"
                  style={{ backgroundImage: `url(${profilePicture})` }}
                  onClick={() => { setProImg(); document.body.classList.add("no-scroll"); setProUrl(profilePicture) }}
                />
              ) : (
                <div className="mx-auto bg-transparent shadow-[0px_8px_28px_-9px_rgba(0,0,0,0.45)] relative w-[240px] h-[35vh] rounded-[16px] overflow-hidden cursor-pointer font-inter">
                  <div className="absolute w-[540px] h-[700px] opacity-60 left-0 top-0 ml-[-50%] mt-[-70%] bg-gradient-to-r from-[#af40ff] via-[#5b42f3] to-[#00ddeb] rounded-[40%] animate-[wave_55s_infinite_linear]" />
                  <div className="absolute w-[540px] h-[700px] opacity-60 left-0 top-[210px] ml-[-50%] mt-[-70%] bg-gradient-to-r from-[#af40ff] via-[#5b42f3] to-[#00ddeb] rounded-[40%] animate-[wave_50s_infinite_linear]" />
                  <div className="absolute w-[540px] h-[700px] opacity-60 left-0 top-[210px] ml-[-50%] mt-[-70%] bg-gradient-to-r from-[#af40ff] via-[#5b42f3] to-[#00ddeb] rounded-[40%] animate-[wave_45s_infinite_linear]" />
                  <div className="absolute top-[4.6em] left-0 right-0 text-white font-[600] text-center">
                    <h1 className="text-[72px]">
                      {profileData.fullName ? `${profileData.fullName.charAt(0)}` : ""}  {profileData.fullName ? `${profileData.fullName.split(" ")[1]?.charAt(0)}` : ""}
                    </h1>
                  </div>
                </div>
              )}
              
              <label
                htmlFor="file-upload"
                className="w-[150px] h-auto text-[12px] px-[10px] py-[5px] font-inter font-[550] border-none rounded-[25px] bg-[rgba(215,170,248,0.622)] cursor-pointer mx-auto mt-[15px]"
              >
                <FontAwesomeIcon icon={faCamera} /> Upload New Photo
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleFileSelect(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div className="w-[80%] h-auto font-inter">
              <h2 className="font-inter mt-[20px] ml-[10px]">PROFILE DETAILS 🧑🏻‍💻</h2>
              <div className="w-full h-auto flex items-center justify-between">
                <div className="w-[45%] flex flex-col mt-[10px]">
                  <label className="text-[12px] text-[#bebebe] font-[550] ml-[10px]">First Name</label>
                  <input 
                    type="text" 
                    name="firstName" 
                    value={profileDetails.firstName} 
                    onChange={setProfileVal}
                    className="w-full mt-[5px] px-[10px] py-[7px] text-[14px] rounded-[25px] bg-[rgba(122,122,122,0.214)] font-inter border-none text-white font-[550] outline-none ml-[10px]"
                  />
                </div>
                <div className="w-[45%] flex flex-col mt-[10px]">
                  <label className="text-[12px] text-[#bebebe] font-[550] ml-[10px]">Last Name</label>
                  <input 
                    type="text" 
                    name="lastName" 
                    value={profileDetails.lastName} 
                    onChange={setProfileVal}
                    className="w-full mt-[5px] px-[10px] py-[7px] text-[14px] rounded-[25px] bg-[rgba(122,122,122,0.214)] font-inter border-none text-white font-[550] outline-none ml-[10px]"
                  />
                </div>
              </div>
              
              <div className="w-full flex flex-col mt-[20px]">
                <label className="text-[12px] text-[#bebebe] font-[550] ml-[10px]">Email Address</label>
                <input 
                  disabled 
                  style={{ cursor: "not-allowed" }} 
                  type="text" 
                  name="email" 
                  value={profileDetails.email} 
                  onChange={setProfileVal}
                  className="w-full mt-[5px] px-[10px] py-[7px] text-[14px] rounded-[25px] bg-[rgba(122,122,122,0.214)] font-inter border-none text-white font-[550] outline-none ml-[10px]"
                />
              </div>
              
              <div className="w-full flex items-center justify-between mt-[15px]">
                <div className="w-[45%] flex flex-col mt-[10px]">
                  <label className="text-[12px] text-[#bebebe] font-[550] ml-[10px]">Country</label>
                  <input 
                    disabled 
                    style={{ cursor: "not-allowed" }} 
                    type="text" 
                    name="country" 
                    value={profileDetails.country} 
                    onChange={setProfileVal}
                    className="w-full mt-[5px] px-[10px] py-[7px] text-[14px] rounded-[25px] bg-[rgba(122,122,122,0.214)] font-inter border-none text-white font-[550] outline-none ml-[10px]"
                  />
                </div>
                <div className="w-[45%] flex flex-col mt-[10px]">
                  <label className="text-[12px] text-[#bebebe] font-[550] ml-[10px]">Contact Number</label>
                  <input 
                    type="number" 
                    name="phone" 
                    value={profileDetails.phone} 
                    onChange={setProfileVal}
                    className="w-full mt-[5px] px-[10px] py-[7px] text-[14px] rounded-[25px] bg-[rgba(122,122,122,0.214)] font-inter border-none text-white font-[550] outline-none ml-[10px]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="w-full h-auto">
            <h2 className="my-[10px] ml-[35px] text-[21px]">Trader BIO 🚀</h2>
            <textarea 
              autoComplete="off" 
              placeholder="Tell us more about yourself ..." 
              name="bio" 
              value={bio} 
              onChange={(e) => setBio(e.target.value)}
              className="w-[95%] h-[20vh] rounded-[25px] p-[15px] border-none bg-[rgba(122,122,122,0.214)] resize-none ml-[20px] mb-[20px] outline-none font-inter text-white font-[550]"
            />
          </div>
        </div>

        <div className="w-[10%] h-[80vh] flex flex-col items-center justify-end">
          <p className="text-center text-tomato text-[12px]">{error}</p>
          <button 
            className="w-[100px] h-auto text-[16px] px-[10px] py-[5px] font-inter font-[550] border-none rounded-[25px] bg-[rgba(215,170,248,0.622)] relative top-[-100px] cursor-pointer"
            onClick={updateData}
          >
            SAVE
          </button>
        </div>
      </div>

      <ProfilePopup deleteImg={deleteImg} />
    </>
  );
};

export default Profile;