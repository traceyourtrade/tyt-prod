"use client"
import { useRef, useEffect } from "react";
import { 
  Pencil, 
  FileText, 
  Calendar, 
  Clock,
  BookOpen
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
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
          <BookOpen className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium text-foreground mb-2">Select a note</h3>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Choose a note from the list to view its contents, or create a new one to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-4 md:px-8 py-4 md:py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-semibold text-foreground truncate">
              {currentFileData?.content?.title || 'Untitled'}
            </h1>
            <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>Created {createdDate}</span>
              </div>
              {lastUpdatedDate && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Updated {lastUpdatedDate}</span>
                </div>
              )}
            </div>
          </div>
          <button 
            onClick={() => changeMode("EDIT")} 
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden md:inline">Edit</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <div
            ref={contentRef}
            className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-foreground leading-relaxed"
            dangerouslySetInnerHTML={
              currentFileData?.content?.content
                ? { __html: currentFileData.content.content }
                : { __html: '<p class="text-muted-foreground italic">No content yet. Click Edit to add content.</p>' }
            }
          />
        </div>
      </div>
    </div>
  );
}

export default ViewMode;
