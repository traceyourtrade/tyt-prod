"use client"
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Plus,
  FolderPlus,
  FileText,
  MoreHorizontal,
  Trash2,
  Pencil,
  Check,
  X,
  Folder as FolderIcon,
  ChevronLeft
} from "lucide-react";
import notebookStore from "@/store/notebookStore";
import ViewMode from "@/components/notebook/ViewMode";
import EditMode from "@/components/notebook/EditMode";
import TemplatePicker from "@/components/notebook/TemplatePicker";
import { NOTEBOOK_TEMPLATES, NotebookTemplate } from "@/lib/notebookTemplates";
import notifications from "@/store/notifications";

const Notebook = () => {
  const { notes, setNotes, selectedFolder, setFolder, selectedFile, setFile } = notebookStore();
  const { setAlertBoxG } = notifications();

  const [mode, setMode] = useState("VIEW");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileView, setMobileView] = useState<"folders" | "notes" | "editor">("folders");
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<NotebookTemplate | null>(null);
  const [showNewNoteInput, setShowNewNoteInput] = useState(false);
  const [newNoteName, setNewNoteName] = useState("");
  const [targetFolder, setTargetFolder] = useState<string | null>(null);
  
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  
  const [folderMenuOpen, setFolderMenuOpen] = useState<string | null>(null);
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState("");
  
  const [editingNote, setEditingNote] = useState<{ folder: string; file: string } | null>(null);
  const [editNoteName, setEditNoteName] = useState("");
  const [noteMenuOpen, setNoteMenuOpen] = useState<string | null>(null);

  const changeMode = (mode: string) => setMode(mode);
  
  useEffect(() => {
    setNotes();
  }, [setNotes]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-context-menu]') && !target.closest('[data-menu-trigger]')) {
        setFolderMenuOpen(null);
        setNoteMenuOpen(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (notes.length > 0) {
      setExpandedFolders(new Set(notes.map(n => n.folderName)));
    }
  }, [notes]);

  const totalNotes = useMemo(() => 
    notes.reduce((acc, folder) => acc + (folder.files?.length || 0), 0)
  , [notes]);

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const query = searchQuery.toLowerCase();
    return notes.map(folder => ({
      ...folder,
      files: folder.files?.filter(file => 
        file.filename.toLowerCase().includes(query)
      ) || []
    })).filter(folder => 
      folder.folderName.toLowerCase().includes(query) || folder.files.length > 0
    );
  }, [notes, searchQuery]);

  const currentFolderNotes = useMemo(() => {
    if (!selectedFolder) return [];
    const folder = notes.find(f => f.folderName === selectedFolder);
    const files = folder?.files || [];
    if (!searchQuery.trim()) return files;
    const query = searchQuery.toLowerCase();
    return files.filter(file => file.filename.toLowerCase().includes(query));
  }, [notes, selectedFolder, searchQuery]);

  const allNotesFlat = useMemo(() => {
    const allNotes: { folder: string; file: any }[] = [];
    notes.forEach(folder => {
      folder.files?.forEach(file => {
        allNotes.push({ folder: folder.folderName, file });
      });
    });
    const sorted = allNotes.sort((a, b) => 
      new Date(b.file.lastUpdate || b.file.created).getTime() - 
      new Date(a.file.lastUpdate || a.file.created).getTime()
    );
    if (!searchQuery.trim()) return sorted;
    const query = searchQuery.toLowerCase();
    return sorted.filter(item => item.file.filename.toLowerCase().includes(query));
  }, [notes, searchQuery]);

  const handleFolderSelect = (folderName: string) => {
    setFolder(folderName);
    setFile("");
    setMobileView("notes");
  };

  const handleNoteSelect = (folderName: string, fileName: string) => {
    setFolder(folderName);
    setFile(fileName);
    setMobileView("editor");
    setMode("VIEW");
    setFolderMenuOpen(null);
    setNoteMenuOpen(null);
  };

  const handleNewNoteInFolder = (folderName: string) => {
    setTargetFolder(folderName);
    setShowTemplatePicker(true);
  };

  const handleTemplateSelect = (template: NotebookTemplate) => {
    setSelectedTemplate(template);
    setShowTemplatePicker(false);
    setShowNewNoteInput(true);
  };

  const createNote = async () => {
    if (!newNoteName.trim() || !targetFolder) return;

    const defaultFields: Record<string, string> = {};
    if (selectedTemplate) {
      selectedTemplate.fields.forEach(field => {
        defaultFields[field.id] = field.defaultValue || "";
      });
    }

    try {
      const response = await fetch(`/api/notebook/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          newFile: newNoteName, 
          folderName: targetFolder, 
          apiName: 'createFile',
          templateId: selectedTemplate?.id || null,
          templateFields: selectedTemplate ? defaultFields : null
        }),
      });

      if (response.ok) {
        setNewNoteName("");
        setShowNewNoteInput(false);
        setSelectedTemplate(null);
        setTargetFolder(null);
        await setNotes();
        handleNoteSelect(targetFolder, newNoteName);
      } else {
        const data = await response.json();
        if (data.error === "File already exists") {
          setAlertBoxG("Note already exists", "error");
        }
      }
    } catch (error) {
      console.error("Error creating note:", error);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const response = await fetch(`/api/notebook/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newFolder: newFolderName, apiName: 'createFolder' }),
      });

      if (response.ok) {
        setNewFolderName("");
        setShowNewFolderInput(false);
        await setNotes();
        setExpandedFolders(prev => new Set([...prev, newFolderName]));
        handleFolderSelect(newFolderName);
      } else {
        const data = await response.json();
        if (data.error === "Folder already exists") {
          setAlertBoxG("Folder already exists", "error");
        }
      }
    } catch (error) {
      console.error("Error creating folder:", error);
    }
  };

  const deleteFolder = async (folderName: string) => {
    try {
      const response = await fetch(`/api/notebook/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName, apiName: 'deleteFolder' }),
      });

      if (response.ok) {
        setFolderMenuOpen(null);
        if (selectedFolder === folderName) {
          setFolder("");
          setFile("");
        }
        await setNotes();
      }
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  const renameFolder = async (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) {
      setEditingFolder(null);
      return;
    }

    try {
      const response = await fetch(`/api/notebook/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName: oldName, newFolderName: newName, apiName: 'renameFolder' }),
      });

      if (response.ok) {
        setEditingFolder(null);
        if (selectedFolder === oldName) {
          setFolder(newName);
        }
        await setNotes();
      }
    } catch (error) {
      console.error("Error renaming folder:", error);
    }
  };

  const deleteNote = async (folderName: string, fileName: string) => {
    try {
      const response = await fetch(`/api/notebook/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName, fileName, apiName: 'deleteFile' }),
      });

      if (response.ok) {
        if (selectedFile === fileName) {
          setFile("");
        }
        await setNotes();
      }
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const renameNote = async (folderName: string, oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) {
      setEditingNote(null);
      return;
    }

    try {
      const response = await fetch(`/api/notebook/post`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderName, fileName: oldName, renameFile: newName, apiName: 'renameFile' }),
      });

      if (response.ok) {
        setEditingNote(null);
        if (selectedFile === oldName) {
          setFile(newName);
        }
        await setNotes();
      } else {
        setAlertBoxG("Failed to rename note", "error");
      }
    } catch (error) {
      console.error("Error renaming note:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="h-screen bg-[#1c1c1e] flex overflow-hidden">
      {/* Column 1: Folders */}
      <div className={`${mobileView === "folders" ? "flex" : "hidden"} md:flex flex-col w-full md:w-[240px] bg-[#2c2c2e] border-r border-[#3a3a3c]`}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-[#3a3a3c]">
          <h1 className="text-[15px] font-semibold text-white">Folders</h1>
          <button
            onClick={() => setShowNewFolderInput(true)}
            className="p-1.5 rounded-md hover:bg-[#3a3a3c] transition-colors"
          >
            <FolderPlus className="h-4 w-4 text-[#ffd60a]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {showNewFolderInput && (
            <div className="px-3 py-2 border-b border-[#3a3a3c]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New Folder"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createFolder()}
                  autoFocus
                  className="flex-1 px-3 py-1.5 bg-[#1c1c1e] border border-[#ffd60a]/50 rounded-md text-sm text-white placeholder:text-[#8e8e93] focus:outline-none focus:border-[#ffd60a]"
                />
                <button onClick={createFolder} className="p-1.5 rounded-md bg-[#ffd60a]/20 hover:bg-[#ffd60a]/30 text-[#ffd60a]">
                  <Check className="h-4 w-4" />
                </button>
                <button onClick={() => { setShowNewFolderInput(false); setNewFolderName(""); }} className="p-1.5 rounded-md hover:bg-[#3a3a3c] text-[#8e8e93]">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* All Notes */}
          <div
            onClick={() => { setFolder(""); setFile(""); setMobileView("notes"); }}
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
              !selectedFolder ? "bg-[#ffd60a]/10" : "hover:bg-[#3a3a3c]/50"
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#ffd60a]/20 flex items-center justify-center">
              <FileText className="h-4 w-4 text-[#ffd60a]" />
            </div>
            <div className="flex-1">
              <span className="text-[15px] text-white">All Notes</span>
            </div>
            <span className="text-[13px] text-[#8e8e93]">{totalNotes}</span>
          </div>

          <div className="h-px bg-[#3a3a3c] mx-4 my-1" />

          {/* Folder list */}
          <div className="py-1">
            {filteredNotes.map((folder) => {
              const isSelected = selectedFolder === folder.folderName;
              const isEditing = editingFolder === folder.folderName;

              return (
                <div key={folder.folderName} className="relative group">
                  <div
                    onClick={() => !isEditing && handleFolderSelect(folder.folderName)}
                    className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors ${
                      isSelected ? "bg-[#ffd60a]/10" : "hover:bg-[#3a3a3c]/50"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected ? "bg-[#ffd60a]/20" : "bg-[#48484a]"
                    }`}>
                      <FolderIcon className={`h-4 w-4 ${isSelected ? "text-[#ffd60a]" : "text-[#8e8e93]"}`} />
                    </div>
                    
                    {isEditing ? (
                      <input
                        type="text"
                        value={editFolderName}
                        onChange={(e) => setEditFolderName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") renameFolder(folder.folderName, editFolderName);
                          if (e.key === "Escape") setEditingFolder(null);
                        }}
                        onBlur={() => renameFolder(folder.folderName, editFolderName)}
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 px-2 py-0.5 bg-[#1c1c1e] border border-[#ffd60a]/50 rounded text-sm text-white focus:outline-none"
                      />
                    ) : (
                      <span className="flex-1 text-[15px] text-white truncate">{folder.folderName}</span>
                    )}
                    
                    <span className="text-[13px] text-[#8e8e93]">{folder.files?.length || 0}</span>
                    
                    <div className="relative">
                      <button
                        data-menu-trigger
                        onClick={(e) => {
                          e.stopPropagation();
                          setFolderMenuOpen(folderMenuOpen === folder.folderName ? null : folder.folderName);
                        }}
                        className="p-1 rounded hover:bg-[#48484a] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreHorizontal className="h-4 w-4 text-[#8e8e93]" />
                      </button>
                      
                      {folderMenuOpen === folder.folderName && (
                        <div data-context-menu className="absolute right-0 top-full mt-1 w-36 bg-[#2c2c2e] border border-[#3a3a3c] rounded-lg shadow-xl z-50 overflow-hidden">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleNewNoteInFolder(folder.folderName); setFolderMenuOpen(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-[#3a3a3c] text-white"
                          >
                            <Plus className="h-4 w-4" /> New Note
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingFolder(folder.folderName);
                              setEditFolderName(folder.folderName);
                              setFolderMenuOpen(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-[#3a3a3c] text-white"
                          >
                            <Pencil className="h-4 w-4" /> Rename
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteFolder(folder.folderName); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-[#3a3a3c] text-[#ff453a]"
                          >
                            <Trash2 className="h-4 w-4" /> Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredNotes.length === 0 && !showNewFolderInput && (
            <div className="text-center py-12 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#3a3a3c] flex items-center justify-center">
                <FolderIcon className="h-8 w-8 text-[#8e8e93]" />
              </div>
              <p className="text-[15px] text-[#8e8e93] mb-3">No Folders</p>
              <button
                onClick={() => setShowNewFolderInput(true)}
                className="text-[13px] text-[#ffd60a] hover:underline"
              >
                Create your first folder
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Column 2: Notes List */}
      <div className={`${mobileView === "notes" ? "flex" : "hidden"} md:flex flex-col w-full md:w-[320px] bg-[#1c1c1e] border-r border-[#3a3a3c]`}>
        <div className="h-14 flex items-center gap-3 px-4 border-b border-[#3a3a3c]">
          <button
            onClick={() => setMobileView("folders")}
            className="md:hidden p-1.5 rounded-md hover:bg-[#3a3a3c] transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-[#ffd60a]" />
          </button>
          <h2 className="text-[15px] font-semibold text-white flex-1 truncate">
            {selectedFolder || "All Notes"}
          </h2>
          <button
            onClick={() => {
              if (selectedFolder) {
                handleNewNoteInFolder(selectedFolder);
              } else if (notes.length > 0) {
                setTargetFolder(notes[0].folderName);
                setShowTemplatePicker(true);
              } else {
                setShowNewFolderInput(true);
                setMobileView("folders");
              }
            }}
            className="p-1.5 rounded-md hover:bg-[#3a3a3c] transition-colors"
          >
            <Plus className="h-5 w-5 text-[#ffd60a]" />
          </button>
        </div>

        <div className="px-3 py-2 border-b border-[#3a3a3c]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8e8e93]" />
            <input
              type="text"
              placeholder="Search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#3a3a3c] rounded-lg text-[13px] text-white placeholder:text-[#8e8e93] focus:outline-none focus:ring-1 focus:ring-[#ffd60a]/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {(selectedFolder ? currentFolderNotes : allNotesFlat.map(r => ({ ...r.file, folder: r.folder }))).length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#3a3a3c] flex items-center justify-center">
                <FileText className="h-8 w-8 text-[#8e8e93]" />
              </div>
              <p className="text-[15px] text-[#8e8e93] mb-3">No Notes</p>
              {selectedFolder && (
                <button
                  onClick={() => handleNewNoteInFolder(selectedFolder)}
                  className="text-[13px] text-[#ffd60a] hover:underline"
                >
                  Create a note
                </button>
              )}
            </div>
          ) : (
            <div>
              {(selectedFolder ? currentFolderNotes : allNotesFlat).map((item) => {
                const file = selectedFolder ? item : item.file;
                const folder = selectedFolder || item.folder;
                const isSelected = selectedFile === file.filename && selectedFolder === folder;
                const noteKey = `${folder}-${file.filename}`;
                const isEditingThisNote = editingNote?.folder === folder && editingNote?.file === file.filename;

                return (
                  <motion.div
                    key={noteKey}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => !isEditingThisNote && handleNoteSelect(folder, file.filename)}
                    className={`group relative px-4 py-3 cursor-pointer border-b border-[#3a3a3c]/50 transition-colors ${
                      isSelected ? "bg-[#ffd60a]/10" : "hover:bg-[#2c2c2e]"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        {isEditingThisNote ? (
                          <input
                            type="text"
                            value={editNoteName}
                            onChange={(e) => setEditNoteName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") renameNote(folder, file.filename, editNoteName);
                              if (e.key === "Escape") setEditingNote(null);
                            }}
                            onBlur={() => renameNote(folder, file.filename, editNoteName)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="w-full px-2 py-1 bg-[#1c1c1e] border border-[#ffd60a]/50 rounded text-[15px] text-white focus:outline-none"
                          />
                        ) : (
                          <>
                            <h3 className={`text-[15px] font-medium truncate ${isSelected ? "text-white" : "text-white"}`}>
                              {file.filename}
                            </h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[12px] text-[#8e8e93]">
                                {formatDate(file.lastUpdate || file.created || new Date().toISOString())}
                              </span>
                              {!selectedFolder && (
                                <>
                                  <span className="text-[#3a3a3c]">·</span>
                                  <span className="text-[12px] text-[#8e8e93] truncate">{folder}</span>
                                </>
                              )}
                            </div>
                            <p className="text-[13px] text-[#8e8e93] truncate mt-1 line-clamp-2">
                              {typeof file.content === 'string' ? file.content.substring(0, 80) : "No additional text"}
                            </p>
                          </>
                        )}
                      </div>

                      <div className="relative flex-shrink-0">
                        <button
                          data-menu-trigger
                          onClick={(e) => {
                            e.stopPropagation();
                            setNoteMenuOpen(noteMenuOpen === noteKey ? null : noteKey);
                            setFolderMenuOpen(null);
                          }}
                          className="p-1 rounded hover:bg-[#48484a] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="h-4 w-4 text-[#8e8e93]" />
                        </button>
                        
                        {noteMenuOpen === noteKey && (
                          <div data-context-menu className="absolute right-0 top-full mt-1 w-32 bg-[#2c2c2e] border border-[#3a3a3c] rounded-lg shadow-xl z-50 overflow-hidden">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingNote({ folder, file: file.filename });
                                setEditNoteName(file.filename);
                                setNoteMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-[#3a3a3c] text-white"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Rename
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNote(folder, file.filename);
                                setNoteMenuOpen(null);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-[13px] hover:bg-[#3a3a3c] text-[#ff453a]"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Column 3: Editor */}
      <div className={`${mobileView === "editor" ? "flex" : "hidden"} md:flex flex-1 flex-col bg-[#1c1c1e] overflow-hidden`}>
        {/* Mobile back button */}
        <div className="md:hidden h-14 flex items-center gap-3 px-4 border-b border-[#3a3a3c]">
          <button
            onClick={() => setMobileView("notes")}
            className="p-1.5 rounded-md hover:bg-[#3a3a3c] transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-[#ffd60a]" />
          </button>
          <span className="text-[15px] font-medium text-white truncate">{selectedFile || "Note"}</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!selectedFile ? (
            <div className="h-full flex items-center justify-center p-8">
              <div className="max-w-md text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[#ffd60a]/20 to-[#ff9500]/20 flex items-center justify-center">
                  <FileText className="h-12 w-12 text-[#ffd60a]" />
                </div>
                
                <h2 className="text-2xl font-semibold text-white mb-2">Select a Note</h2>
                <p className="text-[15px] text-[#8e8e93] mb-8">
                  Choose a note from the list or create a new one to get started
                </p>

                <div className="grid grid-cols-2 gap-3">
                  {NOTEBOOK_TEMPLATES.slice(0, 4).map((template) => {
                    const Icon = template.icon;
                    return (
                      <button
                        key={template.id}
                        onClick={() => {
                          if (notes.length > 0) {
                            setTargetFolder(selectedFolder || notes[0].folderName);
                            setSelectedTemplate(template);
                            setShowNewNoteInput(true);
                          } else {
                            setShowNewFolderInput(true);
                            setMobileView("folders");
                          }
                        }}
                        className="flex items-center gap-3 p-4 rounded-xl bg-[#2c2c2e] border border-[#3a3a3c] hover:border-[#ffd60a]/40 transition-all text-left group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#3a3a3c] flex items-center justify-center group-hover:bg-[#ffd60a]/20 transition-colors">
                          <Icon className="h-5 w-5 text-[#8e8e93] group-hover:text-[#ffd60a] transition-colors" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[13px] font-medium text-white">{template.name}</h4>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : mode === "VIEW" ? (
            <ViewMode
              notes={notes}
              selectedFolder={selectedFolder}
              selectedFile={selectedFile}
              changeMode={changeMode}
            />
          ) : mode === "EDIT" ? (
            <EditMode
              notes={notes}
              selectedFolder={selectedFolder}
              selectedFile={selectedFile}
              changeMode={changeMode}
              setNotes={setNotes}
            />
          ) : null}
        </div>
      </div>

      {/* Template Picker Modal */}
      <TemplatePicker
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelect={handleTemplateSelect}
      />

      {/* New Note Modal */}
      <AnimatePresence>
        {showNewNoteInput && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => { setShowNewNoteInput(false); setSelectedTemplate(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#2c2c2e] border border-[#3a3a3c] rounded-2xl shadow-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                {selectedTemplate ? `New ${selectedTemplate.name}` : "New Note"}
              </h3>
              
              <div className="mb-4">
                <label className="text-[13px] text-[#8e8e93] mb-2 block">Note Title</label>
                <input
                  type="text"
                  placeholder="Enter note title..."
                  value={newNoteName}
                  onChange={(e) => setNewNoteName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createNote()}
                  autoFocus
                  className="w-full px-4 py-3 bg-[#1c1c1e] border border-[#3a3a3c] rounded-lg text-[15px] text-white placeholder:text-[#8e8e93] focus:outline-none focus:ring-1 focus:ring-[#ffd60a]/50 focus:border-[#ffd60a]/50"
                />
              </div>

              {targetFolder && (
                <p className="text-[13px] text-[#8e8e93] mb-4">
                  Folder: <span className="text-white font-medium">{targetFolder}</span>
                </p>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowNewNoteInput(false); setSelectedTemplate(null); setNewNoteName(""); }}
                  className="flex-1 px-4 py-2.5 bg-[#3a3a3c] text-white rounded-lg hover:bg-[#48484a] transition-all text-[15px] font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createNote}
                  disabled={!newNoteName.trim()}
                  className="flex-1 px-4 py-2.5 bg-[#ffd60a] text-black rounded-lg hover:bg-[#ffd60a]/90 transition-all text-[15px] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Notebook;
