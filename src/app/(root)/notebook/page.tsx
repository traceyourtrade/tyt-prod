"use client"
import { useEffect, useState } from "react";
import { Search, Filter, Plus, FolderPlus, Menu, X, ChevronLeft } from "lucide-react";
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-4 md:px-6 py-3 md:py-4">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Mobile Menu Button */}
          <button 
            onClick={() => setShowMobileSidebar(true)}
            className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="h-5 w-5 text-muted-foreground" />
          </button>

          {/* Mobile Back Button */}
          {mobilePanel !== "folders" && (
            <button 
              onClick={mobilePanel === "content" ? handleBackToFiles : handleBackToFolders}
              className="md:hidden p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </button>
          )}

          {/* Search */}
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              name="search"
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 md:py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>

          {/* Filter Button */}
          <button className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Filter</span>
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-card border-r border-border p-4 overflow-y-auto animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">Notebooks</h2>
              <button 
                onClick={() => setShowMobileSidebar(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
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
        </div>
      )}

      {/* Main Content - Desktop: Three columns, Mobile: Single panel */}
      <div className="flex h-[calc(100vh-65px)]">
        {/* Left Sidebar - Folders (Hidden on mobile) */}
        <div className="hidden md:block w-64 lg:w-72 flex-shrink-0 border-r border-border bg-card/50 overflow-hidden">
          <div className="h-full overflow-y-auto p-4">
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
        </div>

        {/* Middle - Files (Hidden on mobile when not active) */}
        <div className={`${mobilePanel === "files" ? "flex" : "hidden"} md:flex w-full md:w-72 lg:w-80 flex-shrink-0 border-r border-border bg-card/30 overflow-hidden flex-col`}>
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

        {/* Right - Content (Hidden on mobile when not active) */}
        <div className={`${mobilePanel === "content" ? "flex" : "hidden"} md:flex flex-1 overflow-hidden flex-col`}>
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

        {/* Mobile: Show folders panel */}
        {mobilePanel === "folders" && (
          <div className="flex md:hidden w-full flex-col overflow-hidden">
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
      </div>
    </div>
  )
}

export default Notebook;
