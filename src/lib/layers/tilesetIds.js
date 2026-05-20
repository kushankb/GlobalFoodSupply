/**
 * Tileset IDs & Layer Configuration
 * -----------------------------------------
 * Breadbaskets  = Mapbox-hosted vector tileset (dot layer by food group)
 * Admin boundaries = Mapbox-hosted vector tilesets
 * Infrastructure edges = deck.gl PathLayer (loaded from static/data/edges.json)
 */

// -- Food group colour palette (bright for dark backgrounds) -----------------
export const FOOD_GROUP_COLORS = {
  starches:             { color: "#f5c542", label: "Starches",            desc: "Wheat, rice, maize, potatoes, cassava & other starchy staples" },
  meat_and_fish:        { color: "#ff6b6b", label: "Meat & Fish",         desc: "Beef, pork, poultry, seafood & other animal proteins" },
  dairy_and_eggs:       { color: "#fff06a", label: "Dairy & Eggs",        desc: "Milk, cheese, butter, yoghurt & eggs" },
  fruits:               { color: "#7dde60", label: "Fruits",              desc: "Tropical, temperate & citrus fruits (bananas, apples, oranges, etc.)" },
  vegetables:           { color: "#3dcc3d", label: "Vegetables",          desc: "Leafy greens, tomatoes, onions, peppers & other vegetables" },
  oils_and_oilseed:     { color: "#e89840", label: "Oils & Oilseeds",    desc: "Soybean, palm, rapeseed, sunflower & other oil crops" },
  pulses:               { color: "#c4855c", label: "Pulses",             desc: "Lentils, chickpeas, beans, peas & other legumes" },
  sugar_and_sweeteners: { color: "#d49ce8", label: "Sugar & Sweeteners", desc: "Sugarcane, sugar beet & other sweetener crops" },
  treenuts:             { color: "#5ea54a", label: "Tree Nuts",           desc: "Almonds, cashews, walnuts, pistachios & other tree nuts" },
  other:                { color: "#aaaaaa", label: "Other",               desc: "Spices, cocoa, coffee, tea & other crops" },
};

// Integer codes used in the compact vector tiles (must match process_breadbaskets.py)
export const FOOD_GROUP_CODES = {
  dairy_and_eggs:       0,
  fruits:               1,
  meat_and_fish:        2,
  oils_and_oilseed:     3,
  other:                4,
  pulses:               5,
  starches:             6,
  sugar_and_sweeteners: 7,
  treenuts:             8,
  vegetables:           9,
};
export const FOOD_GROUP_BY_CODE = Object.fromEntries(
  Object.entries(FOOD_GROUP_CODES).map(([k, v]) => [v, k])
);

// -- Breadbasket (vector tile -- toggleable base layer) -----------------------
export const BREADBASKET = {
  id: "kushankb.breadbaskets4",
  layer: "breadbaskets",
  label: "Food Production Zones",
  groupKey: "zscore",
  valueKey: "c",
};

export function methodCodeExpr(methodKey) {
  if (methodKey === "zscore") {
    return ["floor", ["/", ["get", "c"], 100]];
  }
  if (methodKey === "share") {
    return ["floor", ["/", ["%", ["get", "c"], 100], 10]];
  }
  return ["%", ["get", "c"], 10];
}

export function decodePackedC(c, methodKey) {
  if (c == null) return null;
  if (methodKey === "zscore") return Math.floor(c / 100);
  if (methodKey === "share")  return Math.floor((c % 100) / 10);
  return c % 10;
}

// -- Breadbasket classification methods ----------------------------------------
export const BREADBASKET_METHODS = {
  zscore: {
    key: "zscore",
    label: "Z-Score",
    groupKey: "zscore",
    short: "Most unusually high food group",
    description:
      "Which food group is most unusually high at this pixel, relative to its own global distribution?",
  },
  rank: {
    key: "rank",
    label: "Rank-Based",
    groupKey: "rank",
    short: "How specialized a location is",
    description:
      "How strongly specialized a location is. High margin = monoculture-like; low margin = diversified.",
  },
};

