"use client"
import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Pencil, 
  FileText, 
  Calendar, 
  Clock,
  BookOpen,
  Sparkles,
  ChevronRight,
  Edit3
} from "lucide-react";

interface FileContent {
  title: string;
  content: string;
}

interface FileType {
  filename: string;
  created: string;
  lastUpdate?: string;
  content?: FileContent;
}

interface NoteType {
  folderName: string;
  files: FileType[];
}

interface ViewModeProps {
  notes: NoteType[];
  selectedFolder: string;
  selectedFile: string;
  changeMode: (mode: string) => void;
}

const ViewMode = ({ notes, selectedFolder, selectedFile, changeMode }: ViewModeProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const currentFileData = notes
    .find(note => note.folderName === selectedFolder)
    ?.files?.find(file => file.filename === selectedFile);

  const createdDate = currentFileData?.created
    ? new Date(currentFileData.created).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  const lastUpdatedDate = currentFileData?.lastUpdate
    ? new Date(currentFileData.lastUpdate).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  useEffect(() => {
    if (contentRef.current && currentFileData?.content?.content) {
      contentRef.current.innerHTML = currentFileData.content.content;
    }
  }, [currentFileData]);

  if (!currentFileData?.content?.title) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex flex-col items-center justify-center p-8"
      >
        {/* Premium Empty State */}
        <div className="relative mb-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 via-muted to-profit/10 flex items-center justify-center border border-border"
          >
            <BookOpen className="h-10 w-10 text-primary/60" />
          </motion.div>
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 15 }}
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br from-profit/20 to-profit/10 flex items-center justify-center border border-profit/20"
          >
            <Sparkles className="h-5 w-5 text-profit" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <h3 className="text-lg font-semibold text-foreground mb-2">Select a note</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            Choose a note from the sidebar to view its contents, or create a new one to start documenting
          </p>

          {/* Quick Start Tips */}
          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            {[
              { icon: FileText, text: "Document trade ideas & setups" },
              { icon: Calendar, text: "Write weekly market reviews" },
              { icon: Edit3, text: "Keep strategy notes organized" },
            ].map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3 px-4 py-2.5 bg-muted/30 rounded-lg border border-border"
              >
                <tip.icon className="h-4 w-4 text-primary/60" />
                <span className="text-xs text-muted-foreground">{tip.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col"
    >
      {/* Premium Header with Gradient */}
      <div className="flex-shrink-0 border-b border-border bg-card/30">
        {/* Subtle gradient accent */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        <div className="px-4 md:px-8 py-4 md:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2">
                <span className="hover:text-foreground cursor-pointer transition-colors">{selectedFolder}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-medium truncate">{selectedFile}</span>
              </div>
              
              <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
                {currentFileData?.content?.title || 'Untitled'}
              </h1>
              
              <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Created {createdDate}</span>
                </div>
                {lastUpdatedDate && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Updated {lastUpdatedDate}</span>
                  </div>
                )}
              </div>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => changeMode("EDIT")} 
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary transition-all text-sm font-medium shadow-sm"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden md:inline">Edit</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-4 md:px-8 py-6"
        >
          <div className="max-w-3xl mx-auto">
            {/* Note Content Card */}
            <div className="bg-card/50 border border-border rounded-xl p-6 md:p-8">
              <div
                ref={contentRef}
                className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-foreground leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-medium [&_p]:text-sm [&_ul]:text-sm [&_ol]:text-sm [&_li]:my-1"
                dangerouslySetInnerHTML={
                  currentFileData?.content?.content
                    ? { __html: currentFileData.content.content }
                    : { __html: '<p class="text-muted-foreground italic">No content yet. Click Edit to add content.</p>' }
                }
              />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ViewMode;
