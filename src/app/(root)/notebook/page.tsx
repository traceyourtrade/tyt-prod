"use client"
import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Plus,
  ChevronLeft, 
  BookOpen,
  ChevronRight,
  FolderPlus,
  FileText,
  Sparkles,
  MoreVertical,
  Trash2,
  Pencil,
  Check,
  X,
  Clock,
  Lightbulb,
  BarChart2,
  Calendar,
  Brain,
  PanelLeftClose,
  PanelLeft,
  FolderOpen,
  Folder as FolderIcon
} from "lucide-react";
import notebookStore from "@/store/notebookStore";
import ViewMode from "@/components/notebook/ViewMode";
import EditMode from "@/components/notebook/EditMode";
import TemplatePicker from "@/components/notebook/TemplatePicker";
import { NOTEBOOK_TEMPLATES, NotebookTemplate } from "@/lib/notebookTemplates";
import notifications from "@/store/notifications";

const folderColors = [
  { bg: "bg-blue-500/10", border: "border-blue-500/20", icon: "text-blue-500" },
  { bg: "bg-purple-500/10", border: "border-purple-500/20", icon: "text-purple-500" },
  { bg: "bg-amber-500/10", border: "border-amber-500/20", icon: "text-amber-500" },
  { bg: "bg-profit/10", border: "border-profit/20", icon: "text-profit" },
  { bg: "bg-pink-500/10", border: "border-pink-500/20", icon: "text-pink-500" },
  { bg: "bg-cyan-500/10", border: "border-cyan-500/20", icon: "text-cyan-500" },
];

const quickTemplates = NOTEBOOK_TEMPLATES.slice(0, 4);

