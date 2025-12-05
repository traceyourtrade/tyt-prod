"use client"
import { useEffect, useState } from "react";
import { Search, Filter, Plus } from "lucide-react";
import notebookStore from "@/store/notebookStore";
import Files from "@/components/notebook/Files";
import Folder from "@/components/notebook/Folder";
import ViewMode from "@/components/notebook/ViewMode";
import EditMode from "@/components/notebook/EditMode";

const Notebook = () => {
  const { notes, setNotes, selectedFolder, setFolder, selectedFile, setFile } = notebookStore();

  const [fileShow, setFileShow] = useState(false);
  const [mode, setMode] = useState("VIEW");
  const [searchQuery, setSearchQuery] = useState("");

  const changeMode = (mode: string) => {
    setMode(mode)
  }

  const [newFile, setNewFile] = useState("")
  const [newFolder, setNewFolder] = useState("")
  
  useEffect(() => {
    setNotes();
  }, [setNotes])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              name="search"
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border rounded-lg hover:bg-muted transition-colors">
            <Filter className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Filter</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Sidebar - Folders */}
        <div className="w-64 flex-shrink-0 border-r border-border p-4 overflow-y-auto">
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

        {/* Middle - Files */}
        <div className="w-72 flex-shrink-0 border-r border-border p-4 overflow-y-auto">
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
            setFile={setFile}
          />
        </div>

        {/* Right - Content */}
        <div className="flex-1 overflow-y-auto">
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
  )
}

export default Notebook;
