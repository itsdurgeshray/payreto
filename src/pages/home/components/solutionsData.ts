import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  BookOpen,
  Bot,
  CalendarClock,
  ChartColumn,
  ChartLine,
  ChartPie,
  ChartSpline,
  ClipboardList,
  CreditCard,
  Database,
  FileChartColumn,
  FileCheck2,
  Flag,
  Gauge,
  GitCompareArrows,
  GraduationCap,
  Headphones,
  Headset,
  Landmark,
  ListChecks,
  LockKeyhole,
  MessagesSquare,
  Network,
  Receipt,
  RefreshCw,
  Route,
  Scale,
  ScanFace,
  ShieldAlert,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Smile,
  Store,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

// Single source of truth for the six solution groups and every tile/item.
// The hero mosaic, the morphing tabs and the solutions content all read this.

export type GroupKey = "green" | "orange" | "blue" | "pink" | "cyan" | "yellow";

export type Group = {
  name: string;
  icon: LucideIcon;
  blurb: string;
  // RGB triplets: light (labels on dark), base (glow / tint), deep (accents),
  // ink (text + active fill on the light theme — WCAG-safe with white).
  light: string;
  base: string;
  deep: string;
  ink: string;
  n: [number, number, number];
};

export const GROUP_ORDER: GroupKey[] = ["green", "orange", "blue", "pink", "cyan", "yellow"];

export const GROUPS: Record<GroupKey, Group> = {
  green: {
    icon: Users,
    name: "Talent",
    blurb: "Specialist people, sourced, trained and ready to scale with you.",
    light: "134,239,172",
    base: "74,222,128",
    deep: "22,163,74",
    ink: "21,128,61",
    n: [74, 222, 128],
  },
  orange: {
    icon: UserCheck,
    name: "Onboarding",
    blurb: "Fast, compliant customer onboarding from first document to ongoing review.",
    light: "253,186,116",
    base: "251,146,60",
    deep: "234,88,12",
    ink: "194,65,12",
    n: [251, 146, 60],
  },
  blue: {
    icon: CreditCard,
    name: "Payment",
    blurb: "Payment operations that keep money moving securely, in any currency.",
    light: "147,197,253",
    base: "96,165,250",
    deep: "37,99,235",
    ink: "29,78,216",
    n: [96, 165, 250],
  },
  pink: {
    icon: ChartPie,
    name: "Finance",
    blurb: "Accurate books, clean closes and reporting you can act on.",
    light: "249,168,212",
    base: "244,114,182",
    deep: "219,39,119",
    ink: "190,24,93",
    n: [244, 114, 182],
  },
  cyan: {
    icon: Headset,
    name: "Contact",
    blurb: "Customer conversations handled with care across every channel.",
    light: "103,232,249",
    base: "34,211,238",
    deep: "8,145,178",
    ink: "14,116,144",
    n: [34, 211, 238],
  },
  yellow: {
    icon: Database,
    name: "Data",
    blurb: "Turning operational data into insight, controls and automation.",
    light: "253,224,71",
    base: "250,204,21",
    deep: "202,138,4",
    ink: "161,98,7",
    n: [250, 204, 21],
  },
};

export type Item = {
  code: string;
  group: GroupKey;
  title: string;
  description: string;
  icon: LucideIcon;
  // Optional reference photo; when absent a generated illustration is shown.
  image?: string;
};

