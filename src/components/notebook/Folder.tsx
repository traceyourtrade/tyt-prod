import { useState, useEffect, useRef } from "react";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import notifications from "@/store/notifications";
// Font Awesome Imports
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faCirclePlus, 
    faPlus, 
    faChevronDown, 
    faChevronRight, 
    faFolder,
    faTrashCan,
    faPenToSquare,
    faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
// End of Imports

interface NoteType {
    folderName: string;
    files: any[];
}

interface FolderProps {
    bkurl: string;
    tokenn: string;
    changeMode: (mode: string) => void;
    notes: NoteType[];
    setNotes: (userId: string, tokenn: string) => void;
    userId: string;
    setFolder: (folderName: string) => void;
    newFolder: string;
    setNewFolder: (folder: string) => void;
    setNewFile: (file: string) => void;
    setFileShow: (show: boolean) => void;
    selectedFolder: string;
}

const Folder = ({ 
    bkurl, 
    tokenn, 
    changeMode, 
    notes, 
    setNotes, 
    userId, 
    setFolder, 
    newFolder, 
    setNewFolder, 
    setNewFile, 
    setFileShow, 
    selectedFolder 
}: FolderProps) => {
    const [folderShow, setFolderShow] = useState(false);
    const [isFolderOpen, setIsFolderOpen] = useState(true);
    const { setAlertBoxG } = notifications();
    
    const handleNoteClick = (note: string) => {
        setFolder(note);
    };

    const uploadFolder = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(`${bkurl}/tytusersasqwzxerdfcv/add/folder`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ tokenn, newFolder }),
            });

            const data = await response.json();

            if (response.ok) {
                setNewFolder("")
                setFolderShow(false);
                setNotes(userId, tokenn);
                changeMode("VIEW")
            } else {
                if (data.error === "Folder already exists") {
                    setAlertBoxG("Folder already exists", "error");
                }
            }
        } catch (error) {
            console.error("Error saving notebook:", error);
        }
    }

    const [folderRename, setFolderRename] = useState("")
    const [showFr, setShowFr] = useState(false)
    const [delConfirm, setDelConfirm] = useState(false)
    const [delFolder, setDelFolder] = useState("")
    const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 });
    const [visibleOptions, setVisibleOptions] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleMenuClick = (e: React.MouseEvent, index: number, folderName: string) => {
        e.stopPropagation();
        setShowFr(false)
        setDelFolder(folderName)

        if (visibleOptions === index) {
            setVisibleOptions(null);
        } else {
            const rect = e.currentTarget.getBoundingClientRect();
            setDropdownCoords({ x: rect.left, y: rect.bottom });
            setVisibleOptions(index);
        }
    };

    const deleteFolder = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(`${bkurl}/tytusersasqwzxerdfcv/delete/notebook/folder`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ tokenn, folderName: delFolder }),
            });

            const data = await response.json();

            if (response.ok) {
                setVisibleOptions(null);
                setDelConfirm(false)
                setNewFile("")
                setFileShow(false);
                setNotes(userId, tokenn);
                changeMode("VIEW")
            } else {
                if (data.error === "Folder already exists") {
                    setAlertBoxG("Folder already exists", "error");
                }
            }
        } catch (error) {
            console.error("Error saving notebook:", error);
        }
    }

    const renameFolder = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(`${bkurl}/tytusersasqwzxerdfcv/rename/notebook/folder`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ tokenn, folderName: delFolder, renameFolder: folderRename }),
            });

            const data = await response.json();

            if (response.ok) {
                setVisibleOptions(null);
                setDelConfirm(false)
                setNewFile("")
                setFileShow(false);
                setNotes(userId, tokenn);
                changeMode("VIEW")
            } else {
                if (data.error === "Folder already exists") {
                    setAlertBoxG("Folder already exists", "error");
                }
            }
        } catch (error) {
            console.error("Error saving notebook:", error);
        }
    }

    const handleClickOutside = (event: MouseEvent) => {
        if (
            visibleOptions !== null &&
            dropdownRef.current &&
            !dropdownRef.current.contains(event.target as Node)
        ) {
            setVisibleOptions(null);
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [visibleOptions]);

    return (
        <div className="w-[16%] h-[70vh] bg-[rgba(114,113,113,0.268)] rounded-[25px] font-['Inter'] shadow-[rgba(100,100,111,0.2)_0px_7px_29px_0px]">
            {folderShow ? 
                <div className="w-[85%] flex bg-[rgba(122,122,122,0.214)] mx-auto mt-[20px] mb-[20px] p-[8px_10px] rounded-[15px] cursor-pointer justify-between transition-colors duration-300 ease-in-out text-white">
                    <span className="w-[90%]">
                        <FontAwesomeIcon icon={faFolder} className="ml-[10px] text-white" />
                        <input 
                            name="newFolder" 
                            className="w-[75%] bg-transparent border-none outline-none ml-[10px] text-white font-['Inter']" 
                            placeholder="Enter Folder Name" 
                            value={newFolder} 
                            onChange={(e) => setNewFolder(e.target.value)} 
                            maxLength={20} 
                        />
                    </span>
                    <FontAwesomeIcon 
                        icon={faCirclePlus} 
                        className="mr-[5px] mt-[3px] cursor-pointer" 
                        onClick={uploadFolder} 
                    />  
                </div> : 
                <div 
                    onClick={() => setFolderShow(true)} 
                    className="w-[85%] flex bg-[rgba(122,122,122,0.214)] mx-auto mt-[20px] mb-[20px] p-[8px_10px] rounded-[15px] cursor-pointer justify-between transition-colors duration-300 ease-in-out text-white hover:bg-[rgba(122,122,122,0.551)]"
                >
                    <span className="w-[90%]">
                        <FontAwesomeIcon icon={faFolder} className="ml-[10px] text-white" />
                        <span className="text-white font-semibold ml-[20px] text-[12px] relative top-[-2px]">ADD FOLDER</span>
                    </span>
                    <FontAwesomeIcon 
                        icon={faCirclePlus} 
                        className="mr-[5px] mt-[3px]" 
                        onClick={() => setFolderShow(true)} 
                    />
                </div>
            }

            <div className="mt-[10px]">
                <div className="flex justify-between cursor-pointer p-[5px_20px] font-medium transition-colors duration-300 ease-in-out text-white" onClick={() => setIsFolderOpen(!isFolderOpen)}>
                    <span className="font-medium text-[13px]">FOLDERS</span>
                    {/* REPLACED <i> tag with FontAwesomeIcon */}
                    <FontAwesomeIcon 
                        icon={isFolderOpen ? faChevronDown : faChevronRight}
                        // Note: The original had no separate class on the <i> tag besides the fa/fa-chevron classes.
                    />
                </div>

                <div className={`max-h-0 overflow-hidden transition-[max-height] duration-400 ease-in-out ${isFolderOpen ? "max-h-[calc(70vh-130px)] overflow-y-auto" : ""}`}>
                    {notes.map((note, index) => (
                        <div
                            key={index}
                            className={`flex items-center relative p-[2px_15px] cursor-pointer rounded-[15px] transition-all duration-300 ease-in-out ${selectedFolder === note.folderName ? "font-semibold" : ""}`}
                        >
                            <span 
                                onClick={() => handleNoteClick(note.folderName)} 
                                className={`w-[90%] mx-auto text-[12px] text-[#bebebe] p-[5px_10px] rounded-[15px] transition-all duration-300 ease-in-out ${selectedFolder === note.folderName ? "bg-[rgba(122,122,122,0.214)]" : ""} hover:bg-[rgba(122,122,122,0.214)] hover:scale-105`}
                            >
                                {note.folderName}
                            </span>

                            {note.folderName === "Daily Journal" ? 
                                <MoreVertIcon
                                    className="cursor-pointer text-[#bebebe] relative transition-transform duration-1000 ease-in-out p-[2px] ml-[10px]"
                                    style={{ visibility: "hidden" }}
                                    fontSize="small"
                                /> : 
                                <MoreVertIcon
                                    className={`cursor-pointer text-[#bebebe] relative transition-transform duration-1000 ease-in-out p-[2px] ml-[10px] ${visibleOptions === index ? "bg-[#666666b0] rounded-full" : ""}`}
                                    fontSize="small"
                                    onClick={(e) => handleMenuClick(e, index, note.folderName)}
                                />
                            }

                            {selectedFolder === note.folderName && <div className="absolute left-0 top-0 bottom-0 w-[8px] bg-[#5a3ec8] rounded-r-[5px]"></div>}
                        </div>
                    ))}
                </div>

                {visibleOptions !== null && (
                    <div
                        ref={dropdownRef}
                        className="w-[150px] h-auto bg-white flex flex-col items-start p-[10px] rounded-[10px] absolute mt-[10px] ml-[-150px] z-50 opacity-100 visible transform-none transition-all duration-200 ease-in-out"
                        style={{
                            position: "fixed",
                            left: dropdownCoords.x,
                            top: dropdownCoords.y,
                            zIndex: 9999,
                        }}
                    >
                        {showFr ? 
                            <span className="flex w-[90%] text-[12px] p-[5px] text-[#555] font-semibold text-left mx-auto rounded-[10px] cursor-pointer">
                                <input 
                                    maxLength={20} 
                                    placeholder="New Name" 
                                    className="w-[80%] border-none outline-none bg-transparent mt-[-2px]" 
                                    name="folderRename" 
                                    value={folderRename} 
                                    onChange={(e) => setFolderRename(e.target.value)} 
                                /> 
                                {/* REPLACED <i> tag with FontAwesomeIcon */}
                                <FontAwesomeIcon icon={faPaperPlane} onClick={renameFolder} />
                            </span> : 
                            <span 
                                onClick={() => { setShowFr(true); setFolderRename(delFolder) }} 
                                className="w-[90%] text-[12px] p-[5px] text-[#555] font-semibold text-left mx-auto rounded-[10px] cursor-pointer hover:bg-[#ededed]"
                            >
                                {/* REPLACED <i> tag with FontAwesomeIcon */}
                                <FontAwesomeIcon icon={faPenToSquare} className="mr-[5px] ml-[5px] text-[#333] cursor-pointer" /> Rename
                            </span>
                        }

                        {delConfirm ? 
                            <span 
                                onClick={deleteFolder} 
                                className="w-[90%] text-[12px] p-[5px] text-left mx-auto rounded-[10px] cursor-pointer bg-[#ff6c6cce] text-white hover:bg-[#ff6c6cce]"
                            >
                                {/* REPLACED <i> tag with FontAwesomeIcon */}
                                <FontAwesomeIcon icon={faTrashCan} className="text-white mr-[5px] ml-[5px]" /> Confirm Delete
                            </span> : 
                            <span 
                                onClick={() => setDelConfirm(true)} 
                                className="w-[90%] text-[12px] p-[5px] text-[#555] font-semibold text-left mx-auto rounded-[10px] cursor-pointer hover:bg-[#ededed]"
                            >
                                {/* REPLACED <i> tag with FontAwesomeIcon */}
                                <FontAwesomeIcon icon={faTrashCan} className="mr-[5px] ml-[5px] text-[#333]" /> Delete
                            </span>
                        }
                    </div>
                )}
            </div>
        </div>
    )
}

export default Folder;