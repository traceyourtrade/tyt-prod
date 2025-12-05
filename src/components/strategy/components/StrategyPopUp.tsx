import { useRef } from "react";
import axios from "axios";
import { useDataStore } from "@/store/store";
import { X, Percent, BarChart3, TrendingUp, Clock, Award, Eye } from "lucide-react";

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

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

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
        alert("Image uploaded successfully!");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error uploading strategy image:", error);
      alert("Failed to upload image. Check console for details.");
    }
  };

  const stats = [
    { label: "Win rate", value: strategy.winRate, icon: Percent },
    { label: "Trades", value: strategy.trades, icon: BarChart3 },
    { label: "Profit Factor", value: strategy.winLoss || "—", icon: TrendingUp },
    { label: "Avg duration", value: "43m", icon: Clock },
    { label: "Win/Loss", value: strategy.winLoss, icon: Award },
  ];

  return (
    <div 
      className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl w-[750px] max-w-[90%] text-foreground overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div 
          className="w-full h-[200px] overflow-hidden cursor-pointer relative group border-b border-border"
          onClick={handleImageClick}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {strategy.image ? (
            <>
              <img src={strategy.image} alt={strategy.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div className="absolute inset-0 bg-background/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-foreground text-sm font-medium bg-card/80 px-4 py-2 rounded-lg">Click to change image</span>
              </div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary/60">{getShortForm(strategy.name)}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-4">
          {/* Title and Close */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-foreground">{strategy.name}</h2>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tags */}
          {strategy.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {strategy.tags.map((tag, i) => (
                <span key={i} className="bg-muted px-3 py-1 rounded-full text-xs font-medium text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {strategy.description ? (
            <p className="text-muted-foreground text-sm leading-relaxed">{strategy.description}</p>
          ) : (
            <p className="text-muted-foreground/60 text-sm leading-relaxed italic">
              No description added yet
            </p>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-border">
            {stats.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <div key={i} className="flex flex-col items-center p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                    <Icon className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">{stat.label}</span>
                  </div>
                  <span className="text-base font-semibold text-foreground">{stat.value}</span>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button 
              onClick={onClose}
              className="px-4 py-2.5 border border-border rounded-lg text-foreground text-sm font-medium hover:bg-muted transition-colors"
            >
              Close
            </button>
            <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
              <Eye className="h-4 w-4" />
              View Insights
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyPopup;
