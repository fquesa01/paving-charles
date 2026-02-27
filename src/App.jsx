import { useState, useEffect, useCallback, useRef, useMemo, createContext, useContext } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({ iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png", iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png", shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png" });

// ─── THEME CONTEXT ────────────────────────────────────
const ThemeContext = createContext({ isDark: true, toggle: () => {} });
const useTheme = () => useContext(ThemeContext);

// ─── MOBILE DETECTION ──────────────────────────────────
const useIsMobile = (breakpoint = 768) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= breakpoint);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= breakpoint);
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);
  return isMobile;
};

const COLORS = {
  bg: "var(--c-bg)",
  surface: "var(--c-surface)",
  surfaceHover: "var(--c-surfaceHover)",
  card: "var(--c-card)",
  border: "var(--c-border)",
  borderLight: "var(--c-borderLight)",
  accent: "#F59E0B",
  accentDark: "#D97706",
  accentLight: "#FBBF24",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  text: "var(--c-text)",
  textSecondary: "var(--c-textSecondary)",
  textMuted: "var(--c-textMuted)",
  asphalt: "var(--c-asphalt)",
};

const FONTS = {
  display: "'Oswald', sans-serif",
  body: "'Source Sans 3', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

// ─── MOCK DATA ────────────────────────────────────────────
const EMPLOYEES = [
  { id: 1, name: "Marcus Rivera", role: "Crew Lead", crew: "Alpha", avatar: "MR", status: "active", phone: "317-555-0142" },
  { id: 2, name: "Jake Thompson", role: "Operator", crew: "Alpha", avatar: "JT", status: "active", phone: "317-555-0198" },
  { id: 3, name: "DeShawn Williams", role: "Laborer", crew: "Alpha", avatar: "DW", status: "active", phone: "317-555-0234" },
  { id: 4, name: "Carlos Mendez", role: "Crew Lead", crew: "Bravo", avatar: "CM", status: "active", phone: "614-555-0167" },
  { id: 5, name: "Tommy O'Brien", role: "Operator", crew: "Bravo", avatar: "TO", status: "break", phone: "614-555-0289" },
  { id: 6, name: "Raj Patel", role: "Estimator", crew: "HQ", avatar: "RP", status: "active", phone: "317-555-0311" },
  { id: 7, name: "Sarah Chen", role: "Project Manager", crew: "HQ", avatar: "SC", status: "active", phone: "317-555-0455" },
  { id: 8, name: "Mike Johnson", role: "Fleet Manager", crew: "HQ", avatar: "MJ", status: "offline", phone: "317-555-0522" },
];

const VEHICLES = [
  { id: "T-01", name: "Paver Truck Alpha", type: "Paver", crew: "Alpha", lat: 39.7684, lng: -86.1581, speed: 0, status: "on-site", fuel: 72 },
  { id: "T-02", name: "Roller Alpha", type: "Roller", crew: "Alpha", lat: 39.7690, lng: -86.1575, speed: 0, status: "on-site", fuel: 85 },
  { id: "T-03", name: "Dump Truck 1", type: "Dump Truck", crew: "Alpha", lat: 39.8120, lng: -86.2340, speed: 45, status: "in-transit", fuel: 58 },
  { id: "T-04", name: "Paver Truck Bravo", type: "Paver", crew: "Bravo", lat: 39.9612, lng: -82.9988, speed: 0, status: "on-site", fuel: 64 },
  { id: "T-05", name: "Skid Steer", type: "Skid Steer", crew: "Bravo", lat: 39.9620, lng: -82.9980, speed: 0, status: "idle", fuel: 91 },
  { id: "T-06", name: "Dump Truck 2", type: "Dump Truck", crew: "Bravo", lat: 40.0234, lng: -83.1456, speed: 55, status: "in-transit", fuel: 43 },
  { id: "T-07", name: "Crack Seal Rig", type: "Specialty", crew: "Charlie", lat: 41.4993, lng: -81.6944, speed: 0, status: "maintenance", fuel: 30 },
  { id: "T-08", name: "Pickup - Estimator", type: "Pickup", crew: "HQ", lat: 39.7910, lng: -86.1480, speed: 32, status: "in-transit", fuel: 67 },
];

const PROJECTS = [
  {
    id: "P-1001", name: "Elm Street Residential Driveway", client: "Johnson Family", type: "Residential",
    status: "in-progress", crew: "Alpha", location: "1245 Elm St, Indianapolis, IN",
    startDate: "2026-02-20", endDate: "2026-02-28", budget: 8500, spent: 4200, progress: 55,
    checklist: [
      { id: 1, text: "Site survey & measurements", done: true, completedBy: "Marcus Rivera", date: "Feb 20" },
      { id: 2, text: "Remove existing surface", done: true, completedBy: "Jake Thompson", date: "Feb 21" },
      { id: 3, text: "Grade & compact sub-base", done: true, completedBy: "DeShawn Williams", date: "Feb 22" },
      { id: 4, text: "Install edge forms", done: false },
      { id: 5, text: "Apply tack coat", done: false },
      { id: 6, text: "Lay asphalt (2\" base course)", done: false },
      { id: 7, text: "Lay asphalt (1.5\" surface course)", done: false },
      { id: 8, text: "Compact & finish rolling", done: false },
      { id: 9, text: "Cleanup & client walkthrough", done: false },
    ],
    timeline: [
      { date: "Feb 20", event: "Project started. Site survey completed.", user: "Marcus Rivera", type: "milestone" },
      { date: "Feb 21", event: "Old driveway surface removed. 12 tons debris hauled.", user: "Jake Thompson", type: "update", hasPhoto: true },
      { date: "Feb 22", event: "Sub-base graded and compacted. Ready for forms.", user: "DeShawn Williams", type: "update", hasPhoto: true },
      { date: "Feb 24", event: "Waiting on edge form materials delivery.", user: "Marcus Rivera", type: "delay" },
    ],
  },
  {
    id: "P-1002", name: "Oak Park Business Lot Repair", client: "Oak Park Shopping Center", type: "Commercial",
    status: "in-progress", crew: "Bravo", location: "890 Oak Park Blvd, Columbus, OH",
    startDate: "2026-02-18", endDate: "2026-03-05", budget: 24000, spent: 11800, progress: 40,
    checklist: [
      { id: 1, text: "Lot assessment & damage mapping", done: true, completedBy: "Carlos Mendez", date: "Feb 18" },
      { id: 2, text: "Mark repair zones (spray paint)", done: true, completedBy: "Carlos Mendez", date: "Feb 18" },
      { id: 3, text: "Saw-cut damaged sections", done: true, completedBy: "Tommy O'Brien", date: "Feb 19" },
      { id: 4, text: "Remove & haul damaged asphalt", done: true, completedBy: "Tommy O'Brien", date: "Feb 20" },
      { id: 5, text: "Patch & level sub-base", done: false },
      { id: 6, text: "Pave patched areas", done: false },
      { id: 7, text: "Sealcoat entire lot", done: false },
      { id: 8, text: "Re-stripe parking lines", done: false },
      { id: 9, text: "ADA compliance check", done: false },
      { id: 10, text: "Final walkthrough with client", done: false },
    ],
    timeline: [
      { date: "Feb 18", event: "Assessment complete. 14 repair zones identified.", user: "Carlos Mendez", type: "milestone" },
      { date: "Feb 19", event: "Saw-cutting started on zones 1-6.", user: "Tommy O'Brien", type: "update" },
      { date: "Feb 20", event: "Removal complete. 8 tons hauled.", user: "Tommy O'Brien", type: "update", hasPhoto: true },
    ],
  },
  {
    id: "P-1003", name: "Maple Housing Complex Paths", client: "Maple Grove HOA", type: "Residential",
    status: "bidding", crew: "Unassigned", location: "Maple Grove Complex, Dayton, OH",
    startDate: null, endDate: null, budget: 15000, spent: 0, progress: 0,
    checklist: [], timeline: [],
  },
  {
    id: "P-1004", name: "Highway 31 Shoulder Repair", client: "Marion County DOT", type: "Municipal",
    status: "completed", crew: "Alpha", location: "Hwy 31, Marion County, IN",
    startDate: "2026-02-05", endDate: "2026-02-15", budget: 18000, spent: 16200, progress: 100,
    checklist: [
      { id: 1, text: "Permit obtained", done: true, completedBy: "Sarah Chen", date: "Feb 3" },
      { id: 2, text: "Traffic control setup", done: true, completedBy: "Marcus Rivera", date: "Feb 5" },
      { id: 3, text: "Shoulder edge milling", done: true, completedBy: "Jake Thompson", date: "Feb 7" },
      { id: 4, text: "Pave shoulder sections", done: true, completedBy: "Marcus Rivera", date: "Feb 10" },
      { id: 5, text: "Final inspection", done: true, completedBy: "Sarah Chen", date: "Feb 15" },
    ],
    timeline: [
      { date: "Feb 5", event: "Project kicked off. Traffic control in place.", user: "Marcus Rivera", type: "milestone" },
      { date: "Feb 15", event: "Project completed. Passed DOT inspection.", user: "Sarah Chen", type: "milestone" },
    ],
  },
];

const INVENTORY = [
  { id: 1, name: "Hot Mix Asphalt (HMA)", unit: "tons", qty: 145, minQty: 50, category: "Materials", cost: 85, supplier: "Martin Supply Co.", supplierEmail: "orders@martinsupply.com", coveragePer: "1 ton = ~80 sqft at 2\" depth" },
  { id: 2, name: "Cold Patch Mix", unit: "bags", qty: 220, minQty: 100, category: "Materials", cost: 12, supplier: "Martin Supply Co.", supplierEmail: "orders@martinsupply.com", coveragePer: "1 bag = ~4 sqft patch" },
  { id: 3, name: "Tack Coat Emulsion", unit: "gallons", qty: 380, minQty: 150, category: "Materials", cost: 4.5, supplier: "Midwest Sealcoat", supplierEmail: "dispatch@mwseal.com", coveragePer: "1 gal = ~55 sqft" },
  { id: 4, name: "Sealcoat", unit: "gallons", qty: 520, minQty: 200, category: "Materials", cost: 3.75, supplier: "Midwest Sealcoat", supplierEmail: "dispatch@mwseal.com", coveragePer: "1 gal = ~50 sqft" },
  { id: 5, name: "Crushed Aggregate Base", unit: "tons", qty: 88, minQty: 30, category: "Materials", cost: 28, supplier: "Martin Supply Co.", supplierEmail: "orders@martinsupply.com", coveragePer: "1 ton = ~100 sqft at 4\" depth" },
  { id: 6, name: "Edge Forms (10ft)", unit: "pieces", qty: 45, minQty: 20, category: "Materials", cost: 22 },
  { id: 7, name: "Crack Filler", unit: "gallons", qty: 65, minQty: 25, category: "Materials", cost: 18 },
  { id: 8, name: "Striping Paint (White)", unit: "gallons", qty: 30, minQty: 15, category: "Materials", cost: 32 },
  { id: 9, name: "Striping Paint (Yellow)", unit: "gallons", qty: 25, minQty: 15, category: "Materials", cost: 32 },
  { id: 10, name: "Plate Compactor", unit: "units", qty: 4, minQty: 2, category: "Equipment", cost: 2800 },
  { id: 11, name: "Asphalt Rake", unit: "units", qty: 12, minQty: 6, category: "Tools", cost: 85 },
  { id: 12, name: "Infrared Thermometer", unit: "units", qty: 3, minQty: 2, category: "Tools", cost: 150 },
  { id: 13, name: "Safety Cones", unit: "units", qty: 120, minQty: 50, category: "Safety", cost: 8 },
  { id: 14, name: "Safety Vests", unit: "units", qty: 35, minQty: 20, category: "Safety", cost: 15 },
];

const CONTACTS = [
  ...EMPLOYEES.map(e => ({ ...e, type: "employee" })),
  { id: 101, name: "Mr. Johnson", role: "Homeowner", type: "client", avatar: "MJ", status: "active", phone: "317-555-0333", project: "P-1001" },
  { id: 102, name: "Linda Park", role: "Property Manager", type: "client", avatar: "LP", status: "active", phone: "614-555-0444", project: "P-1002", company: "Oak Park Shopping Center" },
  { id: 103, name: "James Howard", role: "HOA President", type: "client", avatar: "JH", status: "active", phone: "937-555-0321", project: "P-1003", company: "Maple Grove HOA" },
  { id: 104, name: "Dave Muller", role: "DOT Project Mgr", type: "client", avatar: "DM", status: "active", phone: "317-555-0111", project: "P-1004", company: "Marion County DOT" },
  { id: 201, name: "Martin Supply Co.", role: "Asphalt & Aggregate", type: "vendor", avatar: "MS", status: "active", phone: "317-555-0777", email: "orders@martinsupply.com" },
  { id: 202, name: "Midwest Sealcoat", role: "Sealcoat & Coatings", type: "vendor", avatar: "MW", status: "active", phone: "317-555-0888", email: "dispatch@mwseal.com" },
  { id: 203, name: "SafetyFirst Rentals", role: "Equipment & Safety", type: "vendor", avatar: "SF", status: "active", phone: "614-555-0999", email: "sales@safetyfirst.com" },
];


const MESSAGES = [
  { id: 1, channel: "alpha-crew", user: "Marcus Rivera", avatar: "MR", text: "On site at Elm Street. Setting up for edge forms today.", time: "7:42 AM", project: "P-1001" },
  { id: 2, channel: "alpha-crew", user: "Jake Thompson", avatar: "JT", text: "Copy that. Dump truck is 20 min out with the forms.", time: "7:45 AM", project: "P-1001" },
  { id: 3, channel: "alpha-crew", user: "DeShawn Williams", avatar: "DW", text: "Sub-base looks good after last night's rain. No pooling.", time: "7:51 AM", project: "P-1001" },
  { id: 4, channel: "bravo-crew", user: "Carlos Mendez", avatar: "CM", text: "Starting zone 5-8 saw cutting this morning at Oak Park.", time: "8:02 AM", project: "P-1002" },
  { id: 5, channel: "bravo-crew", user: "Tommy O'Brien", avatar: "TO", text: "Blade is getting dull. We may need a replacement by noon.", time: "8:15 AM", project: "P-1002" },
  { id: 6, channel: "management", user: "Sarah Chen", avatar: "SC", text: "Maple Grove HOA wants to schedule a site visit for next Tuesday. Anyone available?", time: "8:30 AM", project: "P-1003" },
  { id: 7, channel: "management", user: "Raj Patel", avatar: "RP", text: "I can do the site visit. I'll prepare the estimate template.", time: "8:35 AM", project: "P-1003" },
  { id: 8, channel: "alpha-crew", user: "Marcus Rivera", avatar: "MR", text: "Edge forms are being installed now. Should be done by lunch.", time: "9:12 AM", project: "P-1001" },
  { id: 9, channel: "dm-101", user: "Mr. Johnson", avatar: "MJ", text: "Hi Sarah, any update on when the edge forms will be in?", time: "8:00 AM", project: "P-1001" },
  { id: 10, channel: "dm-101", user: "Sarah Chen", avatar: "SC", text: "Good morning! Forms are being delivered today. Crew should have them installed by this afternoon.", time: "8:22 AM", project: "P-1001" },
  { id: 11, channel: "dm-101", user: "Mr. Johnson", avatar: "MJ", text: "Great, thanks for the quick update!", time: "8:25 AM", project: "P-1001" },
  { id: 12, channel: "dm-102", user: "Linda Park", avatar: "LP", text: "When do you expect to start the sealcoat phase? The tenants need advance notice.", time: "Yesterday", project: "P-1002" },
  { id: 13, channel: "dm-102", user: "Sarah Chen", avatar: "SC", text: "Sealcoat is scheduled for next week. I'll send you a formal timeline update today.", time: "Yesterday", project: "P-1002" },
  { id: 14, channel: "dm-201", user: "Martin Supply Co.", avatar: "MS", text: "Order #4521 shipped: 12 tons HMA. ETA tomorrow 7 AM to Elm St job site.", time: "Yesterday" },
  { id: 15, channel: "dm-201", user: "Sarah Chen", avatar: "SC", text: "Perfect, Marcus will be on site to receive. Thanks Dave.", time: "Yesterday" },
];

const LEADS = [
  {
    id: "L-001", type: "Bond", source: "Indiana Finance Authority", title: "City of Greenwood - $4.2M Road Infrastructure Bond",
    description: "General obligation bond for residential street resurfacing and sidewalk repair across 12 neighborhoods.",
    amount: "$4,200,000", date: "2026-02-15", location: "Greenwood, IN", status: "new",
    relevance: 92, tags: ["Residential", "Resurfacing", "Municipal"],
  },
  {
    id: "L-002", type: "RFP", source: "City of Fishers Procurement", title: "RFP-2026-0089: Parking Lot Rehabilitation",
    description: "Request for proposals for rehabilitation of 6 municipal parking lots. Estimated project value $180K-$250K.",
    amount: "$180,000 - $250,000", date: "2026-02-22", location: "Fishers, IN", status: "reviewing",
    relevance: 97, tags: ["Commercial", "Parking Lot", "Municipal"],
    deadline: "2026-03-15",
  },
  {
    id: "L-003", type: "Permit", source: "Hamilton County Recorder", title: "Building Permit #26-4521 - New Subdivision Driveways",
    description: "Permit issued for 24-lot residential subdivision. Phase 1 includes road base and 24 driveways.",
    amount: "Est. $120,000", date: "2026-02-24", location: "Noblesville, IN", status: "new",
    relevance: 88, tags: ["Residential", "New Construction", "Driveways"],
  },
  {
    id: "L-004", type: "Bond", source: "Ohio Municipal Advisory Council", title: "Dublin, OH - $8.5M Infrastructure Improvement Bond",
    description: "Revenue bond for road resurfacing, drainage improvements, and bike path paving across the city.",
    amount: "$8,500,000", date: "2026-02-10", location: "Dublin, OH", status: "contacted",
    relevance: 85, tags: ["Municipal", "Resurfacing", "Paths"],
  },
  {
    id: "L-005", type: "RFP", source: "Hendricks County", title: "RFP-HC-2026-012: Rural Road Patching Program",
    description: "Annual contract for pothole repair and road patching on county roads. Small crew friendly.",
    amount: "$90,000 - $140,000", date: "2026-02-20", location: "Hendricks County, IN", status: "new",
    relevance: 94, tags: ["Municipal", "Patching", "Annual Contract"],
    deadline: "2026-03-08",
  },
  {
    id: "L-006", type: "Permit", source: "Marion County Building Dept", title: "Commercial Permit #CP-8834 - Strip Mall Repaving",
    description: "Permit for complete parking lot repaving at Westfield Crossing strip mall. 22,000 sq ft.",
    amount: "Est. $65,000", date: "2026-02-25", location: "Indianapolis, IN", status: "new",
    relevance: 91, tags: ["Commercial", "Parking Lot", "Repaving"],
  },
];


// ─── CLOSED PROJECTS ARCHIVE ─────────────────────────────
const CLOSED_PROJECTS = [
  {
    id: "P-0998", name: "Cedar Lane Cul-de-sac Overlay", client: "City of Carmel", type: "Municipal",
    status: "completed", crew: "Alpha", location: "Cedar Ln, Carmel, IN",
    startDate: "2025-11-10", endDate: "2025-12-02", budget: 32000, spent: 29800, progress: 100,
    rating: 5, invoicePaid: true,
    checklist: [
      { id: 1, text: "Permits & traffic plan", done: true, completedBy: "Sarah Chen", date: "Nov 8" },
      { id: 2, text: "Mill existing surface", done: true, completedBy: "Marcus Rivera", date: "Nov 12" },
      { id: 3, text: "Pave overlay", done: true, completedBy: "Jake Thompson", date: "Nov 22" },
      { id: 4, text: "Final inspection", done: true, completedBy: "Sarah Chen", date: "Dec 2" },
    ],
    timeline: [
      { date: "Nov 10", event: "Project started", user: "Marcus Rivera", type: "milestone" },
      { date: "Dec 2", event: "Completed. City inspector passed all zones.", user: "Sarah Chen", type: "milestone" },
    ],
  },
  {
    id: "P-0995", name: "Greenfield Industrial Park Lot B", client: "Greenfield Commerce LLC", type: "Commercial",
    status: "completed", crew: "Bravo", location: "1400 Commerce Dr, Greenfield, IN",
    startDate: "2025-10-01", endDate: "2025-10-28", budget: 45000, spent: 41200, progress: 100,
    rating: 4, invoicePaid: true,
    checklist: [
      { id: 1, text: "Site prep & grading", done: true, completedBy: "Carlos Mendez", date: "Oct 2" },
      { id: 2, text: "Sub-base installation", done: true, completedBy: "Tommy O\'Brien", date: "Oct 8" },
      { id: 3, text: "Pave 2-course asphalt", done: true, completedBy: "Carlos Mendez", date: "Oct 18" },
      { id: 4, text: "Sealcoat & stripe", done: true, completedBy: "Tommy O\'Brien", date: "Oct 25" },
      { id: 5, text: "ADA compliance & final", done: true, completedBy: "Sarah Chen", date: "Oct 28" },
    ],
    timeline: [],
  },
  {
    id: "P-0991", name: "Fishers Town Center Walkways", client: "Town of Fishers", type: "Municipal",
    status: "completed", crew: "Alpha", location: "Fishers Town Center, Fishers, IN",
    startDate: "2025-08-15", endDate: "2025-09-12", budget: 22000, spent: 20100, progress: 100,
    rating: 5, invoicePaid: true,
    checklist: [], timeline: [],
  },
  {
    id: "P-0987", name: "Westfield Residential Subdivision", client: "Westfield Homes HOA", type: "Residential",
    status: "completed", crew: "Bravo", location: "Westfield Homes, Westfield, IN",
    startDate: "2025-07-01", endDate: "2025-08-05", budget: 58000, spent: 54300, progress: 100,
    rating: 4, invoicePaid: false,
    checklist: [], timeline: [],
  },
  {
    id: "P-0980", name: "Anderson Elementary School Lot", client: "Anderson CSD", type: "Municipal",
    status: "completed", crew: "Alpha", location: "200 School Ave, Anderson, IN",
    startDate: "2025-06-10", endDate: "2025-06-28", budget: 19500, spent: 18200, progress: 100,
    rating: 5, invoicePaid: true,
    checklist: [], timeline: [],
  },
];

// ─── ESTIMATES & INVOICES ────────────────────────────────
const ESTIMATES = [
  { id: "EST-2040", project: "Elm Street Residential Driveway", client: "Johnson Family", date: "2026-02-15", amount: 8500, status: "accepted", items: [
    { desc: "Remove existing driveway (480 sqft)", qty: 1, rate: 1200 },
    { desc: "Grade & compact sub-base", qty: 1, rate: 1500 },
    { desc: "HMA base course 2\" (12 tons)", qty: 12, rate: 210 },
    { desc: "HMA surface course 1.5\" (8 tons)", qty: 8, rate: 230 },
    { desc: "Edge forming & finishing", qty: 1, rate: 800 },
    { desc: "Cleanup & disposal", qty: 1, rate: 480 },
  ]},
  { id: "EST-2039", project: "Oak Park Business Lot Repair", client: "Oak Park Shopping Center", date: "2026-02-10", amount: 24000, status: "accepted", items: [
    { desc: "Lot assessment & damage mapping", qty: 1, rate: 1200 },
    { desc: "Saw-cut & remove damaged sections (14 zones)", qty: 14, rate: 420 },
    { desc: "Sub-base repair & leveling", qty: 1, rate: 3800 },
    { desc: "Pave patched areas (28 tons HMA)", qty: 28, rate: 210 },
    { desc: "Full lot sealcoat (22,000 sqft)", qty: 22, rate: 145 },
    { desc: "Parking line re-striping", qty: 1, rate: 2200 },
    { desc: "ADA compliance upgrades", qty: 1, rate: 1850 },
  ]},
  { id: "EST-2038", project: "Maple Housing Complex Paths", client: "Maple Grove HOA", date: "2026-02-05", amount: 15000, status: "pending", items: [
    { desc: "Walkway removal & prep (1,200 sqft)", qty: 1, rate: 2800 },
    { desc: "New asphalt walkways", qty: 1, rate: 8200 },
    { desc: "Curbing & edging", qty: 1, rate: 2400 },
    { desc: "Cleanup", qty: 1, rate: 1600 },
  ]},
  { id: "EST-2035", project: "Broad Ripple Parking Lot", client: "Broad Ripple Bar Assoc.", date: "2026-01-20", amount: 35000, status: "declined", items: [
    { desc: "Full lot tear-out & repave", qty: 1, rate: 28000 },
    { desc: "Drainage improvements", qty: 1, rate: 4500 },
    { desc: "Striping & signage", qty: 1, rate: 2500 },
  ]},
];

const INVOICES = [
  { id: "INV-3001", estimateId: "EST-2040", project: "Elm Street Residential Driveway", client: "Johnson Family", amount: 4200, total: 8500, status: "partial", dueDate: "2026-03-15", paidDate: null },
  { id: "INV-3000", estimateId: "EST-2039", project: "Oak Park Business Lot Repair", client: "Oak Park Shopping Center", amount: 24000, total: 24000, status: "sent", dueDate: "2026-03-20", paidDate: null },
  { id: "INV-2998", project: "Cedar Lane Cul-de-sac Overlay", client: "City of Carmel", amount: 29800, total: 29800, status: "paid", dueDate: "2025-12-30", paidDate: "2025-12-22" },
  { id: "INV-2995", project: "Greenfield Industrial Park Lot B", client: "Greenfield Commerce LLC", amount: 41200, total: 41200, status: "paid", dueDate: "2025-11-15", paidDate: "2025-11-12" },
];

// ─── APP PHONE NUMBERS ───────────────────────────────────
const APP_PHONE_LINES = [
  { id: "PH-001", number: "+1 (317) 555-0199", label: "Main Office Line", assignedTo: "All Projects", platform: "Twilio", active: true },
  { id: "PH-002", number: "+1 (317) 555-0201", label: "Elm Street Project", assignedTo: "P-1001", platform: "Twilio", active: true },
  { id: "PH-003", number: "+1 (614) 555-0188", label: "Oak Park Project", assignedTo: "P-1002", platform: "Twilio", active: true },
];

// ─── BOND & LEAD DATA SOURCES ──────────────────────────
const DATA_SOURCES = {
  federal: [
    {
      id: "ds-01", name: "EMMA (MSRB)", url: "https://emma.msrb.org", type: "Bond",
      description: "Official SEC-designated repository for all municipal bond disclosures. Free advanced search by issuer, state, security type. Covers 1M+ outstanding municipal securities.",
      searchTerms: ["road", "highway", "infrastructure", "paving", "street improvement", "transportation"],
      frequency: "Every 24 hours", apiAvailable: true, free: true, priority: "Critical",
      category: "National Bond Database",
    },
    {
      id: "ds-02", name: "SAM.gov", url: "https://sam.gov/opportunities", type: "RFP",
      description: "Federal government's centralized procurement system. Search by NAICS codes 237310 (Highway/Street/Bridge Construction) and 238990 (Site Preparation).",
      searchTerms: ["NAICS 237310", "NAICS 238990", "paving", "asphalt", "road construction"],
      frequency: "Every 24 hours", apiAvailable: true, free: true, priority: "Critical",
      category: "Federal Procurement",
    },
    {
      id: "ds-03", name: "FHWA Business Opportunities", url: "https://highways.dot.gov/about/business-opportunities", type: "RFP",
      description: "Federal Highway Administration contracts for roads on federal lands, parkways, Indian reservation roads, and defense access roads.",
      searchTerms: ["road construction", "paving", "highway", "resurfacing"],
      frequency: "Every 24 hours", apiAvailable: false, free: true, priority: "High",
      category: "Federal DOT",
    },
    {
      id: "ds-04", name: "Grants.gov", url: "https://www.grants.gov", type: "Bond",
      description: "Federal grants for infrastructure including FHWA Surface Transportation Block Grants, RAISE grants, and Infrastructure Investment and Jobs Act funding.",
      searchTerms: ["infrastructure", "transportation", "road", "highway", "IIJA"],
      frequency: "Every 24 hours", apiAvailable: true, free: true, priority: "High",
      category: "Federal Grants",
    },
    {
      id: "ds-05", name: "USASpending.gov", url: "https://www.usaspending.gov", type: "Bond",
      description: "Tracks all federal spending. Useful for identifying awarded infrastructure contracts and upcoming re-compete opportunities.",
      searchTerms: ["highway", "road", "paving", "asphalt"],
      frequency: "Weekly", apiAvailable: true, free: true, priority: "Medium",
      category: "Federal Spending",
    },
    {
      id: "ds-06", name: "MunicipalBonds.com", url: "https://www.municipalbonds.com", type: "Bond",
      description: "Real-time municipal bond trade data searchable by category including Roads/Highways, with new issue calendar and screening tools.",
      searchTerms: ["roads/highways", "infrastructure", "general obligation"],
      frequency: "Every 24 hours", apiAvailable: false, free: true, priority: "High",
      category: "National Bond Database",
    },
    {
      id: "ds-07", name: "The Bond Buyer", url: "https://www.bondbuyer.com", type: "Bond",
      description: "Premier municipal finance news source. Tracks new issuance, deal calendars, and infrastructure bond trends nationwide.",
      searchTerms: ["road bond", "infrastructure bond", "GO bond", "transportation"],
      frequency: "Every 24 hours", apiAvailable: false, free: false, priority: "High",
      category: "Industry News & Intelligence",
    },
    {
      id: "ds-08", name: "SIFMA Municipal Bond Data", url: "https://www.sifma.org/research/statistics/us-municipal-bonds-statistics", type: "Bond",
      description: "Securities Industry and Financial Markets Association. Tracks municipal bond issuance statistics, trends, and new issuance data by type.",
      searchTerms: ["municipal issuance", "infrastructure", "transportation"],
      frequency: "Weekly", apiAvailable: false, free: true, priority: "Medium",
      category: "Industry Data & Analytics",
    },
  ],
  procurement: [
    {
      id: "ds-09", name: "BidNet Direct", url: "https://www.bidnetdirect.com", type: "RFP",
      description: "Centralized platform for state/local government bids. Covers all 50 states with regional e-purchasing systems. Supports keyword alerts for paving-specific opportunities.",
      searchTerms: ["paving", "asphalt", "road repair", "parking lot", "driveway", "resurfacing", "sealcoat"],
      frequency: "Every 24 hours", apiAvailable: true, free: false, priority: "Critical",
      category: "Procurement Aggregator",
    },
    {
      id: "ds-10", name: "DemandStar", url: "https://network.demandstar.com", type: "RFP",
      description: "1,400+ government agencies post directly. Covers housing authorities, airports, school districts, cities, and counties. Strong Midwest coverage.",
      searchTerms: ["paving", "road", "parking lot", "asphalt", "resurfacing"],
      frequency: "Every 24 hours", apiAvailable: true, free: false, priority: "Critical",
      category: "Procurement Aggregator",
    },
    {
      id: "ds-11", name: "GovWin IQ (Deltek)", url: "https://iq.govwin.com", type: "RFP",
      description: "Enterprise-grade government intelligence platform. Pre-solicitation intelligence from budget docs and meeting minutes. Largest analyst team in the industry.",
      searchTerms: ["road construction", "paving", "infrastructure", "highway maintenance"],
      frequency: "Every 24 hours", apiAvailable: true, free: false, priority: "High",
      category: "Procurement Intelligence",
    },
    {
      id: "ds-12", name: "FindRFP", url: "https://www.findrfp.com", type: "RFP",
      description: "Database of government bids, RFPs, and contracts from federal, state, and local governments across all 50 states.",
      searchTerms: ["paving", "asphalt", "road", "driveway", "parking"],
      frequency: "Every 24 hours", apiAvailable: false, free: false, priority: "Medium",
      category: "Procurement Aggregator",
    },
    {
      id: "ds-13", name: "Bonfire", url: "https://gobonfire.com", type: "RFP",
      description: "E-procurement platform used by hundreds of government orgs. Free vendor portal to view and submit bids for cities, school districts, and utilities.",
      searchTerms: ["paving", "road maintenance", "asphalt", "parking lot"],
      frequency: "Every 24 hours", apiAvailable: false, free: true, priority: "Medium",
      category: "E-Procurement Platform",
    },
    {
      id: "ds-14", name: "GovSpend", url: "https://www.govspend.com", type: "RFP",
      description: "Covers 80%+ of government purchasing that occurs without RFPs. Provides purchase order data, bids, and government contact databases.",
      searchTerms: ["paving", "asphalt", "road repair", "parking"],
      frequency: "Every 24 hours", apiAvailable: true, free: false, priority: "Medium",
      category: "Procurement Intelligence",
    },
    {
      id: "ds-15", name: "BidSearch", url: "https://www.bidsearch.com", type: "RFP",
      description: "Modern procurement search covering 100,000+ opportunities including Canadian provinces. Simple, focused RFP identification tool.",
      searchTerms: ["paving", "road construction", "asphalt", "resurfacing"],
      frequency: "Every 24 hours", apiAvailable: false, free: false, priority: "Low",
      category: "Procurement Aggregator",
    },
    {
      id: "ds-16", name: "Vendor Registry", url: "https://vendorregistry.com", type: "RFP",
      description: "Serves 400+ public agencies and 70,000+ vendors. Focused on cities, counties, school districts, and utilities. Hand-coded bids matched to vendor profiles.",
      searchTerms: ["paving", "road", "parking lot", "asphalt"],
      frequency: "Every 24 hours", apiAvailable: false, free: false, priority: "Medium",
      category: "Procurement Aggregator",
    },
  ],
  midwest_state: [
    {
      id: "ds-17", name: "INDOT Bid Viewer", url: "https://erms12c.indot.in.gov/INDOTBidViewer/BidOpportunities.aspx", type: "RFP",
      description: "Indiana DOT official bid opportunities portal. All state highway construction letting schedules and local public works jobs advertised through INDOT.",
      searchTerms: ["paving", "resurfacing", "road", "HMA", "asphalt"],
      frequency: "Every 24 hours", apiAvailable: false, free: true, priority: "Critical",
      category: "Indiana State",
    },
    {
      id: "ds-18", name: "Indiana IDOA Procurement", url: "https://www.in.gov/idoa/procurement/current-business-opportunities/", type: "RFP",
      description: "Indiana Department of Administration. All state solicitations over $75,000 posted here. Covers all agency procurement.",
      searchTerms: ["paving", "road", "parking", "asphalt", "infrastructure"],
      frequency: "Every 24 hours", apiAvailable: false, free: true, priority: "Critical",
      category: "Indiana State",
    },
    {
      id: "ds-19", name: "Marion County (Indy) Bids", url: "https://www.indy.gov/activity/find-bid-opportunities", type: "RFP",
      description: "City of Indianapolis / Marion County procurement portal. All city bids including public works, roads, and infrastructure.",
      searchTerms: ["paving", "road", "street", "parking", "sidewalk"],
      frequency: "Every 24 hours", apiAvailable: false, free: true, priority: "Critical",
      category: "Indiana Municipal",
    },
    {
      id: "ds-20", name: "Indiana Public Notices", url: "http://www.indianapublicnotices.com/", type: "Permit",
      description: "Statewide public notice aggregator for Indiana. Includes bid advertisements, bond issuance notices, and public hearing notices.",
      searchTerms: ["road improvement", "paving", "bond", "infrastructure"],
      frequency: "Every 24 hours", apiAvailable: false, free: true, priority: "High",
      category: "Indiana Public Notices",
    },
    {
      id: "ds-21", name: "Ohio DOT Contractor Portal", url: "https://www.transportation.ohio.gov/working/doing-business", type: "RFP",
      description: "Ohio Department of Transportation procurement and bid opportunities. Letting schedules and contractor resources.",
      searchTerms: ["paving", "resurfacing", "road", "asphalt", "bridge"],
      frequency: "Every 24 hours", apiAvailable: false, free: true, priority: "Critical",
      category: "Ohio State",
    },
    {
      id: "ds-22", name: "Illinois DOT Letting Bulletin", url: "https://cei.illinois.gov/vendor-resources/illinois-procurement-opportunities.html", type: "RFP",
      description: "Official IDOT highway construction solicitation bulletin. Covers highway construction, airport work, and DNR construction projects.",
      searchTerms: ["paving", "resurfacing", "road", "HMA", "asphalt"],
      frequency: "Every 24 hours", apiAvailable: false, free: true, priority: "High",
      category: "Illinois State",
    },
    {
      id: "ds-23", name: "Michigan SIGMA VSS", url: "https://sigma.michigan.gov/webapp/PRDVSS2X1/AltSelfService", type: "RFP",
      description: "Michigan's State Integrated Governmental Management Application. All state bid opportunities posted through SIGMA Vendor Self Service.",
      searchTerms: ["paving", "road", "asphalt", "highway"],
      frequency: "Every 24 hours", apiAvailable: false, free: true, priority: "High",
      category: "Michigan State",
    },
    {
      id: "ds-24", name: "Kentucky Transportation Cabinet", url: "https://transportation.ky.gov/Construction-Procurement", type: "RFP",
      description: "Kentucky transportation construction procurement. Bid lettings and pre-qualified contractor opportunities.",
      searchTerms: ["paving", "asphalt", "road", "resurfacing"],
      frequency: "Every 24 hours", apiAvailable: false, free: true, priority: "Medium",
      category: "Kentucky State",
    },
    {
      id: "ds-25", name: "Wisconsin DOT Bids", url: "https://wisconsindot.gov/Pages/doing-bus/contractors/hcci/default.aspx", type: "RFP",
      description: "WisDOT Highway Construction Contract Information. Letting schedules and bid tabulations.",
      searchTerms: ["paving", "road", "asphalt", "HMA"],
      frequency: "Every 24 hours", apiAvailable: false, free: true, priority: "Medium",
      category: "Wisconsin State",
    },
    {
      id: "ds-26", name: "Minnesota DOT Bids", url: "https://www.dot.state.mn.us/bidlet/", type: "RFP",
      description: "MnDOT bid letting schedule and construction project bids. Includes local agency projects.",
      searchTerms: ["paving", "road", "asphalt", "bituminous"],
      frequency: "Every 24 hours", apiAvailable: false, free: true, priority: "Medium",
      category: "Minnesota State",
    },
    {
      id: "ds-27", name: "Iowa DOT Lettings", url: "https://iowadot.gov/contracts/letting-information", type: "RFP",
      description: "Iowa DOT contract letting information and bid results. Highway and road construction projects.",
      searchTerms: ["paving", "road", "asphalt", "HMA"],
      frequency: "Every 24 hours", apiAvailable: false, free: true, priority: "Medium",
      category: "Iowa State",
    },
    {
      id: "ds-28", name: "Missouri DOT Bids", url: "https://www.modot.org/how-bid-modot-project", type: "RFP",
      description: "MoDOT project bidding portal. Highway construction letting schedules and bid results.",
      searchTerms: ["paving", "road", "asphalt", "overlay"],
      frequency: "Every 24 hours", apiAvailable: false, free: true, priority: "Medium",
      category: "Missouri State",
    },
  ],
  permits_local: [
    {
      id: "ds-29", name: "US Public Works - Indiana", url: "https://uspublicworks.com/indiana-bid-notices-city-county-state-municipal/", type: "Permit",
      description: "Comprehensive directory of every Indiana municipality's bid portal. Links to 90+ city, county, and township bid pages.",
      searchTerms: ["paving", "road", "driveway", "parking"],
      frequency: "Every 24 hours", apiAvailable: false, free: true, priority: "High",
      category: "Municipal Directory",
    },
    {
      id: "ds-30", name: "County Recorder Offices", url: "various", type: "Permit",
      description: "Building permit filings for residential and commercial construction. Track new subdivision permits, commercial construction permits, and road improvement permits across Midwest counties.",
      searchTerms: ["driveway", "parking lot", "road", "paving", "new construction"],
      frequency: "Every 24 hours", apiAvailable: false, free: true, priority: "Critical",
      category: "Building Permits",
    },
    {
      id: "ds-31", name: "OpenGov Procurement Portals", url: "https://procurement.opengov.com", type: "RFP",
      description: "Many municipalities use OpenGov for procurement. Bloomington, IN and hundreds of other cities post bids through OpenGov portals.",
      searchTerms: ["paving", "road", "asphalt", "parking"],
      frequency: "Every 24 hours", apiAvailable: true, free: true, priority: "High",
      category: "Municipal Procurement Platform",
    },
  ],
};

// ─── EMAIL/CALENDAR MOCK DATA ─────────────────────────────
const EMAIL_DATA = [
  { id: 1, from: "City of Fishers Procurement", email: "procurement@fishers.in.us", subject: "RFP-2026-0089 Parking Lot Rehabilitation - Q&A Addendum", date: "Feb 26, 10:15 AM", unread: true, label: "RFP", important: true },
  { id: 2, from: "Johnson Family", email: "mjohnson1245@gmail.com", subject: "Re: Driveway project update - looks great so far!", date: "Feb 26, 9:42 AM", unread: true, label: "Client", important: false },
  { id: 3, from: "Midwest Asphalt Supply", email: "orders@midwestasphalt.com", subject: "HMA Delivery Confirmation - Order #8842 - 50 tons", date: "Feb 25, 4:30 PM", unread: false, label: "Vendor", important: false },
  { id: 4, from: "Raj Patel", email: "raj.patel@paving123.com", subject: "Maple Grove HOA - Site Visit Photos & Initial Estimate", date: "Feb 25, 2:15 PM", unread: false, label: "Internal", important: true },
  { id: 5, from: "Hendricks County Procurement", email: "bids@co.hendricks.in.us", subject: "RFP-HC-2026-012 Rural Road Patching - Deadline Reminder March 8", date: "Feb 25, 11:00 AM", unread: false, label: "RFP", important: true },
  { id: 6, from: "INDOT Notifications", email: "noreply@indot.in.gov", subject: "New Letting Schedule Posted - March 2026 Projects", date: "Feb 24, 3:00 PM", unread: false, label: "Lead", important: true },
  { id: 7, from: "Oak Park Shopping Center Mgmt", email: "facilities@oakparkcenter.com", subject: "Re: Parking lot progress - when will striping begin?", date: "Feb 24, 1:22 PM", unread: false, label: "Client", important: false },
  { id: 8, from: "Safety Equipment Plus", email: "sales@safetyeqplus.com", subject: "Invoice #INV-4421 - Safety Vests & Cones Order", date: "Feb 24, 10:05 AM", unread: false, label: "Vendor", important: false },
];

const CALENDAR_EVENTS = [
  { id: 1, title: "Elm St Driveway - Edge Forms Install", time: "7:00 AM - 12:00 PM", date: "today", crew: "Alpha", type: "project", color: COLORS.accent },
  { id: 2, title: "Oak Park Lot - Zones 5-8 Saw Cutting", time: "7:30 AM - 4:00 PM", date: "today", crew: "Bravo", type: "project", color: COLORS.info },
  { id: 3, title: "Weekly Ops Standup", time: "8:30 AM - 9:00 AM", date: "today", crew: "HQ", type: "meeting", color: COLORS.success },
  { id: 4, title: "HMA Delivery - 50 tons to Alpha Site", time: "10:00 AM", date: "today", crew: "Alpha", type: "delivery", color: COLORS.warning },
  { id: 5, title: "Fishers RFP Q&A Session (Virtual)", time: "2:00 PM - 3:00 PM", date: "today", crew: "HQ", type: "bid", color: COLORS.danger },
  { id: 6, title: "Maple Grove HOA Site Visit", time: "10:00 AM - 11:30 AM", date: "Mar 3", crew: "HQ", type: "bid", color: COLORS.danger },
  { id: 7, title: "Hendricks County RFP Deadline", time: "5:00 PM", date: "Mar 8", crew: "HQ", type: "deadline", color: COLORS.danger },
  { id: 8, title: "Fishers RFP Submission Deadline", time: "5:00 PM", date: "Mar 15", crew: "HQ", type: "deadline", color: COLORS.danger },
];

// ─── ICONS (SVG Components) ────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const icons = {
    dashboard: <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />,
    messages: <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z" />,
    projects: <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM17.99 9l-1.41-1.42-6.59 6.59-2.58-2.57-1.42 1.41 4 3.99z" />,
    inventory: <path d="M20 2H4c-1 0-2 .9-2 2v3.01c0 .72.43 1.34 1 1.69V20c0 .55.45 1 1 1h16c.55 0 1-.45 1-1V8.7c.57-.35 1-.97 1-1.69V4c0-1.1-1-2-2-2zm-5 12H9v-2h6v2zm5-7H4V4h16v3z" />,
    tracking: <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />,
    leads: <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z" />,
    truck: <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />,
    check: <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />,
    add: <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />,
    photo: <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />,
    alert: <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />,
    search: <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />,
    send: <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />,
    people: <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />,
    clock: <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />,
    star: <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />,
    money: <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />,
    settings: <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />,
    chevron: <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />,
    close: <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />,
    edit: <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />,
    email: <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />,
    calendar: <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM9 10H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />,
    link: <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />,
    timeline: <path d="M23 8c0 1.1-.9 2-2 2-.18 0-.35-.02-.51-.07l-3.56 3.55c.05.16.07.34.07.52 0 1.1-.9 2-2 2s-2-.9-2-2c0-.18.02-.36.07-.52l-2.55-2.55c-.16.05-.34.07-.52.07s-.36-.02-.52-.07l-4.55 4.56c.05.16.07.33.07.51 0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2c.18 0 .35.02.51.07l4.56-4.55C8.02 9.36 8 9.18 8 9c0-1.1.9-2 2-2s2 .9 2 2c0 .18-.02.36-.07.52l2.55 2.55c.16-.05.34-.07.52-.07s.36.02.52.07l3.55-3.56C19.02 8.35 19 8.18 19 8c0-1.1.9-2 2-2s2 .9 2 2z" />,
    notification: <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />,
    home: <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />,
    mic: <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />,
    phone: <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />,
    mapview: <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z" />,
    dollar: <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />,
    target: <path d="M12 2C6.49 2 2 6.49 2 12s4.49 10 10 10 10-4.49 10-10S17.51 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3-8c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z" />,
    pdf: <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z" />,
    stripe: <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />,
    fuel: <path d="M19.77 7.23l.01-.01-3.72-3.72L15 4.56l2.11 2.11c-.94.36-1.61 1.26-1.61 2.33 0 1.38 1.12 2.5 2.5 2.5.36 0 .69-.08 1-.21v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v16h10v-7.5h1.5v5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V9c0-.69-.28-1.32-.73-1.77zM12 10H6V5h6v5z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg">
      {icons[name] || null}
    </svg>
  );
};

