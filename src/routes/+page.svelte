<script>
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import '$lib/styles/map.css';
  import Map from '$lib/components/Map.svelte';
  import ControlPanel from '$lib/components/ControlPanel.svelte';
  import Legend from '$lib/components/Legend.svelte';
  import InfoPanel from '$lib/components/InfoPanel.svelte';
  import DistrictPanel from '$lib/components/DistrictPanel.svelte';
  import Onboarding from '$lib/components/Onboarding.svelte';
  import SearchBar from '$lib/components/SearchBar.svelte';
  import HowToPanel from '$lib/components/HowToPanel.svelte';
  import DetailPopup from '$lib/components/DetailPopup.svelte';
  import { INFRA_TYPES, FOOD_GROUP_NAMES } from '$lib/layers/tilesetIds.js';

  // ── Map / UI state ────────────────────────────────────────────────────────────
  let selectedStateId   = $state(null);
  let selectedCountryId = $state(null);
  let activeLayers      = $state(['breadbaskets', 'infrastructure']);
  let layerOpacity      = $state({
    breadbaskets: 0.20,
  });
  let selectedFoodGroup  = $state(null);
  let edgeWidthScale     = $state(0.75);
  let mapLoaded          = $state(false);
  let mapRef;

  // ── Edge data state ───────────────────────────────────────────────────────────
  let edgeData    = $state(null);
  let fgData      = $state(null);
  let countryData = $state(null);
  let edgePcts    = $state(null);

  // ── Selected edge state ───────────────────────────────────────────────────────
  let selectedEdge = $state(null);
  let clickCoords  = $state(null);

  // ── Data loading ──────────────────────────────────────────────────────────────
  onMount(() => {
    const t = setTimeout(() => { mapLoaded = true; }, 2200);

    Promise.all([
      fetch(`${base}/data/edges.json`).then(r => r.json()),
      fetch(`${base}/data/foodgroups.json`).then(r => r.json()),
    ]).then(([edges, fg]) => {
      edgeData = edges.data.map((e, i) => ({
        id:        e[0],
        infraType: INFRA_TYPES[e[1]] || 'Other',
        country:   e[2],
        coordinates: e[3],
        flow:      e[4],
        energy:    e[5],
        protein:   e[6],
        fat:       e[7],
        peopleFed: e[8],
        _idx:      i,
      }));
      fgData = fg;
    }).catch(err => console.error('Failed to load edge data:', err));

    fetch(`${base}/data/countries.json`)
      .then(r => r.json())
      .then(d => { countryData = d; })
      .catch(err => console.error('Failed to load country data:', err));

    fetch(`${base}/data/edge_pcts.json`)
      .then(r => r.json())
      .then(d => { edgePcts = d; })
      .catch(err => console.error('Failed to load edge pcts:', err));

    return () => clearTimeout(t);
  });

  // ── Derived popup data ────────────────────────────────────────────────────────
  let selectedFoodGroups = $derived.by(() => {
    if (!selectedEdge || !fgData) return null;
    const arr = fgData.data[selectedEdge._idx];
    if (!arr) return null;
    return FOOD_GROUP_NAMES
      .map((name, i) => ({ name, energy: arr[i] || 0 }))
      .filter(d => d.energy > 0)
      .sort((a, b) => b.energy - a.energy);
  });

  let selectedDestCountries = $derived.by(() => {
    if (!selectedEdge || !countryData) return null;
    const destArr = countryData.edgeDestinations?.[selectedEdge._idx];
    if (!destArr?.length) return null;
    const rankMap = {};
    (countryData.ranking || []).forEach((r, idx) => {
      rankMap[r[0]] = { name: r[1], rank: idx + 1 };
    });
    return destArr
      .map(iso3 => ({ iso3, name: rankMap[iso3]?.name || iso3, rank: rankMap[iso3]?.rank || 9999 }))
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 10);
  });

  let totalDestCount = $derived.by(() => {
    if (!selectedEdge || !countryData) return 0;
    return countryData.edgeDestinations?.[selectedEdge._idx]?.length || 0;
  });

  let selectedEdgePcts = $derived.by(() => {
    if (!selectedEdge || !edgePcts) return null;
    const arr = edgePcts.data?.[selectedEdge._idx];
    if (!arr) return null;
    return { pctFlow: arr[0], pctEnergy: arr[1], pctProtein: arr[2], pctFat: arr[3] };
  });

  // ── Handlers ──────────────────────────────────────────────────────────────────
  function handleSearchSelect(item) {
    if (item.type === 'country') {
      selectedCountryId = item.id;
      selectedStateId = null;
    } else {
      selectedStateId = item.id;
      selectedCountryId = null;
    }
    const zoom = item.type === 'country' ? 4 : 5;
    if (mapRef && item.lat && item.lon) {
      mapRef.flyTo(item.lon, item.lat, zoom);
    }
  }

  function handleToggle(key) {
    activeLayers = activeLayers.includes(key)
      ? activeLayers.filter((k) => k !== key)
      : [...activeLayers, key];
  }

  function handleOpacityChange(key, value) {
    layerOpacity = { ...layerOpacity, [key]: value };
  }

  function handleEdgeClick(info) {
    selectedEdge = info.object;
    clickCoords  = { x: info.x, y: info.y };
    // Close region panel when an edge is clicked
    selectedStateId   = null;
    selectedCountryId = null;
  }

  let breadbasketActive = $derived(activeLayers.includes('breadbaskets'));
  let infraActive       = $derived(activeLayers.includes('infrastructure'));
