import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

const COLORS = {
  bg: "#0F1114",
  surface: "#1A1D23",
  surfaceHover: "#22262E",
  card: "#1E2128",
  border: "#2A2E36",
  borderLight: "#363B45",
  accent: "#F59E0B",
  accentDark: "#D97706",
  accentLight: "#FBBF24",
  success: "#10B981",
  danger: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  text: "#F1F5F9",
  textSecondary: "#94A3B8",
  textMuted: "#64748B",
  asphalt: "#2D3139",
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
  { id: 1, name: "Hot Mix Asphalt (HMA)", unit: "tons", qty: 145, minQty: 50, category: "Materials", cost: 85 },
  { id: 2, name: "Cold Patch Mix", unit: "bags", qty: 220, minQty: 100, category: "Materials", cost: 12 },
  { id: 3, name: "Tack Coat Emulsion", unit: "gallons", qty: 380, minQty: 150, category: "Materials", cost: 4.5 },
  { id: 4, name: "Sealcoat", unit: "gallons", qty: 520, minQty: 200, category: "Materials", cost: 3.75 },
  { id: 5, name: "Crushed Aggregate Base", unit: "tons", qty: 88, minQty: 30, category: "Materials", cost: 28 },
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

const MESSAGES = [
  { id: 1, channel: "alpha-crew", user: "Marcus Rivera", avatar: "MR", text: "On site at Elm Street. Setting up for edge forms today.", time: "7:42 AM", project: "P-1001" },
  { id: 2, channel: "alpha-crew", user: "Jake Thompson", avatar: "JT", text: "Copy that. Dump truck is 20 min out with the forms.", time: "7:45 AM", project: "P-1001" },
  { id: 3, channel: "alpha-crew", user: "DeShawn Williams", avatar: "DW", text: "Sub-base looks good after last night's rain. No pooling.", time: "7:51 AM", project: "P-1001" },
  { id: 4, channel: "bravo-crew", user: "Carlos Mendez", avatar: "CM", text: "Starting zone 5-8 saw cutting this morning at Oak Park.", time: "8:02 AM", project: "P-1002" },
  { id: 5, channel: "bravo-crew", user: "Tommy O'Brien", avatar: "TO", text: "Blade is getting dull. We may need a replacement by noon.", time: "8:15 AM", project: "P-1002" },
  { id: 6, channel: "management", user: "Sarah Chen", avatar: "SC", text: "Maple Grove HOA wants to schedule a site visit for next Tuesday. Anyone available?", time: "8:30 AM", project: "P-1003" },
  { id: 7, channel: "management", user: "Raj Patel", avatar: "RP", text: "I can do the site visit. I'll prepare the estimate template.", time: "8:35 AM", project: "P-1003" },
  { id: 8, channel: "alpha-crew", user: "Marcus Rivera", avatar: "MR", text: "Edge forms are being installed now. Should be done by lunch.", time: "9:12 AM", project: "P-1001" },
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
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: ${COLORS.bg}; font-family: ${FONTS.body}; color: ${COLORS.text}; overflow: hidden; }
    
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: ${COLORS.border}; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: ${COLORS.borderLight}; }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-12px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
    
    .fade-in { animation: fadeIn 0.4s ease-out forwards; }
    .slide-in { animation: slideIn 0.3s ease-out forwards; }
    
    input, textarea { font-family: ${FONTS.body}; }
    
    .glow-amber { box-shadow: 0 0 20px rgba(245, 158, 11, 0.15); }
    .hover-lift { transition: transform 0.2s, box-shadow 0.2s; }
    .hover-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
    
    /* Leaflet dark theme overrides */
    .leaflet-container { background: ${COLORS.bg} !important; border-radius: 12px; }
    .leaflet-control-zoom { border: 1px solid ${COLORS.border} !important; border-radius: 8px !important; overflow: hidden; }
    .leaflet-control-zoom a { background: ${COLORS.surface} !important; color: ${COLORS.text} !important; border-color: ${COLORS.border} !important; width: 32px !important; height: 32px !important; line-height: 32px !important; font-size: 16px !important; }
    .leaflet-control-zoom a:hover { background: ${COLORS.surfaceHover} !important; }
    .leaflet-control-attribution { background: ${COLORS.bg}CC !important; color: ${COLORS.textMuted} !important; font-size: 9px !important; font-family: ${FONTS.mono} !important; border-radius: 4px 0 0 0 !important; }
    .leaflet-control-attribution a { color: ${COLORS.textMuted} !important; }
    .leaflet-popup-content-wrapper { background: ${COLORS.card} !important; color: ${COLORS.text} !important; border-radius: 10px !important; border: 1px solid ${COLORS.border} !important; box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important; }
    .leaflet-popup-tip { background: ${COLORS.card} !important; border: 1px solid ${COLORS.border} !important; }
    .leaflet-popup-close-button { color: ${COLORS.textMuted} !important; font-size: 18px !important; }
    .leaflet-popup-close-button:hover { color: ${COLORS.text} !important; }
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
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
    <div>
      <h2 style={{ fontFamily: FONTS.display, fontSize: 22, fontWeight: 600, letterSpacing: "0.5px", color: COLORS.text }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ─── SIDEBAR ─────────────────────────────────────────────
const Sidebar = ({ activeTab, setActiveTab }) => {
  const navItems = [
    { id: "dashboard", icon: "dashboard", label: "Dashboard" },
    { id: "messages", icon: "messages", label: "Comms Portal", badge: 3 },
    { id: "projects", icon: "projects", label: "Projects" },
    { id: "inventory", icon: "inventory", label: "Inventory" },
    { id: "tracking", icon: "tracking", label: "Fleet & Crew" },
    { id: "leads", icon: "leads", label: "Lead Intel" },
    { id: "integrations", icon: "settings", label: "Integrations" },
  ];

  return (
    <div style={{
      width: 240, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`,
      display: "flex", flexDirection: "column", height: "100vh", flexShrink: 0,
    }}>
      <div style={{ padding: "24px 20px", borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accentDark})`,
            display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTS.display,
            fontWeight: 800, fontSize: 16, color: "#000", letterSpacing: 1,
          }}>P</div>
          <div>
            <div style={{ fontFamily: FONTS.display, fontWeight: 700, fontSize: 18, letterSpacing: 1, lineHeight: 1 }}>PAVING 123</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: FONTS.mono, letterSpacing: 1, marginTop: 2 }}>OPS PLATFORM</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2 }}>
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
              borderRadius: 8, border: "none", cursor: "pointer", fontFamily: FONTS.body,
              fontSize: 14, fontWeight: activeTab === item.id ? 600 : 400, width: "100%", textAlign: "left",
              background: activeTab === item.id ? `${COLORS.accent}15` : "transparent",
              color: activeTab === item.id ? COLORS.accent : COLORS.textSecondary,
              transition: "all 0.2s", position: "relative",
            }}
          >
            {activeTab === item.id && (
              <div style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", width: 3, height: 20, background: COLORS.accent, borderRadius: 2 }} />
            )}
            <Icon name={item.icon} size={18} />
            <span>{item.label}</span>
            {item.badge && (
              <span style={{
                marginLeft: "auto", background: COLORS.danger, color: "#fff", fontSize: 10,
                fontWeight: 700, padding: "1px 6px", borderRadius: 10, fontFamily: FONTS.mono,
              }}>{item.badge}</span>
            )}
          </button>
        ))}
      </nav>

      <div style={{ padding: "16px 12px", borderTop: `1px solid ${COLORS.border}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px" }}>
          <Avatar initials="SC" size={32} color={COLORS.success} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Sarah Chen</div>
            <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: FONTS.mono }}>Project Manager</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── DASHBOARD ──────────────────────────────────────────
const DashboardView = ({ setActiveTab, setSelectedProject }) => {
  const stats = [
    { label: "Active Projects", value: "2", sub: "+1 bidding", icon: "projects", color: COLORS.accent },
    { label: "Crew Members Active", value: "5", sub: "of 8 total", icon: "people", color: COLORS.success },
    { label: "Vehicles In Transit", value: "3", sub: "of 8 total", icon: "truck", color: COLORS.info },
    { label: "New Leads", value: "4", sub: "this week", icon: "leads", color: COLORS.warning },
  ];

  return (
    <div style={{ padding: 32, overflowY: "auto", height: "100vh" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: FONTS.display, fontSize: 32, fontWeight: 700, letterSpacing: "1px" }}>
          Good morning, Sarah
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, marginTop: 4 }}>
          Thursday, February 26, 2026 — Here's your operations overview
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        {stats.map((s, i) => (
          <Card key={i} className="hover-lift" style={{ animationDelay: `${i * 0.08}s` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 12, color: COLORS.textMuted, fontWeight: 500, marginBottom: 8, textTransform: "uppercase", letterSpacing: "1px", fontFamily: FONTS.mono }}>{s.label}</div>
                <div style={{ fontSize: 36, fontWeight: 700, fontFamily: FONTS.display, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>{s.sub}</div>
              </div>
              <div style={{ padding: 10, borderRadius: 10, background: `${s.color}15` }}>
                <Icon name={s.icon} size={22} color={s.color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 32 }}>
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
              <div key={m.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: `1px solid ${COLORS.border}08` }}>
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

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
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
const MessagesView = () => {
  const [activeChannel, setActiveChannel] = useState("alpha-crew");
  const [messages, setMessages] = useState(MESSAGES);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const channels = [
    { id: "alpha-crew", name: "Alpha Crew", members: 3, unread: 2 },
    { id: "bravo-crew", name: "Bravo Crew", members: 2, unread: 1 },
    { id: "management", name: "Management", members: 3, unread: 0 },
    { id: "all-hands", name: "All Hands", members: 8, unread: 0 },
  ];

  const filteredMessages = messages.filter(m => m.channel === activeChannel);

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

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: 260, background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "20px 16px", borderBottom: `1px solid ${COLORS.border}` }}>
          <h2 style={{ fontFamily: FONTS.display, fontSize: 18, fontWeight: 600, letterSpacing: "0.5px" }}>Communications</h2>
          <p style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 2 }}>All messages are logged & reviewable</p>
        </div>
        <div style={{ padding: "12px 8px", flex: 1 }}>
          <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: FONTS.mono, letterSpacing: 1, padding: "8px 10px", textTransform: "uppercase" }}>Channels</div>
          {channels.map(ch => (
            <button key={ch.id} onClick={() => setActiveChannel(ch.id)}
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
          <div style={{ fontSize: 10, color: COLORS.textMuted, fontFamily: FONTS.mono, letterSpacing: 1, padding: "16px 10px 8px", textTransform: "uppercase" }}>Direct Messages</div>
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

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "16px 24px", borderBottom: `1px solid ${COLORS.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ fontFamily: FONTS.display, fontSize: 16, fontWeight: 600 }}>#{channels.find(c => c.id === activeChannel)?.name}</h3>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>{channels.find(c => c.id === activeChannel)?.members} members</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Badge color={COLORS.success} small>LOGGED</Badge>
            <Badge color={COLORS.info} small>AUTO-SYNC</Badge>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 24px" }}>
          <div style={{ padding: "12px 16px", background: `${COLORS.info}10`, borderRadius: 8, border: `1px solid ${COLORS.info}25`, marginBottom: 20, fontSize: 12, color: COLORS.info }}>
            <strong>📋 Auto-Detection Active:</strong> Messages confirming task completion will automatically update project checklists.
          </div>
          {filteredMessages.map((m, i) => (
            <div key={m.id} className="slide-in" style={{ display: "flex", gap: 12, marginBottom: 16, animationDelay: `${i * 0.05}s` }}>
              <Avatar initials={m.avatar} size={36} color={m.channel === "management" ? COLORS.info : COLORS.accent} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
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

        <div style={{ padding: "16px 24px", borderTop: `1px solid ${COLORS.border}` }}>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === "Enter" && sendMessage()}
              placeholder={`Message #${channels.find(c => c.id === activeChannel)?.name}...`}
              style={{
                flex: 1, padding: "12px 16px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
                background: COLORS.surface, color: COLORS.text, fontSize: 14, outline: "none",
              }}
            />
            <Button onClick={sendMessage} icon="send">Send</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── PROJECTS VIEW ──────────────────────────────────────
const ProjectsView = ({ selectedProject, setSelectedProject }) => {
  const [projects, setProjects] = useState(PROJECTS);
  const [newItem, setNewItem] = useState("");

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
      <div style={{ padding: 32, overflowY: "auto", height: "100vh" }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
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

  return (
    <div style={{ padding: 32, overflowY: "auto", height: "100vh" }}>
      <SectionHeader title="Project Management" subtitle="All active, bidding, and completed projects"
        action={<Button icon="add">New Project</Button>} />

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {["All", "In Progress", "Bidding", "Completed"].map(filter => (
          <Button key={filter} variant="secondary" size="sm">{filter}</Button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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
    </div>
  );
};

// ─── INVENTORY VIEW ─────────────────────────────────────
const InventoryView = () => {
  const [filter, setFilter] = useState("All");
  const categories = ["All", "Materials", "Equipment", "Tools", "Safety"];

  const filtered = filter === "All" ? INVENTORY : INVENTORY.filter(i => i.category === filter);
  const totalValue = INVENTORY.reduce((sum, i) => sum + i.qty * i.cost, 0);

  return (
    <div style={{ padding: 32, overflowY: "auto", height: "100vh" }}>
      <SectionHeader title="Inventory Management" subtitle={`${INVENTORY.length} items tracked • Total value: $${totalValue.toLocaleString()}`}
        action={<Button icon="add">Add Item</Button>} />

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {categories.map(cat => (
          <Button key={cat} variant={filter === cat ? "primary" : "secondary"} size="sm" onClick={() => setFilter(cat)}>{cat}</Button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
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
                  borderBottom: `1px solid ${COLORS.border}08`,
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

// ─── CUSTOM MAP MARKERS ─────────────────────────────────
const createVehicleIcon = (status) => {
  const colors = { "on-site": COLORS.success, "in-transit": COLORS.info, idle: COLORS.warning, maintenance: COLORS.danger };
  const color = colors[status] || COLORS.textMuted;
  return L.divIcon({
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
    html: `<div style="
      width:32px;height:32px;border-radius:50%;
      background:${color}22;border:3px solid ${color};
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 12px ${color}55, 0 2px 8px rgba(0,0,0,0.4);
      position:relative;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="${color}"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>
      ${status === "in-transit" ? `<div style="position:absolute;width:100%;height:100%;border-radius:50%;border:2px solid ${color};animation:pulse 2s infinite;top:-2px;left:-2px;"></div>` : ""}
    </div>`,
  });
};

const createEmployeeIcon = (status) => {
  const color = status === "active" ? COLORS.success : status === "break" ? COLORS.warning : COLORS.textMuted;
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
    html: `<div style="
      width:28px;height:28px;border-radius:50%;
      background:${color}22;border:3px solid ${color};
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 0 10px ${color}44, 0 2px 6px rgba(0,0,0,0.3);
    ">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="${color}"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
    </div>`,
  });
};

// Fit map bounds to markers
const MapBoundsUpdater = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }
  }, [positions, map]);
  return null;
};

// ─── FLEET & CREW TRACKING ──────────────────────────────
const TrackingView = () => {
  const [tab, setTab] = useState("vehicles");
  const [selectedItem, setSelectedItem] = useState(null);

  const mapCenter = [39.95, -84.5]; // Midwest center
  const positions = tab === "vehicles"
    ? VEHICLES.map(v => ({ lat: v.lat, lng: v.lng }))
    : EMPLOYEES.filter(e => e.crew !== "HQ").map((e, i) => {
        const crew = VEHICLES.find(v => v.crew === e.crew);
        return { lat: (crew?.lat || 39.77) + (i * 0.002), lng: (crew?.lng || -86.16) + (i * 0.002) };
      });

  return (
    <div style={{ padding: 32, overflowY: "auto", height: "100vh" }}>
      <SectionHeader title="Fleet & Crew Tracking" subtitle="Real-time vehicle and employee locations" />

      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <Button variant={tab === "vehicles" ? "primary" : "secondary"} size="sm" icon="truck" onClick={() => { setTab("vehicles"); setSelectedItem(null); }}>Vehicles ({VEHICLES.length})</Button>
        <Button variant={tab === "employees" ? "primary" : "secondary"} size="sm" icon="people" onClick={() => { setTab("employees"); setSelectedItem(null); }}>Employees ({EMPLOYEES.length})</Button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
        <Card style={{ padding: 0, overflow: "hidden", minHeight: 560, borderRadius: 12 }}>
          <MapContainer
            center={mapCenter}
            zoom={7}
            style={{ width: "100%", height: 560, borderRadius: 12 }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <MapBoundsUpdater positions={positions} />

            {tab === "vehicles" && VEHICLES.map(v => (
              <Marker
                key={v.id}
                position={[v.lat, v.lng]}
                icon={createVehicleIcon(v.status)}
                eventHandlers={{ click: () => setSelectedItem(v) }}
              >
                <Popup>
                  <div style={{ fontFamily: FONTS.body, minWidth: 180 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{v.id} — {v.name}</div>
                    <div style={{ fontSize: 12, color: "#666", marginBottom: 2 }}>{v.type} • {v.crew} Crew</div>
                    <div style={{ fontSize: 12, display: "flex", gap: 12, marginTop: 6 }}>
                      <span>⛽ {v.fuel}%</span>
                      {v.speed > 0 && <span>🏎️ {v.speed} mph</span>}
                      <span style={{ fontWeight: 600, textTransform: "capitalize" }}>{v.status}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {tab === "employees" && EMPLOYEES.filter(e => e.crew !== "HQ").map((emp, i) => {
              const crew = VEHICLES.find(v => v.crew === emp.crew);
              const lat = (crew?.lat || 39.77) + (i * 0.002);
              const lng = (crew?.lng || -86.16) + (i * 0.002);
              return (
                <Marker
                  key={emp.id}
                  position={[lat, lng]}
                  icon={createEmployeeIcon(emp.status)}
                  eventHandlers={{ click: () => setSelectedItem(emp) }}
                >
                  <Popup>
                    <div style={{ fontFamily: FONTS.body, minWidth: 160 }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{emp.name}</div>
                      <div style={{ fontSize: 12, color: "#666" }}>{emp.role} • {emp.crew} Crew</div>
                      <div style={{ fontSize: 12, marginTop: 4, textTransform: "capitalize" }}>Status: {emp.status}</div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>

          {/* Map legend overlay */}
          <div style={{
            position: "relative", bottom: 52, left: 12, zIndex: 1000,
            display: "inline-flex", gap: 14, padding: "8px 14px",
            background: `${COLORS.bg}EE`, borderRadius: 8, border: `1px solid ${COLORS.border}`,
            fontSize: 10, fontFamily: FONTS.mono, width: "fit-content", marginLeft: 12,
            backdropFilter: "blur(8px)",
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

        <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 560, overflowY: "auto" }}>
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

// ─── LEAD INTELLIGENCE VIEW ─────────────────────────────
const LeadsView = () => {
  const [typeFilter, setTypeFilter] = useState("All");
  const [selectedLead, setSelectedLead] = useState(null);
  const [viewTab, setViewTab] = useState("leads"); // "leads" | "sources"
  const [sourceCategory, setSourceCategory] = useState("all");

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
      <div style={{ padding: 32, overflowY: "auto", height: "100vh" }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
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
    <div style={{ padding: 32, overflowY: "auto", height: "100vh" }}>
      <SectionHeader
        title="Lead Intelligence Center"
        subtitle="Auto-scraped bonds, permits, and RFPs from public sources"
        action={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Badge color={COLORS.success}>SCANNER ACTIVE</Badge>
            <Button variant="secondary" size="sm" onClick={() => setViewTab("sources")}>
              Data Sources ({allSources.length})
            </Button>
            <Button icon="search" size="sm">Manual Search</Button>
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
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

      <div style={{ display: "grid", gridTemplateColumns: selectedLead ? "1fr 400px" : "1fr", gap: 20 }}>
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
    </div>
  );
};

// ─── INTEGRATIONS VIEW (EMAIL / CALENDAR) ────────────────
const IntegrationsView = () => {
  const [activeService, setActiveService] = useState(null);
  const [emailTab, setEmailTab] = useState("inbox");

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
      <div style={{ padding: 32, overflowY: "auto", height: "100vh" }}>
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
    <div style={{ padding: 32, overflowY: "auto", height: "100vh" }}>
      <SectionHeader title="Integrations" subtitle="Connect email, calendar, and external services" />

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Email & Calendar</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
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

      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 12, fontFamily: FONTS.mono, color: COLORS.textMuted, letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>API Configuration</div>
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <h4 style={{ fontFamily: FONTS.display, fontSize: 14, fontWeight: 600, marginBottom: 12, color: "#0078D4" }}>Microsoft Graph API</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { label: "Client ID", value: "••••••••-••••-••••-••••-••••••a3f8d2" },
                  { label: "Tenant ID", value: "••••••••-••••-••••-••••-••••••7b1e09" },
                  { label: "Redirect URI", value: "https://app.paving123.com/auth/microsoft/callback" },
                  { label: "API Endpoint", value: "https://graph.microsoft.com/v1.0" },
                ].map(item => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${COLORS.border}08` }}>
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
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${COLORS.border}08` }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
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

// ─── MAIN APP ───────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedProject, setSelectedProject] = useState(null);

  const renderView = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardView setActiveTab={setActiveTab} setSelectedProject={setSelectedProject} />;
      case "messages": return <MessagesView />;
      case "projects": return <ProjectsView selectedProject={selectedProject} setSelectedProject={setSelectedProject} />;
      case "inventory": return <InventoryView />;
      case "tracking": return <TrackingView />;
      case "leads": return <LeadsView />;
      case "integrations": return <IntegrationsView />;
      default: return <DashboardView setActiveTab={setActiveTab} setSelectedProject={setSelectedProject} />;
    }
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: COLORS.bg }}>
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        <main style={{ flex: 1, overflow: "hidden" }}>
          {renderView()}
        </main>
      </div>
    </>
  );
}
