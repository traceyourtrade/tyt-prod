"use client"
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Filter, 
  Menu, 
  X, 
  ChevronLeft, 
  BookOpen,
  PanelLeftClose,
  PanelLeft
} from "lucide-react";
import notebookStore from "@/store/notebookStore";
import Files from "@/components/notebook/Files";
import Folder from "@/components/notebook/Folder";
import ViewMode from "@/components/notebook/ViewMode";
import EditMode from "@/components/notebook/EditMode";

const Notebook = () => {
  const { notes, setNotes, selectedFolder, setFolder, selectedFile, setFile } = notebookStore();

  const [mode, setMode] = useState("VIEW");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobilePanel, setMobilePanel] = useState<"folders" | "files" | "content">("folders");
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isFolderPanelOpen, setIsFolderPanelOpen] = useState(true);

  const changeMode = (mode: string) => {
    setMode(mode)
  }

  const [newFile, setNewFile] = useState("")
  const [newFolder, setNewFolder] = useState("")
  const [fileShow, setFileShow] = useState(false);
  
  useEffect(() => {
    setNotes();
  }, [setNotes])

  const handleFolderSelect = (folderName: string) => {
    setFolder(folderName);
    setMobilePanel("files");
  };

  const handleFileSelect = (fileName: string) => {
    setFile(fileName);
    setMobilePanel("content");
  };

  const handleBackToFolders = () => {
    setMobilePanel("folders");
  };

  const handleBackToFiles = () => {
    setMobilePanel("files");
  };

  const totalNotes = notes.reduce((acc, folder) => acc + (folder.files?.length || 0), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="h-0.5 bg-gradient-to-r from-primary via-profit to-primary opacity-60" />
        
        <div className="px-3 md:px-6 py-2.5 md:py-4">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Back Button */}
            {mobilePanel !== "folders" ? (
              <button 
                onClick={mobilePanel === "content" ? handleBackToFiles : handleBackToFolders}
                className="md:hidden p-2 -ml-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
              >
                <ChevronLeft className="h-5 w-5 text-muted-foreground" />
              </button>
            ) : (
              <div className="md:hidden w-7 h-7 rounded-lg bg-gradient-to-br from-primary/20 to-profit/20 flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
              </div>
            )}

            {/* Mobile Title */}
            <div className="md:hidden flex-1 min-w-0">
              <h1 className="text-sm font-semibold text-foreground truncate">
                {mobilePanel === "folders" ? "Notebook" : mobilePanel === "files" ? selectedFolder : "Note"}
              </h1>
              {mobilePanel === "folders" && (
                <p className="text-[10px] text-muted-foreground">
                  {notes.length} folders · {totalNotes} notes
                </p>
              )}
            </div>

            {/* Desktop Folder Panel Toggle */}
            <button
              onClick={() => setIsFolderPanelOpen(!isFolderPanelOpen)}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
              title={isFolderPanelOpen ? "Hide folders" : "Show folders"}
            >
              {isFolderPanelOpen ? (
                <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
              ) : (
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {/* Desktop Title with Stats */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-profit/20 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h1 className="text-sm font-semibold text-foreground">Notebook</h1>
                  <p className="text-[10px] text-muted-foreground">
                    {notes.length} folders · {totalNotes} notes
                  </p>
                </div>
              </div>
            </div>

            {/* Search - Hidden on mobile folders view, show icon only */}
            <div className="hidden md:flex flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                name="search"
                type="text"
                placeholder="Search notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-background/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
              />
            </div>

            {/* Mobile Search Button */}
            <button className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors flex-shrink-0">
              <Search className="h-5 w-5 text-muted-foreground" />
            </button>

            {/* Filter Button */}
            <button className="hidden md:flex items-center gap-2 px-3 py-2 bg-muted/50 border border-border rounded-lg hover:bg-muted hover:border-primary/30 transition-all group flex-shrink-0">
              <Filter className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showMobileSidebar && (
          <div className="fixed inset-0 z-50 md:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowMobileSidebar(false)}
            />
            <motion.div 
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="absolute left-0 top-0 bottom-0 w-80 bg-card border-r border-border overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-4 border-b border-border bg-muted/30">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-profit/20 flex items-center justify-center">
                    <BookOpen className="h-4 w-4 text-primary" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Notebooks</h2>
                </div>
                <button 
                  onClick={() => setShowMobileSidebar(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
              
              <div className="p-4 overflow-y-auto h-[calc(100%-65px)]">
                <Folder
                  notes={notes}
                  setNotes={setNotes}
                  selectedFolder={selectedFolder}
                  changeMode={changeMode}
                  setFolder={(folder) => {
                    handleFolderSelect(folder);
                    setShowMobileSidebar(false);
                  }}
                  newFolder={newFolder}
                  setNewFolder={setNewFolder}
                  setNewFile={setNewFile}
                  setFileShow={setFileShow}
                  newFile={newFile}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content - Desktop Three Column Layout */}
      <div className="flex h-[calc(100vh-65px)]">
        {/* Left Panel - Folders (Collapsible on Desktop) */}
        <AnimatePresence>
          {isFolderPanelOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 240 }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="hidden md:block flex-shrink-0 border-r border-border bg-card/30 overflow-hidden"
            >
              <div className="w-60 h-full overflow-y-auto p-4">
                <Folder
                  notes={notes}
                  setNotes={setNotes}
                  selectedFolder={selectedFolder}
                  changeMode={changeMode}
                  setFolder={setFolder}
                  newFolder={newFolder}
                  setNewFolder={setNewFolder}
                  setNewFile={setNewFile}
                  setFileShow={setFileShow}
                  newFile={newFile}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Middle Panel - Files (Always visible on Desktop) */}
        <div className="hidden md:flex w-72 lg:w-80 flex-shrink-0 border-r border-border bg-card/20 overflow-hidden flex-col">
          <div className="h-full overflow-y-auto p-4">
            <Files
              newFile={newFile}
              notes={notes}
              setNotes={setNotes}
              selectedFolder={selectedFolder}
              newFolder={newFolder}
              setNewFolder={setNewFolder}
              fileShow={fileShow}
              setNewFile={setNewFile}
              setFileShow={setFileShow}
              changeMode={changeMode}
              setFile={handleFileSelect}
            />
          </div>
        </div>

        {/* Mobile: Folders Panel */}
        {mobilePanel === "folders" && (
          <div className="flex md:hidden w-full flex-col overflow-hidden bg-card/30">
            <div className="h-full overflow-y-auto p-4">
              <Folder
                notes={notes}
                setNotes={setNotes}
                selectedFolder={selectedFolder}
                changeMode={changeMode}
                setFolder={handleFolderSelect}
                newFolder={newFolder}
                setNewFolder={setNewFolder}
                setNewFile={setNewFile}
                setFileShow={setFileShow}
                newFile={newFile}
              />
            </div>
          </div>
        )}

        {/* Mobile: Files Panel */}
        {mobilePanel === "files" && (
          <div className="flex md:hidden w-full flex-col overflow-hidden bg-card/30">
            <div className="h-full overflow-y-auto p-4">
              <Files
                newFile={newFile}
                notes={notes}
                setNotes={setNotes}
                selectedFolder={selectedFolder}
                newFolder={newFolder}
                setNewFolder={setNewFolder}
                fileShow={fileShow}
                setNewFile={setNewFile}
                setFileShow={setFileShow}
                changeMode={changeMode}
                setFile={handleFileSelect}
              />
            </div>
          </div>
        )}

        {/* Right Panel - Content (Focus Canvas) */}
        <div className={`${mobilePanel === "content" ? "flex" : "hidden"} md:flex flex-1 overflow-hidden flex-col bg-background`}>
          <div className="h-full overflow-y-auto">
            {mode === "VIEW" ? (
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
    </div>
  )
}

export default Notebook;
