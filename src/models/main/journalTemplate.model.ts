import mongoose, { Schema, Model } from 'mongoose';
import { connectMainDB } from '@/lib/db/connect';

export interface IJournalPrompt {
  id: string;
  label: string;
  placeholder: string;
  type: 'text' | 'textarea' | 'rating' | 'tags';
}

export interface IJournalTemplate {
  uniqueId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  prompts: IJournalPrompt[];
  isPremade: boolean;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const promptSchema = new Schema({
  id: { type: String, required: true },
  label: { type: String, required: true },
  placeholder: { type: String, default: '' },
  type: { type: String, enum: ['text', 'textarea', 'rating', 'tags'], default: 'textarea' }
}, { _id: false });

const journalTemplateSchema = new Schema<IJournalTemplate>({
  uniqueId: { type: String, required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'FileText' },
  color: { type: String, default: 'blue' },
  prompts: [promptSchema],
  isPremade: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  usageCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

journalTemplateSchema.index({ uniqueId: 1, name: 1 }, { unique: true });

export const getJournalTemplateModel = async (): Promise<Model<IJournalTemplate>> => {
  const conn = await connectMainDB();
  return conn.models.JournalTemplate || conn.model<IJournalTemplate>('JournalTemplate', journalTemplateSchema);
};

export const premadeTemplates = [
  {
    name: 'Trade Review',
    description: 'Comprehensive review of your trade execution',
    icon: 'ClipboardCheck',
    color: 'blue',
    prompts: [
      { id: 'went_well', label: 'What went well?', placeholder: 'Describe the positive aspects of this trade...', type: 'textarea' },
      { id: 'improve', label: 'What could improve?', placeholder: 'Areas for improvement...', type: 'textarea' },
      { id: 'lessons', label: 'Key lessons learned', placeholder: 'What will you remember from this trade?', type: 'textarea' },
      { id: 'follow_plan', label: 'Did you follow your plan?', placeholder: 'Yes/No and explain...', type: 'textarea' }
    ],
    isPremade: true
  },
  {
    name: 'Quick Notes',
    description: 'Simple freeform notes for fast journaling',
    icon: 'Zap',
    color: 'yellow',
    prompts: [
      { id: 'notes', label: 'Trade Notes', placeholder: 'Write your thoughts about this trade...', type: 'textarea' }
    ],
    isPremade: true
  },
  {
    name: 'Setup Analysis',
    description: 'Analyze your entry and exit decisions',
    icon: 'Target',
    color: 'green',
    prompts: [
      { id: 'entry_reason', label: 'Entry Reason', placeholder: 'Why did you enter this trade?', type: 'textarea' },
      { id: 'exit_reason', label: 'Exit Reason', placeholder: 'Why did you exit?', type: 'textarea' },
      { id: 'setup_grade', label: 'Setup Quality (1-10)', placeholder: 'Rate your setup...', type: 'text' },
      { id: 'would_take_again', label: 'Would you take this trade again?', placeholder: 'Yes/No and why...', type: 'textarea' }
    ],
    isPremade: true
  },
  {
    name: 'Emotional Check',
    description: 'Track your mindset and emotions',
    icon: 'Heart',
    color: 'pink',
    prompts: [
      { id: 'mindset_before', label: 'Mindset before trade', placeholder: 'How were you feeling before entering?', type: 'textarea' },
      { id: 'emotions_during', label: 'Emotions during trade', placeholder: 'What emotions came up while in the trade?', type: 'textarea' },
      { id: 'mindset_after', label: 'Mindset after trade', placeholder: 'How do you feel about the outcome?', type: 'textarea' },
      { id: 'confidence', label: 'Confidence level (1-10)', placeholder: 'Rate your confidence...', type: 'text' }
    ],
    isPremade: true
  },
  {
    name: 'Risk Management',
    description: 'Evaluate your risk and position sizing',
    icon: 'Shield',
    color: 'purple',
    prompts: [
      { id: 'risk_planned', label: 'Planned risk %', placeholder: 'What % of account did you risk?', type: 'text' },
      { id: 'stop_placement', label: 'Stop loss placement', placeholder: 'Where was your stop and why?', type: 'textarea' },
      { id: 'target_placement', label: 'Take profit placement', placeholder: 'Where was your target and why?', type: 'textarea' },
      { id: 'risk_assessment', label: 'Risk management review', placeholder: 'Did you manage risk properly?', type: 'textarea' }
    ],
    isPremade: true
  }
];
