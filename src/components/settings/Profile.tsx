"use client";
import { useState } from "react";
import Cookies from "js-cookie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCamera, faCheck, faUser, faPen } from "@fortawesome/free-solid-svg-icons";
import useAccountDetails from "@/store/accountdetails";
import {useDataStore} from "@/store/store";
import calendarPopUp from "@/store/calendarPopUp";
import ProfilePopup from "../dashboard-components/popups/ProfilePopup";

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

  const [profilePicture, setProfilePic] = useState<string>(profileData.profilePicture || "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profileDetails, setProfileDetails] = useState<ProfileDetails>({
    firstName: profileData.fullName ? profileData.fullName.split(" ")[0] : "",
    lastName: profileData.fullName ? profileData.fullName.split(" ")[1] : "",
    email: profileData.email || "",
    phone: profileData.phone || "",
    country: profileData.country || "",
  });

  const [bio, setBio] = useState<string>(profileData?.bio || "");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  const setProfileVal = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileDetails({ ...profileDetails, [name]: value });
  };

  const updateData = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    const { firstName, lastName, phone, country } = profileDetails;
    const tokenn = Cookies.get("Trace Your Trades");

    try {
      const res = await fetch(`/api/user-profile/put`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: `${firstName} ${lastName}`, phone, bio, tokenn, apiName:'editProfile'
        })
      });

      const data = await res.json();

      if (res.status === 200) {
        setSuccess("Profile updated successfully!");
        setIsEditing(false);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

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
        ctx?.drawImage(img, 0, 0, width, height);

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
          url: proImgUrl, tokenn, apiName:"deleteProfilePicture"
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

  const InputField = ({ 
    label, 
    name, 
    value, 
    onChange, 
    disabled = false,
    type = "text" 
  }: { 
    label: string; 
    name: string;
    value: string | number; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    disabled?: boolean;
    type?: string;
  }) => (
    <div className="space-y-2">
      <label className="text-xs uppercase tracking-wider text-gray-500 font-medium">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl px-4 py-3 text-sm text-white font-medium placeholder:text-gray-600 focus:outline-none focus:border-emerald-500/50 transition-all duration-200 ${
          disabled ? 'opacity-60 cursor-not-allowed' : ''
        }`}
      />
    </div>
  );

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-white">Profile Details</h2>
            <p className="text-gray-500 text-xs lg:text-sm mt-1">Manage your personal information</p>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all w-full sm:w-auto ${
              isEditing 
                ? "bg-gray-700 text-gray-300 hover:bg-gray-600" 
                : "bg-[#1e1e1e] text-gray-300 hover:bg-[#252525] border border-[#2a2a2a]"
            }`}
          >
            <FontAwesomeIcon icon={faPen} className="text-xs" />
            {isEditing ? "Cancel" : "Edit Profile"}
          </button>
        </div>

        {(error || success) && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${
            error ? "bg-red-500/15 text-red-400 border border-red-500/30" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
          }`}>
            {error || success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8">
          <div className="lg:col-span-4">
            <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6">
              <div className="flex flex-row lg:flex-col items-center gap-4 lg:gap-0">
                {profilePicture ? (
                  <div 
                    className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-2xl bg-cover bg-center bg-no-repeat cursor-pointer hover:opacity-90 transition-opacity flex-shrink-0"
                    style={{ backgroundImage: `url(${profilePicture})` }}
                    onClick={() => { setProImg(); document.body.classList.add("no-scroll"); setProUrl(profilePicture) }}
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40 rounded-2xl bg-[#252525] flex items-center justify-center flex-shrink-0">
                    <span className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-400">
                      {profileData.fullName ? `${profileData.fullName.charAt(0)}${profileData.fullName.split(" ")[1]?.charAt(0) || ""}` : <FontAwesomeIcon icon={faUser} />}
                    </span>
                  </div>
                )}
                
                <div className="flex-1 lg:flex-initial text-left lg:text-center">
                  <h3 className="text-base sm:text-lg font-semibold text-white">
                    {profileDetails.firstName} {profileDetails.lastName}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">{profileDetails.email}</p>
                  {profileDetails.country && (
                    <span className="inline-block mt-2 px-3 py-1 bg-[#252525] text-gray-400 text-xs rounded-full">
                      {profileDetails.country}
                    </span>
                  )}
                  
                  <label
                    htmlFor="file-upload"
                    className="mt-3 lg:mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#252525] hover:bg-[#2a2a2a] text-gray-300 text-sm font-medium rounded-xl cursor-pointer transition-colors"
                  >
                    <FontAwesomeIcon icon={faCamera} className="text-xs" />
                    Upload Photo
                    <input
                      id="file-upload"
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 space-y-4 lg:space-y-6">
            <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Personal Information</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="First Name"
                  name="firstName"
                  value={profileDetails.firstName}
                  onChange={setProfileVal}
                  disabled={!isEditing}
                />
                <InputField
                  label="Last Name"
                  name="lastName"
                  value={profileDetails.lastName}
                  onChange={setProfileVal}
                  disabled={!isEditing}
                />
              </div>

              <div className="mt-4">
                <InputField
                  label="Email Address"
                  name="email"
                  value={profileDetails.email}
                  onChange={setProfileVal}
                  disabled={true}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                <InputField
                  label="Country"
                  name="country"
                  value={profileDetails.country}
                  onChange={setProfileVal}
                  disabled={true}
                />
                <InputField
                  label="Contact Number"
                  name="phone"
                  value={profileDetails.phone}
                  onChange={setProfileVal}
                  disabled={!isEditing}
                  type="tel"
                />
              </div>
            </div>

            <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl p-4 sm:p-6">
              <h3 className="text-sm font-semibold text-white mb-4">Trader Bio</h3>
              <textarea 
                placeholder="Tell us more about yourself and your trading journey..." 
                name="bio" 
                value={bio} 
                onChange={(e) => setBio(e.target.value)}
                disabled={!isEditing}
                className={`w-full h-24 sm:h-32 bg-[#252525] border border-[#2a2a2a] rounded-xl p-3 sm:p-4 text-sm text-white placeholder:text-gray-600 resize-none focus:outline-none focus:border-emerald-500/50 transition-all duration-200 ${
                  !isEditing ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              />
            </div>

            {isEditing && (
              <div className="flex justify-end">
                <button 
                  onClick={updateData}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="text-xs" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <ProfilePopup deleteImg={() => deleteImg({} as React.FormEvent)} />
    </>
  );
};

export default Profile;
