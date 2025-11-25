"use client"
import { useState } from "react";
import Cookies from "js-cookie";
import { MoreVertical, Send, X } from "lucide-react";
import StrategyPopup from "@/components/strategy/components/StrategyPopUp";
import { useDataStore } from "@/store/store";
interface Trade {
  Profit: number;
  [key: string]: any;
}

interface Strategy {
  _id?: string;
  strategy: string;
  imgLink?: string;
  tags?: string[];
  description?: string;
  [key: string]: any;
}

interface CombinedData {
  id?: string;
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
}

interface StrategiesProps {
  allStrategies: string[];
  strategies: Strategy[];
  strategiesDataObj: { [key: string]: Trade[] };
}

interface NewStrategy {
  name: string;
  tags: string;
  author: string;
}

const Strategies = ({ allStrategies, strategies, strategiesDataObj }: StrategiesProps) => {
  const { bkurl } = useDataStore();

  const [searchTerm, setSearchTerm] = useState("");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [newStrategy, setNewStrategy] = useState<NewStrategy>({
    name: "",
    tags: "",
    author: "",
  });
  const [selectedStrategy, setSelectedStrategy] = useState<CombinedData & { name: string } | null>(null);
  const [error, setError] = useState("");

  const tokenn = Cookies.get("Trace Your Trades");

  const getShortForm = (name: string) =>
    name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase())
      .join("");

  const filteredStrategies = allStrategies.filter((name) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRename = async (e: React.MouseEvent, oldName: string, id?: string) => {
    e.preventDefault();

    if (!id) return;

    try {
      const res = await fetch(`/api/strategy/put`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tokenn, newName: tempName,
          id:id, apiName:'updateStrategyName'
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

  const handleDelete = async (e: React.MouseEvent, name: string, id?: string) => {
    e.preventDefault();

    if (!id) return;

    try {
      const res = await fetch(`/api/strategy/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          tokenn,
          id:id,
          apiName:'deleteStrategy'
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

  const handleMakeDefault = async (e: React.MouseEvent, id?: string) => {
    e.preventDefault();

    if (!id) return;

    try {
      const res = await fetch(`/api/strategy/put`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          id:id,
          apiName:'setDefaultStrategy'
        })
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

  const handleAddStrategy = async (e: React.MouseEvent) => {
    e.preventDefault();

    if (!newStrategy.name.trim()) {
      alert("Please enter a strategy name");
      return;
    }

    try {
      const res = await fetch(`/api/strategy/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          apiName:'addStrategy',
          tokenn, strategy: newStrategy.name, tags: newStrategy.tags, description: newStrategy.author
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

  // 💥 Combine strategies, metadata, and trade data into one object (mockData-like)
  const combinedData: { [key: string]: CombinedData } = {};

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
      author: "Tanmay",
      authorImg: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        meta.strategy || name
      )}`,
      totalWins: wins,
      totalLoses: losses
    };
  });

  return (
    <div className="w-full min-h-[80vh] bg-[#0f0f0f] text-white rounded-xl py-6 flex flex-col gap-6">
      <div className="w-[90%] mx-auto flex justify-between items-center flex-wrap">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#d57eeb] to-[#fccb90] bg-clip-text text-transparent">
          🎯 Strategies
        </h2>

        <div className="flex items-center gap-4">
          <button 
            className="w-[150px] h-8 text-white text-sm bg-[#7e22ce] border-none outline-none rounded-full cursor-pointer"
            onClick={() => setShowPopup(true)}
          >
            Add Strategy +
          </button>

          <input
            type="text"
            placeholder="🔍 Search strategies..."
            className="bg-[#1a1a1a] border border-[#2b2b2b] text-[#ddd] rounded-lg px-3.5 py-2 text-sm outline-none w-[220px] transition-all duration-200 focus:border-[#d57eeb] focus:shadow-[0_0_6px_rgba(213,126,235,0.4)]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Strategy cards */}
      {filteredStrategies.length === 0 ? (
        <p className="text-center text-[#aaa] text-base mt-10">No strategies found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-[90%] mx-auto gap-4 justify-center cursor-pointer">
          {filteredStrategies.map((name, idx) => {
            const s = combinedData[name];
            if (!s) return null;

            return (
              <div 
                key={idx} 
                className="bg-[#1a1a1a] border border-[#262626] rounded-xl overflow-hidden transition-all duration-250 flex flex-col w-full max-w-[340px] hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(213,126,235,0.25)]"
                onClick={() => setSelectedStrategy({ name, ...s })}
              >
                <div className="w-full h-[150px] overflow-hidden border-b border-[#222] flex items-center justify-center">
                  {s.image ? (
                    <img src={s.image} alt={name} className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#4c1d95] via-[#7e22ce] to-[#9333ea] flex items-center justify-center text-2xl font-semibold text-white uppercase tracking-wide">
                      <span>{getShortForm(name)}</span>
                    </div>
                  )}
                </div>

                <div className="p-4 flex flex-col gap-2.5">
                  <div className="flex justify-between items-center relative">
                    {editing === name ? (
                      <div className="flex items-center gap-1.5 w-full">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 px-2 py-1 rounded border border-[#444] bg-[#1a1a1a] text-white text-sm"
                        />
                        <Send
                          size={18}
                          className="cursor-pointer transition-opacity duration-200 text-[#00bcd4] hover:opacity-80"
                          onClick={(e) => { e.stopPropagation(); handleRename(e, name, s.id); }}
                        />
                        <X
                          size={18}
                          className="cursor-pointer transition-opacity duration-200 text-[#f44336] hover:opacity-80"
                          onClick={() => {
                            setEditing(null);
                            setOpenMenu(null);
                          }}
                        />
                      </div>
                    ) : (
                      <>
                        <h3 className="text-base font-semibold text-white">{name}</h3>
                        <MoreVertical
                          className="cursor-pointer opacity-70 transition-opacity duration-200 hover:opacity-100"
                          size={18}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === name ? null : name);
                          }}
                        />
                      </>
                    )}

                    {openMenu === name && editing !== name && (
                      <div className="absolute right-0 top-7 bg-[#222] rounded-lg py-1.5 shadow-lg z-10">
                        <p
                          className="m-0 px-4 py-2 cursor-pointer text-[#eee] text-sm transition-colors duration-200 hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(name);
                            setTempName(name);
                          }}
                        >
                          ✏️ Rename
                        </p>
                        <p 
                          className="m-0 px-4 py-2 cursor-pointer text-[#eee] text-sm transition-colors duration-200 hover:bg-white/10"
                          onClick={(e) => { e.stopPropagation(); handleDelete(e, name, s.id); }}
                        >
                          🗑️ Delete
                        </p>
                        <p 
                          className="m-0 px-4 py-2 cursor-pointer text-[#eee] text-sm transition-colors duration-200 hover:bg-white/10"
                          onClick={(e) => { e.stopPropagation(); handleMakeDefault(e, s.id); }}
                        >
                          ⭐ Make Default
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {s.tags.map((tag, i) => (
                      <span 
                        key={i} 
                        className="bg-[#222] text-[#ccc] rounded px-2 py-1 text-xs transition-all duration-200 hover:bg-[#d57eeb] hover:text-[#111]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-between border-t border-[#262626] pt-2">
                    <div>
                      <p className="text-[#aaa] text-xs">Win rate</p>
                      <p className="text-white text-sm font-semibold">{s.winRate}</p>
                    </div>
                    <div>
                      <p className="text-[#aaa] text-xs">Trades</p>
                      <p className="text-white text-sm font-semibold">{s.trades}</p>
                    </div>
                    <div>
                      <p className="text-[#aaa] text-xs">Win/Loss</p>
                      <p className="text-white text-sm font-semibold">{s.winLoss}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Popup Overlay */}
      {showPopup && (
        <div 
          className="fixed inset-0 bg-[rgba(10,10,10,0.7)] backdrop-blur-md flex justify-center items-center z-[99]"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="bg-[rgba(30,30,30,0.9)] p-6 rounded-xl w-[350px] text-white shadow-2xl animate-fadeIn"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl mb-4 text-center">➕ Add New Strategy</h3>

            <input
              type="text"
              placeholder="Strategy Name"
              value={newStrategy.name}
              onChange={(e) =>
                setNewStrategy({ ...newStrategy, name: e.target.value })
              }
              className="w-[90%] my-2 px-3 py-2.5 rounded-lg border border-[#555] bg-[#1b1b1b] text-white text-sm"
            />

            <input
              type="text"
              placeholder="Tags (comma separated)"
              value={newStrategy.tags}
              onChange={(e) =>
                setNewStrategy({ ...newStrategy, tags: e.target.value })
              }
              className="w-[90%] my-2 px-3 py-2.5 rounded-lg border border-[#555] bg-[#1b1b1b] text-white text-sm"
            />

            <input
              type="text"
              placeholder="Description"
              value={newStrategy.author}
              onChange={(e) =>
                setNewStrategy({ ...newStrategy, author: e.target.value })
              }
              className="w-[90%] my-2 px-3 py-2.5 rounded-lg border border-[#555] bg-[#1b1b1b] text-white text-sm"
            />

            <p className="text-red-400">{error}</p>

            <div className="flex justify-end gap-2.5 mt-4">
              <button 
                className="px-3.5 py-2 border-none rounded-lg cursor-pointer font-semibold bg-[#333] text-[#ccc] transition-colors duration-200 hover:bg-[#444]"
                onClick={() => setShowPopup(false)}
              >
                Cancel
              </button>
              <button 
                className="px-3.5 py-2 border-none rounded-lg cursor-pointer font-semibold bg-[#00bcd4] text-black transition-colors duration-200 hover:bg-[#00d8ff]"
                onClick={handleAddStrategy}
              >
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