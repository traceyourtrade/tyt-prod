"use client"
import { useState } from "react";
import Cookies from "js-cookie";
import { MoreVertical, Send, X, Plus, Search, Target, TrendingUp, BarChart3, Percent, ListChecks, Trash2 } from "lucide-react";
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
  isDefault?: boolean;
}

interface StrategiesProps {
  allStrategies: string[];
  strategies: Strategy[];
  strategiesDataObj: { [key: string]: Trade[] };
}

interface StrategyRule {
  id: string;
  text: string;
}

interface NewStrategy {
  name: string;
  tags: string;
  author: string;
  rules: StrategyRule[];
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
    rules: [],
  });
  const [newRuleText, setNewRuleText] = useState("");
  const [selectedStrategy, setSelectedStrategy] = useState<CombinedData & { name: string } | null>(null);
  const [error, setError] = useState("");

  const tokenn = Cookies.get("ProJournX");

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
          id: id, apiName: 'updateStrategyName'
        })
      });

      const data = await res.json();

      if (res.status === 200) {
        setEditing(null);
        setOpenMenu(null);
      } else {
        if (data.error === "Invalid credentials") {
          setError("Invalid credentials, please recheck the Email & Password")
        } else if (data.error === "Enter all the details") {
          setError("Fill all the entries")
        }
      }
    } catch (error) {
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
          id: id,
          apiName: 'deleteStrategy'
        })
      });

      const data = await res.json();

      if (res.status === 200) {
        setNewStrategy({ name: "", tags: "", author: "", rules: [] });
        setShowPopup(false);
      } else {
        if (data.error === "Invalid credentials") {
          setError("Invalid credentials, please recheck the Email & Password")
        } else if (data.error === "Enter all the details") {
          setError("Fill all the entries")
        }
      }
    } catch (error) {
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
          id: id,
          apiName: 'setDefaultStrategy'
        })
      });

      const data = await res.json();

      if (res.status === 200) {
        setOpenMenu(null);
        window.location.reload();
      } else {
        if (data.error === "Invalid credentials") {
          setError("Invalid credentials, please recheck the Email & Password")
        } else if (data.error === "Enter all the details") {
          setError("Fill all the entries")
        }
      }
    } catch (error) {
    }
  };

  const addRule = () => {
    if (!newRuleText.trim()) return;

    const rule: StrategyRule = {
      id: `rule-${Date.now()}`,
      text: newRuleText.trim()
    };

    setNewStrategy({
      ...newStrategy,
      rules: [...newStrategy.rules, rule]
    });
    setNewRuleText("");
  };

  const removeRule = (ruleId: string) => {
    setNewStrategy({
      ...newStrategy,
      rules: newStrategy.rules.filter(r => r.id !== ruleId)
    });
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
          apiName: 'addStrategy',
          tokenn,
          strategy: newStrategy.name,
          tags: newStrategy.tags,
          description: newStrategy.author,
          rules: newStrategy.rules
        })
      });

      const data = await res.json();

      if (res.status === 200) {
        setNewStrategy({ name: "", tags: "", author: "", rules: [] });
        setNewRuleText("");
        setShowPopup(false);
      } else {
        if (data.error === "Invalid credentials") {
          setError("Invalid credentials, please recheck the Email & Password")
        } else if (data.error === "Enter all the details") {
          setError("Fill all the entries")
        }
      }
    } catch (error) {
    }
  };

  const combinedData: { [key: string]: CombinedData } = {};

  allStrategies.forEach((name) => {
    const meta = strategies.find((s) => s.strategy === name) || {};
    const trades = strategiesDataObj[name] || [];

    const totalTrades = trades.length;
    const wins = trades.filter((t) => t.Profit > 0).length;
    const losses = trades.filter((t) => t.Profit <= 0).length;

    const winRate = totalTrades > 0 ? ((wins / totalTrades) * 100).toFixed(1) + "%" : "—";

    const totalProfit = trades.reduce((acc, t) => acc + t.Profit, 0);
    const grossProfit = trades.filter((t) => t.Profit > 0).reduce((acc, t) => acc + t.Profit, 0);
    const grossLoss = trades.filter((t) => t.Profit < 0).reduce((acc, t) => acc + Math.abs(t.Profit), 0);

    const winLossRatio = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : "∞";

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
      totalLoses: losses,
      isDefault: meta.isDefault || false
    };
  });

  return (
    <div className="w-full min-h-[70vh] text-foreground flex flex-col gap-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Your Strategies</h2>
            <p className="text-sm text-muted-foreground">{allStrategies.length} strategies total</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
          <button
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-all shadow-sm touch-manipulation"
            onClick={() => setShowPopup(true)}
          >
            <Plus className="h-4 w-4" />
            Add Strategy
          </button>

          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search strategies..."
              className="pl-10 pr-4 py-2.5 bg-muted border border-border text-foreground rounded-lg text-sm outline-none w-full sm:w-[220px] transition-all focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Strategy Cards Grid */}
      {filteredStrategies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground text-base">No strategies found.</p>
          <p className="text-muted-foreground text-sm mt-1">Create your first strategy to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStrategies.map((name, idx) => {
            const s = combinedData[name];
            if (!s) return null;

            return (
              <div
                key={idx}
                className="bg-card border border-border rounded-xl overflow-hidden transition-all duration-200 flex flex-col hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 cursor-pointer group"
                onClick={() => setSelectedStrategy({ name, ...s })}
              >
                {/* Card Image/Header */}
                <div className="w-full h-[140px] overflow-hidden border-b border-border flex items-center justify-center relative">
                  {s.image ? (
                    <img src={s.image} alt={name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 flex items-center justify-center">
                      <span className="text-3xl font-bold text-primary/60">{getShortForm(name)}</span>
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-4 flex flex-col gap-3">
                  {/* Name and Menu */}
                  <div className="flex justify-between items-center relative">
                    {editing === name ? (
                      <div className="flex items-center gap-2 w-full">
                        <input
                          type="text"
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <button
                          className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                          onClick={(e) => { e.stopPropagation(); handleRename(e, name, s.id); }}
                        >
                          <Send className="h-4 w-4" />
                        </button>
                        <button
                          className="p-1.5 rounded-lg bg-loss/10 text-loss hover:bg-loss/20 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(null);
                            setOpenMenu(null);
                          }}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-semibold text-foreground">{name}</h3>
                          {s.isDefault && (
                            <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-primary/10 text-primary rounded">
                              Default
                            </span>
                          )}
                        </div>
                        <button
                          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(openMenu === name ? null : name);
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {/* Dropdown Menu */}
                    {openMenu === name && editing !== name && (
                      <div className="absolute right-0 top-8 bg-card border border-border rounded-xl py-1 shadow-xl z-20 min-w-[140px]">
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditing(name);
                            setTempName(name);
                          }}
                        >
                          Rename
                        </button>
                        <button
                          className="w-full px-4 py-2 text-left text-sm text-loss hover:bg-loss/10 transition-colors flex items-center gap-2"
                          onClick={(e) => { e.stopPropagation(); handleDelete(e, name, s.id); }}
                        >
                          Delete
                        </button>
                        {!s.isDefault && (
                          <button
                            className="w-full px-4 py-2 text-left text-sm text-foreground hover:bg-muted transition-colors flex items-center gap-2"
                            onClick={(e) => { e.stopPropagation(); handleMakeDefault(e, s.id); }}
                          >
                            Make Default
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {s.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {s.tags.map((tag, i) => (
                        <span
                          key={i}
                          className="bg-muted text-muted-foreground rounded-md px-2 py-0.5 text-xs font-medium transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Stats Row */}
                  <div className="flex justify-between items-center pt-3 border-t border-border">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                        <Percent className="h-3 w-3" />
                        <span className="text-xs">Win rate</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{s.winRate}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                        <BarChart3 className="h-3 w-3" />
                        <span className="text-xs">Trades</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{s.trades}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1 text-muted-foreground mb-0.5">
                        <TrendingUp className="h-3 w-3" />
                        <span className="text-xs">Win/Loss</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{s.winLoss}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Strategy Popup */}
      {showPopup && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex justify-center items-center z-50"
          onClick={() => setShowPopup(false)}
        >
          <div
            className="bg-card border border-border p-6 rounded-xl w-[500px] max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Plus className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Add New Strategy</h3>
                <p className="text-sm text-muted-foreground">Create a new trading strategy</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Strategy Name</label>
                <input
                  type="text"
                  placeholder="e.g., Momentum Trading"
                  value={newStrategy.name}
                  onChange={(e) =>
                    setNewStrategy({ ...newStrategy, name: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Tags</label>
                <input
                  type="text"
                  placeholder="e.g., scalping, momentum (comma separated)"
                  value={newStrategy.tags}
                  onChange={(e) =>
                    setNewStrategy({ ...newStrategy, tags: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Description</label>
                <input
                  type="text"
                  placeholder="Brief description of your strategy"
                  value={newStrategy.author}
                  onChange={(e) =>
                    setNewStrategy({ ...newStrategy, author: e.target.value })
                  }
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-1.5">
                  <ListChecks className="h-4 w-4 text-primary" />
                  Strategy Rules / Checklist
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Add rules that must be followed when trading this strategy. These will appear as a checklist when journaling.
                </p>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="e.g., Wait for confirmation candle"
                    value={newRuleText}
                    onChange={(e) => setNewRuleText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addRule();
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground"
                  />
                  <button
                    type="button"
                    onClick={addRule}
                    className="px-3 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {newStrategy.rules.length > 0 && (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {newStrategy.rules.map((rule, index) => (
                      <div
                        key={rule.id}
                        className="flex items-center gap-2 p-2.5 bg-muted rounded-lg group"
                      >
                        <span className="w-5 h-5 flex items-center justify-center rounded bg-primary/10 text-primary text-xs font-medium">
                          {index + 1}
                        </span>
                        <span className="flex-1 text-sm text-foreground">{rule.text}</span>
                        <button
                          type="button"
                          onClick={() => removeRule(rule.id)}
                          className="p-1 text-muted-foreground hover:text-loss opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {newStrategy.rules.length === 0 && (
                  <p className="text-xs text-muted-foreground italic py-2">
                    No rules added yet. Add rules to create a trading checklist.
                  </p>
                )}
              </div>

              {error && (
                <p className="text-loss text-sm">{error}</p>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2.5 border border-border rounded-lg text-foreground text-sm font-medium hover:bg-muted transition-colors"
                onClick={() => setShowPopup(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                onClick={handleAddStrategy}
              >
                Create Strategy
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