</script>

<!-- Loading overlay -->
<div class="loading-overlay {mapLoaded ? 'hidden' : ''}">
  <div class="loading-spinner"></div>
  <div class="loading-text">Loading global food supply data…</div>
</div>

<!-- Map -->
<Map
  bind:this={mapRef}
  {activeLayers}
  {layerOpacity}
  selectedMethod="zscore"
  {selectedFoodGroup}
  {selectedStateId}
  {selectedCountryId}
  {edgeData}
  {edgePcts}
  {edgeWidthScale}
  onEdgeClick={handleEdgeClick}
  onStateSelect={(id) => { selectedStateId = id; selectedCountryId = null; selectedEdge = null; }}
  onCountrySelect={(id) => { selectedCountryId = id; selectedStateId = null; selectedEdge = null; }}
/>

<!-- Search bar -->
<SearchBar onSelect={handleSearchSelect} />

<!-- Layer controls -->
<ControlPanel
  {activeLayers}
  {layerOpacity}
  onToggle={handleToggle}
  onOpacityChange={handleOpacityChange}
  {edgeWidthScale}
  onEdgeWidthChange={(v) => { edgeWidthScale = v; }}
/>

<!-- Info panel -->
<InfoPanel />

<!-- How to use -->
<HowToPanel />

<!-- State / Province summary (click a state) -->
<DistrictPanel
  stateId={selectedStateId}
  countryId={selectedCountryId}
  onClose={() => { selectedStateId = null; selectedCountryId = null; }}
/>

<!-- Infrastructure edge popup -->
{#if selectedEdge}
  <DetailPopup
    edge={selectedEdge}
    foodGroups={selectedFoodGroups}
    destCountries={selectedDestCountries}
    {totalDestCount}
    edgePcts={selectedEdgePcts}
    position={clickCoords}
    onClose={() => { selectedEdge = null; clickCoords = null; }}
  />
{/if}

<!-- Onboarding + contextual hints -->
<Onboarding
  {activeLayers}
  {selectedStateId}
  {selectedCountryId}
/>

<!-- Legends -->
<Legend
  {breadbasketActive}
  {infraActive}
  {selectedFoodGroup}
  onSelectFoodGroup={(fg) => { selectedFoodGroup = fg; }}
/>
