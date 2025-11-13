import "../Strategies.css";
import { useRef } from "react";
import axios from "axios";

import useDataStore from "../../../../../Store/store";

const StrategyPopup = ({ strategy, onClose, tokenn }) => {

  const { bkurl } = useDataStore();

  const fileInputRef = useRef(null);

  if (!strategy) return null;

  const getShortForm = (name) =>
    name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("");

  // 🟢 Trigger file input on click
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  // 🟢 Handle file upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {

      const formData = new FormData();
      formData.append("image", file);
      formData.append("tokenn", tokenn);
      formData.append("strategy", strategy.name);

      const res = await axios.post(
        `${bkurl}/strategy/add/strategyimage`,
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
    <div className="popup-overlay" onClick={onClose}>
      <div
        className="strategy-preview-popup"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="spp-img-div" onClick={handleImageClick}>
          {/* Hidden input */}
          <input
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {strategy.image ? (
            <img src={strategy.image} alt={strategy.name} className="popup-image" />
          ) : (
            <div className="thumb-placeholder">
              <span>{getShortForm(strategy.name)}</span>
            </div>
          )}
        </div>

        <div className="popup-content">
          <div className="popup-header">
            <h2>🚀 {strategy.name}</h2>
          </div>

          <div className="popup-tags">
            {strategy.tags.map((tag, i) => (
              <span key={i}>{tag}</span>
            ))}
          </div>

          {strategy.description ? (
            <p className="popup-description">{strategy.description}</p>
          ) : (
            <p className="popup-description" style={{ color: "grey" }}>
              No description
            </p>
          )}

          <div className="popup-stats">
            <div>
              <p className="stat-label">Win rate</p>
              <p className="stat-value">{strategy.winRate}</p>
            </div>
            <div>
              <p className="stat-label">Trades</p>
              <p className="stat-value">{strategy.trades}</p>
            </div>
            <div>
              <p className="stat-label">Profit Factor</p>
              <p className="stat-value">{strategy.profitFactor || "3.92"}</p>
            </div>
            <div>
              <p className="stat-label">Avg trade duration</p>
              <p className="stat-value">{strategy.duration || "43m"}</p>
            </div>
            <div>
              <p className="stat-label">Win/Loss</p>
              <p className="stat-value">{strategy.winLoss}</p>
            </div>
          </div>

          <div className="popup-actions">
            <button className="add-btn">View Insights</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategyPopup;
