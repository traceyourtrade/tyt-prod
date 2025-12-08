"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Activity,
  Moon,
  Plus,
  Check,
  X,
  ChevronRight,
  Flame,
  Calendar,
  Clock,
  Edit2,
  Trash2,
  GripVertical,
  RotateCcw,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Sun,
  Activity,
  Moon,
  Plus,
  Calendar,
  Clock,
};

interface RoutineItem {
  id: string;
  text: string;
  completed: boolean;
}

interface Routine {
  id: string;
  name: string;
  iconName: string;
  color: string;
  items: RoutineItem[];
  isCustom?: boolean;
}

const getIcon = (iconName: string): LucideIcon => {
  return iconMap[iconName] || Plus;
};

const defaultRoutines: Routine[] = [
  {
    id: "pre-market",
    name: "Pre-Market Checklist",
    iconName: "Sun",
    color: "text-amber-500",
    items: [
      { id: "pm1", text: "Check economic calendar for high-impact news", completed: false },
      { id: "pm2", text: "Review overnight market moves and gaps", completed: false },
      { id: "pm3", text: "Mark key support/resistance levels on charts", completed: false },
      { id: "pm4", text: "Set up watchlist with potential trades", completed: false },
      { id: "pm5", text: "Review trading plan and daily goals", completed: false },
      { id: "pm6", text: "Check mental state - am I clear-headed?", completed: false },
      { id: "pm7", text: "Ensure risk parameters are set correctly", completed: false },
    ],
  },
  {
    id: "during-trade",
    name: "During Trade Reminders",
    iconName: "Activity",
    color: "text-blue-500",
    items: [
      { id: "dt1", text: "Is this trade part of my plan?", completed: false },
      { id: "dt2", text: "Is my position size appropriate for risk?", completed: false },
      { id: "dt3", text: "Have I set my stop loss correctly?", completed: false },
      { id: "dt4", text: "Am I trading with the trend?", completed: false },
      { id: "dt5", text: "Am I feeling emotional? If yes, step back.", completed: false },
      { id: "dt6", text: "Is my take profit at a logical level?", completed: false },
    ],
  },
  {
    id: "post-market",
    name: "Post-Market Review",
    iconName: "Moon",
    color: "text-purple-500",
    items: [
      { id: "pm1", text: "Record all trades in journal with screenshots", completed: false },
      { id: "pm2", text: "Calculate daily P&L and update statistics", completed: false },
      { id: "pm3", text: "Review what went well today", completed: false },
      { id: "pm4", text: "Identify areas for improvement", completed: false },
      { id: "pm5", text: "Note any patterns or lessons learned", completed: false },
      { id: "pm6", text: "Prepare for tomorrow - mark key levels", completed: false },
      { id: "pm7", text: "Close trading platform and disconnect mentally", completed: false },
    ],
  },
];

interface StreakData {
  count: number;
  lastCompletedDate: string;
  streakIncrementedToday: boolean;
}

interface RoutineCompletionData {
  routines: Routine[];
  lastResetDate: string;
}