// -- Admin boundaries (vector tiles -- click/hover interaction) ───────────────
export const COUNTRY_BOUNDARIES = {
  id: "kushankb.01l11tz3",
  layer: "countries",
  label: "Countries",
  idKey: "iso3",
};

export const ADMIN2_STATES = {
  id: "kushankb.69o1u9mn",
  layer: "admin2",
  label: "States / Provinces",
  idKey: "ID",
};

// -- Infrastructure (transport edges via deck.gl PathLayer) -------------------
export const INFRA_TYPES = ["Maritime", "Rail", "Road", "Inland Waterway", "Port", "Other"];

export const INFRA_COLORS = {
  Maritime:          { color: "#38bdf8", rgb: [56, 189, 248] },
  Rail:              { color: "#fbbf24", rgb: [251, 191, 36] },
  Road:              { color: "#a78bfa", rgb: [167, 139, 250] },
  "Inland Waterway": { color: "#34d399", rgb: [52, 211, 153] },
  Port:              { color: "#22d3ee", rgb: [34, 211, 238] },
  Other:             { color: "#94a3b8", rgb: [148, 163, 184] },
};

// Food group names matching the edges.json / foodgroups.json data
export const FOOD_GROUP_NAMES = [
  "Grains", "Fruits", "Vegetables", "Meat and Fish", "Dairy and Eggs",
  "Oils and Oilseed", "Pulses", "Starchy Roots", "Treenuts", "Other"
];

// Colours for edge food group breakdown in DetailPopup
export const EDGE_FOOD_GROUP_COLORS = {
  "Grains":           "#f5c542",
  "Fruits":           "#7dde60",
  "Vegetables":       "#3dcc3d",
  "Meat and Fish":    "#ff6b6b",
  "Dairy and Eggs":   "#fff06a",
  "Oils and Oilseed": "#e89840",
  "Pulses":           "#c4855c",
  "Starchy Roots":    "#d49ce8",
  "Treenuts":         "#5ea54a",
  "Other":            "#aaaaaa",
};

// -- Layer descriptions (for button hover tooltips) ---------------------------
export const LAYER_DESCRIPTIONS = {
  breadbaskets: {
    text: "Food-producing areas coloured by the food group most concentrated in each location relative to global averages. Shows regional specialisation, not absolute production.",
    source: "Plotline production dataset · Z-score classification",
  },
  farmsize: {
    text: "Dominant farm size (hectares). Smaller values indicate smallholder-dominated areas.",
    source: "Mehrabi & Ricciardi 2024 (doi:10.7927/WVJE-SN95)",
  },
  infrastructure: {
    text: "Global food transport infrastructure edges (maritime, rail, road, inland waterway). Opacity scales with food energy carried. Click any edge to see its criticality and food flow.",
    source: "FAO / Plotline food transport network",
  },
};

// -- Raster overlay for farm size only (climate rasters removed) --------------
export const RASTER_OVERLAYS = {
  farmsize: {
    tileDir: "farmsize",
    label: "Farm Size",
    description: "Dominant farm size (ha) -- Mehrabi & Ricciardi 2024",
    unit: "ha",
    legendColors: [
      { value:   1,  color: "#f7f4f9", label: "1 ha" },
      { value:  20,  color: "#c994c7", label: "20 ha" },
      { value: 500,  color: "#ce1256", label: "500 ha" },
      { value: 5000, color: "#49006a", label: "5000 ha" },
    ],
  },
};

const TILE_BASE_DEFAULT = 'https://kushankbajaj.com/exposure-tiles';
export function getTileDir(key, percentile = "p50") {
  const cfg = RASTER_OVERLAYS[key];
  if (!cfg) return null;
  if (typeof cfg.tileDir === "string") return cfg.tileDir;
  return cfg.tileDir[percentile] || cfg.tileDir.p50;
}
