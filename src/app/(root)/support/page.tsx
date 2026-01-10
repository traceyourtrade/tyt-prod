"use client";

import React, { useState } from "react";
import { 
  HelpCircle, 
  MessageSquare, 
  BookOpen, 
  Settings, 
  TrendingUp, 
  BarChart3,
  ChevronDown,
  ChevronRight,
  Send,
  Mail,
  User,
  FileText,
  ExternalLink,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "How do I add my first trade?",
        a: "Click the 'Add Trade' button in the sidebar or use the keyboard shortcut. You can add trades manually by entering the details, or connect your broker for automatic sync."
      },
      {
        q: "How do I connect my broker account?",
        a: "Go to Add Trade > Auto Sync tab. Select your broker (MetaTrader 5, Binance, Angel One, or Upstox), enter your credentials, and click Connect. Your trades will sync automatically."
      },
      {
        q: "Can I import trades from a CSV file?",
        a: "Yes! In the Add Trade modal, select the 'File Upload' tab. You can upload CSV files exported from most trading platforms. The system will automatically map the columns."
      }
    ]
  },
  {
    category: "Trading & Analysis",
    questions: [
      {
        q: "How is my P&L calculated?",
        a: "For Buy trades: (Exit Price - Entry Price) × Size - Commission - Charges. For Sell trades: (Entry Price - Exit Price) × Size - Commission - Charges."
      },
      {
        q: "What is the Playbook feature?",
        a: "The Playbook uses AI-powered pattern detection to identify your winning trade setups based on strategy, symbol, time, and day patterns. You need at least 10 trades for detection to work."
      },
      {
        q: "How do I switch between different time periods?",
        a: "On the Dashboard, use the dropdown menu to switch between Daily, Weekly, Monthly, or Custom date ranges to view your performance over different periods."
      }
    ]
  },
  {
    category: "Prop Firm Mode",
    questions: [
      {
        q: "What is Prop Firm Mode?",
        a: "Prop Firm Mode is designed for traders taking prop firm challenges. It tracks your progress with profit targets, drawdown limits (including daily drawdown), and displays a Challenge Command Center."
      },
      {
        q: "How do I enable Prop Firm Mode?",
        a: "Toggle the 'Prop Firm Mode' switch on the Dashboard. You can also mark specific accounts as Prop Firm accounts in Settings > Accounts."
      },
      {
        q: "Can I track multiple prop firm challenges?",
        a: "Yes! Create separate accounts for each challenge and mark them as Prop Firm accounts. You can filter and view each challenge's progress independently."
      }
    ]
  },
  {
    category: "Account & Settings",
    questions: [
      {
        q: "How do I change my currency display?",
        a: "Click the currency dropdown in the header (showing $, ₹, %, or R). Select your preferred display format. INR values are converted using the current exchange rate."
      },
      {
        q: "How do I update my profile information?",
        a: "Go to Settings > Profile. Update your name, email, country, phone, and bio, then click Save to apply changes."
      },
      {
        q: "Can I export my trading data?",
        a: "Yes, go to Reports and use the export feature to download your trading history and analytics in various formats."
      }
    ]
  }
];

const helpTopics = [
  {
    icon: TrendingUp,
    title: "Getting Started",
    description: "Learn the basics of setting up your trading journal",
    color: "emerald",
    links: ["Add your first trade", "Connect broker", "Import trades"]
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Understand your performance metrics and reports",
    color: "blue",
    links: ["Dashboard overview", "AI Analysis", "Custom reports"]
  },
  {
    icon: BookOpen,
    title: "Notebook & Journal",
    description: "Document your trading thoughts and strategies",
    color: "violet",
    links: ["Create notes", "Use templates", "Daily journal"]
  },
  {
    icon: Settings,
    title: "Account Settings",
    description: "Manage your profile, accounts, and preferences",
    color: "amber",
    links: ["Profile settings", "Manage accounts", "Currency options"]
  }
];

const quickLinks = [
  { label: "Resource Center", href: "/resources", icon: BookOpen },
  { label: "AI Analysis", href: "/ai-analysis", icon: Sparkles },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Lot Size Calculator", href: "/lot-calculator", icon: BarChart3 }
];

