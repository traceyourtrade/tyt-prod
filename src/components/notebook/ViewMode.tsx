import { useRef, useEffect } from "react";
// Font Awesome Imports
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
    faImage 
} from '@fortawesome/free-solid-svg-icons';
// End of Imports

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

    useEffect(() => {
        if (contentRef.current && currentFileData?.content?.content) {
            contentRef.current.innerHTML = currentFileData.content.content;
        }
    }, [currentFileData]);

    return (
        <div className="w-[65%] h-[70vh] bg-[rgba(114,113,113,0.268)] rounded-[25px] font-['Inter'] shadow-[rgba(100,100,111,0.2)_0px_7px_29px_0px]">
            {currentFileData?.content?.title ? (
                <>
                    <div className="w-[95%] h-auto mx-auto">
                        <p className="w-[400px] p-[10px] text-[16px] border-none outline-none rounded-[25px] bg-[rgba(122,122,122,0.214)] my-[20px] pl-[20px] text-white ">
                            {currentFileData?.content?.title || ''}
                        </p>
                    </div>

                    <span className="text-[10px] font-['Inter'] relative left-[40px] top-[-10px] text-white">
                        Created: {createdDate} | Last updated: {lastUpdatedDate}
                    </span>

                    <div className="w-[95%] mx-auto rounded-[25px] bg-[rgba(122,122,122,0.214)]">
                        <div className="w-[95%] h-auto mx-auto flex items-center">
                            {/* Disabled buttons - REPLACED <i> with FontAwesomeIcon */}
                            <button className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-not-allowed">
                                <FontAwesomeIcon icon={faRotateLeft} />
                            </button>
                            <button className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-not-allowed">
                                <FontAwesomeIcon icon={faRotateRight} />
                            </button>

                            <button className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-not-allowed">
                                <FontAwesomeIcon icon={faParagraph} />
                            </button>
                            <button className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-not-allowed">
                                <FontAwesomeIcon icon={faHeading} />
                            </button>

                            <select disabled className="bg-[#9d83dd] text-white border-none rounded-[25px] p-[3px_7px] text-[12px] cursor-not-allowed outline-none w-[150px] mt-[10px] mr-[10px] font-['Inter'] font-medium">
                                <option className="bg-[#ededed] text-black text-[12px] rounded-[20px] border-none" value="Inter">Poppins</option>
                                <option className="bg-[#ededed] text-black text-[12px] rounded-[20px] border-none" value="League Spartan">League Spartan</option>
                                <option className="bg-[#ededed] text-black text-[12px] rounded-[20px] border-none" value="Arial">Arial</option>
                                <option className="bg-[#ededed] text-black text-[12px] rounded-[20px] border-none" value="Times New Roman">Times Roman</option>
                                <option className="bg-[#ededed] text-black text-[12px] rounded-[20px] border-none" value="Courier New">Courier New</option>
                                <option className="bg-[#ededed] text-black text-[12px] rounded-[20px] border-none" value="Nunito">Nunito</option>
                            </select>

                            <button className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-not-allowed">
                                <FontAwesomeIcon icon={faBold} />
                            </button>
                            <button className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-not-allowed">
                                <FontAwesomeIcon icon={faItalic} />
                            </button>
                            <button className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-not-allowed">
                                <FontAwesomeIcon icon={faUnderline} />
                            </button>

                            <button className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-not-allowed">
                                <FontAwesomeIcon icon={faList} />
                            </button>

                            <button className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-not-allowed">
                                <FontAwesomeIcon icon={faAlignLeft} />
                            </button>
                            <button className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-not-allowed">
                                <FontAwesomeIcon icon={faAlignCenter} />
                            </button>
                            <button className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-not-allowed">
                                <FontAwesomeIcon icon={faAlignRight} />
                            </button>
                            <button className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-not-allowed">
                                <FontAwesomeIcon icon={faLink} />
                            </button>
                            <button className="text-[17px] bg-transparent text-[#939393] border-none mr-[10px] mt-[10px] font-extrabold cursor-not-allowed">
                                <FontAwesomeIcon icon={faTableCells} />
                            </button>
                            <label className="mt-[10px] cursor-not-allowed">
                                {/* REPLACED <i> with FontAwesomeIcon */}
                                <FontAwesomeIcon icon={faImage} className="text-[#939393] relative bottom-[-6px]" />
                            </label>
                        </div>
                        <div
                            className="w-[95%] h-[40vh] text-[16px] rounded-[5px] outline-none break-words overflow-y-auto mb-[10px] mx-auto font-['Inter'] text-white"
                            contentEditable={false}
                            placeholder="Write here..."
                            ref={contentRef}
                            dangerouslySetInnerHTML={
                                currentFileData?.content?.content
                                    ? { __html: currentFileData.content.content }
                                    : { __html: '' }
                            }
                        ></div>
                        <button 
                            onClick={() => changeMode("EDIT")} 
                            className="p-[5px] bg-[#5a3ec8] text-white font-['Inter'] text-[12px] rounded-[25px] border-none outline-none w-[100px] cursor-pointer relative left-[-20px] float-right bottom-[-10px] hover:bg-[#6450b0]"
                        >
                            Edit
                        </button>
                    </div>
                </>
            ) : (
                <div className="w-full flex items-center justify-center h-[70vh]">
                    <h3 className="text-white text-[21px]">Select a file</h3>
                </div>
            )}
        </div>
    )
}

export default ViewMode;