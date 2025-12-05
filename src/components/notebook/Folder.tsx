"use client"
import { useState, useEffect, useRef } from "react";
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
  Plus
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

  return (
    <div className="h-full">
      {/* Add Folder Button */}
      {folderShow ? (
        <div className="mb-4">
          <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg border border-border">
            <FolderIcon className="h-4 w-4 text-primary flex-shrink-0" />
            <input 
              name="newFolder" 
              className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground" 
              placeholder="Folder name..." 
              value={newFolder} 
              onChange={(e) => setNewFolder(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && uploadFolder(e)}
              maxLength={20}
              autoFocus
            />
            <button 
              onClick={uploadFolder}
              className="p-1.5 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              <Check className="h-3.5 w-3.5" />
            </button>
            <button 
              onClick={() => { setFolderShow(false); setNewFolder(""); }}
              className="p-1.5 rounded-md hover:bg-muted-foreground/20 transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setFolderShow(true)} 
          className="w-full flex items-center gap-2 px-3 py-2.5 mb-4 bg-card border border-border rounded-lg hover:bg-muted hover:border-primary/30 transition-all group"
        >
          <FolderPlus className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">New Folder</span>
          <span className="ml-auto text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            Click to add
          </span>
        </button>
      )}

      {/* Folders Header */}
      <div className="mb-2">
        <button 
          className="flex items-center gap-2 w-full px-1 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          onClick={() => setIsFolderOpen(!isFolderOpen)}
        >
          {isFolderOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          Folders
          <span className="ml-auto text-xs font-normal bg-muted px-1.5 py-0.5 rounded">
            {notes.length}
          </span>
        </button>
      </div>

      {/* Folder List */}
      <div className={`space-y-1 transition-all duration-300 overflow-hidden ${isFolderOpen ? "max-h-[calc(100vh-250px)] overflow-y-auto" : "max-h-0"}`}>
        {notes.map((note, index) => (
          <div
            key={index}
            className={`group relative flex items-center rounded-lg transition-all duration-200 ${
              selectedFolder === note.folderName 
                ? "bg-primary/10 border-l-2 border-primary" 
                : "hover:bg-muted"
            }`}
          >
            <button 
              onClick={() => handleNoteClick(note.folderName)} 
              className="flex-1 flex items-center gap-2.5 px-3 py-2 text-left"
            >
              <FolderIcon className={`h-4 w-4 flex-shrink-0 ${
                selectedFolder === note.folderName ? "text-primary" : "text-muted-foreground"
              }`} />
              <span className={`text-sm truncate ${
                selectedFolder === note.folderName 
                  ? "text-primary font-medium" 
                  : "text-foreground"
              }`}>
                {note.folderName}
              </span>
              <span className="ml-auto text-xs text-muted-foreground">
                {note.files?.length || 0}
              </span>
            </button>

            {note.folderName !== "Daily Journal" && (
              <button
                onClick={(e) => handleMenuClick(e, index, note.folderName)}
                className={`p-1.5 mr-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/20 transition-all ${
                  visibleOptions === index ? "opacity-100 bg-muted-foreground/20" : ""
                }`}
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Context Menu */}
      {visibleOptions !== null && (
        <div
          ref={dropdownRef}
          className="fixed z-50 w-44 bg-card border border-border rounded-lg shadow-lg overflow-hidden animate-in fade-in slide-in-from-left-2 duration-200"
          style={{
            left: dropdownCoords.x,
            top: dropdownCoords.y,
          }}
        >
          {showFr ? (
            <div className="p-2">
              <div className="flex items-center gap-2">
                <input 
                  maxLength={20} 
                  placeholder="New name..." 
                  className="flex-1 px-2 py-1.5 text-sm bg-muted border border-border rounded-md outline-none focus:border-primary text-foreground" 
                  name="folderRename" 
                  value={folderRename} 
                  onChange={(e) => setFolderRename(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && renameFolder(e)}
                  autoFocus
                />
                <button 
                  onClick={renameFolder}
                  className="p-1.5 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={() => { setShowFr(true); setFolderRename(delFolder) }} 
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Pencil className="h-4 w-4 text-muted-foreground" />
              Rename
            </button>
          )}

          {delConfirm ? (
            <button 
              onClick={deleteFolder} 
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white bg-red-500 hover:bg-red-600 transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              Confirm Delete
            </button>
          ) : (
            <button 
              onClick={() => setDelConfirm(true)} 
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
              Delete
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {notes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FolderIcon className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-2">No folders yet</p>
          <button 
            onClick={() => setFolderShow(true)}
            className="text-sm text-primary hover:underline"
          >
            Create your first folder
          </button>
        </div>
      )}
    </div>
  )
}

export default Folder;
