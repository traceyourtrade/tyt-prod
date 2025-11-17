import mongoose, { Schema, Document, Model } from "mongoose";
import { connectMainDB } from "@/lib/db/connect";

export interface INoteFile {
  filename: string;
  created: number;
  lastUpdate: number;
  content: {
    title: string;
    content: string;
  };
}

export interface INoteFolder {
  folderName: string;
  createdDate: number;
  folderType: string;
  files: INoteFile[];
}

export interface INote extends Document {
  uniqueId: string;
  email: string;
  notes: INoteFolder[];
  
  // Methods
  addFolder(folderName: string, folderType: string): Promise<INoteFolder[]>;
}

const noteSchema = new Schema<INote>({
  uniqueId: { type: String, required: true },
  email: { type: String, required: true },
  notes: [
    {
      folderName: { type: String, required: true },
      createdDate: { type: Number, default: () => Date.now() },
      folderType: { type: String, required: true },
      files: { type: [Schema.Types.Mixed], default: [] }
    }
  ]
});

// Add folder method
noteSchema.methods.addFolder = async function (folderName: string, folderType: string): Promise<INoteFolder[]> {
  try {
    this.notes = this.notes.concat({ folderName, folderType, files: [] });
    await this.save();
    return this.notes;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// Pre-save hook to add default folders/files for new documents
noteSchema.pre('save', async function (next) {
  if (this.isNew) {
    const now = Date.now();
    this.notes = [
      {
        folderName: "Daily Journal",
        folderType: "dj",
        createdDate: now,
        files: []
      },
      {
        folderName: "Risk Management",
        folderType: "default",
        createdDate: now,
        files: [
          {
            filename: 'Risk Management Rules',
            created: now,
            lastUpdate: now,
            content: {
              title: 'Risk Management Rules',
              content: `<font style=""><font size="5" style="font-weight: bold; font-style: italic;"><u>Risk Management Rules</u></font><br><font size="3">Recall below Risk Managment Rules before placing a trade:</font></font><div><ul><li><font style=""><font size="3">Risk Just 0.5-1% of capital per trade.</font></font></li><li><font size="3">Capture atleast 1:2 RR ratio</font></li><li><font size="3">Use a strategy with atleast 70% accuracy</font></li></ul></div>`
            }
          },
          {
            filename: 'Position Sizing Formulas',
            created: now,
            lastUpdate: now,
            content: {
              title: 'Position Sizing Calculators Formulas',
              content: `<font size="3"><br><table className="notebook-table" contenteditable="false"><tr><th contenteditable="true">Market</th><th contenteditable="true">Formula</th></tr><tr><td contenteditable="true">&nbsp;Forex</td><td contenteditable="true">&nbsp;Lot Size = (Risk Per Trade) / (Pips in SL × Pip Value)</td></tr><tr><td contenteditable="true">&nbsp;Stocks</td><td contenteditable="true">&nbsp;Shares = Risk Amount / (Entry Price − Stop Loss Price)</td></tr><tr><td contenteditable="true">&nbsp;Crypto</td><td contenteditable="true">&nbsp;Quantity = (Risk Per Trade / % in SL) / Current Market Price</td></tr></table><br></font>`
            }
          }
        ]
      },
      {
        folderName: "Psychology",
        folderType: "default",
        createdDate: now,
        files: [
          {
            filename: 'Psychology Rules',
            created: now,
            lastUpdate: now,
            content: {
              title: 'Psychology Rules',
              content: `<div><font size="5"><b><i><u>Psychology Tips:</u></i></b></font></div><div><ul><li><font size="3">Stick to Your Plan&nbsp;<font color="#fafafc" face="system-ui, ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif, Inter, NotoSansHans"><span style="letter-spacing: 0.32px; white-space-collapse: preserve-breaks; background-color: rgb(43, 43, 49);">&nbsp;- Emotions like fear and greed lead to impulsive decisions. Always follow your trading plan.</span></font></font></li><li><font size="3"><font color="#fafafc" face="system-ui, ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif, Inter, NotoSansHans"><span style="letter-spacing: 0.32px; white-space-collapse: preserve-breaks; background-color: rgb(43, 43, 49);">A</span></font></font>ccept Losses as Part of the Game&nbsp;<span style="background-color: rgb(43, 43, 49); color: rgb(250, 250, 252); font-family: system-ui, ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif, Inter, NotoSansHans; letter-spacing: 0.32px; white-space-collapse: preserve-breaks;"> – No strategy wins 100%. Losing trades don't mean failure—poor discipline does.</span></li><li>Avoid Revenge Trading&nbsp;<span style="background-color: rgb(43, 43, 49); color: rgb(250, 250, 252); font-family: system-ui, ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif, Inter, NotoSansHans; letter-spacing: 0.32px; white-space-collapse: preserve-breaks;"> – Don't chase losses. One bad trade shouldn't turn into five.</span></li><li>Be Patient -&nbsp;<span style="background-color: rgb(43, 43, 49); color: rgb(250, 250, 252); font-family: system-ui, ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif, Inter, NotoSansHans; letter-spacing: 0.32px; white-space-collapse: preserve-breaks;">&nbsp;Wait for high-probability setups. Opportunities will come; FOMO kills accounts.</span></li><li>Keep Ego in Check&nbsp;<span style="background-color: rgb(43, 43, 49); color: rgb(250, 250, 252); font-family: system-ui, ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif, Inter, NotoSansHans; letter-spacing: 0.32px; white-space-collapse: preserve-breaks;"> – It's not about being "right"—it's about making money. Cut losers fast, no matter your opinion</span></li></ul></div>`
            }
          }
        ]
      }
    ];
  }
  next();
});

export const getNoteModel = async (): Promise<Model<INote>> => {
  const conn = await connectMainDB();
  return conn.models.NOTES || conn.model<INote>("NOTES", noteSchema);
};