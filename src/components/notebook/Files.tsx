import { useState, useRef, useEffect } from "react";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import notifications from "@/store/notifications";
// Add these imports at the top (alongside the existing MoreVertIcon import):
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faPlus, 
    faCirclePlus, 
    faChevronDown, 
    faChevronRight, 
    faFolder,
    faTrashCan,
    faPenToSquare,
    faPaperPlane
} from '@fortawesome/free-solid-svg-icons';
interface FileType {
    filename: string;
    created: string;
}

interface NoteType {
    folderName: string;
    files: FileType[];
}

interface FilesProps {
    userId: string;
    bkurl: string;
    tokenn: string;
    notes: NoteType[];
    setNotes: (userId: string, tokenn: string) => void;
    setFile: (filename: string) => void;
    newFolder: string;
    setNewFolder: (folder: string) => void;
    setNewFile: (file: string) => void;
    setFileShow: (show: boolean) => void;
    newFile: string;
    selectedFolder: string;
    changeMode: (mode: string) => void;
    fileShow: boolean;
}

const Files = ({ 
    userId, 
    bkurl, 
    tokenn, 
    notes, 
    setNotes, 
    setFile, 
    newFolder, 
    setNewFolder, 
    setNewFile, 
    setFileShow, 
    newFile, 
    selectedFolder, 
    changeMode, 
    fileShow 
}: FilesProps) => {
    console.log("Rendering Files Component");
    console.log("Selected Folder:", selectedFolder);
    console.log("Notes:", notes);
    console.log("New File:", newFile);
    console.log("File Show:", fileShow);
    console.log("User ID:", userId);
    console.log("BK URL:", bkurl);
    
    const { setAlertBoxG } = notifications();
    const [isFileOpen, setIsFileOpen] = useState(true);

    const uploadFile = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const response = await fetch(`${bkurl}/tytusersasqwzxerdfcv/add/file`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ tokenn, newFile, folderName: selectedFolder }),
            });

            const data = await response.json();

            if (response.ok) {
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

    const filteredFiles = notes
        .filter(note => note.folderName === selectedFolder)
        .flatMap(note => note.files);

    // Dropdown
    const [dropdownCoords, setDropdownCoords] = useState({ x: 0, y: 0 });
    const [showFr, setShowFr] = useState(false)
    const [visibleOptions, setVisibleOptions] = useState<number | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [delConfirm, setDelConfirm] = useState(false)
    const [delFolder, setDelFolder] = useState("")
    const [folderRename, setFolderRename] = useState("")

    const handleMenuClick = (e: React.MouseEvent, index: number, filename: string) => {
        e.stopPropagation();
        setShowFr(false)
        setDelFolder(filename)

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
            const response = await fetch(`${bkurl}/tytusersasqwzxerdfcv/delete/notebook/file`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ tokenn, folderName: selectedFolder, fileName: delFolder }),
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
            const response = await fetch(`${bkurl}/tytusersasqwzxerdfcv/rename/notebook/file`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ tokenn, folderName: selectedFolder, fileName: delFolder, renameFile: folderRename }),
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
            {selectedFolder === "Daily Journal" ? "" :
                fileShow ? 
                <div className="w-[85%] flex bg-[rgba(122,122,122,0.214)] mx-auto mt-[20px] mb-[20px] p-[8px_10px] rounded-[15px] cursor-pointer justify-between transition-colors duration-300 ease-in-out text-white hover:bg-[rgba(122,122,122,0.551)]">
                    <span className="w-[90%]">
                        <FontAwesomeIcon icon={faFolder} className="ml-[10px] text-white" />
                        <input 
                            className="w-[75%] bg-transparent border-none outline-none ml-[10px] text-white font-['Inter']" 
                            placeholder="Enter File Name" 
                            value={newFile} 
                            name="newFile" 
                            onChange={(e) => setNewFile(e.target.value)} 
                            maxLength={20} 
                        />
                    </span>
                   <FontAwesomeIcon 
                        icon={faCirclePlus} 
                        className="mr-[5px] mt-[3px] cursor-pointer" 
                        onClick={uploadFile} 
                    />
                </div> : 
                <div 
                    onClick={() => setFileShow(true)} 
                    className="w-[85%] flex bg-[rgba(122,122,122,0.214)] mx-auto mt-[20px] mb-[20px] p-[8px_10px] rounded-[15px] cursor-pointer justify-between transition-colors duration-300 ease-in-out text-white hover:bg-[rgba(122,122,122,0.551)]"
                >
                    <span className="w-[90%]">
                       <FontAwesomeIcon icon={faFolder} className="ml-[10px] text-white" />
                        <span className="text-white font-semibold ml-[20px] text-[12px] relative top-[-2px]">ADD FILE</span>
                    </span>
                    <FontAwesomeIcon icon={faPlus} className="mr-[5px] mt-[3px]" />
                </div>
            }

            <div className="mt-[10px]">
                <div className="flex justify-between cursor-pointer p-[5px_20px] font-medium transition-colors duration-300 ease-in-out text-white" onClick={() => setIsFileOpen(!isFileOpen)}>
                    <span className="font-medium text-[13px]">FILES</span>
                   <FontAwesomeIcon icon={isFileOpen ? faChevronDown : faChevronRight} className="text-white" />
                </div>

                <div className={`max-h-0 overflow-hidden transition-[max-height] duration-400 ease-in-out ${isFileOpen ? "max-h-[calc(70vh-130px)] overflow-y-auto" : ""} mt-[5px]`}>
                    {filteredFiles.length === 0 ? (
                        <div className="w-full h-[50vh] flex items-center justify-center text-white text-[12px]">
                            <p>No Files Found</p>
                        </div>
                    ) : (
                        filteredFiles.map((file, index) => (
                            <div key={file.filename}>
                                <div className="w-[90%] h-auto mx-auto flex flex-row items-center">
                                    <div 
                                        className="w-full h-[40px] rounded-[10px] bg-[rgba(122,122,122,0.214)] ml-[10px] pl-[10px] cursor-pointer"
                                        onClick={() => setFile(file.filename)}
                                    >
                                        <p className="text-[12px] text-white font-medium mt-[2px]">{file.filename}</p>
                                        <span className="text-[#bebebe] text-[10px] font-medium relative top-[-5px]">
                                            {new Date(file.created).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <MoreVertIcon
                                        className="cursor-pointer text-[#bebebe] relative transition-all duration-1000 ease-in-out p-[2px] ml-[10px]"
                                        fontSize="small"
                                        onClick={(e) => handleMenuClick(e, index, file.filename)}
                                    />
                                </div>
                                <br />
                            </div>
                        ))
                    )}
                </div>

                {visibleOptions !== null && (
                    <div
                        ref={dropdownRef}
                        className="w-[150px] h-auto bg-white flex flex-col items-start p-[10px] rounded-[10px] absolute mt-[10px] ml-[-150px] z-10 opacity-0 invisible translate-y-[-10px] transition-all duration-200 ease-in-out visible:opacity-100 visible:visible visible:translate-y-0"
                        style={{
                            position: "fixed",
                            left: dropdownCoords.x,
                            top: dropdownCoords.y,
                        }}
                    >
                        {selectedFolder === "Daily Journal" ? "" : 
                            showFr ? 
                            <span className="flex w-[90%] text-[12px] p-[5px] text-[#555] font-semibold text-left mx-auto rounded-[10px] cursor-pointer">
                                <input 
                                    maxLength={20} 
                                    placeholder="New Name" 
                                    className="w-[80%] border-none outline-none bg-transparent mt-[-2px]" 
                                    name="folderRename" 
                                    value={folderRename} 
                                    onChange={(e) => setFolderRename(e.target.value)} 
                                /> 
                                <FontAwesomeIcon 
                                    icon={faPaperPlane} 
                                    className="ml-[5px] cursor-pointer" 
                                    onClick={renameFolder} 
                                />  
                            </span> : 
                            <span 
                                onClick={() => { setShowFr(true); setFolderRename(delFolder) }} 
                                className="w-[90%] text-[12px] p-[5px] text-[#555] font-semibold text-left mx-auto rounded-[10px] cursor-pointer hover:bg-[#ededed]"
                            >
                                <FontAwesomeIcon icon={faPenToSquare} className="mr-[5px] ml-[5px] text-[#333] cursor-pointer"/> Rename
                            </span>
                        }

                        {delConfirm ? 
                            <span 
                                onClick={deleteFolder} 
                                className="w-[90%] text-[12px] p-[5px] text-left mx-auto rounded-[10px] cursor-pointer bg-[#ff6c6cce] text-white hover:bg-[#ff6c6cce]"
                            >
                                <FontAwesomeIcon icon={faTrashCan} className="text-white mr-[5px] ml-[5px]"/> Confirm Delete
                            </span> : 
                            <span 
                                onClick={() => setDelConfirm(true)} 
                                className="w-[90%] text-[12px] p-[5px] text-[#555] font-semibold text-left mx-auto rounded-[10px] cursor-pointer hover:bg-[#ededed]"
                            >
                                <FontAwesomeIcon icon={faTrashCan} className="mr-[5px] ml-[5px] text-[#333]"/> Delete
                            </span>
                        }
                    </div>
                )}
            </div>
        </div>
    )
}

export default Files;