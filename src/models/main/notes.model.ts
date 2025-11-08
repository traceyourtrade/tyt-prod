import mongoose, { Schema, Document } from "mongoose";
import { connectMainDB } from "@/lib/db/connect";

// 🧩 Interfaces
interface IFile {
  filename: string;
  created: number;
  lastUpdate: number;
  content: {
    title: string;
    content: string;
  };
}

interface INoteFolder {
  folderName: string;
  createdDate: number;
  folderType: string;
  files: IFile[];
}

export interface INotes extends Document {
  uniqueId: string;
  email: string;
  notes: INoteFolder[];
  addFolder(folderName: string, folderType: string): Promise<INoteFolder[]>;
}

// 🧱 Schema
const noteSchema = new Schema<INotes>({
  uniqueId: { type: String, required: true },
  email: { type: String, required: true },
  notes: [
    {
      folderName: { type: String, required: true },
      createdDate: { type: Number, default: () => Date.now() },
      folderType: { type: String, required: true },
      files: { type: [Schema.Types.Mixed], default: [] },
    },
  ],
});

// ➕ Add Folder Method
noteSchema.methods.addFolder = async function (folderName: string, folderType: string) {
  try {
    this.notes = this.notes.concat({ folderName, folderType, files: [] });
    await this.save();
    return this.notes;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// ⚙️ Pre-Save Hook for Default Folders
noteSchema.pre("save", async function (next) {
  if (this.isNew) {
    const now = Date.now();

    this.notes = [
      {
        folderName: "Daily Journal",
        folderType: "dj",
        createdDate: now,
        files: [],
      },
      {
        folderName: "Risk Management",
        folderType: "default",
        createdDate: now,
        files: [
          {
            filename: "Risk Management Rules",
            created: now,
            lastUpdate: now,
            content: {
              title: "Risk Management Rules",
              content: `<font style=""><font size="5" style="font-weight: bold; font-style: italic;"><u>Risk Management Rules</u></font><br><font size="3">Recall below Risk Managment Rules before placing a trade:</font></font><div><ul><li><font size="3">Risk Just 0.5-1% of capital per trade.</font></li><li><font size="3">Capture atleast 1:2 RR ratio</font></li><li><font size="3">Use a strategy with atleast 70% accuracy</font></li></ul></div>`,
            },
          },
          {
            filename: "Position Sizing Formulas",
            created: now,
            lastUpdate: now,
            content: {
              title: "Position Sizing Calculators Formulas",
              content: `<font size="3"><br><table className="notebook-table" contenteditable="false"><tr><th>Market</th><th>Formula</th></tr><tr><td>&nbsp;Forex</td><td>&nbsp;Lot Size = (Risk Per Trade) / (Pips in SL × Pip Value)</td></tr><tr><td>&nbsp;Stocks</td><td>&nbsp;Shares = Risk Amount / (Entry Price − Stop Loss Price)</td></tr><tr><td>&nbsp;Crypto</td><td>&nbsp;Quantity = (Risk Per Trade / % in SL) / Current Market Price</td></tr></table><br></font>`,
            },
          },
        ],
      },
      {
        folderName: "Psychology",
        folderType: "default",
        createdDate: now,
        files: [
          {
            filename: "Psychology Rules",
            created: now,
            lastUpdate: now,
            content: {
              title: "Psychology Rules",
              content: `<div><font size="5"><b><i><u>Psychology Tips:</u></i></b></font></div><div><ul><li><font size="3">Stick to Your Plan - Emotions like fear and greed lead to impulsive decisions. Always follow your trading plan.</font></li><li><font size="3">Accept Losses as Part of the Game – No strategy wins 100%. Losing trades don't mean failure—poor discipline does.</font></li><li><font size="3">Avoid Revenge Trading – Don't chase losses. One bad trade shouldn't turn into five.</font></li><li><font size="3">Be Patient – Wait for high-probability setups. Opportunities will come; FOMO kills accounts.</font></li><li><font size="3">Keep Ego in Check – It's not about being "right"—it's about making money. Cut losers fast, no matter your opinion.</font></li></ul></div>`,
            },
          },
        ],
      },
    ];
  }

  next();
});

// 🚀 Model Getter
export const getNotesModel = async () => {
  const conn = await connectMainDB();
  return conn.models.NOTES || conn.model<INotes>("NOTES", noteSchema);
};