const RoutinesTab = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>("pre-market");
  const [streak, setStreak] = useState(0);
  const [streakIncrementedToday, setStreakIncrementedToday] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState("");
  const [editingItem, setEditingItem] = useState<{ routineId: string; itemId: string } | null>(null);
  const [editText, setEditText] = useState("");

  const getTodayString = () => new Date().toDateString();

  const isYesterday = (dateString: string) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return new Date(dateString).toDateString() === yesterday.toDateString();
  };

  const migrateRoutineData = (routines: Routine[]): Routine[] => {
    return routines.map((routine) => {
      if (!routine.iconName) {
        const iconNameMap: Record<string, string> = {
          "pre-market": "Sun",
          "during-trade": "Activity",
          "post-market": "Moon",
        };
        return {
          ...routine,
          iconName: iconNameMap[routine.id] || (routine.isCustom ? "Calendar" : "Plus"),
        };
      }
      return routine;
    });
  };

  useEffect(() => {
    const today = getTodayString();
    
    const savedData = localStorage.getItem("tradingRoutinesData");
    if (savedData) {
      const data = JSON.parse(savedData);
      const migratedRoutines = migrateRoutineData(data.routines);
      
      if (data.lastResetDate !== today) {
        const resetRoutines = migratedRoutines.map((routine) => ({
          ...routine,
          items: routine.items.map((item) => ({ ...item, completed: false })),
        }));
        setRoutines(resetRoutines);
        saveRoutinesToStorage(resetRoutines, today);
      } else {
        setRoutines(migratedRoutines);
        if (migratedRoutines !== data.routines) {
          saveRoutinesToStorage(migratedRoutines, data.lastResetDate);
        }
      }
    } else {
      setRoutines(defaultRoutines);
      saveRoutinesToStorage(defaultRoutines, today);
    }

    const savedStreak = localStorage.getItem("routineStreak");
    if (savedStreak) {
      const streakData: StreakData = JSON.parse(savedStreak);
      
      if (streakData.lastCompletedDate === today) {
        setStreak(streakData.count);
        setStreakIncrementedToday(true);
      } else if (isYesterday(streakData.lastCompletedDate)) {
        setStreak(streakData.count);
        setStreakIncrementedToday(false);
      } else {
        setStreak(0);
        setStreakIncrementedToday(false);
      }
    }
  }, []);

  const saveRoutinesToStorage = (newRoutines: Routine[], date?: string) => {
    const data: RoutineCompletionData = {
      routines: newRoutines,
      lastResetDate: date || getTodayString(),
    };
    localStorage.setItem("tradingRoutinesData", JSON.stringify(data));
  };

  const saveRoutines = (newRoutines: Routine[]) => {
    setRoutines(newRoutines);
    saveRoutinesToStorage(newRoutines);
  };

  const checkAndUpdateStreak = (newRoutines: Routine[]) => {
    if (streakIncrementedToday) return;

    const allCompleted = newRoutines.every((r) =>
      r.items.length > 0 && r.items.every((i) => i.completed)
    );
    
    if (allCompleted) {
      const today = getTodayString();
      const newStreak = streak + 1;
      const streakData: StreakData = {
        count: newStreak,
        lastCompletedDate: today,
        streakIncrementedToday: true,
      };
      setStreak(newStreak);
      setStreakIncrementedToday(true);
      localStorage.setItem("routineStreak", JSON.stringify(streakData));
    }
  };

  const toggleItem = (routineId: string, itemId: string) => {
    const newRoutines = routines.map((routine) => {
      if (routine.id === routineId) {
        const newItems = routine.items.map((item) =>
          item.id === itemId ? { ...item, completed: !item.completed } : item
        );
        return { ...routine, items: newItems };
      }
      return routine;
    });
    saveRoutines(newRoutines);
    checkAndUpdateStreak(newRoutines);
  };

  const resetRoutine = (routineId: string) => {
    const newRoutines = routines.map((routine) => {
      if (routine.id === routineId) {
        return {
          ...routine,
          items: routine.items.map((item) => ({ ...item, completed: false })),
        };
      }
      return routine;
    });
    saveRoutines(newRoutines);
  };

  const addCustomRoutine = () => {
    if (!newRoutineName.trim()) return;

    const newRoutine: Routine = {
      id: `custom-${Date.now()}`,
      name: newRoutineName,
      iconName: "Calendar",
      color: "text-emerald-500",
      items: [],
      isCustom: true,
    };

    saveRoutines([...routines, newRoutine]);
    setNewRoutineName("");
    setShowAddModal(false);
    setExpandedRoutine(newRoutine.id);
  };

  const addItemToRoutine = (routineId: string) => {
    const newRoutines = routines.map((routine) => {
      if (routine.id === routineId) {
        return {
          ...routine,
          items: [
            ...routine.items,
            { id: `item-${Date.now()}`, text: "New item - click to edit", completed: false },
          ],
        };
      }
      return routine;
    });
    saveRoutines(newRoutines);
  };

  const updateItem = (routineId: string, itemId: string, newText: string) => {
    if (!newText.trim()) return;

    const newRoutines = routines.map((routine) => {
      if (routine.id === routineId) {
        return {
          ...routine,
          items: routine.items.map((item) =>
            item.id === itemId ? { ...item, text: newText } : item
          ),
        };
      }
      return routine;
    });
    saveRoutines(newRoutines);
    setEditingItem(null);
    setEditText("");
  };

  const deleteItem = (routineId: string, itemId: string) => {
    const newRoutines = routines.map((routine) => {
      if (routine.id === routineId) {
        return {
          ...routine,
          items: routine.items.filter((item) => item.id !== itemId),
        };
      }
      return routine;
    });
    saveRoutines(newRoutines);
  };

  const deleteRoutine = (routineId: string) => {
    const newRoutines = routines.filter((r) => r.id !== routineId);
    saveRoutines(newRoutines);
  };

  const getCompletionPercentage = (routine: Routine) => {
    if (routine.items.length === 0) return 0;
    return Math.round(
      (routine.items.filter((i) => i.completed).length / routine.items.length) * 100
    );
  };

  return (
    <div className="space-y-6">
      {/* Streak Banner */}
      <motion.div
        className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/20">
            <Flame className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold text-foreground">{streak} days</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Complete all routines daily</p>
          <p className="text-xs text-muted-foreground">to build your streak!</p>
        </div>
      </motion.div>

      {/* Routines List */}
      <div className="space-y-4">
        {routines.map((routine) => {
          const Icon = getIcon(routine.iconName);
          const isExpanded = expandedRoutine === routine.id;
          const completionPct = getCompletionPercentage(routine);
          const completedCount = routine.items.filter((i) => i.completed).length;

          return (
            <motion.div
              key={routine.id}
              layout
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              {/* Routine Header */}
              <button
                onClick={() => setExpandedRoutine(isExpanded ? null : routine.id)}
                className="w-full p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${routine.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-medium text-foreground">{routine.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {completedCount}/{routine.items.length} completed
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Progress Circle */}
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 -rotate-90">
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        className="text-muted"
                      />
                      <circle
                        cx="20"
                        cy="20"
                        r="16"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        strokeDasharray={100}
                        strokeDashoffset={100 - completionPct}
                        className={completionPct === 100 ? "text-profit" : "text-primary"}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {completionPct}%
                    </span>
                  </div>

                  <ChevronRight
                    className={`h-5 w-5 text-muted-foreground transition-transform ${
                      isExpanded ? "rotate-90" : ""
                    }`}
                  />
                </div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-t border-border"
                  >
                    <div className="p-4 space-y-2">
                      {routine.items.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                            item.completed ? "bg-profit/10" : "bg-muted/50 hover:bg-muted"
                          }`}
                        >
                          <button
                            onClick={() => toggleItem(routine.id, item.id)}
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                              item.completed
                                ? "bg-profit border-profit text-white"
                                : "border-muted-foreground/50 hover:border-primary"
                            }`}
                          >
                            {item.completed && <Check className="h-3 w-3" />}
                          </button>

                          {editingItem?.routineId === routine.id && editingItem?.itemId === item.id ? (
                            <input
                              type="text"
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              onBlur={() => updateItem(routine.id, item.id, editText)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") updateItem(routine.id, item.id, editText);
                                if (e.key === "Escape") {
                                  setEditingItem(null);
                                  setEditText("");
                                }
                              }}
                              autoFocus
                              className="flex-1 bg-transparent border-b border-primary text-sm text-foreground focus:outline-none"
                            />
                          ) : (
                            <span
                              className={`flex-1 text-sm ${
                                item.completed ? "text-muted-foreground line-through" : "text-foreground"
                              }`}
                            >
                              {item.text}
                            </span>
                          )}

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingItem({ routineId: routine.id, itemId: item.id });
                                setEditText(item.text);
                              }}
                              className="p-1.5 rounded hover:bg-muted transition-colors"
                            >
                              <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => deleteItem(routine.id, item.id)}
                              className="p-1.5 rounded hover:bg-loss/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-loss" />
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Add Item Button */}
                      <button
                        onClick={() => addItemToRoutine(routine.id)}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-lg border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors text-sm text-muted-foreground hover:text-primary"
                      >
                        <Plus className="h-4 w-4" />
                        Add Item
                      </button>

                      {/* Routine Actions */}
                      <div className="flex items-center justify-between pt-2">
                        <button
                          onClick={() => resetRoutine(routine.id)}
                          className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Reset
                        </button>

                        {routine.isCustom && (
                          <button
                            onClick={() => deleteRoutine(routine.id)}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-loss/70 hover:text-loss transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete Routine
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Add Custom Routine Button */}
      <button
        onClick={() => setShowAddModal(true)}
        className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors text-muted-foreground hover:text-primary"
      >
        <Plus className="h-5 w-5" />
        Create Custom Routine
      </button>

      {/* Add Routine Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-2xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-semibold text-foreground mb-4">Create Custom Routine</h3>

              <input
                type="text"
                value={newRoutineName}
                onChange={(e) => setNewRoutineName(e.target.value)}
                placeholder="Routine name (e.g., Weekly Review)"
                className="w-full px-4 py-3 bg-muted border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                autoFocus
              />

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addCustomRoutine}
                  disabled={!newRoutineName.trim()}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RoutinesTab;
