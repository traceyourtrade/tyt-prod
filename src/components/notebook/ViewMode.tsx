"use client"
import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Pencil, 
  FileText, 
  Calendar, 
  Clock,
  BookOpen,
  Sparkles,
  ChevronRight,
  Edit3,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  AlertTriangle,
  CheckCircle2,
  BarChart2,
  Lightbulb,
  Brain,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { getTemplateById, NOTEBOOK_TEMPLATES } from "@/lib/notebookTemplates";

interface FileContent {
  title: string;
  content: string;
  templateId?: string;
  fields?: Record<string, string>;
}

interface FileType {
  filename: string;
  created: string;
  lastUpdate?: string;
  content?: FileContent;
}

interface NoteType {
  folderName: string;
  files: FileType[];
}

interface ViewModeProps {
  notes: NoteType[];
  selectedFolder: string;
  selectedFile: string;
  changeMode: (mode: string) => void;
}

const ViewMode = ({ notes, selectedFolder, selectedFile, changeMode }: ViewModeProps) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const currentFileData = notes
    .find(note => note.folderName === selectedFolder)
    ?.files?.find(file => file.filename === selectedFile);

  const createdDate = currentFileData?.created
    ? new Date(currentFileData.created).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  const lastUpdatedDate = currentFileData?.lastUpdate
    ? new Date(currentFileData.lastUpdate).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';

  const template = currentFileData?.content?.templateId 
    ? getTemplateById(currentFileData.content.templateId) 
    : null;
  const fields = currentFileData?.content?.fields || {};

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case "bullish": return <TrendingUp className="h-4 w-4" />;
      case "bearish": return <TrendingDown className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case "bullish": return "text-profit bg-profit/10 border-profit/20";
      case "bearish": return "text-loss bg-loss/10 border-loss/20";
      default: return "text-muted-foreground bg-muted/50 border-border";
    }
  };

  const renderFieldValue = (fieldId: string, value: string, fieldType: string) => {
    if (!value) return <span className="text-muted-foreground italic">Not set</span>;
    
    if (fieldId === "sentiment" || fieldId === "overallBias") {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getSentimentColor(value)}`}>
          {getSentimentIcon(value)}
          <span className="capitalize">{value}</span>
        </span>
      );
    }

    if (fieldId === "confidence") {
      const level = parseInt(value) || 3;
      return (
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <div 
                key={i}
                className={`w-2 h-6 rounded-sm ${i <= level ? "bg-primary" : "bg-muted"}`}
              />
            ))}
          </div>
          <span className="text-sm text-muted-foreground">{level}/5</span>
        </div>
      );
    }

    if (fieldType === "textarea") {
      return (
        <div className="whitespace-pre-wrap text-sm text-foreground leading-relaxed">
          {value}
        </div>
      );
    }

    return <span className="text-sm text-foreground">{value}</span>;
  };

  useEffect(() => {
    if (contentRef.current && currentFileData?.content?.content && !template) {
      contentRef.current.innerHTML = currentFileData.content.content;
    }
  }, [currentFileData, template]);

  if (!currentFileData?.content?.title) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-full flex flex-col items-center justify-center p-8"
      >
        <div className="relative mb-6">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 15 }}
            className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/10 via-muted to-profit/10 flex items-center justify-center border border-border"
          >
            <BookOpen className="h-10 w-10 text-primary/60" />
          </motion.div>
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: "spring", damping: 15 }}
            className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl bg-gradient-to-br from-profit/20 to-profit/10 flex items-center justify-center border border-profit/20"
          >
            <Sparkles className="h-5 w-5 text-profit" />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <h3 className="text-lg font-semibold text-foreground mb-2">Select a note</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            Choose a note from the sidebar to view its contents, or create a new one to start documenting
          </p>

          <div className="flex flex-col gap-2 max-w-xs mx-auto">
            {[
              { icon: FileText, text: "Document trade ideas & setups" },
              { icon: Calendar, text: "Write weekly market reviews" },
              { icon: Edit3, text: "Keep strategy notes organized" },
            ].map((tip, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-3 px-4 py-2.5 bg-muted/30 rounded-lg border border-border"
              >
                <tip.icon className="h-4 w-4 text-primary/60" />
                <span className="text-xs text-muted-foreground">{tip.text}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col"
    >
      <div className="flex-shrink-0 border-b border-border bg-card/30">
        <div className="h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
        
        <div className="px-4 md:px-8 py-4 md:py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-2">
                <span className="hover:text-foreground cursor-pointer transition-colors">{selectedFolder}</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-medium truncate">{selectedFile}</span>
              </div>
              
              <div className="flex items-center gap-3 mb-2">
                {template && (
                  <div className={`w-8 h-8 rounded-lg ${template.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <template.icon className={`h-4 w-4 ${template.color}`} />
                  </div>
                )}
                <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
                  {currentFileData?.content?.title || 'Untitled'}
                </h1>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                {template && (
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${template.bgColor} ${template.color} border ${template.borderColor}`}>
                    {template.name}
                  </span>
                )}
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>Created {createdDate}</span>
                </div>
                {lastUpdatedDate && (
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>Updated {lastUpdatedDate}</span>
                  </div>
                )}
              </div>
            </div>
            
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => changeMode("EDIT")} 
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary transition-all text-sm font-medium shadow-sm"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden md:inline">Edit</span>
            </motion.button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="px-4 md:px-8 py-6"
        >
          <div className="max-w-3xl mx-auto">
            {template && Object.keys(fields).length > 0 ? (
              <div className="space-y-4">
                {fields.sentiment && (
                  <div className="flex items-center gap-4 p-4 bg-card/50 border border-border rounded-xl">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getSentimentColor(fields.sentiment)}`}>
                      {getSentimentIcon(fields.sentiment)}
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Market Bias</p>
                      <p className="text-lg font-semibold text-foreground capitalize">{fields.sentiment}</p>
                    </div>
                    {fields.confidence && (
                      <div className="ml-auto">
                        <p className="text-xs text-muted-foreground mb-1">Confidence</p>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(i => (
                            <div 
                              key={i}
                              className={`w-2.5 h-6 rounded-sm ${i <= parseInt(fields.confidence) ? "bg-primary" : "bg-muted"}`}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(fields.entry || fields.stopLoss || fields.takeProfit) && (
                  <div className="grid grid-cols-3 gap-3">
                    {fields.entry && (
                      <div className="p-4 bg-card/50 border border-border rounded-xl text-center">
                        <p className="text-xs text-muted-foreground mb-1">Entry</p>
                        <p className="text-lg font-bold text-foreground">{fields.entry}</p>
                      </div>
                    )}
                    {fields.stopLoss && (
                      <div className="p-4 bg-loss/5 border border-loss/20 rounded-xl text-center">
                        <p className="text-xs text-loss mb-1">Stop Loss</p>
                        <p className="text-lg font-bold text-loss">{fields.stopLoss}</p>
                      </div>
                    )}
                    {fields.takeProfit && (
                      <div className="p-4 bg-profit/5 border border-profit/20 rounded-xl text-center">
                        <p className="text-xs text-profit mb-1">Take Profit</p>
                        <p className="text-lg font-bold text-profit">{fields.takeProfit}</p>
                      </div>
                    )}
                  </div>
                )}

                {template.fields
                  .filter(f => !["sentiment", "confidence", "entry", "stopLoss", "takeProfit"].includes(f.id))
                  .map((field) => {
                    const value = fields[field.id];
                    if (!value && field.type !== "textarea") return null;
                    
                    return (
                      <div key={field.id} className="p-4 bg-card/50 border border-border rounded-xl">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                          {field.label}
                        </p>
                        {renderFieldValue(field.id, value, field.type)}
                      </div>
                    );
                  })}
              </div>
            ) : (
              <div className="bg-card/50 border border-border rounded-xl p-6 md:p-8">
                <div
                  ref={contentRef}
                  className="prose prose-sm md:prose-base dark:prose-invert max-w-none text-foreground leading-relaxed [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-semibold [&_h3]:text-base [&_h3]:font-medium [&_p]:text-sm [&_ul]:text-sm [&_ol]:text-sm [&_li]:my-1"
                  dangerouslySetInnerHTML={
                    currentFileData?.content?.content
                      ? { __html: currentFileData.content.content }
                      : { __html: '<p class="text-muted-foreground italic">No content yet. Click Edit to add content.</p>' }
                  }
                />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

export default ViewMode;