// ─── STYLE TAG ─────────────────────────────────────────────
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&family=Source+Sans+3:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

    /* ─── DARK THEME (default) ─────────────────── */
    :root, [data-theme="dark"] {
      --c-bg: #0F1114;
      --c-surface: #1A1D23;
      --c-surfaceHover: #22262E;
      --c-card: #1E2128;
      --c-border: #2A2E36;
      --c-borderLight: #363B45;
      --c-text: #F1F5F9;
      --c-textSecondary: #94A3B8;
      --c-textMuted: #64748B;
      --c-asphalt: #2D3139;
      --c-shadow: rgba(0,0,0,0.3);
      --c-overlay: rgba(0,0,0,0.6);
    }

    /* ─── LIGHT THEME ──────────────────────────── */
    [data-theme="light"] {
      --c-bg: #F1F5F9;
      --c-surface: #FFFFFF;
      --c-surfaceHover: #F8FAFC;
      --c-card: #FFFFFF;
      --c-border: #E2E8F0;
      --c-borderLight: #CBD5E1;
      --c-text: #0F172A;
      --c-textSecondary: #475569;
      --c-textMuted: #64748B;
      --c-asphalt: #E2E8F0;
      --c-shadow: rgba(0,0,0,0.08);
      --c-overlay: rgba(0,0,0,0.3);
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: var(--c-bg); font-family: ${FONTS.body}; color: var(--c-text); overflow: hidden; transition: background 0.3s, color 0.3s; }
    
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--c-border); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--c-borderLight); }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
    
    .fade-in { animation: fadeIn 0.4s ease-out forwards; }
    .slide-in { animation: slideIn 0.3s ease-out forwards; }
    
    input, textarea { font-family: ${FONTS.body}; }
    
    .glow-amber { box-shadow: 0 0 20px rgba(245, 158, 11, 0.15); }
    .hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
    .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 24px var(--c-shadow); }

    /* Theme transition on key elements */
    [data-theme] * {
      transition: background-color 0.25s ease, border-color 0.25s ease, color 0.25s ease, box-shadow 0.25s ease;
    }
  `}</style>
);

// ─── REUSABLE COMPONENTS ────────────────────────────────────
const Badge = ({ children, color = COLORS.accent, bg, small }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: small ? "1px 6px" : "2px 10px",
    borderRadius: 4, fontSize: small ? 10 : 11,
    fontWeight: 600, fontFamily: FONTS.mono,
    color: color, background: bg || `${color}18`,
    letterSpacing: "0.5px", textTransform: "uppercase",
    whiteSpace: "nowrap",
  }}>{children}</span>
);

const StatusDot = ({ status }) => {
  const colors = { active: COLORS.success, break: COLORS.warning, offline: COLORS.textMuted, "on-site": COLORS.success, "in-transit": COLORS.info, idle: COLORS.warning, maintenance: COLORS.danger };
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: colors[status] || COLORS.textMuted, display: "inline-block", flexShrink: 0 }} />;
};

const Avatar = ({ initials, size = 36, color = COLORS.accent }) => (
  <div style={{
    width: size, height: size, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
    background: `${color}22`, color: color, fontWeight: 700, fontSize: size * 0.35, fontFamily: FONTS.display,
    letterSpacing: 1, flexShrink: 0, border: `1px solid ${color}33`,
  }}>{initials}</div>
);

const ProgressBar = ({ value, height = 6, color = COLORS.accent }) => (
  <div style={{ width: "100%", height, background: COLORS.asphalt, borderRadius: height / 2, overflow: "hidden" }}>
    <div style={{ width: `${Math.min(100, value)}%`, height: "100%", background: color, borderRadius: height / 2, transition: "width 0.6s ease" }} />
  </div>
);

const Card = ({ children, style, className = "", onClick }) => (
  <div onClick={onClick} className={`fade-in ${className}`} style={{
    background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12,
    padding: 20, ...style,
    ...(onClick ? { cursor: "pointer" } : {}),
  }}>{children}</div>
);

const Button = ({ children, variant = "primary", size = "md", onClick, style, icon }) => {
  const variants = {
    primary: { background: COLORS.accent, color: "#000", fontWeight: 700 },
    secondary: { background: COLORS.surface, color: COLORS.text, border: `1px solid ${COLORS.border}` },
    ghost: { background: "transparent", color: COLORS.textSecondary },
    danger: { background: `${COLORS.danger}22`, color: COLORS.danger, border: `1px solid ${COLORS.danger}33` },
  };
  const sizes = { sm: { padding: "6px 12px", fontSize: 12 }, md: { padding: "8px 16px", fontSize: 13 }, lg: { padding: "12px 24px", fontSize: 14 } };
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 6, borderRadius: 8, border: "none",
      cursor: "pointer", fontFamily: FONTS.body, fontWeight: 600, transition: "all 0.2s",
      letterSpacing: "0.3px", ...variants[variant], ...sizes[size], ...style,
    }}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} />}
      {children}
    </button>
  );
};

const SectionHeader = ({ title, subtitle, action }) => (
  <div className="section-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, gap: 12, flexWrap: "wrap" }}>
    <div>
      <h1 style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, letterSpacing: "0.5px", color: COLORS.text }}>{title}</h1>
      {subtitle && <p style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── THEME TOGGLE ─────────────────────────────────────
const ThemeToggle = ({ compact }) => {
  const { isDark, toggle } = useTheme();
  return (
    <button onClick={toggle} title={isDark ? "Switch to light mode" : "Switch to dark mode"} style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: compact ? 0 : 8, padding: compact ? 6 : "6px 12px",
      borderRadius: 8, border: `1px solid ${COLORS.border}`,
      background: isDark ? "transparent" : "var(--c-surfaceHover)",
      color: COLORS.textSecondary, cursor: "pointer",
      fontSize: 12, fontFamily: FONTS.body, fontWeight: 500,
      transition: "all 0.2s",
      width: compact ? 36 : "auto", height: compact ? 36 : "auto",
    }}>
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
      {!compact && <span>{isDark ? "Light" : "Dark"}</span>}
    </button>
  );
};

// ─── SIDEBAR ─────────────────────────────────────────────
const Sidebar = ({ activeTab, setActiveTab, collapsed, setCollapsed }) => {
  const navItems = [
    { id: "home", icon: "home", label: "Home" },
    { id: "messages", icon: "messages", label: "Comms Portal", badge: 3 },
    { id: "projects", icon: "projects", label: "Projects" },
    { id: "projectmap", icon: "mapview", label: "Project Map" },
    { id: "estimates", icon: "dollar", label: "Estimates & Billing" },
    { id: "inventory", icon: "inventory", label: "Inventory" },
    { id: "tracking", icon: "tracking", label: "Fleet & Crew" },
    { id: "leads", icon: "leads", label: "Lead Intel" },
    { id: "integrations", icon: "settings", label: "Integrations" },
  ];

  return (
    <div style={{
      width: collapsed ? 64 : 240, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`,
      display: "flex", flexDirection: "column", height: "100vh", flexShrink: 0,
      transition: "width 0.25s cubic-bezier(0.4, 0, 0.2, 1)", overflow: "hidden",
    }}>
      <div style={{ padding: collapsed ? "24px 12px" : "24px 20px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", minHeight: 88 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, overflow: "hidden" }}>
          <div style={{
            width: 40, height: 40, minWidth: 40, borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.display,
            fontWeight: 800, fontSize: 16, color: "#000", letterSpacing: 1, cursor: "pointer",
          }} onClick={() => setCollapsed(!collapsed)}>P</div>
          {!collapsed && (
            <div style={{ whiteSpace: "nowrap" }}>
              <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 18, letterSpacing: 1, lineHeight: 1 }}>PAVING 123</div>
              <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: FONTS.mono, letterSpacing: 1, marginTop: 2 }}>OPS PLATFORM</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={() => setCollapsed(true)} title="Collapse sidebar" style={{
            background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted,
            padding: 4, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
            transition: "color 0.2s",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" /></svg>
          </button>
        )}
      </div>

      <nav style={{ flex: 1, padding: collapsed ? "12px 6px" : "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            title={collapsed ? item.label : undefined}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: collapsed ? "10px 0" : "10px 14px",
              justifyContent: collapsed ? "center" : "flex-start",
              borderRadius: 8, border: "none", cursor: "pointer", fontFamily: FONTS.body,
              fontSize: 14, fontWeight: activeTab === item.id ? 600 : 400, width: "100%", textAlign: "left",
              background: activeTab === item.id ? `${COLORS.accent}15` : "transparent",
              color: activeTab === item.id ? COLORS.accent : COLORS.textSecondary,
              transition: "all 0.2s", position: "relative", overflow: "hidden", whiteSpace: "nowrap",
            }}
          >
            {activeTab === item.id && (
              <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, background: COLORS.accent, borderRadius: 2 }} />
            )}
            <Icon name={item.icon} size={18} />
            {!collapsed && <span>{item.label}</span>}
            {item.badge && !collapsed && (
              <span style={{
                marginLeft: "auto", background: COLORS.danger, color: "#fff", fontSize: 10,
                fontWeight: 700, padding: "1px 6px", borderRadius: 10, fontFamily: FONTS.mono,
              }}>{item.badge}</span>
            )}
            {item.badge && collapsed && (
              <span style={{
                position: "absolute", top: 4, right: 6, width: 8, height: 8,
                borderRadius: "50%", background: COLORS.danger,
              }} />
            )}
          </button>
        ))}
      </nav>

      {collapsed ? (
        <div style={{ padding: "12px 0", borderTop: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <ThemeToggle compact />
          <button onClick={() => setCollapsed(false)} title="Expand sidebar" style={{
            background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted,
            padding: 6, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
            transition: "color 0.2s",
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" /></svg>
          </button>
        </div>
      ) : (
        <div style={{ padding: "16px 12px", borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar initials="SC" size={32} color={COLORS.success} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Sarah Chen</div>
                <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: FONTS.mono }}>Project Manager</div>
              </div>
            </div>
          </div>
          <ThemeToggle />
        </div>
      )}
    </div>
  );
};


// ─── HOME VIEW (AI Landing Page) ─────────────────────────
const HomeView = ({ setActiveTab, setSelectedProject, isMobile }) => {
  const [query, setQuery] = useState("");
  const [listening, setListening] = useState(false);
  const [showResult, setShowResult] = useState(null);
  const recognitionRef = useRef(null);

  const quickActions = [
    { icon: "messages", label: "Text a team member", desc: "Send a quick message to any crew", action: () => setActiveTab("messages") },
    { icon: "projects", label: "View active projects", desc: "Check progress on current jobs", action: () => setActiveTab("projects") },
    { icon: "dollar", label: "Create an estimate", desc: "Build a new estimate from templates", action: () => setActiveTab("estimates") },
    { icon: "mapview", label: "Open project map", desc: "See all projects on a map", action: () => setActiveTab("projectmap") },
    { icon: "people", label: "Check crew status", desc: "See who\'s on site & available", action: () => setActiveTab("tracking") },
    { icon: "leads", label: "Review new leads", desc: "4 new opportunities this week", action: () => setActiveTab("leads") },
  ];

  const parseCommand = (text) => {
    const t = text.toLowerCase();
    if (t.includes("text") || t.includes("message") || t.includes("send")) {
      setActiveTab("messages"); return;
    }
    if (t.includes("project") && (t.includes("active") || t.includes("open") || t.includes("current"))) {
      setActiveTab("projects"); return;
    }
    if (t.includes("map")) { setActiveTab("projectmap"); return; }
    if (t.includes("estimate") || t.includes("quote") || t.includes("bid") || t.includes("bill") || t.includes("invoice")) {
      setActiveTab("estimates"); return;
    }
    if (t.includes("crew") || t.includes("fleet") || t.includes("truck") || t.includes("who")) {
      setActiveTab("tracking"); return;
    }
    if (t.includes("lead") || t.includes("opportunity") || t.includes("bond")) {
      setActiveTab("leads"); return;
    }
    if (t.includes("inventory") || t.includes("material") || t.includes("asphalt") || t.includes("supply")) {
      setActiveTab("inventory"); return;
    }
    if (t.includes("email") || t.includes("calendar") || t.includes("integration") || t.includes("phone number")) {
      setActiveTab("integrations"); return;
    }
    setShowResult(`I heard: "${text}". Try saying something like "text Marcus" or "open active projects".`);
  };

  const handleSubmit = () => {
    if (!query.trim()) return;
    parseCommand(query);
    setQuery("");
  };

  const startListening = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setShowResult("Voice recognition is not supported in this browser. Try Chrome or Safari.");
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      parseCommand(transcript);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: isMobile ? "flex-start" : "center", height: "100vh", padding: isMobile ? "24px 20px" : 40, overflowY: "auto" }}>
      <div style={{ width: "100%", maxWidth: 680, textAlign: "center" }}>
        {/* Logo & Greeting */}
        <div style={{
          width: 56, height: 56, borderRadius: 16, margin: "0 auto 20px",
          background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: FONTS.display, fontWeight: 800, fontSize: 24, color: "#000",
        }}>P</div>
        <h1 style={{ fontFamily: FONTS.display, fontSize: isMobile ? 28 : 36, fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>
          {greeting}, Sarah
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: 15, marginBottom: 32 }}>
          What can I help you with today?
        </p>

        {/* Prompt Box */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "12px 16px", borderRadius: 16, border: `1px solid ${COLORS.border}`,
          background: COLORS.surface, marginBottom: 12,
          boxShadow: "0 4px 24px var(--c-shadow)",
        }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
            placeholder={isMobile ? "Ask Jane anything..." : "Ask Jane to navigate, text a crew member, create an estimate..."}
            style={{
              flex: 1, background: "transparent", border: "none", outline: "none",
              color: COLORS.text, fontSize: 15, fontFamily: FONTS.body,
            }}
          />
          <button onClick={startListening} style={{
            background: listening ? `${COLORS.danger}20` : `${COLORS.accent}15`,
            border: `1px solid ${listening ? COLORS.danger : COLORS.accent}40`,
            borderRadius: 10, padding: 8, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
            animation: listening ? "pulse 1.5s infinite" : "none",
          }}>
            <Icon name="mic" size={20} color={listening ? COLORS.danger : COLORS.accent} />
          </button>
          <button onClick={handleSubmit} style={{
            background: COLORS.accent, border: "none", borderRadius: 10,
            padding: 8, cursor: "pointer", display: "flex",
          }}>
            <Icon name="send" size={20} color="#000" />
          </button>
        </div>

        <p style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 40 }}>
          Say <strong style={{ color: COLORS.accent }}>"Hey Jane"</strong> or tap the mic to use voice commands
        </p>

        {showResult && (
          <div style={{
            padding: 16, borderRadius: 12, background: `${COLORS.info}10`,
            border: `1px solid ${COLORS.info}30`, marginBottom: 24,
            fontSize: 14, color: COLORS.info, textAlign: "left",
          }}>
            {showResult}
            <button onClick={() => setShowResult(null)} style={{
              float: "right", background: "none", border: "none",
              color: COLORS.info, cursor: "pointer", fontSize: 18,
            }}>×</button>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ textAlign: "left", marginBottom: 16 }}>
          <span style={{ fontSize: 11, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase" }}>Quick Actions</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
          {quickActions.map((a, i) => (
            <button key={i} onClick={a.action} style={{
              display: "flex", alignItems: "center", gap: 14, padding: 16,
              background: COLORS.surface, border: `1px solid ${COLORS.border}`,
              borderRadius: 12, cursor: "pointer", textAlign: "left",
              transition: "all 0.2s", width: "100%",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.accent; e.currentTarget.style.background = COLORS.surfaceHover; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = COLORS.border; e.currentTarget.style.background = COLORS.surface; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10, background: `${COLORS.accent}12`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name={a.icon} size={20} color={COLORS.accent} />
              </div>
              <div>
                <div style={{ fontFamily: FONTS.display, fontSize: 14, fontWeight: 600, color: COLORS.text, marginBottom: 2 }}>{a.label}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>{a.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── DASHBOARD ──────────────────────────────────────────
const DashboardView = ({ setActiveTab, setSelectedProject, isMobile }) => {
  const stats = [
    { label: "Active Projects", value: "2", sub: "+1 bidding", icon: "projects", color: COLORS.accent },
    { label: "Crew Members Active", value: "5", sub: "of 8 total", icon: "people", color: COLORS.success },
    { label: "Vehicles In Transit", value: "3", sub: "of 8 total", icon: "truck", color: COLORS.info },
    { label: "New Leads", value: "4", sub: "this week", icon: "leads", color: COLORS.warning },
  ];

  const pad = isMobile ? 16 : 32;

  return (
    <div style={{ padding: pad, overflowY: "auto", height: "100vh" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: FONTS.display, fontSize: isMobile ? 24 : 32, fontWeight: 700, letterSpacing: "1px" }}>
          Good morning, Sarah
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: isMobile ? 12 : 14, marginTop: 4 }}>
          Thursday, February 26, 2026 — Here's your operations overview
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: isMobile ? 10 : 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <Card key={i} className="hover-lift" style={{ animationDelay: `${i * 0.08}s` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: isMobile ? 10 : 12, color: COLORS.textMuted, fontWeight: 500, marginBottom: 6, textTransform: "uppercase", letterSpacing: "1px", fontFamily: FONTS.mono }}>{s.label}</div>
                <div style={{ fontSize: isMobile ? 28 : 36, fontWeight: 700, fontFamily: FONTS.display, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: isMobile ? 10 : 12, color: COLORS.textSecondary, marginTop: 4 }}>{s.sub}</div>
              </div>
              {!isMobile && <div style={{ padding: 10, borderRadius: 10, background: `${s.color}15` }}>
                <Icon name={s.icon} size={22} color={s.color} />
              </div>}
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 12 : 20, marginBottom: 24 }}>
        <Card>
          <SectionHeader title="Active Projects" action={<Button variant="ghost" size="sm" onClick={() => setActiveTab("projects")}>View All →</Button>} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {PROJECTS.filter(p => p.status === "in-progress").map(p => (
              <div key={p.id} onClick={() => { setSelectedProject(p); setActiveTab("projects"); }}
                style={{ padding: 14, background: COLORS.surface, borderRadius: 8, border: `1px solid ${COLORS.border}`, cursor: "pointer", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = COLORS.accent}
                onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{p.name}</div>
                  <Badge color={COLORS.info} small>{p.crew} Crew</Badge>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>{p.location}</span>
                  <span style={{ fontSize: 12, color: COLORS.accent, fontWeight: 600, fontFamily: FONTS.mono }}>{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Recent Messages" action={<Button variant="ghost" size="sm" onClick={() => setActiveTab("messages")}>View All →</Button>} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {MESSAGES.slice(-5).map(m => (
              <div key={m.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid color-mix(in srgb, ${COLORS.border} 3%, transparent)` }}>
                <Avatar initials={m.avatar} size={28} color={m.channel === "management" ? COLORS.info : COLORS.accent} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 12 }}>{m.user}</span>
                    <span style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: FONTS.mono }}>{m.time}</span>
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.text}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 12 : 20 }}>
        <Card>
          <SectionHeader title="Inventory Alerts" action={<Button variant="ghost" size="sm" onClick={() => setActiveTab("inventory")}>Manage →</Button>} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {INVENTORY.filter(i => i.qty <= i.minQty * 1.5).map(item => (
              <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: item.qty <= item.minQty ? `${COLORS.danger}08` : COLORS.surface, borderRadius: 8, border: `1px solid ${item.qty <= item.minQty ? COLORS.danger + "33" : COLORS.border}` }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.mono }}>{item.qty} {item.unit} remaining</div>
                </div>
                {item.qty <= item.minQty ? (
                  <Badge color={COLORS.danger} small>LOW STOCK</Badge>
                ) : (
                  <Badge color={COLORS.warning} small>MONITOR</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeader title="Top Lead Opportunities" action={<Button variant="ghost" size="sm" onClick={() => setActiveTab("leads")}>View All →</Button>} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {LEADS.slice(0, 3).map(lead => (
              <div key={lead.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: COLORS.surface, borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.title}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, display: "flex", gap: 8, marginTop: 2 }}>
                    <Badge color={lead.type === "Bond" ? COLORS.info : lead.type === "RFP" ? COLORS.accent : COLORS.success} small>{lead.type}</Badge>
                    <span>{lead.location}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right", marginLeft: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: FONTS.display, color: COLORS.success }}>{lead.relevance}</div>
                  <div style={{ fontSize: 9, color: COLORS.textMuted, fontFamily: FONTS.mono }}>RELEVANCE</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ─── MESSAGES VIEW ──────────────────────────────────────
const MessagesView = ({ isMobile }) => {
  const [activeChannel, setActiveChannel] = useState("alpha-crew");
  const [messages, setMessages] = useState(MESSAGES);
  const [newMessage, setNewMessage] = useState("");
  const [showChannelList, setShowChannelList] = useState(!isMobile);
  const [showClientUpdate, setShowClientUpdate] = useState(false);
  const messagesEndRef = useRef(null);

  const channels = [
    { id: "alpha-crew", name: "Alpha Crew", members: 3, unread: 2, type: "channel" },
    { id: "bravo-crew", name: "Bravo Crew", members: 2, unread: 1, type: "channel" },
    { id: "management", name: "Management", members: 3, unread: 0, type: "channel" },
    { id: "all-hands", name: "All Hands", members: 8, unread: 0, type: "channel" },
  ];
  const clientDMs = CONTACTS.filter(c => c.type === "client");
  const vendorDMs = CONTACTS.filter(c => c.type === "vendor");
  const activeContact = [...clientDMs, ...vendorDMs].find(c => activeChannel === `dm-${c.id}`);

  const filteredMessages = messages.filter(m => m.channel === activeChannel);

  const handleChannelSelect = (id) => {
    setActiveChannel(id);
    if (isMobile) setShowChannelList(false);
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    const msg = {
      id: messages.length + 1, channel: activeChannel,
      user: "Sarah Chen", avatar: "SC", text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
      project: null,
    };
    setMessages([...messages, msg]);
    setNewMessage("");
  };

  // On mobile: show either channel list OR message thread
  const channelPanel = (
    <div style={{ width: isMobile ? "100%" : 260, minWidth: isMobile ? 0 : 260, background: COLORS.surface, borderRight: isMobile ? "none" : `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ padding: "20px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
        <h2 style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 600, letterSpacing: "0.5px" }}>Communications</h2>
        <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>All messages are logged & reviewable</p>
      </div>
      <div style={{ padding: "12px 8px", flex: 1, overflowY: "auto" }}>
        <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: FONTS.mono, letterSpacing: 1, padding: "8px 10px", textTransform: "uppercase" }}>Channels</div>
        {channels.map(ch => (
          <button key={ch.id} onClick={() => handleChannelSelect(ch.id)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              width: "100%", padding: "10px 12px", borderRadius: 8, border: "none", cursor: "pointer",
              background: activeChannel === ch.id ? `${COLORS.accent}15` : "transparent",
              color: activeChannel === ch.id ? COLORS.accent : COLORS.textSecondary,
              fontFamily: FONTS.body, fontSize: 13, fontWeight: activeChannel === ch.id ? 600 : 400,
              transition: "all 0.15s", textAlign: "left",
            }}
          >
            <span># {ch.name}</span>
            {ch.unread > 0 && (
              <span style={{ background: COLORS.danger, color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>{ch.unread}</span>
            )}
          </button>
        ))}
        <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: FONTS.mono, letterSpacing: 1, padding: "16px 10px 8px", textTransform: "uppercase" }}>Clients</div>
        {clientDMs.map(c => (
          <button key={c.id} onClick={() => handleChannelSelect(`dm-${c.id}`)} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px",
            borderRadius: 8, border: "none", cursor: "pointer",
            background: activeChannel === `dm-${c.id}` ? `${COLORS.accent}15` : "transparent",
            color: activeChannel === `dm-${c.id}` ? COLORS.accent : COLORS.textSecondary,
            fontFamily: FONTS.body, fontSize: 13, textAlign: "left",
          }}>
            <Avatar initials={c.avatar} size={24} color={COLORS.success} />
            <div><div>{c.name}</div><div style={{ fontSize: 10, color: COLORS.textMuted }}>{c.role}</div></div>
          </button>
        ))}
        <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: FONTS.mono, letterSpacing: 1, padding: "16px 10px 8px", textTransform: "uppercase" }}>Vendors & Suppliers</div>
        {vendorDMs.map(c => (
          <button key={c.id} onClick={() => handleChannelSelect(`dm-${c.id}`)} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px",
            borderRadius: 8, border: "none", cursor: "pointer",
            background: activeChannel === `dm-${c.id}` ? `${COLORS.accent}15` : "transparent",
            color: activeChannel === `dm-${c.id}` ? COLORS.accent : COLORS.textSecondary,
            fontFamily: FONTS.body, fontSize: 13, textAlign: "left",
          }}>
            <Avatar initials={c.avatar} size={24} color={COLORS.info} />
            <div><div>{c.name}</div><div style={{ fontSize: 10, color: COLORS.textMuted }}>{c.role}</div></div>
          </button>
        ))}
        <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: FONTS.mono, letterSpacing: 1, padding: "16px 10px 8px", textTransform: "uppercase" }}>Team</div>
        {EMPLOYEES.slice(0, 4).map(emp => (
          <button key={emp.id} style={{
            display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px",
            borderRadius: 8, border: "none", cursor: "pointer", background: "transparent",
            color: COLORS.textSecondary, fontFamily: FONTS.body, fontSize: 13, textAlign: "left",
          }}>
            <StatusDot status={emp.status} />
            <span>{emp.name}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const messagePanel = (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
      <div style={{ padding: isMobile ? "12px 16px" : "16px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {isMobile && (
            <button onClick={() => setShowChannelList(true)} style={{
              background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted,
              padding: 4, display: "flex", alignItems: "center",
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>
            </button>
          )}
          <div>
            <h3 style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600 }}>
              {activeContact ? activeContact.name : `#${channels.find(c => c.id === activeChannel)?.name}`}
            </h3>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>
              {activeContact ? `${activeContact.role}${activeContact.company ? ` · ${activeContact.company}` : ""}` : `${channels.find(c => c.id === activeChannel)?.members} members`}
            </span>
          </div>
        </div>
        {!isMobile && <div style={{ display: "flex", gap: 8 }}>
          <Badge color={COLORS.success} small>LOGGED</Badge>
          <Badge color={COLORS.info} small>AUTO-SYNC</Badge>
        </div>}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? "12px 16px" : "16px 24px" }}>
        <div style={{ padding: "10px 14px", background: `${COLORS.info}10`, borderRadius: 8, border: `1px solid ${COLORS.info}25`, marginBottom: 16, fontSize: 12, color: COLORS.info }}>
          <strong>📋 Auto-Detection Active:</strong> Messages confirming task completion will automatically update project checklists.
        </div>
        {filteredMessages.map((m, i) => (
          <div key={m.id} className="slide-in" style={{ display: "flex", gap: 10, marginBottom: 14, animationDelay: `${i * 0.05}s` }}>
            <Avatar initials={m.avatar} size={isMobile ? 32 : 36} color={m.channel === "management" ? COLORS.info : COLORS.accent} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{m.user}</span>
                <span style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.mono }}>{m.time}</span>
                {m.project && <Badge color={COLORS.textMuted} small>{m.project}</Badge>}
              </div>
              <div style={{ fontSize: 14, color: COLORS.textSecondary, marginTop: 4, lineHeight: 1.5 }}>{m.text}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Auto Client Update Panel */}
      {activeContact && activeContact.type === "client" && showClientUpdate && (
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${COLORS.accent}30`, background: `${COLORS.accent}05` }}>
          <div style={{ fontSize: 11, fontFamily: FONTS.mono, color: COLORS.accent, letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>Professional Client Update Preview</div>
          <div style={{
            borderRadius: 12, overflow: "hidden", border: `1px solid ${COLORS.border}`,
            background: COLORS.card, marginBottom: 12,
          }}>
            {/* Update Header */}
            <div style={{ padding: "16px 20px", background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`, color: "#000" }}>
              <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 700 }}>PAVING 123 · PROJECT UPDATE</div>
              <div style={{ fontSize: 12, marginTop: 2, opacity: 0.8 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
            </div>
            {/* Update Body */}
            <div style={{ padding: "16px 20px" }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                {PROJECTS.find(p => p.id === activeContact.project)?.name || "Project Update"}
              </div>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>
                Client: {activeContact.name} · {activeContact.company || ""}
              </div>
              {/* Progress */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                  <span>Overall Progress</span>
                  <span style={{ fontWeight: 600, color: COLORS.accent }}>{PROJECTS.find(p => p.id === activeContact.project)?.progress || 0}%</span>
                </div>
                <ProgressBar value={PROJECTS.find(p => p.id === activeContact.project)?.progress || 0} height={8} />
              </div>
              {/* Recent milestones */}
              <div style={{ fontSize: 12, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Completed This Week</div>
              {(PROJECTS.find(p => p.id === activeContact.project)?.checklist || []).filter(c => c.done).slice(-3).map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: COLORS.success, marginBottom: 2 }}>
                  <Icon name="check" size={12} color={COLORS.success} /> {c.text}
                </div>
              ))}
              {/* Next steps */}
              <div style={{ fontSize: 12, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginTop: 10, marginBottom: 6 }}>Up Next</div>
              {(PROJECTS.find(p => p.id === activeContact.project)?.checklist || []).filter(c => !c.done).slice(0, 3).map((c, i) => (
                <div key={i} style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 2 }}>• {c.text}</div>
              ))}
              {/* Photo placeholder */}
              <div style={{
                marginTop: 12, height: 80, borderRadius: 8,
                background: `linear-gradient(135deg, ${COLORS.asphalt}, ${COLORS.surface})`,
                border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center",
                justifyContent: "center", color: COLORS.textMuted, fontSize: 12, gap: 6,
              }}>
                <Icon name="photo" size={16} color={COLORS.textMuted} /> Site photo will be attached
              </div>
            </div>
            <div style={{ padding: "12px 20px", borderTop: `1px solid ${COLORS.border}`, fontSize: 10, color: COLORS.textMuted, textAlign: "center" }}>
              Paving 123 · Licensed & Insured · paving123.com
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button size="sm" icon="send">Send via Text</Button>
            <Button size="sm" icon="email" variant="ghost">Send via Email</Button>
            <Button size="sm" icon="photo" variant="ghost">Attach Photo</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowClientUpdate(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div style={{ padding: isMobile ? "12px 16px" : "16px 24px", borderTop: `1px solid ${COLORS.border}` }}>
        {activeContact && activeContact.type === "client" && !showClientUpdate && (
          <button onClick={() => setShowClientUpdate(true)} style={{
            display: "flex", alignItems: "center", gap: 6, marginBottom: 8, padding: "6px 12px",
            borderRadius: 8, border: `1px solid ${COLORS.accent}40`,
            background: `${COLORS.accent}10`, color: COLORS.accent,
            fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: FONTS.body,
          }}>
            <Icon name="send" size={14} color={COLORS.accent} /> Send Professional Project Update
          </button>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            onKeyDown={e => e.key === "Enter" && sendMessage()}
            placeholder={activeContact ? `Message ${activeContact.name}...` : `Message #${channels.find(c => c.id === activeChannel)?.name}...`}
            style={{
              flex: 1, padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
              background: COLORS.surface, color: COLORS.text, fontSize: 14, outline: "none",
            }}
          />
          <Button onClick={sendMessage} icon="send">{isMobile ? "" : "Send"}</Button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {isMobile ? (showChannelList ? channelPanel : messagePanel) : <>{channelPanel}{messagePanel}</>}
    </div>
  );
};

// ─── PROJECTS VIEW ──────────────────────────────────────
const ProjectsView = ({ selectedProject, setSelectedProject, isMobile }) => {
  const [projects, setProjects] = useState(PROJECTS);
  const [closedProjects] = useState(CLOSED_PROJECTS);
  const [projectTab, setProjectTab] = useState("active");
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [openStage, setOpenStage] = useState(null);
  const [newProject, setNewProject] = useState({ name: "", client: "", type: "Residential", location: "", crew: "Unassigned", budget: "", startDate: "", endDate: "" });
  const [newItem, setNewItem] = useState("");

  const createProject = () => {
    if (!newProject.name || !newProject.client) return;
    const proj = {
      id: "P-" + (1005 + projects.length), ...newProject,
      budget: Number(newProject.budget) || 0, spent: 0, progress: 0,
      status: "bidding", checklist: [], timeline: [
        { date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }), event: "Project created", user: "Sarah Chen", type: "milestone" },
      ],
    };
    setProjects([...projects, proj]);
    setNewProject({ name: "", client: "", type: "Residential", location: "", crew: "Unassigned", budget: "", startDate: "", endDate: "" });
    setShowCreateProject(false);
  };

  const statusColors = { "in-progress": COLORS.info, bidding: COLORS.warning, completed: COLORS.success, on_hold: COLORS.danger };
  const timelineColors = { milestone: COLORS.accent, update: COLORS.info, delay: COLORS.danger };

  const toggleCheck = (projectId, checkId) => {
    setProjects(projects.map(p =>
      p.id === projectId
        ? { ...p, checklist: p.checklist.map(c => c.id === checkId ? { ...c, done: !c.done, completedBy: !c.done ? "Sarah Chen" : undefined, date: !c.done ? "Feb 26" : undefined } : c) }
        : p
    ));
  };

  const addCheckItem = (projectId) => {
    if (!newItem.trim()) return;
    setProjects(projects.map(p =>
      p.id === projectId
        ? { ...p, checklist: [...p.checklist, { id: p.checklist.length + 1, text: newItem, done: false }] }
        : p
    ));
    setNewItem("");
  };

  if (selectedProject) {
    const p = projects.find(pr => pr.id === selectedProject.id) || selectedProject;
    const completedTasks = p.checklist.filter(c => c.done).length;
    const totalTasks = p.checklist.length;
    const computedProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
      <div style={{ padding: isMobile ? 16 : 32, overflowY: "auto", height: "100vh" }}>
        <button onClick={() => setSelectedProject(null)}
          style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: COLORS.textMuted, fontSize: 13, cursor: "pointer", marginBottom: 20, fontFamily: FONTS.body }}>
          ← Back to Projects
        </button>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1 style={{ fontFamily: FONTS.display, fontSize: 28, fontWeight: 700 }}>{p.name}</h1>
              <Badge color={statusColors[p.status]}>{p.status}</Badge>
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 8, fontSize: 13, color: COLORS.textMuted }}>
              <span>📍 {p.location}</span>
              <span>👤 {p.client}</span>
              <span>🏷️ {p.type}</span>
              {p.crew !== "Unassigned" && <span>👥 {p.crew} Crew</span>}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.mono, marginBottom: 4 }}>BUDGET</div>
            <div style={{ fontSize: 24, fontWeight: 700, fontFamily: FONTS.display, color: COLORS.accent }}>${p.budget?.toLocaleString()}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>${p.spent?.toLocaleString()} spent</div>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 12 : 20 }}>
          <Card>
            <SectionHeader title="Project Checklist" subtitle={`${completedTasks} of ${totalTasks} tasks completed (${computedProgress}%)`} />
            <ProgressBar value={computedProgress} height={8} color={COLORS.success} />
            <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 4 }}>
              {p.checklist.map(item => (
                <div key={item.id}
                  onClick={() => toggleCheck(p.id, item.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                    borderRadius: 8, cursor: "pointer", transition: "all 0.15s",
                    background: item.done ? `${COLORS.success}08` : "transparent",
                    border: `1px solid ${item.done ? COLORS.success + "25" : "transparent"}`,
                  }}
                >
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, border: `2px solid ${item.done ? COLORS.success : COLORS.border}`,
                    background: item.done ? COLORS.success : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s",
                  }}>
                    {item.done && <Icon name="check" size={14} color="#fff" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, textDecoration: item.done ? "line-through" : "none", color: item.done ? COLORS.textMuted : COLORS.text }}>{item.text}</div>
                    {item.done && (
                      <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>✓ {item.completedBy} — {item.date}</div>
                    )}
                  </div>
                </div>
              ))}
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <input
                  value={newItem}
                  onChange={e => setNewItem(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCheckItem(p.id)}
                  placeholder="Add checklist item..."
                  style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 13, outline: "none" }}
                />
                <Button onClick={() => addCheckItem(p.id)} icon="add" size="sm">Add</Button>
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Project Timeline" subtitle="Activity log with photos & updates" />
            <div style={{ position: "relative", paddingLeft: 24 }}>
              <div style={{ position: "absolute", left: 7, top: 0, bottom: 0, width: 2, background: COLORS.border }} />
              {p.timeline.map((entry, i) => (
                <div key={i} className="fade-in" style={{ marginBottom: 20, position: "relative", animationDelay: `${i * 0.1}s` }}>
                  <div style={{
                    position: "absolute", left: -20, top: 4, width: 14, height: 14,
                    borderRadius: "50%", background: COLORS.bg,
                    border: `3px solid ${timelineColors[entry.type]}`,
                  }} />
                  <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.mono, marginBottom: 4 }}>{entry.date}</div>
                  <div style={{ fontSize: 14, color: COLORS.text, lineHeight: 1.5 }}>{entry.event}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>— {entry.user}</div>
                  {entry.hasPhoto && (
                    <div style={{
                      marginTop: 8, width: "100%", height: 100, borderRadius: 8,
                      background: `linear-gradient(135deg, ${COLORS.asphalt}, ${COLORS.surface})`,
                      border: `1px solid ${COLORS.border}`, display: "flex", alignItems: "center",
                      justifyContent: "center", color: COLORS.textMuted, fontSize: 12, gap: 6,
                    }}>
                      <Icon name="photo" size={16} color={COLORS.textMuted} /> Photo attached
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Button variant="secondary" size="sm" icon="add" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
              Add Update / Photo
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const allKanbanProjects = [...projects, ...closedProjects];
  const kanbanCols = [
    { id: "estimate", title: "Estimate Sent", color: COLORS.textMuted, icon: "dollar",
      items: allKanbanProjects.filter(p => p.status === "bidding") },
    { id: "signed", title: "Contract Signed", color: COLORS.info, icon: "projects",
      items: allKanbanProjects.filter(p => p.status === "in-progress" && p.progress === 0) },
    { id: "deposit", title: "Deposit Received", color: "#8B5CF6", icon: "money",
      items: allKanbanProjects.filter(p => p.status === "in-progress" && p.progress > 0 && p.progress <= 15) },
    { id: "demo", title: "Demolition & Prep", color: COLORS.warning, icon: "truck",
      items: allKanbanProjects.filter(p => p.status === "in-progress" && p.progress > 15 && p.progress <= 35) },
    { id: "grading", title: "Grading & Sub-Base", color: "#EC4899", icon: "tracking",
      items: allKanbanProjects.filter(p => p.status === "in-progress" && p.progress > 35 && p.progress <= 55) },
    { id: "paving", title: "Laying Asphalt", color: COLORS.accent, icon: "inventory",
      items: allKanbanProjects.filter(p => p.status === "in-progress" && p.progress > 55 && p.progress <= 80) },
    { id: "finishing", title: "Finishing & Sealcoat", color: COLORS.info, icon: "edit",
      items: allKanbanProjects.filter(p => p.status === "in-progress" && p.progress > 80 && p.progress < 100) },
    { id: "complete", title: "Completed", color: COLORS.success, icon: "check",
      items: allKanbanProjects.filter(p => p.status === "completed").slice(0, 6) },
  ];

  return (
    <div style={{ padding: isMobile ? 16 : 32, overflowY: "auto", height: "100vh" }}>
      <SectionHeader title="Projects" subtitle={`${projects.length} active · ${closedProjects.length} closed`}
        action={<Button icon="add" onClick={() => setShowCreateProject(!showCreateProject)}>{showCreateProject ? "Cancel" : "New Project"}</Button>} />

      {/* View Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
        {[["active", "Active & Bidding"], ["kanban", "Pipeline Board"], ["closed", `Closed (${closedProjects.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setProjectTab(id)} style={{
            padding: "10px 20px", border: "none", cursor: "pointer",
            background: "transparent", fontFamily: FONTS.body, fontSize: 13, fontWeight: 500,
            color: projectTab === id ? COLORS.accent : COLORS.textMuted,
            borderBottom: projectTab === id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
          }}>{label}</button>
        ))}
      </div>

      {/* Create Project Form */}
      {showCreateProject && (
        <Card style={{ marginBottom: 20, border: `1px solid ${COLORS.accent}30` }}>
          <h3 style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>New Project</h3>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 12 }}>
            {[["name","Project Name","text"],["client","Client Name","text"],["location","Address / Location","text"],["budget","Budget ($)","number"],["startDate","Start Date","date"],["endDate","End Date","date"]].map(([key,label,type]) => (
              <div key={key}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, fontFamily: FONTS.mono }}>{label}</div>
                <input type={type} value={newProject[key]} onChange={e => setNewProject({...newProject, [key]: e.target.value})}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 14, outline: "none" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, fontFamily: FONTS.mono }}>Type</div>
              <select value={newProject.type} onChange={e => setNewProject({...newProject, type: e.target.value})}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 14 }}>
                <option>Residential</option><option>Commercial</option><option>Municipal</option>
              </select>
            </div>
            <div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4, fontFamily: FONTS.mono }}>Crew</div>
              <select value={newProject.crew} onChange={e => setNewProject({...newProject, crew: e.target.value})}
                style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 14 }}>
                <option>Unassigned</option><option>Alpha</option><option>Bravo</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <Button variant="ghost" onClick={() => setShowCreateProject(false)}>Cancel</Button>
            <Button onClick={createProject}>Create Project</Button>
          </div>
        </Card>
      )}

      {/* ─── KANBAN PIPELINE BOARD (Accordion) ─── */}
      {projectTab === "kanban" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {kanbanCols.map(col => {
            const isOpen = openStage === col.id;
            return (
              <div key={col.id}>
                {/* Accordion Header */}
                <button
                  onClick={() => setOpenStage(isOpen ? null : col.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10, width: "100%",
                    padding: "14px 16px", borderRadius: isOpen ? "10px 10px 0 0" : 10,
                    border: `1px solid ${isOpen ? col.color : COLORS.border}`,
                    borderBottom: isOpen ? `2px solid ${col.color}` : `1px solid ${isOpen ? col.color : COLORS.border}`,
                    background: isOpen ? `${col.color}10` : COLORS.surface,
                    cursor: "pointer", transition: "all 0.2s",
                    fontFamily: FONTS.body, textAlign: "left",
                  }}
                  onMouseEnter={e => { if (!isOpen) e.currentTarget.style.borderColor = col.color; }}
                  onMouseLeave={e => { if (!isOpen) e.currentTarget.style.borderColor = COLORS.border; }}
                >
                  <Icon name={col.icon} size={18} color={col.color} />
                  <span style={{ flex: 1, fontFamily: FONTS.display, fontSize: 14, fontWeight: 600, color: isOpen ? col.color : COLORS.text, letterSpacing: 0.3 }}>
                    {col.title}
                  </span>
                  <span style={{
                    background: `${col.color}20`, color: col.color,
                    fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 10, fontFamily: FONTS.mono,
                    minWidth: 28, textAlign: "center",
                  }}>{col.items.length}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={isOpen ? col.color : COLORS.textMuted}
                    style={{ transition: "transform 0.2s", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                  </svg>
                </button>

                {/* Accordion Content */}
                {isOpen && (
                  <div style={{
                    border: `1px solid ${col.color}40`, borderTop: "none",
                    borderRadius: "0 0 10px 10px", padding: 10,
                    background: `${COLORS.surface}80`,
                    animation: "fadeIn 0.2s ease-out",
                  }}>
                    {col.items.length === 0 ? (
                      <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: COLORS.textMuted, fontStyle: "italic" }}>No projects in this stage</div>
                    ) : (
                      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                        {col.items.map(p => (
                          <div key={p.id} onClick={() => setSelectedProject(p)} style={{
                            padding: 14, borderRadius: 8, background: COLORS.card,
                            border: `1px solid ${COLORS.border}`, cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                          onMouseEnter={e => e.currentTarget.style.borderColor = col.color}
                          onMouseLeave={e => e.currentTarget.style.borderColor = COLORS.border}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                              <div style={{ fontWeight: 600, fontSize: 13, lineHeight: 1.3 }}>{p.name}</div>
                              <span style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted, flexShrink: 0, marginLeft: 8 }}>{p.id}</span>
                            </div>
                            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 6 }}>{p.client}</div>
                            {p.progress > 0 && p.progress < 100 && (
                              <div style={{ marginBottom: 6 }}><ProgressBar value={p.progress} height={4} color={col.color} /></div>
                            )}
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11 }}>
                              <span style={{ color: COLORS.textMuted }}>{p.crew !== "Unassigned" ? `${p.crew} Crew` : ""}</span>
                              <span style={{ fontFamily: FONTS.mono, color: col.color, fontWeight: 700 }}>${p.budget?.toLocaleString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ─── CLOSED PROJECTS ─── */}
      {projectTab === "closed" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
          {closedProjects.map(p => (
            <Card key={p.id} style={{ cursor: "pointer" }} onClick={() => setSelectedProject(p)}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 10, color: COLORS.textMuted }}>{p.id}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginTop: 2 }}>{p.name}</div>
                </div>
                <Badge color={COLORS.success} small>Completed</Badge>
              </div>
              <div style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 }}>{p.client}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>{p.location}</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontSize: 12 }}>
                <span style={{ color: COLORS.textMuted }}>{p.startDate} → {p.endDate}</span>
                <span style={{ fontFamily: FONTS.mono, fontWeight: 600, color: COLORS.success }}>${p.spent?.toLocaleString()}</span>
              </div>
              {p.invoicePaid === false && <Badge color={COLORS.danger} small>Invoice unpaid</Badge>}
              {p.rating && (
                <div style={{ marginTop: 6 }}>
                  {"★★★★★".slice(0, p.rating).split("").map((s, i) => <span key={i} style={{ color: COLORS.accent }}>{s}</span>)}
                  {"★★★★★".slice(0, 5 - p.rating).split("").map((s, i) => <span key={i} style={{ color: COLORS.border }}>{s}</span>)}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* ─── ACTIVE PROJECTS LIST ─── */}
      {projectTab === "active" && (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 10 : 16 }}>
          {projects.map((p, i) => {
            const completed = p.checklist.filter(c => c.done).length;
            const total = p.checklist.length;
            return (
              <Card key={p.id} className="hover-lift" onClick={() => setSelectedProject(p)}
                style={{ cursor: "pointer", animationDelay: `${i * 0.08}s` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <Badge color={statusColors[p.status]} small>{p.status}</Badge>
                    <h3 style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 600, marginTop: 8 }}>{p.name}</h3>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{p.client} • {p.type}</div>
                  </div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted }}>{p.id}</div>
                </div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 12 }}>📍 {p.location}</div>
                {total > 0 && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6 }}>
                      <span style={{ color: COLORS.textMuted }}>{completed}/{total} tasks</span>
                      <span style={{ color: COLORS.accent, fontWeight: 600 }}>{Math.round((completed / total) * 100)}%</span>
                    </div>
                    <ProgressBar value={(completed / total) * 100} />
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${COLORS.border}` }}>
                  <span style={{ fontSize: 12, color: COLORS.textMuted }}>
                    {p.crew !== "Unassigned" ? `${p.crew} Crew` : "Unassigned"}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: FONTS.display, color: COLORS.accent }}>
                    ${p.budget?.toLocaleString()}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ─── INVENTORY VIEW ─────────────────────────────────────
const InventoryView = ({ isMobile }) => {
  const [filter, setFilter] = useState("All");
  const categories = ["All", "Materials", "Equipment", "Tools", "Safety"];

  const filtered = filter === "All" ? INVENTORY : INVENTORY.filter(i => i.category === filter);
  const totalValue = INVENTORY.reduce((sum, i) => sum + i.qty * i.cost, 0);

  return (
    <div style={{ padding: isMobile ? 16 : 32, overflowY: "auto", height: "100vh" }}>
      <SectionHeader title="Inventory Management" subtitle={`${INVENTORY.length} items tracked • Total value: $${totalValue.toLocaleString()}`}
        action={<Button icon="add">Add Item</Button>} />

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {categories.map(cat => (
          <Button key={cat} variant={filter === cat ? "primary" : "secondary"} size="sm" onClick={() => setFilter(cat)}>{cat}</Button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Total Items", value: INVENTORY.length, color: COLORS.accent },
          { label: "Low Stock", value: INVENTORY.filter(i => i.qty <= i.minQty).length, color: COLORS.danger },
          { label: "Watch List", value: INVENTORY.filter(i => i.qty > i.minQty && i.qty <= i.minQty * 1.5).length, color: COLORS.warning },
          { label: "Stocked", value: INVENTORY.filter(i => i.qty > i.minQty * 1.5).length, color: COLORS.success },
        ].map((s, i) => (
          <Card key={i} style={{ padding: 16, textAlign: "center" }}>
            <div style={{ fontSize: 28, fontWeight: 700, fontFamily: FONTS.display, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.mono, letterSpacing: 1, textTransform: "uppercase" }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Low Stock Auto-Alert Section */}
      {INVENTORY.filter(i => i.qty <= i.minQty).length > 0 && (
        <Card style={{ marginBottom: 20, border: `1px solid ${COLORS.danger}30` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.danger, animation: "pulse 2s infinite" }} />
              <span style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 600, color: COLORS.danger }}>Low Stock Auto-Alerts</span>
            </div>
            <Badge color={COLORS.success} small>AUTO-REORDER ACTIVE</Badge>
          </div>
          <p style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 }}>
            When items drop below minimum quantities, the app automatically sends re-order texts and emails to the supplier.
          </p>
          {INVENTORY.filter(i => i.qty <= i.minQty).map(item => (
            <div key={item.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px", borderRadius: 8, background: `${COLORS.danger}08`,
              border: `1px solid ${COLORS.danger}15`, marginBottom: 6, flexWrap: "wrap", gap: 8,
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                  {item.qty} {item.unit} remaining · Min: {item.minQty} {item.unit}
                  {item.supplier && ` · Supplier: ${item.supplier}`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Badge color={COLORS.danger} small>Below minimum</Badge>
                {item.supplier && (
                  <button style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: `${COLORS.accent}15`, color: COLORS.accent, border: `1px solid ${COLORS.accent}30`,
                    cursor: "pointer", fontFamily: FONTS.body,
                  }}>
                    Re-order from {item.supplier} →
                  </button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Low Stock Auto-Alert Section */}
      {INVENTORY.filter(i => i.qty <= i.minQty).length > 0 && (
        <Card style={{ marginBottom: 20, border: `1px solid ${COLORS.danger}30` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.danger, animation: "pulse 2s infinite" }} />
              <span style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 600, color: COLORS.danger }}>Low Stock Auto-Alerts</span>
            </div>
            <Badge color={COLORS.success} small>AUTO-REORDER ACTIVE</Badge>
          </div>
          <p style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 12 }}>
            When items drop below minimum quantities, the app automatically sends re-order texts and emails to the supplier.
          </p>
          {INVENTORY.filter(i => i.qty <= i.minQty).map(item => (
            <div key={item.id} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px", borderRadius: 8, background: `${COLORS.danger}08`,
              border: `1px solid ${COLORS.danger}15`, marginBottom: 6, flexWrap: "wrap", gap: 8,
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                  {item.qty} {item.unit} remaining · Min: {item.minQty} {item.unit}
                  {item.supplier && ` · Supplier: ${item.supplier}`}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Badge color={COLORS.danger} small>Below minimum</Badge>
                {item.supplier && (
                  <button style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                    background: `${COLORS.accent}15`, color: COLORS.accent, border: `1px solid ${COLORS.accent}30`,
                    cursor: "pointer", fontFamily: FONTS.body,
                  }}>
                    Re-order from {item.supplier} →
                  </button>
                )}
              </div>
            </div>
          ))}
        </Card>
      )}

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
              {["Item", "Category", "Qty / Unit", "Min Qty", "Status", "Unit Cost", "Total Value"].map(h => (
                <th key={h} style={{
                  padding: "14px 16px", textAlign: "left", fontSize: 10, fontFamily: FONTS.mono,
                  letterSpacing: 1, color: COLORS.textMuted, textTransform: "uppercase", fontWeight: 600,
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((item, i) => {
              const status = item.qty <= item.minQty ? "low" : item.qty <= item.minQty * 1.5 ? "watch" : "ok";
              return (
                <tr key={item.id} className="fade-in" style={{
                  borderBottom: `1px solid color-mix(in srgb, ${COLORS.border} 3%, transparent)`,
                  background: i % 2 === 0 ? "transparent" : COLORS.surface + "40",
                  animationDelay: `${i * 0.03}s`,
                }}>
                  <td style={{ padding: "12px 16px", fontWeight: 600, fontSize: 13 }}>{item.name}</td>
                  <td style={{ padding: "12px 16px" }}><Badge color={COLORS.textMuted} small>{item.category}</Badge></td>
                  <td style={{ padding: "12px 16px", fontFamily: FONTS.mono, fontSize: 13 }}>{item.qty} {item.unit}</td>
                  <td style={{ padding: "12px 16px", fontFamily: FONTS.mono, fontSize: 13, color: COLORS.textMuted }}>{item.minQty}</td>
                  <td style={{ padding: "12px 16px" }}>
                    <Badge color={status === "low" ? COLORS.danger : status === "watch" ? COLORS.warning : COLORS.success} small>
                      {status === "low" ? "LOW" : status === "watch" ? "WATCH" : "OK"}
                    </Badge>
                  </td>
                  <td style={{ padding: "12px 16px", fontFamily: FONTS.mono, fontSize: 13 }}>${item.cost}</td>
                  <td style={{ padding: "12px 16px", fontFamily: FONTS.mono, fontSize: 13, fontWeight: 600 }}>${(item.qty * item.cost).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

// ─── FLEET & CREW TRACKING ──────────────────────────────
const TrackingView = ({ isMobile }) => {
  const [tab, setTab] = useState("vehicles");
  const [selectedItem, setSelectedItem] = useState(null);

  // Build OpenStreetMap iframe URL with markers
  const mapCenter = "39.85,-84.5";
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=-88.0,38.5,-81.0,42.5&layer=mapnik&marker=${mapCenter}`;

  return (
    <div style={{ padding: isMobile ? 16 : 32, overflowY: "auto", height: "100vh" }}>
      <SectionHeader title="Fleet & Crew Tracking" subtitle="Real-time vehicle and employee locations" />

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <Button variant={tab === "vehicles" ? "primary" : "secondary"} size="sm" icon="truck" onClick={() => { setTab("vehicles"); setSelectedItem(null); }}>Vehicles ({VEHICLES.length})</Button>
        <Button variant={tab === "employees" ? "primary" : "secondary"} size="sm" icon="people" onClick={() => { setTab("employees"); setSelectedItem(null); }}>Employees ({EMPLOYEES.length})</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 380px", gap: isMobile ? 12 : 20 }}>
        <Card style={{ padding: 0, overflow: "hidden", minHeight: 560, borderRadius: 12, position: "relative" }}>
          <iframe
            src={mapUrl}
            style={{ width: "100%", height: isMobile ? 300 : 560, border: "none", borderRadius: 12, filter: "invert(0.9) hue-rotate(180deg) brightness(1.2) contrast(0.9)" }}
            title="Fleet Map"
          />
          {/* Vehicle overlay markers */}
          <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", borderRadius: 12 }}>
            {(tab === "vehicles" ? VEHICLES : []).map((v) => {
              const x = 15 + ((v.lng + 88) / 7) * 70;
              const y = 10 + ((42.5 - v.lat) / 4) * 80;
              const statusColor = v.status === "on-site" ? COLORS.success : v.status === "in-transit" ? COLORS.info : v.status === "idle" ? COLORS.warning : COLORS.danger;
              return (
                <div key={v.id} style={{
                  position: "absolute", left: `${Math.max(5, Math.min(90, x))}%`, top: `${Math.max(5, Math.min(90, y))}%`,
                  transform: "translate(-50%, -50%)", zIndex: 10, pointerEvents: "auto",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%", background: `${statusColor}33`, border: `3px solid ${statusColor}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 0 12px ${statusColor}55, 0 2px 8px rgba(0,0,0,0.4)`,
                    animation: v.status === "in-transit" ? "pulse 2s infinite" : "none",
                    cursor: "pointer",
                  }} onClick={() => setSelectedItem(v)}>
                    <Icon name="truck" size={12} color={statusColor} />
                  </div>
                  <div style={{
                    position: "absolute", top: 30, left: "50%", transform: "translateX(-50%)",
                    fontSize: 9, fontFamily: FONTS.mono, color: COLORS.text,
                    whiteSpace: "nowrap", background: COLORS.bg, padding: "2px 6px", borderRadius: 4,
                    border: `1px solid ${COLORS.border}`,
                  }}>{v.id}</div>
                </div>
              );
            })}
            {tab === "employees" && EMPLOYEES.filter(e => e.crew !== "HQ").map((emp, i) => {
              const crew = VEHICLES.find(v => v.crew === emp.crew);
              const lat = (crew?.lat || 39.77) + (i * 0.15);
              const lng = (crew?.lng || -86.16) + (i * 0.15);
              const x = 15 + ((lng + 88) / 7) * 70;
              const y = 10 + ((42.5 - lat) / 4) * 80;
              const statusColor = emp.status === "active" ? COLORS.success : emp.status === "break" ? COLORS.warning : COLORS.textMuted;
              return (
                <div key={emp.id} style={{
                  position: "absolute", left: `${Math.max(5, Math.min(90, x))}%`, top: `${Math.max(5, Math.min(90, y))}%`,
                  transform: "translate(-50%, -50%)", zIndex: 10, pointerEvents: "auto",
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", background: `${statusColor}33`, border: `2px solid ${statusColor}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: `0 0 8px ${statusColor}44`,
                    cursor: "pointer",
                  }} onClick={() => setSelectedItem(emp)}>
                    <Icon name="people" size={10} color={statusColor} />
                  </div>
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{
            position: "absolute", bottom: 12, left: 12, zIndex: 20,
            display: "flex", gap: 14, padding: "8px 14px",
            background: COLORS.bg, borderRadius: 8, border: `1px solid ${COLORS.border}`,
            fontSize: 10, fontFamily: FONTS.mono,
          }}>
            {[
              { s: "on-site", c: COLORS.success },
              { s: "in-transit", c: COLORS.info },
              { s: "idle", c: COLORS.warning },
              { s: "maintenance", c: COLORS.danger },
            ].map(x => (
              <span key={x.s} style={{ display: "flex", alignItems: "center", gap: 5, color: COLORS.textSecondary }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: x.c, boxShadow: `0 0 6px ${x.c}66` }} />
                {x.s}
              </span>
            ))}
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: isMobile ? 300 : 560, overflowY: "auto" }}>
          {tab === "vehicles" ? VEHICLES.map((v, i) => {
            const statusColor = v.status === "on-site" ? COLORS.success : v.status === "in-transit" ? COLORS.info : v.status === "idle" ? COLORS.warning : COLORS.danger;
            const isSelected = selectedItem?.id === v.id;
            return (
              <Card key={v.id} className="fade-in" onClick={() => setSelectedItem(v)}
                style={{
                  padding: 14, animationDelay: `${i * 0.04}s`, cursor: "pointer",
                  border: `1px solid ${isSelected ? statusColor : COLORS.border}`,
                  background: isSelected ? `${statusColor}08` : COLORS.card,
                  transition: "all 0.2s",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ padding: 6, borderRadius: 6, background: `${statusColor}15` }}>
                      <Icon name="truck" size={16} color={statusColor} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{v.id} — {v.name}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted }}>{v.type} • {v.crew} Crew</div>
                    </div>
                  </div>
                  <Badge color={statusColor} small>{v.status}</Badge>
                </div>
                <div style={{ display: "flex", gap: 16, fontSize: 11 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, color: v.fuel < 50 ? COLORS.danger : COLORS.textMuted }}>
                    <Icon name="fuel" size={12} color={v.fuel < 50 ? COLORS.danger : COLORS.textMuted} /> {v.fuel}% fuel
                  </span>
                  {v.speed > 0 && <span style={{ color: COLORS.info }}>⏱ {v.speed} mph</span>}
                  <span style={{ color: COLORS.textMuted, fontFamily: FONTS.mono, fontSize: 10 }}>
                    {v.lat.toFixed(3)}, {v.lng.toFixed(3)}
                  </span>
                </div>
                {v.fuel < 50 && (
                  <div style={{ marginTop: 8 }}>
                    <ProgressBar value={v.fuel} height={4} color={v.fuel < 30 ? COLORS.danger : COLORS.warning} />
                  </div>
                )}
              </Card>
            );
          }) : EMPLOYEES.map((emp, i) => {
            const isSelected = selectedItem?.id === emp.id;
            const statusColor = emp.status === "active" ? COLORS.success : emp.status === "break" ? COLORS.warning : COLORS.textMuted;
            return (
              <Card key={emp.id} className="fade-in" onClick={() => setSelectedItem(emp)}
                style={{
                  padding: 14, animationDelay: `${i * 0.04}s`, cursor: "pointer",
                  border: `1px solid ${isSelected ? statusColor : COLORS.border}`,
                  background: isSelected ? `${statusColor}08` : COLORS.card,
                  transition: "all 0.2s",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar initials={emp.avatar} size={36} color={statusColor} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{emp.name}</div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted }}>{emp.role} • {emp.crew} Crew</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <StatusDot status={emp.status} />
                    <span style={{ fontSize: 11, color: COLORS.textMuted, textTransform: "capitalize" }}>{emp.status}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};


// ─── PROJECT MAP VIEW ────────────────────────────────────
const ProjectMapView = ({ isMobile }) => {
  const [filter, setFilter] = useState("all");
  const allProjects = [...PROJECTS, ...CLOSED_PROJECTS];
  const filtered = filter === "all" ? allProjects : allProjects.filter(p => p.status === filter);

  const statusColors = { "in-progress": COLORS.accent, "completed": COLORS.success, "bidding": COLORS.info };
  const statusLabels = { "all": "All Projects", "in-progress": "Active", "completed": "Completed", "bidding": "Bidding" };

  const projectCoords = {
    "P-1001": { lat: 39.7684, lng: -86.1581 },
    "P-1002": { lat: 39.9612, lng: -82.9988 },
    "P-1003": { lat: 39.7589, lng: -84.1916 },
    "P-1004": { lat: 39.8000, lng: -86.1200 },
    "P-0998": { lat: 39.9784, lng: -86.1180 },
    "P-0995": { lat: 39.7851, lng: -85.7694 },
    "P-0991": { lat: 39.9568, lng: -86.0180 },
    "P-0987": { lat: 40.0429, lng: -86.1277 },
    "P-0980": { lat: 40.1053, lng: -85.6803 },
  };

  return (
    <div className="view-container" style={{ padding: isMobile ? 16 : 32, overflowY: "auto", height: "100vh" }}>
      <SectionHeader title="Project Map" subtitle={`${filtered.length} projects shown`} />

      {/* Filter Chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {Object.entries(statusLabels).map(([key, label]) => (
          <button key={key} onClick={() => setFilter(key)} style={{
            padding: "6px 16px", borderRadius: 20,
            border: `1px solid ${filter === key ? COLORS.accent : COLORS.border}`,
            background: filter === key ? `${COLORS.accent}15` : "transparent",
            color: filter === key ? COLORS.accent : COLORS.textSecondary,
            cursor: "pointer", fontSize: 13, fontFamily: FONTS.body, fontWeight: 500,
          }}>
            {label} ({key === "all" ? allProjects.length : allProjects.filter(p => p.status === key).length})
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="map-grid" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 340px", gap: 20 }}>
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <iframe
            title="Project Map"
            src="https://www.openstreetmap.org/export/embed.html?bbox=-87.5%2C39.2%2C-82.5%2C40.5&layer=mapnik"
            style={{ width: "100%", height: isMobile ? 350 : 520, border: "none" }}
          />
          {/* Overlay markers */}
          <div style={{ position: "relative", marginTop: -60, padding: "0 16px 16px", zIndex: 2 }}>
            <div style={{
              background: COLORS.bg, borderRadius: 10, padding: "10px 14px",
              border: `1px solid ${COLORS.border}`, fontSize: 12, color: COLORS.textMuted,
            }}>
              <span style={{ color: COLORS.accent }}>●</span> Active &nbsp;
              <span style={{ color: COLORS.success }}>●</span> Completed &nbsp;
              <span style={{ color: COLORS.info }}>●</span> Bidding
            </div>
          </div>
        </Card>

        {/* Project List */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: isMobile ? 350 : 520, overflowY: "auto" }}>
          {filtered.map(p => (
            <Card key={p.id} style={{ padding: 14, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>{p.location}</div>
                </div>
                <span style={{
                  width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                  background: statusColors[p.status] || COLORS.textMuted,
                }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: COLORS.textSecondary }}>
                <span>{p.client}</span>
                <Badge small color={statusColors[p.status]}>{p.status.replace("-", " ")}</Badge>
              </div>
              {p.progress > 0 && p.progress < 100 && (
                <div style={{ marginTop: 8 }}><ProgressBar value={p.progress} height={4} /></div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};



// ─── PAVING COST REFERENCE ───────────────────────────────
const COST_REFERENCE = [
  { keyword: "hma", material: "Hot Mix Asphalt", costPer: 85, unit: "ton", coversSqft: 80, depth: '2"', note: "$10,625 covers ~10,000 sqft" },
  { keyword: "surface course", material: "HMA Surface Course", costPer: 85, unit: "ton", coversSqft: 110, depth: '1.5"', note: "" },
  { keyword: "sealcoat", material: "Sealcoat", costPer: 3.75, unit: "gallon", coversSqft: 50, depth: "surface", note: "$0.075/sqft material cost" },
  { keyword: "aggregate", material: "Crushed Aggregate Base", costPer: 28, unit: "ton", coversSqft: 100, depth: '4"', note: "" },
  { keyword: "tack coat", material: "Tack Coat Emulsion", costPer: 4.50, unit: "gallon", coversSqft: 55, depth: "bond", note: "" },
  { keyword: "cold patch", material: "Cold Patch", costPer: 12, unit: "bag", coversSqft: 4, depth: '2"', note: "Quick-set pothole fill" },
  { keyword: "crack filler", material: "Crack Filler", costPer: 18, unit: "gallon", coversSqft: 30, depth: "fill", note: "" },
  { keyword: "striping", material: "Striping Paint", costPer: 32, unit: "gallon", coversSqft: 400, depth: "line-ft", note: "~400 linear ft per gallon" },
  { keyword: "edge form", material: "Edge Forms (10ft)", costPer: 22, unit: "piece", coversSqft: 10, depth: "linear-ft", note: "" },
];


// ─── ESTIMATES & BILLING VIEW ────────────────────────────
const EstimatesView = ({ isMobile }) => {
  const [tab, setTab] = useState("estimates");
  const [showCreate, setShowCreate] = useState(false);
  const [newEst, setNewEst] = useState({ client: "", project: "", items: [{ desc: "", qty: 1, rate: 0 }] });
  const [sendingEst, setSendingEst] = useState(null);

  const addItem = () => setNewEst(prev => ({ ...prev, items: [...prev.items, { desc: "", qty: 1, rate: 0 }] }));
  const updateItem = (i, field, val) => {
    const items = [...newEst.items];
    items[i] = { ...items[i], [field]: field === "desc" ? val : Number(val) };
    setNewEst(prev => ({ ...prev, items }));
  };
  const estTotal = newEst.items.reduce((sum, i) => sum + (i.qty * i.rate), 0);

  const statusColors = { accepted: COLORS.success, pending: COLORS.warning, declined: COLORS.danger, sent: COLORS.info, paid: COLORS.success, partial: COLORS.warning, overdue: COLORS.danger };

  return (
    <div className="view-container" style={{ padding: isMobile ? 16 : 32, overflowY: "auto", height: "100vh" }}>
      <SectionHeader title="Estimates & Billing" subtitle="Create, send, and track payments" action={
        <Button onClick={() => setShowCreate(!showCreate)} icon="add">{showCreate ? "Cancel" : "New Estimate"}</Button>
      } />

      {/* Tabs */}
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `1px solid ${COLORS.border}` }}>
        {[["estimates", "Estimates"], ["invoices", "Invoices & Billing"], ["stripe", "Stripe Connect"]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding: "10px 20px", border: "none", cursor: "pointer",
            background: "transparent", fontFamily: FONTS.body, fontSize: 13, fontWeight: 500,
            color: tab === id ? COLORS.accent : COLORS.textMuted,
            borderBottom: tab === id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
          }}>{label}</button>
        ))}
      </div>

      {/* Create Estimate Form */}
      {showCreate && (
        <Card style={{ marginBottom: 24, border: `1px solid ${COLORS.accent}30` }}>
          <h3 style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>New Estimate</h3>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <input placeholder="Client name" value={newEst.client} onChange={e => setNewEst({...newEst, client: e.target.value})}
              style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 14, outline: "none" }} />
            <input placeholder="Project description" value={newEst.project} onChange={e => setNewEst({...newEst, project: e.target.value})}
              style={{ padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 14, outline: "none" }} />
          </div>
          <div style={{ fontSize: 12, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Line Items</div>
          {newEst.items.map((item, i) => {
            const costMatch = COST_REFERENCE.find(r => item.desc.toLowerCase().includes(r.keyword));
            const materialCost = costMatch ? (item.qty * costMatch.costPer) : null;
            return (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 80px 120px 100px", gap: 8 }}>
                <input placeholder="Description (e.g. HMA base course)" value={item.desc} onChange={e => updateItem(i, "desc", e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 13, outline: "none" }} />
                <input placeholder="Qty" type="number" value={item.qty || ""} onChange={e => updateItem(i, "qty", e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 13, outline: "none" }} />
                <input placeholder="Client Rate $" type="number" value={item.rate || ""} onChange={e => updateItem(i, "rate", e.target.value)}
                  style={{ padding: "8px 12px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 13, outline: "none" }} />
                <div style={{ display: "flex", alignItems: "center", fontSize: 12, fontFamily: FONTS.mono, fontWeight: 600, color: (item.qty * item.rate - (materialCost || 0)) > 0 ? COLORS.success : COLORS.textMuted }}>
                  {materialCost !== null ? `+$${(item.qty * item.rate - materialCost).toLocaleString()}` : ""}
                </div>
              </div>
              {/* Cost intelligence hint */}
              {costMatch && item.qty > 0 && (
                <div style={{
                  marginTop: 4, padding: "6px 10px", borderRadius: 6,
                  background: `${COLORS.info}08`, border: `1px solid ${COLORS.info}15`,
                  fontSize: 11, color: COLORS.info, display: "flex", gap: 12, flexWrap: "wrap",
                }}>
                  <span>Your cost: <strong>${materialCost?.toLocaleString()}</strong> ({item.qty} × ${costMatch.costPer}/{costMatch.unit})</span>
                  <span>Coverage: ~{(item.qty * costMatch.coversSqft).toLocaleString()} sqft</span>
                  <span>Margin: <strong style={{ color: (item.qty * item.rate - materialCost) > 0 ? COLORS.success : COLORS.danger }}>
                    {item.rate > 0 ? Math.round(((item.qty * item.rate - materialCost) / (item.qty * item.rate)) * 100) : 0}%
                  </strong></span>
                </div>
              )}
            </div>
            );
          })}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, flexWrap: "wrap", gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={addItem} icon="add">Add Line Item</Button>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>
                Material cost: ${newEst.items.reduce((s, item) => {
                  const m = COST_REFERENCE.find(r => item.desc.toLowerCase().includes(r.keyword));
                  return s + (m ? item.qty * m.costPer : 0);
                }, 0).toLocaleString()}
              </div>
              <div style={{ fontFamily: FONTS.display, fontSize: 20, fontWeight: 700, color: COLORS.accent }}>
                Client Total: ${estTotal.toLocaleString()}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <Button variant="ghost" onClick={() => {}}>Save Draft</Button>
            <Button variant="ghost" icon="email" onClick={() => {}}>Send PDF via Email</Button>
            <Button icon="send" onClick={() => {}}>Send PDF via Text</Button>
          </div>
        </Card>
      )}

      {tab === "estimates" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>
            <strong>Tip:</strong> Estimates can be based on past jobs. Select a past estimate to use as a template.
          </div>
          {ESTIMATES.map(est => (
            <Card key={est.id} style={{ padding: 16, cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>{est.id}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{est.project}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{est.client} · {est.date}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, color: COLORS.accent }}>${est.amount.toLocaleString()}</div>
                  <Badge color={statusColors[est.status]} small>{est.status}</Badge>
                </div>
              </div>
              {sendingEst === est.id && (
                <div style={{
                  marginTop: 12, padding: 14, borderRadius: 10,
                  background: `${COLORS.accent}08`, border: `1px solid ${COLORS.accent}20`,
                }}>
                  <div style={{ fontSize: 12, fontFamily: FONTS.mono, color: COLORS.accent, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Send Estimate to {est.client}</div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    <select style={{ flex: 1, padding: "8px 12px", borderRadius: 6, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 13 }}>
                      <option>Send as Text (SMS/iMessage)</option>
                      <option>Send via Email</option>
                      <option>Send via WhatsApp</option>
                    </select>
                  </div>
                  <input placeholder="Phone or email..." defaultValue="" style={{
                    width: "100%", padding: "8px 12px", borderRadius: 6, marginBottom: 8,
                    border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 13, outline: "none",
                  }} />
                  <p style={{ fontSize: 11, color: COLORS.textSecondary, marginBottom: 8 }}>
                    PDF will include your company logo, itemized breakdown, terms, and a professional cover page.
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <Button size="sm" icon="send">Send Now</Button>
                    <Button size="sm" variant="ghost" onClick={() => setSendingEst(null)}>Cancel</Button>
                  </div>
                </div>
              )}
              {sendingEst !== est.id && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Button variant="ghost" size="sm" icon="pdf" onClick={() => setSendingEst(est.id)}>Send PDF</Button>
                  <Button variant="ghost" size="sm" icon="email" onClick={() => setSendingEst(est.id)}>Email</Button>
                  <Button variant="ghost" size="sm" icon="send" onClick={() => setSendingEst(est.id)}>Text</Button>
                  <Button variant="ghost" size="sm" icon="edit">Duplicate</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === "invoices" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {INVOICES.map(inv => (
            <Card key={inv.id} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <div style={{ fontFamily: FONTS.mono, fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>{inv.id}</div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{inv.project}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{inv.client} · Due: {inv.dueDate}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 700, color: inv.status === "paid" ? COLORS.success : COLORS.accent }}>
                    ${inv.amount.toLocaleString()}
                  </div>
                  <Badge color={statusColors[inv.status]} small>{inv.status}</Badge>
                </div>
              </div>
              {inv.status !== "paid" && (
                <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                  <Button size="sm" icon="send">Send Payment Link</Button>
                  <Button variant="ghost" size="sm" icon="email">Send Reminder</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {tab === "stripe" && (
        <Card>
          <div style={{ textAlign: "center", padding: isMobile ? 20 : 40 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 16, margin: "0 auto 16px",
              background: "#635BFF15", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#635BFF"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg>
            </div>
            <h3 style={{ fontFamily: FONTS.display, fontSize: 20, fontWeight: 600, marginBottom: 8 }}>Stripe Connect</h3>
            <p style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 24, maxWidth: 400, margin: "0 auto 24px" }}>
              Connect your Stripe account to accept credit card payments, send payment links, and auto-reconcile invoices.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 320, margin: "0 auto" }}>
              <input placeholder="Stripe API Key (sk_live_...)" style={{
                padding: "12px 16px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
                background: COLORS.surface, color: COLORS.text, fontSize: 13, outline: "none",
                fontFamily: FONTS.mono,
              }} />
              <Button style={{ background: "#635BFF", border: "none" }}>Connect Stripe</Button>
              <p style={{ fontSize: 11, color: COLORS.textMuted }}>
                You can add your API key later. Find it at dashboard.stripe.com/apikeys
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

// ─── LEAD INTELLIGENCE VIEW ─────────────────────────────
const LeadsView = ({ isMobile }) => {
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewTab, setViewTab] = useState("leads"); // "leads" | "sources" | "geofence"
  const [sourceCategory, setSourceCategory] = useState("all");
  const [geoFence, setGeoFence] = useState({
    targetTitle: "", targetOrg: "", location: "", radiusMiles: 1,
    platform: "meta", budget: 30, duration: 7,
    adCopy: "Award-winning paving contractor serving Central Indiana. Licensed, insured, competitive pricing.",
  });

  const filtered = typeFilter === "All" ? LEADS : LEADS.filter(l => l.type === typeFilter);
  const typeColors = { Bond: COLORS.info, RFP: COLORS.accent, Permit: COLORS.success };
  const statusColors = { new: COLORS.accent, reviewing: COLORS.info, contacted: COLORS.success, archived: COLORS.textMuted };

  const allSources = [...DATA_SOURCES.federal, ...DATA_SOURCES.procurement, ...DATA_SOURCES.midwest_state, ...DATA_SOURCES.permits_local];
  const filteredSources = sourceCategory === "all" ? allSources
    : sourceCategory === "federal" ? DATA_SOURCES.federal
    : sourceCategory === "procurement" ? DATA_SOURCES.procurement
    : sourceCategory === "midwest" ? DATA_SOURCES.midwest_state
    : DATA_SOURCES.permits_local;

  const priorityColors = { Critical: COLORS.danger, High: COLORS.accent, Medium: COLORS.info, Low: COLORS.textMuted };

  if (viewTab === "sources") {
    return (
      <div style={{ padding: isMobile ? 16 : 32, overflowY: "auto", height: "100vh" }}>
        <SectionHeader
          title="Lead Data Sources & Scraping Configuration"
          subtitle={`${allSources.length} sources configured — Auto-scraping every 24 hours`}
          action={
            <div style={{ display: "flex", gap: 8 }}>
              <Button variant="secondary" size="sm" onClick={() => setViewTab("leads")}>← Back to Leads</Button>
              <Button icon="search" size="sm">Run Full Scan Now</Button>
            </div>
          }
        />

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
          {[
            { label: "National / Federal", count: DATA_SOURCES.federal.length, key: "federal", color: COLORS.info, desc: "EMMA, SAM.gov, FHWA, Bond Buyer" },
            { label: "Procurement Platforms", count: DATA_SOURCES.procurement.length, key: "procurement", color: COLORS.accent, desc: "BidNet, DemandStar, GovWin" },
            { label: "Midwest State DOTs", count: DATA_SOURCES.midwest_state.length, key: "midwest", color: COLORS.success, desc: "IN, OH, IL, MI, KY, WI, MN, IA, MO" },
            { label: "Permits & Municipal", count: DATA_SOURCES.permits_local.length, key: "local", color: COLORS.warning, desc: "County recorders, OpenGov" },
          ].map((cat, i) => (
            <Card key={cat.key} className="hover-lift" onClick={() => setSourceCategory(sourceCategory === cat.key ? "all" : cat.key)}
              style={{ cursor: "pointer", border: `1px solid ${sourceCategory === cat.key ? cat.color : COLORS.border}`, animationDelay: `${i * 0.06}s` }}>
              <div style={{ fontSize: 28, fontWeight: 700, fontFamily: FONTS.display, color: cat.color }}>{cat.count}</div>
              <div style={{ fontFamily: FONTS.display, fontSize: 14, fontWeight: 600, marginTop: 4 }}>{cat.label}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{cat.desc}</div>
            </Card>
          ))}
        </div>

        <Card style={{ padding: "12px 16px", marginBottom: 20, background: `${COLORS.info}08`, border: `1px solid ${COLORS.info}25` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Badge color={COLORS.success}>SCANNER ACTIVE</Badge>
            <span style={{ fontSize: 13, color: COLORS.textSecondary }}>
              Auto-scraping runs daily at 2:00 AM EST. Search terms: <span style={{ fontFamily: FONTS.mono, color: COLORS.accent }}>road, paving, asphalt, driveway, parking lot, resurfacing, infrastructure, highway, HMA, sealcoat, overlay</span>
            </span>
          </div>
        </Card>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filteredSources.map((src, i) => (
            <Card key={src.id} className="fade-in" style={{ padding: 16, animationDelay: `${i * 0.03}s` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Badge color={priorityColors[src.priority]} small>{src.priority}</Badge>
                    <Badge color={typeColors[src.type]} small>{src.type}</Badge>
                    {src.free ? <Badge color={COLORS.success} small>FREE</Badge> : <Badge color={COLORS.warning} small>PAID</Badge>}
                    {src.apiAvailable && <Badge color={COLORS.info} small>API</Badge>}
                    <Badge color={COLORS.textMuted} small>{src.category}</Badge>
                  </div>
                  <h3 style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600 }}>{src.name}</h3>
                  <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4, lineHeight: 1.5 }}>{src.description}</p>
                  <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {src.searchTerms.map(term => (
                      <span key={term} style={{
                        padding: "2px 8px", borderRadius: 4, fontSize: 10, fontFamily: FONTS.mono,
                        background: `${COLORS.accent}12`, color: COLORS.accent, border: `1px solid ${COLORS.accent}25`,
                      }}>{term}</span>
                    ))}
                  </div>
                </div>
                <div style={{ textAlign: "right", marginLeft: 16, flexShrink: 0 }}>
                  <div style={{ fontSize: 10, fontFamily: FONTS.mono, color: COLORS.textMuted, marginBottom: 4 }}>SCAN FREQ</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.text }}>{src.frequency}</div>
                  {src.url !== "various" && (
                    <div style={{ fontSize: 10, color: COLORS.info, marginTop: 8, fontFamily: FONTS.mono, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {src.url}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? 16 : 32, overflowY: "auto", height: "100vh" }}>
      <SectionHeader
        title="Lead Intelligence Center"
        subtitle="Auto-scraped bonds, permits, and RFPs from public sources"
        action={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Badge color={COLORS.success}>SCANNER ACTIVE</Badge>
            <Button icon="search" size="sm">Manual Search</Button>
          </div>
        }
      />

      {/* Tab Bar */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: `1px solid ${COLORS.border}` }}>
        {[["leads", "Pipeline"], ["sources", `Data Sources (${allSources.length})`], ["geofence", "Geo-Fence Targeting"]].map(([id, label]) => (
          <button key={id} onClick={() => setViewTab(id)} style={{
            padding: "10px 20px", border: "none", cursor: "pointer",
            background: "transparent", fontFamily: FONTS.body, fontSize: 13, fontWeight: 500,
            color: viewTab === id ? COLORS.accent : COLORS.textMuted,
            borderBottom: viewTab === id ? `2px solid ${COLORS.accent}` : "2px solid transparent",
          }}>{label}</button>
        ))}
      </div>

      {viewTab === "geofence" && (
        <Card>
          <h3 style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Geo-Fence Decision Makers</h3>
          <p style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 20 }}>
            Target government officials, project managers, and procurement officers at their offices. Automatically creates Meta/Facebook ad campaigns with location-based targeting.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Target Configuration</div>
              {[
                ["targetTitle", "Target Job Title", "e.g. County Engineer, Public Works Director"],
                ["targetOrg", "Organization", "e.g. Marion County DOT, City of Indianapolis"],
                ["location", "Office Address to Geo-Fence", "e.g. 200 E Washington St, Indianapolis, IN"],
              ].map(([key, label, placeholder]) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>{label}</div>
                  <input placeholder={placeholder} value={geoFence[key]} onChange={e => setGeoFence({...geoFence, [key]: e.target.value})}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 13, outline: "none" }} />
                </div>
              ))}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Radius (miles)</div>
                  <input type="number" value={geoFence.radiusMiles} onChange={e => setGeoFence({...geoFence, radiusMiles: Number(e.target.value)})}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 13, outline: "none" }} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Duration (days)</div>
                  <input type="number" value={geoFence.duration} onChange={e => setGeoFence({...geoFence, duration: Number(e.target.value)})}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 13, outline: "none" }} />
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Meta / Facebook Ad Setup</div>
              <div style={{ padding: 16, borderRadius: 10, background: `${COLORS.info}08`, border: `1px solid ${COLORS.info}20`, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.info }}>Meta Ads Manager</span>
                  <Badge color={COLORS.info} small>AUTO-FILL</Badge>
                </div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, lineHeight: 1.6 }}>
                  The app will auto-populate Meta Ads Manager fields:<br/>
                  • <strong>Campaign Objective:</strong> Awareness → Reach<br/>
                  • <strong>Audience Location:</strong> Drop pin + {geoFence.radiusMiles} mi radius<br/>
                  • <strong>Job Title Targeting:</strong> {geoFence.targetTitle || "—"}<br/>
                  • <strong>Employer Targeting:</strong> {geoFence.targetOrg || "—"}<br/>
                  • <strong>Budget:</strong> ${geoFence.budget}/day × {geoFence.duration} days<br/>
                  • <strong>Total Spend:</strong> ${geoFence.budget * geoFence.duration}
                </div>
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Daily Budget ($)</div>
                <input type="number" value={geoFence.budget} onChange={e => setGeoFence({...geoFence, budget: Number(e.target.value)})}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Ad Copy</div>
                <textarea value={geoFence.adCopy} onChange={e => setGeoFence({...geoFence, adCopy: e.target.value})} rows={3}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 13, outline: "none", resize: "vertical" }} />
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                <Button>Launch Geo-Fence Campaign</Button>
                <Button variant="ghost">Preview Ad</Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {viewTab === "leads" && (
      <>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { type: "Bond", icon: "money", desc: "Infrastructure bonds with road/paving allocations", count: LEADS.filter(l => l.type === "Bond").length },
          { type: "RFP", icon: "projects", desc: "Procurement requests for paving services", count: LEADS.filter(l => l.type === "RFP").length },
          { type: "Permit", icon: "edit", desc: "Building permits for road & driveway work", count: LEADS.filter(l => l.type === "Permit").length },
        ].map((t, i) => (
          <Card key={t.type} onClick={() => setTypeFilter(typeFilter === t.type ? "All" : t.type)}
            className="hover-lift" style={{
              cursor: "pointer", animationDelay: `${i * 0.08}s`,
              border: `1px solid ${typeFilter === t.type ? typeColors[t.type] : COLORS.border}`,
            }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ padding: 8, borderRadius: 8, background: `${typeColors[t.type]}15` }}>
                <Icon name={t.icon} size={20} color={typeColors[t.type]} />
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, fontFamily: FONTS.display, color: typeColors[t.type] }}>{t.count}</div>
            </div>
            <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600, marginTop: 12 }}>{t.type}s</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{t.desc}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : (selectedLead ? "1fr 400px" : "1fr"), gap: isMobile ? 12 : 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((lead, i) => (
            <Card key={lead.id} onClick={() => setSelectedLead(lead)}
              className="hover-lift" style={{
                cursor: "pointer", padding: 16, animationDelay: `${i * 0.06}s`,
                border: `1px solid ${selectedLead?.id === lead.id ? COLORS.accent : COLORS.border}`,
              }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <Badge color={typeColors[lead.type]}>{lead.type}</Badge>
                    <Badge color={statusColors[lead.status]} small>{lead.status}</Badge>
                    {lead.deadline && <Badge color={COLORS.danger} small>Due {lead.deadline}</Badge>}
                  </div>
                  <h3 style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{lead.title}</h3>
                  <p style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.5, marginBottom: 8 }}>{lead.description}</p>
                  <div style={{ display: "flex", gap: 16, fontSize: 12, color: COLORS.textMuted }}>
                    <span>📍 {lead.location}</span>
                    <span>💰 {lead.amount}</span>
                    <span>📅 {lead.date}</span>
                    <span style={{ fontSize: 11 }}>Source: {lead.source}</span>
                  </div>
                  <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                    {lead.tags.map(tag => <Badge key={tag} color={COLORS.textMuted} small>{tag}</Badge>)}
                  </div>
                </div>
                <div style={{ textAlign: "center", padding: "8px 16px", background: `${COLORS.success}10`, borderRadius: 8, marginLeft: 16 }}>
                  <div style={{ fontSize: 28, fontWeight: 700, fontFamily: FONTS.display, color: lead.relevance >= 90 ? COLORS.success : COLORS.accent }}>{lead.relevance}</div>
                  <div style={{ fontSize: 9, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1 }}>MATCH</div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {selectedLead && (
          <Card className="fade-in" style={{ position: "sticky", top: 32, height: "fit-content" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600 }}>Lead Details</h3>
              <button onClick={() => setSelectedLead(null)} style={{ background: "none", border: "none", cursor: "pointer", color: COLORS.textMuted }}>
                <Icon name="close" size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
              <div style={{ padding: 12, background: COLORS.surface, borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontFamily: FONTS.mono, color: COLORS.textMuted, marginBottom: 4, letterSpacing: 1 }}>LEAD ID</div>
                <div style={{ fontWeight: 600 }}>{selectedLead.id}</div>
              </div>
              <div style={{ padding: 12, background: COLORS.surface, borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontFamily: FONTS.mono, color: COLORS.textMuted, marginBottom: 4, letterSpacing: 1 }}>ESTIMATED VALUE</div>
                <div style={{ fontWeight: 700, fontSize: 18, fontFamily: FONTS.display, color: COLORS.accent }}>{selectedLead.amount}</div>
              </div>
              <div style={{ padding: 12, background: COLORS.surface, borderRadius: 8 }}>
                <div style={{ fontSize: 10, fontFamily: FONTS.mono, color: COLORS.textMuted, marginBottom: 4, letterSpacing: 1 }}>DATA SOURCE</div>
                <div>{selectedLead.source}</div>
              </div>
              {selectedLead.deadline && (
                <div style={{ padding: 12, background: `${COLORS.danger}08`, borderRadius: 8, border: `1px solid ${COLORS.danger}25` }}>
                  <div style={{ fontSize: 10, fontFamily: FONTS.mono, color: COLORS.danger, marginBottom: 4, letterSpacing: 1 }}>DEADLINE</div>
                  <div style={{ fontWeight: 600, color: COLORS.danger }}>{selectedLead.deadline}</div>
                </div>
              )}
            </div>

            <div style={{ marginTop: 16, fontSize: 12, fontWeight: 600, color: COLORS.textMuted, fontFamily: FONTS.mono, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>Recommended Actions</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {selectedLead.type === "Bond" && (
                <>
                  <div style={{ padding: 10, background: `${COLORS.info}08`, borderRadius: 6, fontSize: 12, color: COLORS.textSecondary }}>→ Contact municipality public works department</div>
                  <div style={{ padding: 10, background: `${COLORS.info}08`, borderRadius: 6, fontSize: 12, color: COLORS.textSecondary }}>→ Monitor for upcoming RFPs related to this bond</div>
                  <div style={{ padding: 10, background: `${COLORS.info}08`, borderRadius: 6, fontSize: 12, color: COLORS.textSecondary }}>→ Prepare bid package for likely project scope</div>
                </>
              )}
              {selectedLead.type === "RFP" && (
                <>
                  <div style={{ padding: 10, background: `${COLORS.accent}08`, borderRadius: 6, fontSize: 12, color: COLORS.textSecondary }}>→ Download full RFP documents</div>
                  <div style={{ padding: 10, background: `${COLORS.accent}08`, borderRadius: 6, fontSize: 12, color: COLORS.textSecondary }}>→ Schedule site visit before deadline</div>
                  <div style={{ padding: 10, background: `${COLORS.accent}08`, borderRadius: 6, fontSize: 12, color: COLORS.textSecondary }}>→ Prepare cost estimate and proposal</div>
                </>
              )}
              {selectedLead.type === "Permit" && (
                <>
                  <div style={{ padding: 10, background: `${COLORS.success}08`, borderRadius: 6, fontSize: 12, color: COLORS.textSecondary }}>→ Contact property owner or developer</div>
                  <div style={{ padding: 10, background: `${COLORS.success}08`, borderRadius: 6, fontSize: 12, color: COLORS.textSecondary }}>→ Request to bid on paving scope</div>
                  <div style={{ padding: 10, background: `${COLORS.success}08`, borderRadius: 6, fontSize: 12, color: COLORS.textSecondary }}>→ Prepare competitive quote package</div>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <Button size="sm" style={{ flex: 1, justifyContent: "center" }}>Take Action</Button>
              <Button variant="secondary" size="sm">Archive</Button>
            </div>
          </Card>
        )}
      </div>
      </>
      )}
    </div>
  );
};

// ─── INTEGRATIONS VIEW (EMAIL / CALENDAR) ────────────────
const IntegrationsView = ({ isMobile }) => {
  const [activeService, setActiveService] = useState(null);
  const [emailTab, setEmailTab] = useState("inbox");
  const [phoneLines] = useState(APP_PHONE_LINES);
  const [newPhone, setNewPhone] = useState({ label: "", platform: "twilio" });

  const services = [
    {
      id: "outlook", name: "Microsoft Outlook", icon: "email",
      description: "Connect Outlook Mail & Calendar via Microsoft Graph API",
      color: "#0078D4", connected: true,
      scopes: ["Mail.Read", "Mail.Send", "Calendars.ReadWrite", "Contacts.Read"],
      features: ["Read/send emails", "Calendar sync", "Contact lookup", "Meeting scheduling"],
    },
    {
      id: "gmail", name: "Gmail & Google Calendar", icon: "email",
      description: "Connect Gmail & Google Calendar via Google Workspace API",
      color: "#EA4335", connected: false,
      scopes: ["gmail.readonly", "gmail.send", "calendar.events", "contacts.readonly"],
      features: ["Read/send emails", "Calendar sync", "Contact lookup", "Meeting scheduling"],
    },
  ];

  const labelColors = { RFP: COLORS.danger, Client: COLORS.success, Vendor: COLORS.info, Internal: COLORS.accent, Lead: COLORS.warning };

  // Email + Calendar unified view
  if (activeService) {
    const service = services.find(s => s.id === activeService);
    return (
      <div style={{ padding: isMobile ? 16 : 32, overflowY: "auto", height: "100vh" }}>
        <button onClick={() => setActiveService(null)}
          style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", color: COLORS.textMuted, fontSize: 13, cursor: "pointer", marginBottom: 20, fontFamily: FONTS.body }}>
          ← Back to Integrations
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: `${service.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon name="email" size={24} color={service.color} />
          </div>
          <div>
            <h1 style={{ fontFamily: FONTS.display, fontSize: 28, fontWeight: 700 }}>{service.name}</h1>
            <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
              <Badge color={service.connected ? COLORS.success : COLORS.textMuted}>{service.connected ? "CONNECTED" : "NOT CONNECTED"}</Badge>
              {service.connected && <Badge color={COLORS.info} small>SYNCING</Badge>}
            </div>
          </div>
        </div>

        {!service.connected ? (
          <Card style={{ textAlign: "center", padding: 40 }}>
            <div style={{ width: 64, height: 64, borderRadius: 16, background: `${service.color}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Icon name="link" size={32} color={service.color} />
            </div>
            <h2 style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, marginBottom: 8 }}>Connect {service.name}</h2>
            <p style={{ color: COLORS.textSecondary, fontSize: 14, maxWidth: 400, margin: "0 auto 8px", lineHeight: 1.5 }}>
              Authorize Paving 123 to access your {service.id === "gmail" ? "Google" : "Microsoft"} account for email and calendar integration.
            </p>
            <p style={{ color: COLORS.textMuted, fontSize: 12, marginBottom: 24 }}>
              OAuth 2.0 — Your credentials are never stored
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 24 }}>
              <Button style={{ background: service.color }}>
                Sign in with {service.id === "gmail" ? "Google" : "Microsoft"}
              </Button>
            </div>
            <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.mono }}>
              Scopes requested: {service.scopes.join(", ")}
            </div>
          </Card>
        ) : (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <Button variant={emailTab === "inbox" ? "primary" : "secondary"} size="sm" icon="email" onClick={() => setEmailTab("inbox")}>Inbox</Button>
              <Button variant={emailTab === "calendar" ? "primary" : "secondary"} size="sm" icon="calendar" onClick={() => setEmailTab("calendar")}>Calendar</Button>
              <Button variant={emailTab === "compose" ? "primary" : "secondary"} size="sm" icon="edit" onClick={() => setEmailTab("compose")}>Compose</Button>
            </div>

            {emailTab === "inbox" && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
                {EMAIL_DATA.map((email, i) => (
                  <Card key={email.id} className="fade-in hover-lift" style={{
                    padding: 14, cursor: "pointer", animationDelay: `${i * 0.04}s`,
                    borderLeft: email.unread ? `3px solid ${COLORS.accent}` : `3px solid transparent`,
                    background: email.unread ? `${COLORS.accent}05` : COLORS.card,
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontWeight: email.unread ? 700 : 400, fontSize: 13 }}>{email.from}</span>
                          <Badge color={labelColors[email.label] || COLORS.textMuted} small>{email.label}</Badge>
                          {email.important && <Icon name="star" size={12} color={COLORS.accent} />}
                        </div>
                        <div style={{ fontSize: 14, fontWeight: email.unread ? 600 : 400, color: COLORS.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {email.subject}
                        </div>
                        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>{email.email}</div>
                      </div>
                      <div style={{ fontSize: 11, color: COLORS.textMuted, fontFamily: FONTS.mono, whiteSpace: "nowrap", marginLeft: 16 }}>
                        {email.date}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {emailTab === "calendar" && (
              <div>
                <Card style={{ marginBottom: 16, background: `${COLORS.accent}08`, border: `1px solid ${COLORS.accent}25` }}>
                  <div style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>📅 Today — Thursday, February 26, 2026</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>5 events scheduled</div>
                </Card>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {CALENDAR_EVENTS.map((evt, i) => (
                    <Card key={evt.id} className="fade-in" style={{ padding: 14, borderLeft: `3px solid ${evt.color}`, animationDelay: `${i * 0.05}s` }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{evt.title}</span>
                            <Badge color={evt.color} small>{evt.type}</Badge>
                          </div>
                          <div style={{ display: "flex", gap: 12, fontSize: 12, color: COLORS.textMuted }}>
                            <span>🕐 {evt.time}</span>
                            <span>👥 {evt.crew}</span>
                          </div>
                        </div>
                        <Badge color={evt.date === "today" ? COLORS.accent : COLORS.textMuted} small>{evt.date}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
                <Card style={{ marginTop: 16, padding: 14, border: `1px dashed ${COLORS.border}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="add" size={16} color={COLORS.textMuted} />
                    <span style={{ fontSize: 13, color: COLORS.textMuted }}>Quick add event — syncs to {service.name}</span>
                  </div>
                </Card>
              </div>
            )}

            {emailTab === "compose" && (
              <Card>
                <h3 style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600, marginBottom: 16 }}>New Email</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, display: "block", marginBottom: 4 }}>TO</label>
                    <input placeholder="Recipient email..." style={{
                      width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
                      background: COLORS.surface, color: COLORS.text, fontSize: 13, outline: "none",
                    }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, display: "block", marginBottom: 4 }}>SUBJECT</label>
                    <input placeholder="Email subject..." style={{
                      width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
                      background: COLORS.surface, color: COLORS.text, fontSize: 13, outline: "none",
                    }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, display: "block", marginBottom: 4 }}>MESSAGE</label>
                    <textarea rows={8} placeholder="Write your email..." style={{
                      width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
                      background: COLORS.surface, color: COLORS.text, fontSize: 13, outline: "none", resize: "vertical",
                    }} />
                  </div>
                  <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                    <Button variant="secondary" size="sm">Save Draft</Button>
                    <Button icon="send" size="sm">Send via {service.name}</Button>
                  </div>
                </div>
              </Card>
            )}
          </>
        )}
      </div>
    );
  }

  // Integration hub main view
  return (
    <div style={{ padding: isMobile ? 16 : 32, overflowY: "auto", height: "100vh" }}>
      <SectionHeader title="Integrations" subtitle="Connect email, calendar, and external services" />

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Email & Calendar</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 10 : 16 }}>
          {services.map((svc, i) => (
            <Card key={svc.id} className="hover-lift" onClick={() => setActiveService(svc.id)}
              style={{ cursor: "pointer", animationDelay: `${i * 0.08}s` }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: `${svc.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon name="email" size={28} color={svc.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 600 }}>{svc.name}</h3>
                    <Badge color={svc.connected ? COLORS.success : COLORS.textMuted}>{svc.connected ? "Connected" : "Not Connected"}</Badge>
                  </div>
                  <p style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 4 }}>{svc.description}</p>
                  <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {svc.features.map(f => <Badge key={f} color={COLORS.textMuted} small>{f}</Badge>)}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Phone & Messaging */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Phone & Messaging</div>
        <Card>
          <p style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 }}>
            Virtual phone numbers for the app. Add these to WhatsApp groups, iMessage, Signal, or SMS. All messages import into the knowledge base and auto-create checklists.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
            {phoneLines.map(ph => (
              <div key={ph.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: 14, borderRadius: 10, background: COLORS.surface, border: `1px solid ${COLORS.border}`, flexWrap: "wrap", gap: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${COLORS.success}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="phone" size={20} color={COLORS.success} />
                  </div>
                  <div>
                    <div style={{ fontFamily: FONTS.mono, fontSize: 14, fontWeight: 600 }}>{ph.number}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>{ph.label} · {ph.assignedTo}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <Badge color={COLORS.success} small>Active</Badge>
                  <Badge color={COLORS.info} small>{ph.platform}</Badge>
                </div>
              </div>
            ))}
          </div>
          <div style={{ padding: 16, borderRadius: 10, border: `1px dashed ${COLORS.border}`, background: `${COLORS.accent}05` }}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr auto", gap: 10, alignItems: "end" }}>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Label</div>
                <input placeholder="e.g. New Project Line" value={newPhone.label} onChange={e => setNewPhone({...newPhone, label: e.target.value})}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 13, outline: "none" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>Platform</div>
                <select value={newPhone.platform} onChange={e => setNewPhone({...newPhone, platform: e.target.value})}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.surface, color: COLORS.text, fontSize: 13 }}>
                  <option value="twilio">Twilio</option>
                  <option value="whatsapp">WhatsApp Business</option>
                  <option value="signal">Signal</option>
                </select>
              </div>
              <Button icon="add">Provision Number</Button>
            </div>
          </div>
        </Card>
      </div>

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>API Configuration</div>
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 12 : 20 }}>
            <div>
              <h4 style={{ fontFamily: FONTS.display, fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#0078D4" }}>Microsoft Graph API</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Client ID", value: "••••••••-••••-••••-••••-••••••a3f8d2" },
                  { label: "Tenant ID", value: "••••••••-••••-••••-••••-••••••7b1e09" },
                  { label: "Redirect URI", value: "https://app.paving123.com/auth/microsoft/callback" },
                  { label: "API Endpoint", value: "https://graph.microsoft.com/v1.0" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid color-mix(in srgb, ${COLORS.border} 3%, transparent)` }}>
                    <span style={{ fontSize: 12, color: COLORS.textMuted }}>{item.label}</span>
                    <span style={{ fontSize: 11, fontFamily: FONTS.mono, color: COLORS.textSecondary }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 style={{ fontFamily: FONTS.display, fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#EA4335" }}>Google Workspace API</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Client ID", value: "Not configured" },
                  { label: "Client Secret", value: "Not configured" },
                  { label: "Redirect URI", value: "https://app.paving123.com/auth/google/callback" },
                  { label: "API Endpoint", value: "https://gmail.googleapis.com/gmail/v1" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid color-mix(in srgb, ${COLORS.border} 3%, transparent)` }}>
                    <span style={{ fontSize: 12, color: COLORS.textMuted }}>{item.label}</span>
                    <span style={{ fontSize: 11, fontFamily: FONTS.mono, color: item.value === "Not configured" ? COLORS.danger : COLORS.textSecondary }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div>
        <div style={{ fontSize: 12, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>How It Works</div>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12 }}>
          {[
            { step: "1", title: "OAuth 2.0 Auth", desc: "Secure sign-in through Microsoft or Google. No passwords stored. Tokens refresh automatically." },
            { step: "2", title: "Bi-Directional Sync", desc: "Emails tagged with project IDs auto-link to projects. Calendar events sync crew schedules in real-time." },
            { step: "3", title: "Smart Routing", desc: "RFP-related emails auto-flag as leads. Client emails attach to project timelines. Vendor invoices route to inventory." },
          ].map((item, i) => (
            <Card key={i} className="fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${COLORS.accent}15`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.display, fontWeight: 700, color: COLORS.accent, fontSize: 16, marginBottom: 12 }}>{item.step}</div>
              <h4 style={{ fontFamily: FONTS.display, fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{item.title}</h4>
              <p style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.5 }}>{item.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};


// ─── VOICE ASSISTANT FAB ─────────────────────────────────
const VoiceAssistantFAB = ({ onCommand, isMobile }) => {
  const [listening, setListening] = useState(false);
  const [lastHeard, setLastHeard] = useState("");
  const [showToast, setShowToast] = useState(false);

  const startVoice = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setLastHeard("Voice not supported in this browser");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event) => {
      const t = event.results[0][0].transcript.toLowerCase();
      setLastHeard(t);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      if (t.includes("text") || t.includes("message")) onCommand("messages");
      else if (t.includes("project") && !t.includes("map")) onCommand("projects");
      else if (t.includes("map")) onCommand("projectmap");
      else if (t.includes("estimate") || t.includes("bill") || t.includes("invoice")) onCommand("estimates");
      else if (t.includes("crew") || t.includes("fleet")) onCommand("tracking");
      else if (t.includes("lead") || t.includes("bid")) onCommand("leads");
      else if (t.includes("inventory") || t.includes("material")) onCommand("inventory");
      else if (t.includes("home") || t.includes("jane")) onCommand("home");
      else if (t.includes("setting") || t.includes("integration") || t.includes("phone")) onCommand("integrations");
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
  };

  return (
    <>
      {showToast && (
        <div style={{
          position: "fixed", bottom: isMobile ? 90 : 100, right: isMobile ? 16 : 28,
          background: COLORS.surface, border: `1px solid ${COLORS.border}`,
          borderRadius: 12, padding: "10px 16px", zIndex: 200,
          fontSize: 13, color: COLORS.text, boxShadow: "0 4px 20px var(--c-shadow)",
          maxWidth: 280, animation: "fadeIn 0.3s ease-out",
        }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, marginBottom: 2, fontFamily: FONTS.mono }}>JANE HEARD:</div>
          "{lastHeard}"
        </div>
      )}
      <button onClick={startVoice} style={{
        position: "fixed", bottom: isMobile ? 24 : 28, right: isMobile ? 16 : 28,
        width: 56, height: 56, borderRadius: 16, border: "none", cursor: "pointer",
        background: listening ? COLORS.danger : `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 20px ${listening ? COLORS.danger : COLORS.accent}40`,
        zIndex: 200, transition: "all 0.2s",
        animation: listening ? "pulse 1.5s infinite" : "none",
      }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill={listening ? "#fff" : "#000"}>
          <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
        </svg>
      </button>
    </>
  );
};

// ─── MAIN APP ───────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedProject, setSelectedProject] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const isMobile = useIsMobile();

  const toggleTheme = useCallback(() => setIsDark(prev => !prev), []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
  }, [isDark]);

  const handleNav = (tab) => {
    setActiveTab(tab);
    setMobileSidebarOpen(false);
  };

  const renderView = () => {
    const props = { isMobile };
    switch (activeTab) {
      case "home": return <HomeView setActiveTab={handleNav} setSelectedProject={setSelectedProject} {...props} />;
      case "messages": return <MessagesView {...props} />;
      case "projects": return <ProjectsView selectedProject={selectedProject} setSelectedProject={setSelectedProject} {...props} />;
      case "projectmap": return <ProjectMapView {...props} />;
      case "estimates": return <EstimatesView {...props} />;
      case "inventory": return <InventoryView {...props} />;
      case "tracking": return <TrackingView {...props} />;
      case "leads": return <LeadsView {...props} />;
      case "integrations": return <IntegrationsView {...props} />;
      default: return <HomeView setActiveTab={handleNav} setSelectedProject={setSelectedProject} {...props} />;
    }
  };

  const tabLabels = { home: "Home", messages: "Comms Portal", projects: "Projects", projectmap: "Project Map", estimates: "Estimates", inventory: "Inventory", tracking: "Fleet & Crew", leads: "Lead Intel", integrations: "Integrations" };

  return (
    <ThemeContext.Provider value={{ isDark, toggle: toggleTheme }}>
      <GlobalStyles />
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: COLORS.bg }}>
        {/* Desktop sidebar */}
        {!isMobile && (
          <Sidebar activeTab={activeTab} setActiveTab={handleNav} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
        )}
        {/* Mobile overlay + sidebar */}
        {isMobile && mobileSidebarOpen && (
          <>
            <div onClick={() => setMobileSidebarOpen(false)} style={{
              position: "fixed", inset: 0, zIndex: 99, background: "var(--c-overlay)",
            }} />
            <div style={{
              position: "fixed", left: 0, top: 0, zIndex: 100, width: 280, height: "100vh",
              background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`,
              animation: "slideInLeft 0.25s ease-out",
            }}>
              <Sidebar activeTab={activeTab} setActiveTab={handleNav} collapsed={false} setCollapsed={() => {}} />
            </div>
          </>
        )}
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Mobile header */}
          {isMobile && (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px", background: COLORS.surface,
              borderBottom: `1px solid ${COLORS.border}`, flexShrink: 0,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button onClick={() => setMobileSidebarOpen(true)} style={{
                  background: "none", border: "none", color: COLORS.text,
                  cursor: "pointer", padding: 4, display: "flex",
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/></svg>
                </button>
                <div style={{
                  width: 28, height: 28, borderRadius: 7, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.display,
                  fontWeight: 800, fontSize: 12, color: "#000", flexShrink: 0,
                }}>P</div>
                <span style={{ fontFamily: FONTS.display, fontWeight: 600, fontSize: 15 }}>{tabLabels[activeTab]}</span>
              </div>
              <ThemeToggle compact />
            </div>
          )}
          <main style={{ flex: 1, overflow: "hidden" }}>
            {renderView()}
          </main>
        </div>
      </div>
      {/* Voice Assistant FAB */}
      <VoiceAssistantFAB onCommand={handleNav} isMobile={isMobile} />
    </ThemeContext.Provider>
  );
}
