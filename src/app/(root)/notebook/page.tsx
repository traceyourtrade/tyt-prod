"use client"
import { useEffect, useState } from "react";
import Cookies from "js-cookie";
import { faMagnifyingGlass, faFilter } from '@fortawesome/free-solid-svg-icons';
// Stores

import { useDataStore } from "@/store/store";
import notebookStore from "@/store/notebookStore";
import Files from "@/components/notebook/Files";
import Folder from "@/components/notebook/Folder";
import ViewMode from "@/components/notebook/ViewMode";
import EditMode from "@/components/notebook/EditMode";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const Notebook = () => {

    const { notes, setNotes, selectedFolder, setFolder, selectedFile, setFile } = notebookStore();

    const [fileShow, setFileShow] = useState(false);
    const [mode, setMode] = useState("VIEW");

    const changeMode = (mode: string) => {
        setMode(mode)
    }


    const [newFile, setNewFile] = useState("")
    const [newFolder, setNewFolder] = useState("")
    useEffect(() => {
        setNotes();
    }, [ setNotes])
    return (
        <div className="w-full h-auto min-h-[calc(100vh)] absolute z-[1] top-[50px] left-[10px]">
            <div className="w-full h-auto flex flex-col items-start justify-start">
                <div className="flex">
                    <div className="w-[320px] flex flex-row items-center h-auto bg-[rgba(122,122,122,0.551)] rounded-[25px] pl-[20px] cursor-pointer shadow-[rgba(100,100,111,0.2)_0px_7px_29px_0px]">
                        <FontAwesomeIcon icon={faMagnifyingGlass} />
                        <input
                            name="search"
                            type="text"
                            placeholder="Search your Notes here..."
                            className="text-[14px] p-[10px] border-none outline-none font-['Inter'] cursor-pointer bg-transparent text-white placeholder:text-white w-full"
                        />
                    </div>
                    <FontAwesomeIcon
                        icon={faFilter}
                        className="relative right-[-20px] bg-[rgba(122,122,122,0.551)] p-[12.5px] rounded-full cursor-pointer text-[#b191fc] shadow-[rgba(100,100,111,0.2)_0px_7px_29px_0px]"
                    />
                </div>

                <div className="w-full h-auto flex items-center justify-between mt-[20px]">
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

                    {(mode === "VIEW") ?
                        <ViewMode
                            notes={notes}
                            selectedFolder={selectedFolder}
                            selectedFile={selectedFile}
                            changeMode={changeMode}
                        /> :
                        (mode === "EDIT") ?
                            <EditMode
                                notes={notes}
                                selectedFolder={selectedFolder}
                                selectedFile={selectedFile}
                                bkurl={bkurl}
                                changeMode={changeMode}
                                setNotes={setNotes}
                                tokenn={tokenn}
                                userId={userId}
                            /> :
                            ""
                    }
                </div>
            </div>
        </div>
    )
}

export default Notebook;