const Notebook = () => {
  const { notes, setNotes, selectedFolder, setFolder, selectedFile, setFile } = notebookStore();
  const { setAlertBoxG } = notifications();

  const [mode, setMode] = useState("VIEW");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileView, setMobileView] = useState<"sidebar" | "content">("sidebar");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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

  const recentNotes = useMemo(() => {
    const allNotes: { folder: string; file: any }[] = [];
    notes.forEach(folder => {
      folder.files?.forEach(file => {
        allNotes.push({ folder: folder.folderName, file });
      });
    });
    return allNotes
      .sort((a, b) => new Date(b.file.lastUpdate || b.file.created).getTime() - new Date(a.file.lastUpdate || a.file.created).getTime())
      .slice(0, 5);
  }, [notes]);

  const toggleFolder = (folderName: string) => {
    setFolderMenuOpen(null);
    setNoteMenuOpen(null);
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderName)) {
        next.delete(folderName);
      } else {
        next.add(folderName);
      }
      return next;
    });
  };

  const handleNoteSelect = (folderName: string, fileName: string) => {
    setFolder(folderName);
    setFile(fileName);
    setMobileView("content");
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

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="h-0.5 bg-gradient-to-r from-primary via-profit to-primary opacity-60" />
        
        <div className="px-3 md:px-6 py-2.5 md:py-3">
          <div className="flex items-center gap-2 md:gap-4">
            {mobileView === "content" ? (
              <button 
                onClick={() => setMobileView("sidebar")}
                className="md:hidden p-2 -ml-1 rounded-lg hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>
            ) : (
              <div className="md:hidden w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-profit/20 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
            )}

            <div className="md:hidden flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-foreground truncate">
                {mobileView === "content" && selectedFile ? selectedFile : "Notebook"}
              </h1>
              {mobileView === "sidebar" && (
                <p className="text-[10px] text-muted-foreground">
                  {notes.length} folders · {totalNotes} notes
                </p>
              )}
            </div>

            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors"
              title={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
            >
              {isSidebarOpen ? (
                <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
              ) : (
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            <div className="hidden md:flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-profit/20 flex items-center justify-center">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground">Notebook</h1>
                <p className="text-[10px] text-muted-foreground">
                  {notes.length} folders · {totalNotes} notes
                </p>
              </div>
            </div>

            <div className="flex-1" />

            <button
              onClick={() => {
                setTargetFolder(selectedFolder || (notes[0]?.folderName || null));
                if (notes.length === 0) {
                  setShowNewFolderInput(true);
                } else {
                  setShowTemplatePicker(true);
                }
              }}
              className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-medium"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New Note</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-57px)]">
        <AnimatePresence>
          {(isSidebarOpen || mobileView === "sidebar") && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "100%" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className={`${mobileView === "sidebar" ? "flex" : "hidden"} md:flex flex-col border-r border-border bg-card/30 overflow-hidden md:w-80 md:flex-shrink-0`}
            >
              <div className="p-3 border-b border-border/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search notes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-background/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folders</span>
                  <button
                    onClick={() => setShowNewFolderInput(true)}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    title="New folder"
                  >
                    <FolderPlus className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </button>
                </div>

                {showNewFolderInput && (
                  <div className="mb-3 flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Folder name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && createFolder()}
                      autoFocus
                      className="flex-1 px-3 py-1.5 bg-background border border-primary/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button onClick={createFolder} className="p-1.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setShowNewFolderInput(false); setNewFolderName(""); }} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {filteredNotes.length === 0 && !showNewFolderInput ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-muted/50 flex items-center justify-center">
                      <FolderIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">No folders yet</p>
                    <button
                      onClick={() => setShowNewFolderInput(true)}
                      className="text-sm text-primary hover:underline"
                    >
                      Create your first folder
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredNotes.map((folder, idx) => {
                      const isExpanded = expandedFolders.has(folder.folderName);
                      const colorSet = folderColors[idx % folderColors.length];
                      const isEditing = editingFolder === folder.folderName;

                      return (
                        <div key={folder.folderName}>
                          <div 
                            className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all ${
                              selectedFolder === folder.folderName && !selectedFile 
                                ? "bg-primary/10 border border-primary/20" 
                                : "hover:bg-muted/50"
                            }`}
                          >
                            <button
                              onClick={() => toggleFolder(folder.folderName)}
                              className="p-0.5 rounded hover:bg-muted"
                            >
                              {isExpanded ? (
                                <ChevronRight className="h-4 w-4 text-muted-foreground rotate-90 transition-transform" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
                              )}
                            </button>
                            
                            <div className={`w-6 h-6 rounded-md ${colorSet.bg} flex items-center justify-center`}>
                              {isExpanded ? (
                                <FolderOpen className={`h-3.5 w-3.5 ${colorSet.icon}`} />
                              ) : (
                                <FolderIcon className={`h-3.5 w-3.5 ${colorSet.icon}`} />
                              )}
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
                                className="flex-1 px-2 py-0.5 bg-background border border-primary/50 rounded text-sm focus:outline-none"
                              />
                            ) : (
                              <span 
                                onClick={() => { setFolder(folder.folderName); toggleFolder(folder.folderName); }}
                                className="flex-1 text-sm font-medium text-foreground truncate"
                              >
                                {folder.folderName}
                              </span>
                            )}
                            
                            <span className="text-xs text-muted-foreground">{folder.files?.length || 0}</span>
                            
                            <div className="relative">
                              <button
                                data-menu-trigger
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFolderMenuOpen(folderMenuOpen === folder.folderName ? null : folder.folderName);
                                  setNoteMenuOpen(null);
                                }}
                                className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              </button>
                              
                              {folderMenuOpen === folder.folderName && (
                                <div data-context-menu className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                                  <button
                                    onClick={() => handleNewNoteInFolder(folder.folderName)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-foreground"
                                  >
                                    <Plus className="h-4 w-4" /> New Note
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingFolder(folder.folderName);
                                      setEditFolderName(folder.folderName);
                                      setFolderMenuOpen(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-foreground"
                                  >
                                    <Pencil className="h-4 w-4" /> Rename
                                  </button>
                                  <button
                                    onClick={() => deleteFolder(folder.folderName)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-loss"
                                  >
                                    <Trash2 className="h-4 w-4" /> Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="ml-6 pl-4 border-l border-border/50"
                              >
                                {folder.files?.length === 0 ? (
                                  <button
                                    onClick={() => handleNewNoteInFolder(folder.folderName)}
                                    className="w-full flex items-center gap-2 px-3 py-2 my-1 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all"
                                  >
                                    <Plus className="h-4 w-4" />
                                    <span>Add a note</span>
                                  </button>
                                ) : (
                                  folder.files?.map(file => {
                                    const isEditingThisNote = editingNote?.folder === folder.folderName && editingNote?.file === file.filename;
                                    const noteKey = `${folder.folderName}-${file.filename}`;
                                    
                                    return (
                                      <div
                                        key={file.filename}
                                        onClick={() => !isEditingThisNote && handleNoteSelect(folder.folderName, file.filename)}
                                        className={`group flex items-center gap-2 px-3 py-2 my-0.5 rounded-lg cursor-pointer transition-all ${
                                          selectedFile === file.filename && selectedFolder === folder.folderName
                                            ? "bg-primary/10 border border-primary/20"
                                            : "hover:bg-muted/50"
                                        }`}
                                      >
                                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                        {isEditingThisNote ? (
                                          <input
                                            type="text"
                                            value={editNoteName}
                                            onChange={(e) => setEditNoteName(e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") renameNote(folder.folderName, file.filename, editNoteName);
                                              if (e.key === "Escape") setEditingNote(null);
                                            }}
                                            onBlur={() => renameNote(folder.folderName, file.filename, editNoteName)}
                                            onClick={(e) => e.stopPropagation()}
                                            autoFocus
                                            className="flex-1 px-2 py-0.5 bg-background border border-primary/50 rounded text-sm focus:outline-none min-w-0"
                                          />
                                        ) : (
                                          <span className="flex-1 text-sm text-foreground truncate">{file.filename}</span>
                                        )}
                                        
                                        <div className="relative flex-shrink-0">
                                          <button
                                            data-menu-trigger
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setNoteMenuOpen(noteMenuOpen === noteKey ? null : noteKey);
                                              setFolderMenuOpen(null);
                                            }}
                                            className="p-1 rounded hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                          </button>
                                          
                                          {noteMenuOpen === noteKey && (
                                            <div data-context-menu className="absolute right-0 top-full mt-1 w-32 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setEditingNote({ folder: folder.folderName, file: file.filename });
                                                  setEditNoteName(file.filename);
                                                  setNoteMenuOpen(null);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-foreground"
                                              >
                                                <Pencil className="h-3.5 w-3.5" /> Rename
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  deleteNote(folder.folderName, file.filename);
                                                  setNoteMenuOpen(null);
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted text-loss"
                                              >
                                                <Trash2 className="h-3.5 w-3.5" /> Delete
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}

                {recentNotes.length > 0 && !searchQuery && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent</span>
                    </div>
                    <div className="space-y-1">
                      {recentNotes.map(({ folder, file }) => (
                        <div
                          key={`${folder}-${file.filename}`}
                          onClick={() => handleNoteSelect(folder, file.filename)}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-all"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground truncate">{file.filename}</p>
                            <p className="text-[10px] text-muted-foreground">{folder}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`${mobileView === "content" ? "flex" : "hidden"} md:flex flex-1 overflow-hidden flex-col bg-background`}>
          <div className="h-full overflow-y-auto">
            {!selectedFile ? (
              <div className="h-full flex items-center justify-center p-6">
                <div className="max-w-lg w-full text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-profit/20 flex items-center justify-center">
                    <BookOpen className="h-10 w-10 text-primary" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-foreground mb-2">Your Trading Notebook</h2>
                  <p className="text-muted-foreground mb-8">
                    Document trade ideas, analyze markets, and build your trading knowledge base.
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {quickTemplates.map((template) => {
                      const Icon = template.icon;
                      return (
                        <button
                          key={template.id}
                          onClick={() => {
                            setTargetFolder(selectedFolder || (notes[0]?.folderName || null));
                            if (!notes.length) {
                              setShowNewFolderInput(true);
                            } else {
                              setSelectedTemplate(template);
                              setShowNewNoteInput(true);
                            }
                          }}
                          className={`flex items-center gap-3 p-4 rounded-xl border ${template.borderColor} ${template.bgColor} hover:border-primary/40 transition-all text-left group`}
                        >
                          <div className={`w-10 h-10 rounded-lg ${template.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                            <Icon className={`h-5 w-5 ${template.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-foreground">{template.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{template.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setShowTemplatePicker(true)}
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <Sparkles className="h-4 w-4" />
                    View all templates
                  </button>

                  <div className="mt-8 pt-8 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Select a note from the sidebar or create a new one to get started
                    </p>
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
      </div>

      <TemplatePicker
        isOpen={showTemplatePicker}
        onClose={() => setShowTemplatePicker(false)}
        onSelect={handleTemplateSelect}
      />

      <AnimatePresence>
        {showNewNoteInput && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => { setShowNewNoteInput(false); setSelectedTemplate(null); }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">
                {selectedTemplate ? `New ${selectedTemplate.name}` : "New Note"}
              </h3>
              
              <div className="mb-4">
                <label className="text-sm text-muted-foreground mb-2 block">Note Title</label>
                <input
                  type="text"
                  placeholder="Enter note title..."
                  value={newNoteName}
                  onChange={(e) => setNewNoteName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && createNote()}
                  autoFocus
                  className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
                />
              </div>

              {targetFolder && (
                <p className="text-xs text-muted-foreground mb-4">
                  Will be created in: <span className="text-foreground font-medium">{targetFolder}</span>
                </p>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowNewNoteInput(false); setSelectedTemplate(null); setNewNoteName(""); }}
                  className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={createNote}
                  disabled={!newNoteName.trim()}
                  className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Note
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
