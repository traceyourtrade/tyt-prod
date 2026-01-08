"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, 
  Mail, 
  Phone, 
  Globe, 
  FileText, 
  Camera, 
  Edit3, 
  Check, 
  Loader2,
  ChevronRight
} from "lucide-react";
import calendarPopUp from "@/store/calendarPopUp";
import { cn } from "@/lib/utils";

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [originalPicture, setOriginalPicture] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
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
          setOriginalPicture(data.profilePicture || null);
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
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const payload: Record<string, string | undefined> = {
        firstName,
        lastName,
        country,
        phone,
        bio,
      };

      if (profilePicture !== originalPicture) {
        payload.profilePicture = profilePicture || undefined;
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.profilePicture) {
          setProfilePicture(data.profilePicture);
          setOriginalPicture(data.profilePicture);
        }
        setSaveMessage({ type: 'success', text: 'Profile saved successfully!' });
        setIsEditing(false);
        setTimeout(() => setSaveMessage(null), 3000);
      } else {
        const data = await res.json();
        setSaveMessage({ type: 'error', text: data.error || 'Failed to save profile' });
      }
    } catch (error) {
      console.error("Save profile error:", error);
      setSaveMessage({ type: 'error', text: 'Failed to save profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header Card */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl border p-6",
        "bg-gradient-to-br from-primary/5 via-card to-card",
        "border-border dark:border-white/[0.08]"
      )}>
        {/* Decorative Orbs */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-[30px] translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {/* Avatar Section */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-emerald-500 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-500" />
              <div 
                className="relative w-24 h-24 rounded-full overflow-hidden bg-muted flex-shrink-0 cursor-pointer border-2 border-background shadow-xl"
                onClick={() => profilePicture && (setProImg(), setProUrl(profilePicture))}
              >
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-primary to-emerald-600 text-white">
                    {initials}
                  </div>
                )}
                
                {/* Hover Overlay */}
                <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center cursor-pointer transition-all duration-300">
                  <Camera className="w-6 h-6 text-white mb-1" />
                  <span className="text-[10px] text-white font-medium uppercase tracking-wider">Change</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground">
                {firstName} {lastName}
              </h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{email}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <AnimatePresence mode="wait">
              {saveMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 20 }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium shadow-sm border",
                    saveMessage.type === 'success' 
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" 
                      : "bg-red-500/10 border-red-500/20 text-red-600"
                  )}
                >
                  {saveMessage.text}
                </motion.div>
              )}
            </AnimatePresence>
            
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              disabled={isSaving}
              className={cn(
                "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all duration-300 shadow-sm",
                isEditing 
                  ? "bg-primary text-white hover:bg-primary/90 shadow-primary/20" 
                  : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20",
                isSaving && "opacity-70 cursor-not-allowed"
              )}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditing ? (
                <Check className="w-4 h-4" />
              ) : (
                <Edit3 className="w-4 h-4" />
              )}
              {isSaving ? "Saving..." : (isEditing ? "Save Changes" : "Edit Profile")}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-1">Personal Details</h3>
          <div className="bg-card rounded-2xl border border-border dark:border-white/[0.08] overflow-hidden divide-y divide-border dark:divide-white/[0.05]">
            <Field 
              label="First Name" 
              value={firstName} 
              onChange={setFirstName} 
              disabled={!isEditing} 
              icon={User} 
            />
            <Field 
              label="Last Name" 
              value={lastName} 
              onChange={setLastName} 
              disabled={!isEditing} 
              icon={User} 
            />
            <Field 
              label="Email Address" 
              value={email} 
              onChange={setEmail} 
              disabled 
              type="email" 
              icon={Mail} 
            />
          </div>
        </div>

        {/* Contact & Location */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-1">Contact & Reach</h3>
          <div className="bg-card rounded-2xl border border-border dark:border-white/[0.08] overflow-hidden divide-y divide-border dark:divide-white/[0.05]">
            <Field 
              label="Country" 
              value={country} 
              onChange={setCountry} 
              disabled={!isEditing} 
              icon={Globe} 
            />
            <Field 
              label="Phone Number" 
              value={phone} 
              onChange={setPhone} 
              disabled={!isEditing} 
              type="tel" 
              icon={Phone} 
            />
          </div>
        </div>
      </div>

      {/* Bio Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest px-1">About You</h3>
        <div className={cn(
          "bg-card rounded-2xl border border-border dark:border-white/[0.08] p-5 transition-all duration-300",
          isEditing && "ring-1 ring-primary/20 border-primary/30 shadow-lg shadow-primary/5"
        )}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <label className="text-sm font-medium text-foreground">Biography</label>
          </div>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            disabled={!isEditing}
            placeholder="Tell us about your trading journey..."
            className={cn(
              "w-full h-32 px-4 py-3 text-sm bg-muted/30 border border-border dark:border-white/[0.05] rounded-xl",
              "text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40",
              "transition-all duration-300 disabled:opacity-70 resize-none"
            )}
          />
        </div>
      </div>
    </motion.div>
  );
};

const Field = ({ 
  label, 
  value, 
  onChange, 
  disabled, 
  type = "text", 
  icon: Icon 
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  type?: string;
  icon: React.ElementType;
}) => (
  <div className={cn(
    "group flex items-center gap-4 px-5 py-4 transition-colors duration-200",
    !disabled && "hover:bg-primary/[0.02]"
  )}>
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm",
      disabled ? "bg-muted/50" : "bg-primary/10 group-hover:scale-110 group-hover:rotate-3"
    )}>
      <Icon className={cn(
        "w-4.5 h-4.5",
        disabled ? "text-muted-foreground" : "text-primary"
      )} />
    </div>
    
    <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-4">
      <span className="text-sm font-medium text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={cn(
            "w-full text-sm text-foreground bg-transparent focus:outline-none transition-all duration-200",
            disabled ? "text-muted-foreground opacity-80" : "text-foreground",
            "text-left sm:text-right"
          )}
          placeholder="—"
        />
        {!disabled && <ChevronRight className="w-4 h-4 text-muted-foreground/30 hidden sm:block" />}
      </div>
    </div>
  </div>
);

export default Profile;
