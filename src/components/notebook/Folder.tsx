"use client"
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FolderPlus, 
  Folder as FolderIcon, 
  ChevronDown, 
  ChevronRight, 
  MoreVertical,
  Trash2,
  Pencil,
  Check,
  X,
  Plus,
  BookOpen,
  Sparkles,
  FileText
} from "lucide-react";
import notifications from "@/store/notifications";

interface NoteType {
  folderName: string;
  files: any[];
}

interface FolderProps {
  changeMode: (mode: string) => void;
  notes: NoteType[];
  setNotes: () => Promise<void>;
  setFolder: (folderName: string) => void;
  newFolder: string;
  setNewFolder: (folder: string) => void;
  setNewFile: (file: string) => void;
  setFileShow: (show: boolean) => void;
  selectedFolder: string;
  newFile?: string;
}

const folderColors = [
  { bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "text-blue-500" },
  { bg: "bg-purple-500/10", border: "border-purple-500/20", icon: "text-purple-500" },
  { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "text-amber-500" },
  { bg: "bg-profit/10", border: "border-profit/20", icon: "text-profit" },
  { bg: "bg-pink-500/10", border: "border-pink-500/20", icon: "text-pink-500" },
  { bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: "text-cyan-500" },
];

const Folder = ({ 
  changeMode, 
  notes, 
  setNotes, 
  setFolder, 
  newFolder, 
  setNewFolder, 
  setNewFile, 
  setFileShow, 
  selectedFolder 
}: FolderProps) => {
  const [folderShow, setFolderShow] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(true);
  const { setAlertBoxG } = notifications();
  
  const handleNoteClick = (note: string) => {
    setFolder(note);
  };

  const uploadFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolder.trim()) return;

    try {
      const response = await fetch(`/api/notebook/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ newFolder, apiName: 'createFolder' }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewFolder("")
        setFolderShow(false);
        setNotes();
        changeMode("VIEW")
      } else {
        if (data.error === "Folder already exists") {
          setAlertBoxG("Folder already exists", "error");
        }
      }
    } catch (error) {
      console.error("Error saving notebook:", error);
    }
  }

  const [folderRename, setFolderRename] = useState("")
  const [showFr, setShowFr] = useState(false)
  const [delConfirm, setDelConfirm] = useState(false)
  const [delFolder, setDelFolder] = useState("")
  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 });
  const [visibleOptions, setVisibleOptions] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleMenuClick = (e: React.MouseEvent, index: number, folderName: string) => {
    e.stopPropagation();
    setShowFr(false)
    setDelFolder(folderName)
    setDelConfirm(false)

    if (visibleOptions === index) {
      setVisibleOptions(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownCoords({ x: rect.right + 8, y: rect.top });
      setVisibleOptions(index);
    }
  };

  const deleteFolder = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/notebook/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ folderName: delFolder, apiName: 'deleteFolder' }),
      });

      if (response.ok) {
        setVisibleOptions(null);
        setDelConfirm(false)
        setNewFile("")
        setFileShow(false);
        setNotes();
        changeMode("VIEW")
      } else {
        setAlertBoxG("Failed to delete folder", "error");
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  }

  const renameFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderRename.trim()) return;

    try {
      const response = await fetch(`/api/notebook/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ folderName: delFolder, renameFolder: folderRename, apiName: 'renameFolder' }),
      });

      if (response.ok) {
        setVisibleOptions(null);
        setShowFr(false);
        setNotes();
        changeMode("VIEW")
      } else {
        setAlertBoxG("Failed to rename folder", "error");
      }
    } catch (error) {
      console.error("Error renaming folder:", error);
    }
  }

  const handleClickOutside = (event: MouseEvent) => {
    if (
      visibleOptions !== null &&
      dropdownRef.current &&
      !dropdownRef.current.contains(event.target as Node)
    ) {
      setVisibleOptions(null);
      setShowFr(false);
      setDelConfirm(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [visibleOptions]);

  const getFolderColor = (index: number) => {
    return folderColors[index % folderColors.length];
  };

  return (
    <div className="h-full">
      {/* Add Folder Button */}
      <AnimatePresence mode="wait">
        {folderShow ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4"
          >
            <div className="flex flex-col gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FolderPlus className="h-4 w-4 text-primary" />
                </div>
                <input 
                  name="newFolder" 
                  className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground" 
                  placeholder="Folder name..." 
                  value={newFolder} 
                  onChange={(e) => setNewFolder(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && uploadFolder(e)}
                  maxLength={20}
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={uploadFolder}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <Check className="h-4 w-4" />
                  <span>Create</span>
                </button>
                <button 
                  onClick={() => { setFolderShow(false); setNewFolder(""); }}
                  className="px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-sm font-medium text-muted-foreground"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setFolderShow(true)} 
            className="w-full flex items-center gap-2.5 px-3 py-3 mb-4 bg-gradient-to-r from-primary/5 to-profit/5 border border-primary/20 rounded-lg hover:from-primary/10 hover:to-profit/10 hover:border-primary/30 transition-all group active:scale-[0.98]"
          >
            <div className="w-8 h-8 rounded-md bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors flex-shrink-0">
              <Plus className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-medium text-foreground">New Folder</span>
            <Sparkles className="ml-auto h-4 w-4 text-primary/50 group-hover:text-primary transition-colors flex-shrink-0" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Folders Header */}
      <div className="mb-2">
        <button 
          className="flex items-center gap-2 w-full px-1 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          onClick={() => setIsFolderOpen(!isFolderOpen)}
        >
          <motion.div
            animate={{ rotate: isFolderOpen ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-3 w-3" />
          </motion.div>
          Folders
          <span className="ml-auto px-1.5 py-0.5 text-[10px] font-medium bg-muted rounded-full">
            {notes.length}
          </span>
        </button>
      </div>

      {/* Folder List */}
      <AnimatePresence>
        {isFolderOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1 overflow-hidden"
          >
            {notes.map((note, index) => {
              const color = getFolderColor(index);
              const isSelected = selectedFolder === note.folderName;
              
              return (
                <motion.div
                  key={note.folderName}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group relative"
                >
                  <button 
                    onClick={() => handleNoteClick(note.folderName)} 
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isSelected 
                        ? `${color.bg} border ${color.border}` 
                        : "hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                      isSelected ? color.bg : "bg-muted"
                    }`}>
                      <FolderIcon className={`h-3.5 w-3.5 ${isSelected ? color.icon : "text-muted-foreground"}`} />
                    </div>
                    <span className={`text-sm truncate flex-1 text-left ${
                      isSelected ? "text-foreground font-medium" : "text-muted-foreground"
                    }`}>
                      {note.folderName}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? `${color.bg} ${color.icon}` : "bg-muted text-muted-foreground"
                    }`}>
                      {note.files?.length || 0}
                    </span>
                  </button>

                  {note.folderName !== "Daily Journal" && (
                    <button
                      onClick={(e) => handleMenuClick(e, index, note.folderName)}
                      className={`absolute right-1 top-1/2 -translate-y-1/2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all ${
                        visibleOptions === index ? "opacity-100 bg-muted" : ""
                      }`}
                    >
                      <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Context Menu */}
      <AnimatePresence>
        {visibleOptions !== null && (
          <motion.div
            ref={dropdownRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 w-40 bg-card border border-border rounded-lg shadow-xl overflow-hidden"
            style={{
              left: dropdownCoords.x,
              top: dropdownCoords.y,
            }}
          >
            {showFr ? (
              <div className="p-2">
                <div className="flex items-center gap-1.5">
                  <input 
                    maxLength={20} 
                    placeholder="New name..." 
                    className="flex-1 px-2 py-1.5 text-xs bg-muted border border-border rounded-md outline-none focus:border-primary text-foreground" 
                    name="folderRename" 
                    value={folderRename} 
                    onChange={(e) => setFolderRename(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && renameFolder(e)}
                    autoFocus
                  />
                  <button 
                    onClick={renameFolder}
                    className="p-1.5 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
                  >
                    <Check className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => { setShowFr(true); setFolderRename(delFolder) }} 
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                Rename
              </button>
            )}

            {delConfirm ? (
              <button 
                onClick={deleteFolder} 
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white bg-loss hover:bg-loss/90 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Confirm Delete
              </button>
            ) : (
              <button 
                onClick={() => setDelConfirm(true)} 
                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                Delete
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Empty State */}
      {notes.length === 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-10 text-center"
        >
          <div className="relative mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-profit/20 flex items-center justify-center">
              <BookOpen className="h-7 w-7 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-profit/20 flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-profit" />
            </div>
          </div>
          <p className="text-sm font-medium text-foreground mb-1">Start Your Trading Notebook</p>
          <p className="text-xs text-muted-foreground mb-4 max-w-[180px]">
            Document insights, strategies, and market observations
          </p>
          <button 
            onClick={() => setFolderShow(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors"
          >
            <Plus className="h-3 w-3" />
            Create First Folder
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default Folder;
