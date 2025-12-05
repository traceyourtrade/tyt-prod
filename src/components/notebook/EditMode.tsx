"use client"
import { useState, useRef, useEffect } from "react";
import { 
  Undo2, 
  Redo2, 
  Type, 
  Heading, 
  Bold, 
  Italic, 
  Underline, 
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Table,
  Image,
  Save,
  X,
  Calendar,
  Clock
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

interface EditModeProps {
  notes: NoteType[];
  selectedFolder: string;
  selectedFile: string;
  changeMode: (mode: string) => void;
  setNotes: () => Promise<void>;
}

interface FormattingState {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSize: string;
  fontName: string;
  align: string;
}

const EditMode = ({ notes, selectedFolder, selectedFile, changeMode, setNotes }: EditModeProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const currentFileData = notes
    .find(note => note.folderName === selectedFolder)
    ?.files?.find(file => file.filename === selectedFile);

  const [title, setTitle] = useState(currentFileData?.content?.title || '');

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

  const [currentFormatting, setCurrentFormatting] = useState<FormattingState>({
    bold: false,
    italic: false,
    underline: false,
    fontSize: "3",
    fontName: "Inter",
    align: "left"
  });

  const handleCommand = (command: string, value: string | null = null) => {
    document.execCommand(command, false, value ?? undefined);
    contentRef.current?.focus();

    if (command === "bold" || command === "italic" || command === "underline") {
      setCurrentFormatting(prev => ({
        ...prev,
        [command]: !prev[command as keyof Omit<FormattingState, 'fontSize' | 'fontName' | 'align'>]
      }));
    }

    if (command === "fontSize") {
      setCurrentFormatting(prev => ({
        ...prev,
        fontSize: value || "3",
      }));
    }

    if (command === "fontName") {
      setCurrentFormatting(prev => ({
        ...prev,
        fontName: value || "Inter"
      }));
    }

    if (command.startsWith("justify")) {
      const align = command.replace("justify", "").toLowerCase();
      setCurrentFormatting(prev => ({
        ...prev,
        align
      }));
    }
  };

  const handleListCommand = () => {
    document.execCommand('insertUnorderedList', false);
    contentRef.current?.focus();
  };

  const insertTable = () => {
    const rows = prompt("Enter number of rows:", "2");
    const cols = prompt("Enter number of columns:", "2");

    if (rows && cols) {
      const table = document.createElement("table");
      table.className = "w-full border-collapse my-4 text-foreground";
      (table as HTMLElement).contentEditable = "false";

      const headerRow = document.createElement("tr");
      for (let j = 0; j < parseInt(cols); j++) {
        const headerCell = document.createElement("th");
        headerCell.innerHTML = "Header";
        (headerCell as HTMLElement).contentEditable = "true";
        headerCell.className = "bg-muted font-semibold p-2 text-left border border-border";
        headerRow.appendChild(headerCell);
      }
      table.appendChild(headerRow);

      for (let i = 1; i < parseInt(rows); i++) {
        const row = document.createElement("tr");
        for (let j = 0; j < parseInt(cols); j++) {
          const cell = document.createElement("td");
          cell.innerHTML = "&nbsp;";
          (cell as HTMLElement).contentEditable = "true";
          cell.className = "border border-border p-2 text-left";
          row.appendChild(cell);
        }
        table.appendChild(row);
      }

      const selection = window.getSelection();
      if (!selection?.rangeCount) return;

      const range = selection.getRangeAt(0);
      range.deleteContents();
      range.insertNode(table);

      range.setStartAfter(table);
      range.setEndAfter(table);
      selection.removeAllRanges();
      selection.addRange(range);

      contentRef.current?.focus();
    }
  };

  const insertImage = (src: string) => {
    const selection = window.getSelection();

    if (!selection?.rangeCount) {
      const range = document.createRange();
      const editor = contentRef.current;
      if (!editor) return;
      range.selectNodeContents(editor);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }

    const range = selection?.getRangeAt(0);
    if (!range) return;

    const img = document.createElement("img");
    img.src = src;
    img.className = "max-w-full h-auto my-4 rounded-lg shadow-sm";
    (img as HTMLElement).contentEditable = "false";

    range.deleteContents();
    range.insertNode(img);

    const newRange = document.createRange();
    newRange.setStartAfter(img);
    newRange.collapse(true);
    selection?.removeAllRanges();
    selection?.addRange(newRange);

    contentRef.current?.focus();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      contentRef.current?.focus();

      const selection = window.getSelection();
      const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

      const reader = new FileReader();
      reader.onloadend = () => {
        if (range) {
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
        insertImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const content = contentRef.current?.innerHTML || '';
    const data = { title, content };

    try {
      const response = await fetch(`/api/notebook/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ selectedFolder, selectedFile, data, apiName: 'editNotebookFile' }),
      });

      if (response.ok) {
        setNotes();
        changeMode("VIEW");
      }
    } catch (error) {
      console.error("Error saving notebook:", error);
    }
  };

  const getTextAlignment = (element: Element) => {
    if ((element as HTMLElement).style.textAlign === "center") return "center";
    if ((element as HTMLElement).style.textAlign === "right") return "right";
    return "left";
  };

  useEffect(() => {
    const handleSelectionChange = () => {
      if (contentRef.current) {
        const selection = window.getSelection();
        if (selection?.rangeCount) {
          const range = selection.getRangeAt(0);
          const parentElement = range.commonAncestorContainer.parentElement;

          if (parentElement && contentRef.current.contains(parentElement)) {
            setCurrentFormatting({
              bold: document.queryCommandState("bold"),
              italic: document.queryCommandState("italic"),
              underline: document.queryCommandState("underline"),
              fontSize: document.queryCommandValue("fontSize"),
              fontName: document.queryCommandValue("fontName"),
              align: getTextAlignment(parentElement)
            });
          }
        }
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => document.removeEventListener("selectionchange", handleSelectionChange);
  }, []);

  useEffect(() => {
    setTitle(currentFileData?.content?.title || '');

    if (contentRef.current && currentFileData?.content?.content) {
      contentRef.current.innerHTML = currentFileData.content.content;
    }
  }, [currentFileData, selectedFolder, selectedFile]);

  const ToolbarButton = ({ 
    onClick, 
    active = false, 
    children,
    title 
  }: { 
    onClick: () => void; 
    active?: boolean; 
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-2 rounded-md transition-colors ${
        active 
          ? "bg-primary/20 text-primary" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );

  const ToolbarDivider = () => (
    <div className="w-px h-6 bg-border mx-1" />
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border px-4 md:px-8 py-4 md:py-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <input
              type="text"
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xl md:text-2xl font-semibold text-foreground bg-transparent border-none outline-none placeholder:text-muted-foreground"
            />
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
          <div className="flex items-center gap-2">
            <button 
              onClick={() => changeMode("VIEW")} 
              className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors text-sm"
            >
              <X className="h-4 w-4" />
              <span className="hidden md:inline">Cancel</span>
            </button>
            <button 
              onClick={handleSave} 
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm font-medium"
            >
              <Save className="h-4 w-4" />
              <span className="hidden md:inline">Save</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex-shrink-0 border-b border-border px-4 md:px-8 py-2 overflow-x-auto">
        <div className="flex items-center gap-0.5 min-w-max">
          {/* Undo/Redo */}
          <ToolbarButton onClick={() => handleCommand("undo")} title="Undo">
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={() => handleCommand("redo")} title="Redo">
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Text Size */}
          <ToolbarButton 
            onClick={() => handleCommand("fontSize", "3")} 
            active={currentFormatting.fontSize === "3"}
            title="Paragraph"
          >
            <Type className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => handleCommand("fontSize", "5")} 
            active={currentFormatting.fontSize === "5"}
            title="Heading"
          >
            <Heading className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Font */}
          <select
            className="h-8 px-2 text-sm bg-card border border-border rounded-md text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            value={currentFormatting.fontName}
            onChange={(e) => handleCommand("fontName", e.target.value)}
          >
            <option value="Inter">Inter</option>
            <option value="Arial">Arial</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Courier New">Courier New</option>
            <option value="Georgia">Georgia</option>
          </select>

          <ToolbarDivider />

          {/* Text Formatting */}
          <ToolbarButton 
            onClick={() => handleCommand("bold")} 
            active={currentFormatting.bold}
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => handleCommand("italic")} 
            active={currentFormatting.italic}
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => handleCommand("underline")} 
            active={currentFormatting.underline}
            title="Underline"
          >
            <Underline className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* List */}
          <ToolbarButton onClick={handleListCommand} title="Bullet List">
            <List className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Alignment */}
          <ToolbarButton 
            onClick={() => handleCommand("justifyLeft")} 
            active={currentFormatting.align === "left"}
            title="Align Left"
          >
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => handleCommand("justifyCenter")} 
            active={currentFormatting.align === "center"}
            title="Align Center"
          >
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton 
            onClick={() => handleCommand("justifyRight")} 
            active={currentFormatting.align === "right"}
            title="Align Right"
          >
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarDivider />

          {/* Insert */}
          <ToolbarButton 
            onClick={() => {
              const url = prompt("Enter URL:");
              if (url) handleCommand("createLink", url);
            }} 
            title="Insert Link"
          >
            <Link2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton onClick={insertTable} title="Insert Table">
            <Table className="h-4 w-4" />
          </ToolbarButton>
          <label className="cursor-pointer">
            <ToolbarButton onClick={() => {}} title="Insert Image">
              <Image className="h-4 w-4" />
            </ToolbarButton>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
        <div className="max-w-3xl mx-auto">
          <div
            ref={contentRef}
            contentEditable
            className="min-h-[400px] prose prose-sm md:prose-base dark:prose-invert max-w-none text-foreground leading-relaxed outline-none focus:outline-none empty:before:content-['Start_writing...'] empty:before:text-muted-foreground empty:before:pointer-events-none"
            suppressContentEditableWarning
          />
        </div>
      </div>
    </div>
  );
}

export default EditMode;
