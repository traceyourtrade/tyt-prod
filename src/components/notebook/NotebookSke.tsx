// Add these imports at the top:
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faFilter 
} from '@fortawesome/free-solid-svg-icons';
const NotebookSke = () => {
    
    return (<>

        <div className="w-full h-auto min-h-[calc(100vh)] absolute z-10 top-[50px] left-[-10px]">

            <div className="w-full h-auto flex flex-col items-start justify-start">
                <div style={{ display: "flex" }} >
                    <div className="w-[320px] h-auto bg-[rgba(122,122,122,0.551)] rounded-[25px] pl-[20px] cursor-pointer shadow-[rgba(100,100,111,0.2)_0px_7px_29px_0px] skeleton">

                    </div>
                    <FontAwesomeIcon
      icon={faFilter}
      className="relative right-[-20px] bg-[rgba(122,122,122,0.551)] p-[12.5px] rounded-full cursor-pointer text-[#b191fc] shadow-[rgba(100,100,111,0.2)_0px_7px_29px_0px] skeleton"
    />
                </div>
            </div>

            <div className="w-full h-auto flex items-center justify-between mt-[20px]">

                <div className="w-[16%] h-[70vh] bg-[rgba(114,113,113,0.268)] rounded-[25px] font-['Inter'] shadow-[rgba(100,100,111,0.2)_0px_7px_29px_0px] skeleton"></div>
                <div className="w-[16%] h-[70vh] bg-[rgba(114,113,113,0.268)] rounded-[25px] font-['Inter'] shadow-[rgba(100,100,111,0.2)_0px_7px_29px_0px] skeleton"></div>
                <div className="w-[65%] h-[70vh] bg-[rgba(114,113,113,0.268)] rounded-[25px] font-['Inter'] shadow-[rgba(100,100,111,0.2)_0px_7px_29px_0px] skeleton"></div>

            </div>

        </div>

    </>)
}

export default NotebookSke;