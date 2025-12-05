"use client"
import { useState, useRef, useEffect } from "react";
import { 
  File, 
  FilePlus, 
  ChevronDown, 
  ChevronRight, 
  MoreVertical,
  Trash2,
  Pencil,
  Check,
  X,
  FileText,
  Calendar
} from "lucide-react";
import notifications from "@/store/notifications";

interface FileType {
  filename: string;
  created: string;
}

interface NoteType {
  folderName: string;
  files: FileType[];
}

interface FilesProps {
  notes: NoteType[];
  setNotes: () => Promise<void>;
  setFile: (filename: string) => void;
  newFolder: string;
  setNewFolder: (folder: string) => void;
  setNewFile: (file: string) => void;
  setFileShow: (show: boolean) => void;
  newFile: string;
  selectedFolder: string;
  changeMode: (mode: string) => void;
  fileShow: boolean;
}

const Files = ({ 
  notes, 
  setNotes, 
  setFile, 
  setNewFile, 
  setFileShow, 
  newFile, 
  selectedFolder, 
  changeMode, 
  fileShow 
}: FilesProps) => {
  const { setAlertBoxG } = notifications();
  const [isFileOpen, setIsFileOpen] = useState(true);

  const uploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile.trim()) return;

    try {
      const response = await fetch(`/api/notebook/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ newFile, folderName: selectedFolder, apiName: 'createFile' }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewFile("")
        setFileShow(false);
        setNotes();
        changeMode("VIEW")
      } else {
        if (data.error === "File already exists") {
          setAlertBoxG("File already exists", "error");
        }
      }
    } catch (error) {
      console.error("Error creating file:", error);
    }
  }

  const filteredFiles = notes
    .filter(note => note.folderName === selectedFolder)
    .flatMap(note => note.files);

  const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 });
  const [showFr, setShowFr] = useState(false)
  const [visibleOptions, setVisibleOptions] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [delConfirm, setDelConfirm] = useState(false)
  const [delFile, setDelFile] = useState("")
  const [fileRename, setFileRename] = useState("")

  const handleMenuClick = (e: React.MouseEvent, index: number, filename: string) => {
    e.stopPropagation();
    setShowFr(false)
    setDelFile(filename)
    setDelConfirm(false)

    if (visibleOptions === index) {
      setVisibleOptions(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      setDropdownCoords({ x: rect.right + 8, y: rect.top });
      setVisibleOptions(index);
    }
  };

  const deleteFile = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`/api/notebook/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ folderName: selectedFolder, fileName: delFile, apiName: 'deleteFile' }),
      });

      if (response.ok) {
        setVisibleOptions(null);
        setDelConfirm(false)
        setNewFile("")
        setFileShow(false);
        setNotes();
        changeMode("VIEW")
      } else {
        setAlertBoxG("Failed to delete file", "error");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
    }
  }

  const renameFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileRename.trim()) return;

    try {
      const response = await fetch(`/api/notebook/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ folderName: selectedFolder, fileName: delFile, renameFile: fileRename, apiName: 'renameFile' }),
      });

      if (response.ok) {
        setVisibleOptions(null);
        setShowFr(false);
        setNotes();
        changeMode("VIEW")
      } else {
        setAlertBoxG("Failed to rename file", "error");
      }
    } catch (error) {
      console.error("Error renaming file:", error);
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="h-full">
      {/* Header with folder name */}
      <div className="mb-4 pb-3 border-b border-border">
        <h3 className="text-base font-semibold text-foreground truncate">{selectedFolder}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {filteredFiles.length} {filteredFiles.length === 1 ? 'note' : 'notes'}
        </p>
      </div>

      {/* Add File Button - Only show if not Daily Journal */}
      {selectedFolder !== "Daily Journal" && (
        fileShow ? (
          <div className="mb-4">
            <div className="flex items-center gap-2 p-2.5 bg-muted rounded-lg border border-border">
              <FileText className="h-4 w-4 text-primary flex-shrink-0" />
              <input 
                className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground" 
                placeholder="Note name..." 
                value={newFile} 
                name="newFile" 
                onChange={(e) => setNewFile(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && uploadFile(e)}
                maxLength={30}
                autoFocus
              />
              <button 
                onClick={uploadFile}
                className="p-1.5 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button 
                onClick={() => { setFileShow(false); setNewFile(""); }}
                className="p-1.5 rounded-md hover:bg-muted-foreground/20 transition-colors"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setFileShow(true)} 
            className="w-full flex items-center gap-2 px-3 py-2.5 mb-4 bg-card border border-border border-dashed rounded-lg hover:bg-muted hover:border-primary/30 transition-all group"
          >
            <FilePlus className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">New Note</span>
          </button>
        )
      )}

      {/* Files Header */}
      <div className="mb-2">
        <button 
          className="flex items-center gap-2 w-full px-1 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          onClick={() => setIsFileOpen(!isFileOpen)}
        >
          {isFileOpen ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          Notes
        </button>
      </div>

      {/* File List */}
      <div className={`space-y-2 transition-all duration-300 overflow-hidden ${isFileOpen ? "max-h-[calc(100vh-300px)] overflow-y-auto" : "max-h-0"}`}>
        {filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">No notes yet</p>
            {selectedFolder !== "Daily Journal" && (
              <button 
                onClick={() => setFileShow(true)}
                className="text-sm text-primary hover:underline"
              >
                Create your first note
              </button>
            )}
            {selectedFolder === "Daily Journal" && (
              <p className="text-xs text-muted-foreground mt-1">
                Notes from trades will appear here
              </p>
            )}
          </div>
        ) : (
          filteredFiles.map((file, index) => (
            <div
              key={file.filename}
              className="group relative"
            >
              <button 
                onClick={() => setFile(file.filename)}
                className="w-full p-3 bg-card border border-border rounded-lg hover:border-primary/30 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {file.filename}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(file.created)}</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Menu Button */}
              <button
                onClick={(e) => handleMenuClick(e, index, file.filename)}
                className={`absolute top-2 right-2 p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all ${
                  visibleOptions === index ? "opacity-100 bg-muted" : ""
                }`}
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          ))
        )}
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
          {selectedFolder !== "Daily Journal" && (
            showFr ? (
              <div className="p-2">
                <div className="flex items-center gap-2">
                  <input 
                    maxLength={30} 
                    placeholder="New name..." 
                    className="flex-1 px-2 py-1.5 text-sm bg-muted border border-border rounded-md outline-none focus:border-primary text-foreground" 
                    name="fileRename" 
                    value={fileRename} 
                    onChange={(e) => setFileRename(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && renameFile(e)}
                    autoFocus
                  />
                  <button 
                    onClick={renameFile}
                    className="p-1.5 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => { setShowFr(true); setFileRename(delFile) }} 
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
                Rename
              </button>
            )
          )}

          {delConfirm ? (
            <button 
              onClick={deleteFile} 
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
    </div>
  )
}

export default Files;
