import { useState } from "react";
import Cookies from "js-cookie";
import { MoreVertical, Send, X } from "lucide-react";
import "./Strategies.css";
import StrategyPopup from "./components/StrategyPopup";

import useDataStore from "../../../../Store/store";

const Strategies = ({ allStrategies, strategies, strategiesDataObj }) => {

    const { bkurl } = useDataStore();

    const [searchTerm, setSearchTerm] = useState("");
    const [openMenu, setOpenMenu] = useState(null);
    const [editing, setEditing] = useState(null);
    const [tempName, setTempName] = useState("");
    const [showPopup, setShowPopup] = useState(false);
    const [newStrategy, setNewStrategy] = useState({
        name: "",
        tags: "",
        author: "",
    });

    const [selectedStrategy, setSelectedStrategy] = useState(null);

    const getShortForm = (name) =>
        name
            .split(" ")
            .map((word) => word.charAt(0).toUpperCase())
            .join("");

    const filteredStrategies = allStrategies.filter((name) =>
        name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleRename = async (e, oldName, id) => {

        // alert(`Renamed "${oldName}" to "${tempName}"`);

        e.preventDefault();

        try {

            const res = await fetch(`${bkurl}/strategy/update/strategy-name/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    tokenn, newName: tempName
                })
            });

            const data = await res.json();

            if (res.status === 200) {

                setEditing(null);
                setOpenMenu(null);
                // api call function

            } else {
                console.log(data);
                if (data.error === "Invalid credentials") {
                    setError("Invalid credentials, please recheck the Email & Password")
                } else if (data.error === "Enter all the details") {
                    setError("Fill all the entries")
                }
            }

        } catch (error) {
            // console.log(error)
        }

    };

    const handleDelete = async (e, name, id) => {

        e.preventDefault();

        // console.log(id)

        try {

            const res = await fetch(`${bkurl}/strategy/delete/strategy/${id}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    tokenn
                })
            });

            const data = await res.json();

            if (res.status === 200) {

                setNewStrategy({ name: "", tags: "", author: "" });
                setShowPopup(false);
                // api call function

            } else {
                console.log(data);
                if (data.error === "Invalid credentials") {
                    setError("Invalid credentials, please recheck the Email & Password")
                } else if (data.error === "Enter all the details") {
                    setError("Fill all the entries")
                }
            }

        } catch (error) {
            // console.log(error)
        }

    };

    const handleMakeDefault = async (e, id) => {

        e.preventDefault();

        try {

            const res = await fetch(`${bkurl}/strategy/set-default/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                }
            });

            const data = await res.json();

            if (res.status === 200) {

                setOpenMenu(null);
                // api call function

            } else {
                if (data.error === "Invalid credentials") {
                    setError("Invalid credentials, please recheck the Email & Password")
                } else if (data.error === "Enter all the details") {
                    setError("Fill all the entries")
                }
            }

        } catch (error) {
            // console.log(error)
        }

    };

    const [error, setError] = useState("")
    const tokenn = Cookies.get("Trace Your Trades");

    const handleAddStrategy = async (e) => {

        e.preventDefault();

        if (!newStrategy.name.trim()) {

            alert("Please enter a strategy name");
            return;

        } else {

            try {

                const res = await fetch(`${bkurl}/strategy/add/strategy`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        tokenn, strategy: newStrategy.name, tags: newStrategy.tags, description: newStrategy.author
                    })
                });

                const data = await res.json();

                if (res.status === 200) {

                    // here lund
                    setNewStrategy({ name: "", tags: "", author: "" });
                    setShowPopup(false);
                    // api call function

                } else {
                    console.log(data);
                    if (data.error === "Invalid credentials") {
                        setError("Invalid credentials, please recheck the Email & Password")
                    } else if (data.error === "Enter all the details") {
                        setError("Fill all the entries")
                    }
                }

            } catch (error) {
                // console.log(error)
            }

        }

    };

    // 💥 Combine strategies, metadata, and trade data into one object (mockData-like)
    const combinedData = {};

    allStrategies.forEach((name) => {
        // find metadata (tags, description, etc.)
        const meta = strategies.find((s) => s.strategy === name) || {};

        // find trades for this strategy
        const trades = strategiesDataObj[name] || [];

        // calculate metrics from trades
        const totalTrades = trades.length;
        const wins = trades.filter((t) => t.Profit > 0).length;
        const losses = trades.filter((t) => t.Profit <= 0).length;

        const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) + "%" : "—";

        const totalProfit = trades.reduce((acc, t) => acc + t.Profit, 0);
        const grossProfit = trades.filter((t) => t.Profit > 0).reduce((acc, t) => acc + t.Profit, 0);
        const grossLoss = trades.filter((t) => t.Profit < 0).reduce((acc, t) => acc + Math.abs(t.Profit), 0);

        const winLossRatio = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : "∞";

        // ✅ build combined record
        combinedData[name] = {
            id: meta._id,
            image: meta.imgLink || null,
            tags: meta.tags || [],
            description: meta.description || "",
            trades: totalTrades,
            winRate,
            winLoss: winLossRatio,
            totalProfit: totalProfit.toFixed(2),
            author: "Tanmay", // or meta.author if exists
            authorImg: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
                meta.strategy || name
            )}`,
            totalWins: wins,
            totalLoses: losses
        };
    });

    // console.log(combinedData)

    return (
        <div className="strategies-wrapper">
            <div className="strategies-header">
                <h2>🎯 Strategies</h2>

                <div>
                    <button onClick={() => setShowPopup(true)}>Add Strategy +</button>

                    <input
                        type="text"
                        placeholder="🔍 Search strategies..."
                        className="strategy-search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Strategy cards */}
            {filteredStrategies.length === 0 ? (
                <p className="no-results">No strategies found.</p>
            ) : (
                <div className="strategies-grid">
                    {filteredStrategies.map((name, idx) => {
                        const s = combinedData[name];
                        if (!s) return null;

                        return (

                            <div key={idx} className="strategy-card" onClick={() => setSelectedStrategy({ name, ...s })}>
                                <div className="thumb-box">
                                    {s.image ? (
                                        <img src={s.image} alt={name} />
                                    ) : (
                                        <div className="thumb-placeholder">
                                            <span>{getShortForm(name)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="card-body">
                                    <div className="strategy-title-row">
                                        {editing === name ? (
                                            <div className="rename-input-box">
                                                <input
                                                    type="text"
                                                    value={tempName}
                                                    onChange={(e) => setTempName(e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                />
                                                <Send
                                                    size={18}
                                                    className="icon-btn send"
                                                    onClick={(e) => { e.stopPropagation(); handleRename(e, name, s.id); }}
                                                />
                                                <X
                                                    size={18}
                                                    className="icon-btn close"
                                                    onClick={() => {
                                                        setEditing(null);
                                                        setOpenMenu(null);
                                                    }}
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <h3>{name}</h3>
                                                <MoreVertical
                                                    className="menu-icon"
                                                    size={18}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenu(openMenu === name ? null : name);
                                                    }}
                                                />
                                            </>
                                        )}

                                        {openMenu === name && editing !== name && (
                                            <div className="menu-dropdown">
                                                <p
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditing(name);
                                                        setTempName(name);
                                                    }}
                                                >
                                                    ✏️ Rename
                                                </p>
                                                <p onClick={(e) => { e.stopPropagation(); handleDelete(e, name, s.id); }}>🗑️ Delete</p>
                                                <p onClick={(e) => { e.stopPropagation(); handleMakeDefault(e, s.id); }}>
                                                    ⭐ Make Default
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="tag-container">
                                        {s.tags.map((tag, i) => (
                                            <span key={i} className="tag">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>

                                    <div className="stats-row">
                                        <div>
                                            <p className="stat-label">Win rate</p>
                                            <p className="stat-value">{s.winRate}</p>
                                        </div>
                                        <div>
                                            <p className="stat-label">Trades</p>
                                            <p className="stat-value">{s.trades}</p>
                                        </div>
                                        <div>
                                            <p className="stat-label">Win/Loss</p>
                                            <p className="stat-value">{s.winLoss}</p>
                                        </div>
                                    </div>

                                    {/* <div className="author-box">
                                        <img src={s.authorImg} alt={s.author} />
                                        <p>{s.author}</p>
                                    </div> */}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Popup Overlay */}
            {showPopup && (
                <div className="popup-overlay" onClick={() => setShowPopup(false)}>

                    <div
                        className="popup-box"
                        onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
                    >

                        <h3>➕ Add New Strategy</h3>

                        <input
                            type="text"
                            placeholder="Strategy Name"
                            value={newStrategy.name}
                            onChange={(e) =>
                                setNewStrategy({ ...newStrategy, name: e.target.value })
                            }
                        />

                        <input
                            type="text"
                            placeholder="Tags (comma separated)"
                            value={newStrategy.tags}
                            onChange={(e) =>
                                setNewStrategy({ ...newStrategy, tags: e.target.value })
                            }
                        />

                        <input
                            type="text"
                            placeholder="Description"
                            value={newStrategy.author}
                            onChange={(e) =>
                                setNewStrategy({ ...newStrategy, author: e.target.value })
                            }
                        />

                        <p>{error}</p>

                        <div className="popup-actions">
                            <button className="cancel-btn" onClick={() => setShowPopup(false)}>
                                Cancel
                            </button>
                            <button className="save-btn" onClick={handleAddStrategy}>
                                Save
                            </button>
                        </div>

                    </div>

                </div>
            )}

            {selectedStrategy && (
                <StrategyPopup
                    strategy={selectedStrategy}
                    onClose={() => setSelectedStrategy(null)}
                    tokenn={tokenn}
                />
            )}

        </div>
    );
};

export default Strategies;
