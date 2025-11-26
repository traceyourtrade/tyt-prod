import { useRef } from "react";
import axios from "axios";
import { useDataStore } from "@/store/store";


interface StrategyPopupProps {
  strategy: {
    name: string;
    image: string | null;
    tags: string[];
    description: string;
    trades: number;
    winRate: string;
    winLoss: string;
    totalProfit: string;
    author: string;
    authorImg: string;
    totalWins: number;
    totalLoses: number;
  };
  onClose: () => void;
  tokenn: string | undefined;
}

const StrategyPopup = ({ strategy, onClose, tokenn }: StrategyPopupProps) => {
  const { bkurl } = useDataStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!strategy) return null;

  const getShortForm = (name: string) =>
    name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("");

  // 🟢 Trigger file input on click
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // 🟢 Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("tokenn", tokenn || "");
      formData.append("strategy", strategy.name);
      formData.append("apiName","uploadStrategyImage")

      const res = await axios.post(
        `/api/strategy/post`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (res.status === 200) {
        alert("✅ Image uploaded successfully!");
        // Optional: refresh the popup data or page
        window.location.reload();
      }
    } catch (error) {
      console.error("Error uploading strategy image:", error);
      alert("❌ Failed to upload image. Check console for details.");
    }
  };

  return (
    <div className="fixed inset-0 bg-[rgba(10,10,10,0.7)] backdrop-blur-md flex justify-center items-center z-[99]" onClick={onClose}>
      <div
        className="bg-[#181818] rounded-2xl w-[750px] max-w-[90%] text-white overflow-hidden shadow-2xl animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-full h-[250px] overflow-hidden cursor-pointer" onClick={handleImageClick}>
          {/* Hidden input */}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {strategy.image ? (
            <img src={strategy.image} alt={strategy.name} className="w-full h-[300px] object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#4c1d95] via-[#7e22ce] to-[#9333ea] flex items-center justify-center text-2xl font-semibold text-white uppercase tracking-wide">
              <span>{getShortForm(strategy.name)}</span>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">🚀 {strategy.name}</h2>
          </div>

          <div className="flex gap-2 flex-wrap">
            {strategy.tags.map((tag, i) => (
              <span key={i} className="bg-[#2a2a2a] px-2.5 py-1 rounded-full text-xs text-[#bbb]">
                {tag}
              </span>
            ))}
          </div>

          {strategy.description ? (
            <p className="text-[#ccc] text-sm leading-relaxed mt-1.5">{strategy.description}</p>
          ) : (
            <p className="text-gray-500 text-sm leading-relaxed mt-1.5">
              No description
            </p>
          )}

          <div className="flex justify-between mt-2.5 flex-wrap gap-3">
            <div className="flex-1 min-w-[100px]">
              <p className="text-[#888] text-xs">Win rate</p>
              <p className="font-semibold text-white">{strategy.winRate}</p>
            </div>
            <div className="flex-1 min-w-[100px]">
              <p className="text-[#888] text-xs">Trades</p>
              <p className="font-semibold text-white">{strategy.trades}</p>
            </div>
            <div className="flex-1 min-w-[100px]">
              <p className="text-[#888] text-xs">Profit Factor</p>
              <p className="font-semibold text-white">{strategy.winLoss || "3.92"}</p>
            </div>
            <div className="flex-1 min-w-[100px]">
              <p className="text-[#888] text-xs">Avg trade duration</p>
              <p className="font-semibold text-white">43m</p>
            </div>
            <div className="flex-1 min-w-[100px]">
              <p className="text-[#888] text-xs">Win/Loss</p>
              <p className="font-semibold text-white">{strategy.winLoss}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2.5 mt-4.5">
            <button className="px-4 py-2 border-none rounded-lg font-medium cursor-pointer bg-[#7b5cff] text-white transition-colors duration-200 hover:bg-[#8b6cff]">
              View Insights
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyPopup;