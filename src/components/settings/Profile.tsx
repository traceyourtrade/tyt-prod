"use client";
import { useState, useEffect, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faCamera, faPen, faCheck, faBars } from "@fortawesome/free-solid-svg-icons";
import calendarPopUp from "@/store/calendarPopUp";

interface Props {
  onMenuClick: () => void;
}

const Profile = ({ onMenuClick }: Props) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { setProImg, setProUrl } = calendarPopUp();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/profile", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          setEmail(data.email || "");
          setCountry(data.country || "");
          setPhone(data.phone || "");
          setBio(data.bio || "");
          setProfilePicture(data.profilePicture || null);
        }
      } catch (e) {
        setFirstName("Demo");
        setLastName("Trader");
        setEmail("demo@tradeyourtrip.com");
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsEditing(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setProfilePicture(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "DT";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onMenuClick} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white">
            <FontAwesomeIcon icon={faBars} />
          </button>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
        </div>
        <button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isEditing 
              ? "bg-emerald-500 text-white hover:bg-emerald-600" 
              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
          }`}
        >
          <FontAwesomeIcon icon={isEditing ? faCheck : faPen} className="w-3" />
          {isEditing ? "Save" : "Edit"}
        </button>
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] p-4">
        <div className="flex items-center gap-4">
          <div 
            className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-100 dark:bg-[#1e1e1e] flex-shrink-0 cursor-pointer group"
            onClick={() => profilePicture && (setProImg(), setProUrl(profilePicture))}
          >
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-400">
                {initials}
              </div>
            )}
            <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
              <FontAwesomeIcon icon={faCamera} className="text-white" />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {firstName} {lastName}
            </p>
            <p className="text-sm text-gray-500 truncate">{email}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] divide-y divide-gray-100 dark:divide-[#262626]">
        <Field label="First Name" value={firstName} onChange={setFirstName} disabled={!isEditing} />
        <Field label="Last Name" value={lastName} onChange={setLastName} disabled={!isEditing} />
        <Field label="Email" value={email} onChange={setEmail} disabled type="email" />
        <Field label="Country" value={country} onChange={setCountry} disabled={!isEditing} />
        <Field label="Phone" value={phone} onChange={setPhone} disabled={!isEditing} type="tel" />
      </div>

      <div className="bg-white dark:bg-[#141414] rounded-xl border border-gray-200 dark:border-[#262626] p-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          disabled={!isEditing}
          placeholder="Tell us about yourself..."
          className="w-full h-20 px-3 py-2 text-sm bg-transparent border border-gray-200 dark:border-[#262626] rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-emerald-500 disabled:opacity-50 resize-none"
        />
      </div>
    </div>
  );
};

const Field = ({ label, value, onChange, disabled, type = "text" }: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  type?: string;
}) => (
  <div className="flex items-center justify-between px-4 py-3">
    <span className="text-sm text-gray-500 w-28 flex-shrink-0">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="flex-1 text-sm text-right bg-transparent text-gray-900 dark:text-white focus:outline-none disabled:opacity-70 min-w-0"
      placeholder="—"
    />
  </div>
);

export default Profile;