const Support = () => {
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("Getting Started");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("sending");
    
    try {
      const response = await fetch("/api/support/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      
      if (response.ok) {
        setFormStatus("success");
        setFormData({ name: "", email: "", subject: "", message: "" });
        setTimeout(() => setFormStatus("idle"), 5000);
      } else {
        setFormStatus("error");
        setTimeout(() => setFormStatus("idle"), 5000);
      }
    } catch {
      setFormStatus("error");
      setTimeout(() => setFormStatus("idle"), 5000);
    }
  };

  const getTopicColorClasses = (color: string) => {
    switch (color) {
      case "emerald": return "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500/20";
      case "blue": return "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20";
      case "violet": return "bg-violet-500/10 text-violet-500 group-hover:bg-violet-500/20";
      case "amber": return "bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Hero Section */}
      <div className={cn(
        "relative overflow-hidden rounded-2xl border p-8 sm:p-10",
        "bg-gradient-to-br from-primary/5 via-card to-card",
        "dark:from-zinc-900 dark:via-zinc-900 dark:to-zinc-800",
        "border-border dark:border-white/[0.08]"
      )}>
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 dark:bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-violet-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/2" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
            <HelpCircle className="w-4 h-4" />
            <span>Help & Support</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            How can we help you?
          </h1>
          
          <p className="text-muted-foreground text-lg">
            Find answers to common questions, explore help topics, or reach out to our support team.
          </p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border transition-all",
              "bg-card hover:bg-muted/50 border-border hover:border-primary/30",
              "group"
            )}
          >
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              <link.icon className="w-4 h-4" />
            </div>
            <span className="font-medium text-sm text-foreground">{link.label}</span>
          </a>
        ))}
      </div>

      {/* Help Topics */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">Help Topics</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {helpTopics.map((topic) => (
            <div
              key={topic.title}
              className={cn(
                "group p-5 rounded-xl border transition-all cursor-pointer",
                "bg-card hover:bg-card/80 border-border hover:border-border/80",
                "hover:shadow-lg hover:shadow-black/5"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-colors",
                getTopicColorClasses(topic.color)
              )}>
                <topic.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{topic.title}</h3>
              <p className="text-sm text-muted-foreground mb-3">{topic.description}</p>
              <div className="space-y-1">
                {topic.links.map((link) => (
                  <div key={link} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    <ChevronRight className="w-3 h-3" />
                    {link}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-semibold text-foreground mb-4">Frequently Asked Questions</h2>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {faqData.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activeCategory === cat.category
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {cat.category}
              </button>
            ))}
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-2">
            {faqData
              .find(cat => cat.category === activeCategory)
              ?.questions.map((faq, index) => {
                const faqId = `${activeCategory}-${index}`;
                const isExpanded = expandedFaq === faqId;
                
                return (
                  <div
                    key={faqId}
                    className={cn(
                      "border rounded-xl overflow-hidden transition-all",
                      isExpanded ? "bg-card border-primary/30" : "bg-card/50 border-border"
                    )}
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : faqId)}
                      className="w-full flex items-center justify-between p-4 text-left"
                    >
                      <span className="font-medium text-foreground pr-4">{faq.q}</span>
                      <ChevronDown className={cn(
                        "w-5 h-5 text-muted-foreground transition-transform flex-shrink-0",
                        isExpanded && "rotate-180"
                      )} />
                    </button>
                    
                    <div className={cn(
                      "overflow-hidden transition-all",
                      isExpanded ? "max-h-96" : "max-h-0"
                    )}>
                      <div className="px-4 pb-4 text-muted-foreground">
                        {faq.a}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Contact Support</h2>
          <div className={cn(
            "p-6 rounded-xl border",
            "bg-card border-border"
          )}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Send us a message</h3>
                <p className="text-xs text-muted-foreground">We typically respond within 24 hours</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Your name"
                    required
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm",
                      "bg-background border-border text-foreground placeholder:text-muted-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your@email.com"
                    required
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm",
                      "bg-background border-border text-foreground placeholder:text-muted-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Subject</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="How can we help?"
                    required
                    className={cn(
                      "w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm",
                      "bg-background border-border text-foreground placeholder:text-muted-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    )}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your issue or question..."
                  rows={4}
                  required
                  className={cn(
                    "w-full px-4 py-2.5 rounded-lg border text-sm resize-none",
                    "bg-background border-border text-foreground placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  )}
                />
              </div>

              <button
                type="submit"
                disabled={formStatus === "sending"}
                className={cn(
                  "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all",
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {formStatus === "sending" ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Message
                  </>
                )}
              </button>

              {formStatus === "success" && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  Message sent successfully! We'll get back to you soon.
                </div>
              )}

              {formStatus === "error" && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Failed to send message. Please try again.
                </div>
              )}
            </form>

            <div className="mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Average response time: 24 hours</span>
              </div>
            </div>
          </div>

          {/* WhatsApp Support */}
          <div className={cn(
            "mt-4 p-6 rounded-xl border",
            "bg-card border-border"
          )}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-[#25D366]/10 text-[#25D366]">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-foreground">Chat on WhatsApp</h3>
                <p className="text-xs text-muted-foreground">Get quick support via WhatsApp</p>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              For faster responses, reach out to us directly on WhatsApp. We're available to help with any questions or issues.
            </p>

            <a
              href="https://wa.me/919000248120?text=Hi!%20I%20need%20help%20with%20ProJournX."
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all",
                "bg-[#25D366] text-white hover:bg-[#20BA5C]"
              )}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Chat with us on WhatsApp
            </a>
          </div>
        </div>
      </div>

      {/* Additional Resources */}
      <div className={cn(
        "p-6 rounded-xl border",
        "bg-gradient-to-r from-primary/5 to-violet-500/5",
        "border-border"
      )}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="font-semibold text-foreground mb-1">Need more help?</h3>
            <p className="text-sm text-muted-foreground">
              Check out our Resource Center for trading education, tips, and guides.
            </p>
          </div>
          <a
            href="/resources"
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium text-sm transition-all",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "whitespace-nowrap"
            )}
          >
            Visit Resource Center
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Support;