// Order matters: the mosaic assigns these to tiles column by column.
export const ITEMS: Item[] = [
  { code: "TpL", group: "green", title: "Talent Pipeline", icon: Users, description: "Always-on sourcing that keeps vetted fintech and operations specialists ready before a role even opens." },
  { code: "Tas", group: "green", title: "Talent Acquisition Services", icon: UserPlus, description: "End-to-end recruitment — from role scoping and screening to offer — for hard-to-fill regulated roles." },
  { code: "TnG", group: "green", title: "Training & Growth", icon: GraduationCap, description: "Structured onboarding, certification and upskilling programmes that keep teams sharp as you scale." },

  { code: "IvD", group: "orange", title: "Identity Verification & Documentation", icon: ScanFace, description: "Document checks, liveness and biometric matching to confirm every customer is who they claim to be." },
  { code: "CoD", group: "orange", title: "Collection of Documents", icon: FileCheck2, description: "Guided, chased and validated document collection so applications never stall on missing paperwork." },
  { code: "Wr", group: "orange", title: "Watchlist Review", icon: ShieldAlert, description: "Sanctions, PEP and adverse-media screening with analyst review of every potential match." },
  { code: "Ap", group: "orange", title: "Application Processing", icon: ClipboardList, description: "High-volume processing of new applications against your policy, with clear decisions and audit trails." },
  { code: "Ct", group: "orange", title: "Compliance Tracking", icon: ListChecks, description: "Live tracking of every onboarding requirement so nothing goes live without the right approvals." },
  { code: "Rf", group: "orange", title: "Risk Flagging", icon: Flag, description: "Early detection of high-risk signals during onboarding, escalated to the right team in minutes." },
  { code: "Am", group: "orange", title: "Account Maintenance", icon: UserCog, description: "Ongoing updates to customer records, ownership changes and account lifecycle requests." },
  { code: "Af", group: "orange", title: "Anti-Fraud Checks", icon: ShieldCheck, description: "Device, behavioural and data-consistency checks that stop synthetic and stolen identities." },
  { code: "Rw", group: "orange", title: "Re-verification Workflows", icon: RefreshCw, description: "Trigger-based refresh of customer data when documents expire or risk profiles change." },
  { code: "Pe", group: "orange", title: "Periodic Evaluation", icon: CalendarClock, description: "Scheduled KYC reviews sized to each customer's risk tier, completed on time, every time." },
  { code: "AtR", group: "orange", title: "Automated Tiered Risk-rating", icon: Gauge, description: "Rules-driven risk scoring that places each customer in the right due-diligence tier automatically." },

  { code: "Fx", group: "blue", title: "Foreign Exchange", icon: ArrowLeftRight, description: "Multi-currency conversion and FX operations with transparent rates and tight settlement windows." },
  { code: "Mt", group: "blue", title: "Merchant Transactions", icon: Store, description: "Monitoring and servicing of merchant payment flows, from authorisation to payout." },
  { code: "ToR", group: "blue", title: "Transaction Orchestration & Routing", icon: Route, description: "Smart routing across acquirers and rails to lift approval rates and cut processing cost." },
  { code: "Dm", group: "blue", title: "Dispute Management", icon: Scale, description: "Chargeback handling, evidence packs and representment that recover revenue and protect ratios." },
  { code: "TdS", group: "blue", title: "3-D Secure", icon: LockKeyhole, description: "Strong customer authentication set up and tuned to reduce fraud without adding checkout friction." },
  { code: "Pa", group: "blue", title: "Payment Acceptance", icon: CreditCard, description: "Card, wallet and local payment method acceptance, configured and supported end to end." },
  { code: "To", group: "blue", title: "Treasury Operations", icon: Landmark, description: "Liquidity, safeguarding and funding operations that keep balances where they need to be." },
  { code: "TsG", group: "blue", title: "Transaction Settlement Gateway", icon: Network, description: "Reliable settlement and payout processing with full visibility of every transfer." },

  { code: "FoP", group: "pink", title: "Financial Operations & Planning", icon: ChartLine, description: "Budgeting, forecasting and financial planning that ties operational activity to the numbers." },
  { code: "Oc", group: "pink", title: "Order-to-Cash", icon: Receipt, description: "Invoicing, collections and cash application that shorten the time between sale and settlement." },
  { code: "PrP", group: "pink", title: "Procure-to-Pay", icon: ShoppingCart, description: "Purchase approvals, supplier onboarding and accounts payable run with controls built in." },
  { code: "Ga", group: "pink", title: "General Accounting", icon: BookOpen, description: "Journals, accruals and month-end close delivered accurately and on schedule." },
  { code: "PrL", group: "pink", title: "Payroll", icon: Wallet, description: "Accurate, compliant payroll processing across entities, currencies and jurisdictions." },
  { code: "ReC", group: "pink", title: "Reconciliation", icon: GitCompareArrows, description: "Bank, ledger and scheme reconciliation that surfaces breaks before they become losses." },
  { code: "PvR", group: "pink", title: "Performance & Variance Reporting", icon: FileChartColumn, description: "Management reporting that explains what moved, why it moved and what to do next." },

  { code: "VoH", group: "cyan", title: "Voice Helpdesk", icon: Headphones, description: "Multilingual phone support staffed by agents who understand financial products." },
  { code: "TsO", group: "cyan", title: "Technical Support Operations", icon: Wrench, description: "Tier 1–2 technical support for integrations, APIs and platform issues." },
  { code: "Le", group: "cyan", title: "Live Engagement", icon: MessagesSquare, description: "Chat, email and social messaging handled in real time with consistent quality." },
  { code: "NpS", group: "cyan", title: "Net Promoter Score", icon: Smile, description: "Customer feedback programmes that measure loyalty and feed insights back into operations." },

  { code: "Dc", group: "yellow", title: "Data Capture", icon: Database, description: "Accurate extraction and entry of data from documents, forms and legacy systems." },
  { code: "Dv", group: "yellow", title: "Data Visualisation", icon: ChartColumn, description: "Dashboards that give every team a clear, live view of the metrics that matter." },
  { code: "Mec", group: "yellow", title: "Metrics, Evaluation & Controls", icon: SlidersHorizontal, description: "KPI frameworks, quality sampling and control testing that keep operations measurable." },
  { code: "AuT", group: "yellow", title: "Automation Tooling", icon: Bot, description: "Workflow automation and bots that remove repetitive manual steps from operations." },
  { code: "Pa", group: "yellow", title: "Predictive Analytics", icon: ChartSpline, description: "Forecasting models that anticipate volumes, risk and demand before they arrive." },
];
