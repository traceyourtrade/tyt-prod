"use client"
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Calendar,
  Clock,
  Sparkles,
  Plus,
  BookOpen,
  LayoutTemplate
} from "lucide-react";
import notifications from "@/store/notifications";
import TemplatePicker from "./TemplatePicker";
import { NotebookTemplate } from "@/lib/notebookTemplates";

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
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotebookTemplate | null>(null);

  const handleTemplateSelect = (template: NotebookTemplate) => {
    setSelectedTemplate(template);
    setShowTemplatePicker(false);
    setFileShow(true);
  };

  const handleNewNoteClick = () => {
    setShowTemplatePicker(true);
  };

  const uploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFile.trim()) return;

    const defaultFields: Record<string, string> = {};
    if (selectedTemplate) {
      selectedTemplate.fields.forEach(field => {
        defaultFields[field.id] = field.defaultValue || "";
      });
    }

    try {
      const response = await fetch(`/api/notebook/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          newFile, 
          folderName: selectedFolder, 
          apiName: 'createFile',
          templateId: selectedTemplate?.id || null,
          templateFields: selectedTemplate ? defaultFields : null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setNewFile("");
        setFileShow(false);
        setSelectedTemplate(null);
        setNotes();
        changeMode("VIEW");
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
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (!selectedFolder) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Select a folder to view notes</p>
      </div>
    );
  }

  return (
    <div className="h-full">
      {/* Header with folder name */}
      <div className="mb-4 pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <FileText className="h-3 w-3 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">{selectedFolder}</h3>
            <p className="text-[10px] text-muted-foreground">
              {filteredFiles.length} {filteredFiles.length === 1 ? 'note' : 'notes'}
            </p>
          </div>
        </div>
      </div>

      {/* Add File Button - Only show if not Daily Journal */}
      {selectedFolder !== "Daily Journal" && (
        <AnimatePresence mode="wait">
          {fileShow ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4"
            >
              <div className={`flex flex-col gap-3 p-3 rounded-lg border ${selectedTemplate ? `${selectedTemplate.bgColor} ${selectedTemplate.borderColor}` : "bg-profit/5 border-profit/20"}`}>
                {selectedTemplate && (
                  <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                    <div className={`w-6 h-6 rounded-md ${selectedTemplate.bgColor} flex items-center justify-center`}>
                      <selectedTemplate.icon className={`h-3 w-3 ${selectedTemplate.color}`} />
                    </div>
                    <span className={`text-xs font-medium ${selectedTemplate.color}`}>{selectedTemplate.name} Template</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${selectedTemplate ? selectedTemplate.bgColor : "bg-profit/10"}`}>
                    <FilePlus className={`h-4 w-4 ${selectedTemplate ? selectedTemplate.color : "text-profit"}`} />
                  </div>
                  <input 
                    className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground" 
                    placeholder="Note name..." 
                    value={newFile} 
                    name="newFile" 
                    onChange={(e) => setNewFile(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && uploadFile(e)}
                    maxLength={30}
                    autoFocus
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={uploadFile}
                    className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-white transition-colors text-sm font-medium ${selectedTemplate?.id === "trade-idea" ? "bg-amber-500 hover:bg-amber-500/90" : selectedTemplate?.id === "market-analysis" ? "bg-blue-500 hover:bg-blue-500/90" : selectedTemplate?.id === "weekly-review" ? "bg-purple-500 hover:bg-purple-500/90" : selectedTemplate?.id === "strategy-doc" ? "bg-profit hover:bg-profit/90" : selectedTemplate?.id === "psychology" ? "bg-pink-500 hover:bg-pink-500/90" : "bg-profit hover:bg-profit/90"}`}
                  >
                    <Check className="h-4 w-4" />
                    <span>Create Note</span>
                  </button>
                  <button 
                    onClick={() => { setFileShow(false); setNewFile(""); setSelectedTemplate(null); }}
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
              onClick={handleNewNoteClick} 
              className="w-full flex items-center gap-2 px-3 py-3 mb-4 bg-gradient-to-r from-profit/5 to-primary/5 border border-profit/20 rounded-lg hover:from-profit/10 hover:to-primary/10 hover:border-profit/30 transition-all group active:scale-[0.98]"
            >
              <div className="w-8 h-8 rounded-md bg-profit/10 group-hover:bg-profit/20 flex items-center justify-center transition-colors flex-shrink-0">
                <LayoutTemplate className="h-4 w-4 text-profit" />
              </div>
              <div className="flex-1 text-left">
                <span className="text-sm font-medium text-foreground block">New Note</span>
                <span className="text-[10px] text-muted-foreground">Choose a template</span>
              </div>
              <Sparkles className="h-4 w-4 text-profit/50 group-hover:text-profit transition-colors flex-shrink-0" />
            </motion.button>
          )}
        </AnimatePresence>
      )}

      {/* Notes Header */}
      <div className="mb-2">
        <button 
          className="flex items-center gap-2 w-full px-1 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          onClick={() => setIsFileOpen(!isFileOpen)}
        >
          <motion.div
            animate={{ rotate: isFileOpen ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="h-3 w-3" />
          </motion.div>
          Notes
        </button>
      </div>

      {/* File List */}
      <AnimatePresence>
        {isFileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-1.5 overflow-hidden"
          >
            {filteredFiles.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-10 text-center"
              >
                <div className="relative mb-3">
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                <p className="text-xs font-medium text-muted-foreground mb-1">No notes yet</p>
                {selectedFolder !== "Daily Journal" ? (
                  <button 
                    onClick={() => setFileShow(true)}
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Create your first note
                  </button>
                ) : (
                  <p className="text-[10px] text-muted-foreground max-w-[160px]">
                    Journal entries from your trades will appear here
                  </p>
                )}
              </motion.div>
            ) : (
              filteredFiles.map((file, index) => (
                <motion.div
                  key={file.filename}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="group relative"
                >
                  <button 
                    onClick={() => setFile(file.filename)}
                    className="w-full p-2.5 bg-card/50 border border-border rounded-lg hover:border-primary/30 hover:bg-card transition-all text-left"
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/10 to-profit/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate pr-6">
                          {file.filename}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5 text-[10px] text-muted-foreground">
                          <Clock className="h-2.5 w-2.5" />
                          <span>{formatDate(file.created)}</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Menu Button */}
                  <button
                    onClick={(e) => handleMenuClick(e, index, file.filename)}
                    className={`absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted transition-all ${
                      visibleOptions === index ? "opacity-100 bg-muted" : ""
                    }`}
                  >
                    <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  </button>
                </motion.div>
              ))
            )}
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
            {selectedFolder !== "Daily Journal" && (
              showFr ? (
                <div className="p-2">
                  <div className="flex items-center gap-1.5">
                    <input 
                      maxLength={30} 
                      placeholder="New name..." 
                      className="flex-1 px-2 py-1.5 text-xs bg-muted border border-border rounded-md outline-none focus:border-primary text-foreground" 
                      name="fileRename" 
                      value={fileRename} 
                      onChange={(e) => setFileRename(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && renameFile(e)}
                      autoFocus
                    />
                    <button 
                      onClick={renameFile}
                      className="p-1.5 rounded-md bg-primary text-white hover:bg-primary/90 transition-colors"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => { setShowFr(true); setFileRename(delFile) }} 
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  Rename
                </button>
              )
            )}

            {delConfirm ? (
              <button 
                onClick={deleteFile} 
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

      {/* Template Picker Modal */}
      <TemplatePicker
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelect={handleTemplateSelect}
      />
    </div>
  )
}

export default Files;
