"use client"
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { NOTEBOOK_TEMPLATES, NotebookTemplate } from "@/lib/notebookTemplates";

interface TemplatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: NotebookTemplate) => void;
}

const TemplatePicker = ({ isOpen, onClose, onSelect }: TemplatePickerProps) => {
  const categories = [
    { id: "trading", label: "Trading", description: "Trade ideas and setups" },
    { id: "analysis", label: "Analysis", description: "Market research" },
    { id: "review", label: "Review", description: "Performance tracking" },
    { id: "learning", label: "Learning", description: "Strategies & psychology" },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl max-h-[85vh] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="h-1 bg-gradient-to-r from-primary via-profit to-primary" />
            
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-profit/20 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Choose a Template</h2>
                    <p className="text-sm text-muted-foreground">Start with a pre-built structure for your notes</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
              {categories.map((category) => {
                const templates = NOTEBOOK_TEMPLATES.filter(t => t.category === category.id);
                if (templates.length === 0) return null;

                return (
                  <div key={category.id} className="mb-6 last:mb-0">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-foreground">{category.label}</h3>
                      <p className="text-xs text-muted-foreground">{category.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {templates.map((template) => {
                        const Icon = template.icon;
                        return (
                          <motion.button
                            key={template.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              onSelect(template);
                              onClose();
                            }}
                            className={`flex items-start gap-3 p-4 rounded-xl border ${template.borderColor} ${template.bgColor} hover:border-primary/40 transition-all text-left group`}
                          >
                            <div className={`w-10 h-10 rounded-lg ${template.bgColor} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                              <Icon className={`h-5 w-5 ${template.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-foreground mb-0.5">{template.name}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
                              <p className="text-[10px] text-muted-foreground/70 mt-1">
                                {template.fields.length} fields
                              </p>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default TemplatePicker;
