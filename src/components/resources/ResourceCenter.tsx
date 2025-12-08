"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Brain,
  CheckSquare,
  GraduationCap,
  Lightbulb,
  Target,
  TrendingUp,
  Clock,
  Sun,
  Moon,
  Zap,
} from "lucide-react";
import KnowledgeHub from "./KnowledgeHub";
import PsychologyCorner from "./PsychologyCorner";
import RoutinesTab from "./RoutinesTab";

type TabType = "knowledge" | "psychology" | "routines";

const tabs = [
  { id: "knowledge" as TabType, label: "Knowledge Hub", icon: GraduationCap },
  { id: "psychology" as TabType, label: "Psychology", icon: Brain },
  { id: "routines" as TabType, label: "Routines", icon: CheckSquare },
];

const ResourceCenter = () => {
  const [activeTab, setActiveTab] = useState<TabType>("knowledge");

  return (
    <div className="min-h-screen bg-background">
      {/* Premium Header */}
      <div className="sticky top-0 z-20 bg-card/80 backdrop-blur-xl border-b border-border">
        <div className="h-0.5 bg-gradient-to-r from-primary via-profit to-primary opacity-60" />

        <div className="px-4 md:px-6 py-3 md:py-4">
          <div className="flex flex-col gap-4">
            {/* Title Row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-foreground">
                    Resource Center
                  </h1>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Knowledge, psychology tips, and trading routines
                  </p>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl w-fit">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-card border border-border rounded-lg shadow-sm"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <Icon className="relative z-10 h-4 w-4" />
                    <span className="relative z-10 hidden sm:inline">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 md:p-6">
        <AnimatePresence mode="wait">
          {activeTab === "knowledge" && (
            <motion.div
              key="knowledge"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <KnowledgeHub />
            </motion.div>
          )}
          {activeTab === "psychology" && (
            <motion.div
              key="psychology"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <PsychologyCorner />
            </motion.div>
          )}
          {activeTab === "routines" && (
            <motion.div
              key="routines"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <RoutinesTab />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ResourceCenter;
