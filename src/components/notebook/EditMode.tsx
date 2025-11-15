import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faRotateLeft, 
    faRotateRight, 
    faParagraph, 
    faHeading, 
    faBold, 
    faItalic, 
    faUnderline, 
    faList, 
    faAlignLeft, 
    faAlignCenter, 
    faAlignRight, 
    faLink, 
    faTableCells, 
    faImage,
    faFilter,
    faChevronDown,
    faChevronRight,
    faFolder, // For the "fa fa-folder" class
    faPlus,
    faCirclePlus,
    faTrashCan,
    faPenToSquare,
    faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
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
    bkurl: string;
    changeMode: (mode: string) => void;
    setNotes: (userId: string, tokenn: string) => void;
    tokenn: string;
    userId: string;
}

interface FormattingState {
    bold: boolean;
    italic: boolean;
    underline: boolean;
    fontSize: string;
    fontName: string;
    align: string;
}

const EditMode = ({ notes, selectedFolder, selectedFile, bkurl, changeMode, setNotes, tokenn, userId }: EditModeProps) => {
    const contentRef = useRef<HTMLDivElement>(null);

    const currentFileData = notes
        .find(note => note.folderName === selectedFolder)
        ?.files?.find(file => file.filename === selectedFile);

    const [title, setTitle] = useState(currentFileData?.content?.title || '');

    // Format dates
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
        document.execCommand(command, false, value);
        contentRef.current?.focus();

        // Update state for toggle commands
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

    // Tool icons state
    const [para, setPara] = useState(true);
    const [heading, setHeading] = useState(false);
    const [bold, setBold] = useState(false);
    const [italic, setItalic] = useState(false);
    const [underline, setUl] = useState(false);
    const [alignLeft, setLeftAL] = useState(false);
    const [alignCenter, setCenterAL] = useState(false);
    const [alignRight, setRightAl] = useState(false);

    // Update the click handlers to use the new approach
    const clickPara = () => {
        handleCommand("fontSize", "3");
        setPara(true);
        setHeading(false);
    };

    const clickHeading = () => {
        handleCommand("fontSize", "5");
        setHeading(true);
        setPara(false);
    };

    const clickBold = () => {
        handleCommand("bold");
        setBold(!bold);
    };

    const clickItalic = () => {
        handleCommand("italic");
        setItalic(!italic);
    };

    const clickUnderline = () => {
        handleCommand("underline");
        setUl(!underline);
    };

    const clickLeftAL = () => {
        handleCommand("justifyLeft");
        setLeftAL(true);
        setCenterAL(false);
        setRightAl(false);
    };

    const clickCenterAL = () => {
        handleCommand("justifyCenter");
        setLeftAL(false);
        setCenterAL(true);
        setRightAl(false);
    };

    const clickRightAL = () => {
        handleCommand("justifyRight");
        setLeftAL(false);
        setCenterAL(false);
        setRightAl(true);
    };

    const handleListCommand = () => {
        const selection = window.getSelection();
        if (!selection?.rangeCount) return;

        const range = selection.getRangeAt(0);
        let node = range.commonAncestorContainer;

        let inList = false;
        while (node && node !== contentRef.current) {
            if (node.nodeName === 'UL' || node.nodeName === 'OL') {
                inList = true;
                break;
            }
            node = node.parentNode;
        }

        if (inList) {
            document.execCommand('insertUnorderedList', false, null);
        } else {
            document.execCommand('insertUnorderedList', false, null);
        }

        contentRef.current?.focus();
    };

    const insertTable = () => {
        const rows = prompt("Enter number of rows:", "2");
        const cols = prompt("Enter number of columns:", "2");

        if (rows && cols) {
            const table = document.createElement("table");
            table.className = "border-collapse w-full my-[10px]";
            table.contentEditable = false;

            // Add table headers (first row)
            const headerRow = document.createElement("tr");
            for (let j = 0; j < parseInt(cols); j++) {
                const headerCell = document.createElement("th");
                headerCell.innerHTML = "Header";
                headerCell.contentEditable = true;
                headerCell.className = "bg-[#6a6a6a] font-bold p-[8px] text-left";
                headerRow.appendChild(headerCell);
            }
            table.appendChild(headerRow);

            // Add table rows and cells
            for (let i = 1; i < parseInt(rows); i++) {
                const row = document.createElement("tr");
                for (let j = 0; j < parseInt(cols); j++) {
                    const cell = document.createElement("td");
                    cell.innerHTML = "&nbsp;";
                    cell.contentEditable = true;
                    cell.className = "border-b border-l border-[#ddd] p-[8px] text-left";
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
            selection.removeAllRanges();
            selection.addRange(range);
        }

        const range = selection.getRangeAt(0);

        const img = document.createElement("img");
        img.src = src;
        img.className = "max-w-full h-auto my-[10px] block cursor-pointer rounded-[4px] shadow-[0_2px_4px_rgba(0,0,0,0.1)]";
        img.contentEditable = false;

        range.deleteContents();
        range.insertNode(img);

        const newRange = document.createRange();
        newRange.setStartAfter(img);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

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
            const response = await fetch(`${bkurl}/tytusersasqwzxerdfcv/edit/notebookfile`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ tokenn, selectedFolder, selectedFile, data }),
            });

            if (response.ok) {
                setNotes(userId, tokenn)
                changeMode("VIEW")
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

    // Update formatting state when selection changes
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

    return (<>
        <div className="w-[65%] h-[70vh] bg-[rgba(114,113,113,0.268)] rounded-[25px] font-['Inter'] shadow-[rgba(100,100,111,0.2)_0px_7px_29px_0px]">

            <div className="w-[95%] h-auto mx-auto">
                <input
                    type="text"
                    placeholder="Enter title..."
                    className="w-[400px] p-[10px] text-[16px] border-none outline-none rounded-[25px] bg-[rgba(122,122,122,0.214)] my-[20px] pl-[20px] text-white h-[20px]"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            <span className="text-[10px] font-['Inter'] relative left-[40px] top-[-10px] text-white"> Created: {createdDate} | Last updated: {lastUpdatedDate}</span>

            <div className="w-[95%] mx-auto rounded-[25px] bg-[rgba(122,122,122,0.214)]">

                <div className="w-[95%] h-auto mx-auto flex items-center">
                    {/* Undo/Redo buttons */}
                    <button className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-pointer active:text-white" onClick={() => handleCommand("undo")}>
                        <FontAwesomeIcon icon={faRotateLeft} />
                    </button>
                    <button className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-pointer active:text-white" onClick={() => handleCommand("redo")}>
                        <FontAwesomeIcon icon={faRotateRight} />
                    </button>

                    {/* Paragraph/Heading */}
                    <button
                        className={`text-[17px] bg-transparent border-none mr-[10px] mt-[10px] font-extrabold cursor-pointer ${currentFormatting.fontSize === "3" ? "text-white" : "text-[#939393]"} active:text-white`}
                        onClick={clickPara}
                    >
                        <FontAwesomeIcon icon={faParagraph} />
                    </button>
                    <button
                        className={`text-[17px] bg-transparent border-none mr-[10px] mt-[10px] font-extrabold cursor-pointer ${currentFormatting.fontSize === "5" ? "text-white" : "text-[#939393]"} active:text-white`}
                        onClick={clickHeading}
                    >
                        <FontAwesomeIcon icon={faHeading} />
                    </button>

                    {/* Font selector */}
                    <select
                        className="bg-[#9d83dd] text-white border-none rounded-[25px] p-[3px_7px] text-[12px] cursor-pointer outline-none w-[150px] mt-[10px] mr-[10px] font-['Inter'] font-medium"
                        value={currentFormatting.fontName}
                        onChange={(e) => handleCommand("fontName", e.target.value)}
                    >
                        <option className="bg-[#ededed] text-black text-[12px] rounded-[20px] border-none cursor-pointer transition-colors duration-500 ease-in-out hover:bg-[#e0e0e0]" value="Inter">Poppins</option>
                        <option className="bg-[#ededed] text-black text-[12px] rounded-[20px] border-none cursor-pointer transition-colors duration-500 ease-in-out hover:bg-[#e0e0e0]" value="League Spartan">League Spartan</option>
                        <option className="bg-[#ededed] text-black text-[12px] rounded-[20px] border-none cursor-pointer transition-colors duration-500 ease-in-out hover:bg-[#e0e0e0]" value="Arial">Arial</option>
                        <option className="bg-[#ededed] text-black text-[12px] rounded-[20px] border-none cursor-pointer transition-colors duration-500 ease-in-out hover:bg-[#e0e0e0]" value="Times New Roman">Times Roman</option>
                        <option className="bg-[#ededed] text-black text-[12px] rounded-[20px] border-none cursor-pointer transition-colors duration-500 ease-in-out hover:bg-[#e0e0e0]" value="Courier New">Courier New</option>
                        <option className="bg-[#ededed] text-black text-[12px] rounded-[20px] border-none cursor-pointer transition-colors duration-500 ease-in-out hover:bg-[#e0e0e0]" value="Nunito">Nunito</option>
                    </select>

                    {/* Formatting buttons */}
                    <button
                        className={`text-[17px] bg-transparent border-none mr-[10px] mt-[10px] font-extrabold cursor-pointer ${currentFormatting.bold ? "text-white" : "text-[#939393]"} active:text-white`}
                        onClick={clickBold}
                    >
                        <FontAwesomeIcon icon={faBold} />
                    </button>
                    <button
                        className={`text-[17px] bg-transparent border-none mr-[10px] mt-[10px] font-extrabold cursor-pointer ${currentFormatting.italic ? "text-white" : "text-[#939393]"} active:text-white`}
                        onClick={clickItalic}
                    >
                        <FontAwesomeIcon icon={faItalic} />
                    </button>
                    <button
                        className={`text-[17px] bg-transparent border-none mr-[10px] mt-[10px] font-extrabold cursor-pointer ${currentFormatting.underline ? "text-white" : "text-[#939393]"} active:text-white`}
                        onClick={clickUnderline}
                    >
                        <FontAwesomeIcon icon={faUnderline} />
                    </button>

                    {/* List button */}
                    <button 
                        className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-pointer active:text-white"
                        onClick={handleListCommand}
                    >
                        <FontAwesomeIcon icon={faList} />
                    </button>

                    {/* Alignment buttons */}
                    <button
                        className={`text-[17px] bg-transparent border-none mr-[10px] mt-[10px] font-extrabold cursor-pointer ${currentFormatting.align === "left" ? "text-white" : "text-[#939393]"} active:text-white`}
                        onClick={clickLeftAL}
                    >
                        <FontAwesomeIcon icon={faAlignLeft} />
                    </button>
                    <button
                        className={`text-[17px] bg-transparent border-none mr-[10px] mt-[10px] font-extrabold cursor-pointer ${currentFormatting.align === "center" ? "text-white" : "text-[#939393]"} active:text-white`}
                        onClick={clickCenterAL}
                    >
                        <FontAwesomeIcon icon={faAlignCenter} />
                    </button>
                    <button
                        className={`text-[17px] bg-transparent border-none mr-[10px] mt-[10px] font-extrabold cursor-pointer ${currentFormatting.align === "right" ? "text-white" : "text-[#939393]"} active:text-white`}
                        onClick={clickRightAL}
                    >
                        <FontAwesomeIcon icon={faAlignRight} />
                    </button>
                    <button 
                        className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-pointer active:text-white"
                        onClick={() => {
                            const url = prompt("Enter the URL:");
                            if (url) handleCommand("createLink", url);
                        }}
                    >
                        <FontAwesomeIcon icon={faLink} />
                    </button>
                    <button 
                        className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-pointer active:text-white"
                        onClick={insertTable}
                    >
                        <FontAwesomeIcon icon={faTableCells} />
                    </button>
                    <label htmlFor="image-upload" className="mt-[10px] cursor-pointer">
                        <FontAwesomeIcon icon={faImage} className="text-[#939393] relative bottom-[-6px]" />
                        <input
                            type="file"
                            id="image-upload"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                        />
                    </label>
                </div>
               <div
    className="w-[95%] h-[40vh] text-[16px] rounded-[5px] outline-none break-words overflow-y-auto mb-[10px] mx-auto font-['Inter'] text-white bg-transparent"
    contentEditable
    ref={contentRef}
    placeholder="Write here..."
></div>

                <button onClick={handleSave} className="p-[5px] bg-[#5a3ec8] text-white font-['Inter'] text-[12px] rounded-[25px] border-none outline-none w-[100px] cursor-pointer relative left-[-20px] float-right bottom-[-10px] hover:bg-[#6450b0]">Save</button>
                <button style={{ marginRight: "15px" }} onClick={() => changeMode("VIEW")} className="p-[5px] bg-[#5a3ec8] text-white font-['Inter'] text-[12px] rounded-[25px] border-none outline-none w-[100px] cursor-pointer relative left-[-20px] float-right bottom-[-10px] hover:bg-[#6450b0]">Cancel</button>
            </div>

        </div>
    </>)
}

export default EditMode;