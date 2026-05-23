<script>
  import { onMount } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import 'mapbox-gl/dist/mapbox-gl.css';
  import { PathLayer } from '@deck.gl/layers';
  import { MapboxOverlay } from '@deck.gl/mapbox';
  import {
    BREADBASKET,
    BREADBASKET_METHODS,
    FOOD_GROUP_COLORS,
    FOOD_GROUP_CODES,
    FOOD_GROUP_BY_CODE,
    ADMIN2_STATES,
    COUNTRY_BOUNDARIES,
    methodCodeExpr,
    decodePackedC,
  } from '$lib/layers/tilesetIds.js';

  let {
    activeLayers,
    layerOpacity,
    selectedMethod,
    selectedFoodGroup,
    onLegendChange = () => {},
    selectedStateId = null,
    selectedCountryId = null,
    onStateSelect = () => {},
    onCountrySelect = () => {},
    edgeData = null,
    edgePcts = null,
    edgeWidthScale = 1.0,
    onEdgeClick = () => {},
  } = $props();

  import { PUBLIC_MAPBOX_TOKEN } from '$env/static/public';
  const MAPBOX_TOKEN = PUBLIC_MAPBOX_TOKEN;

  const BREADBASKET_SIZE = [
    'interpolate', ['linear'], ['zoom'],
    1, 0.5, 2, 0.7, 3, 1.0, 4, 1.4, 5, 2.0, 6, 2.8, 7, 3.6, 8, 4.5,
  ];

  // ── Dark / light style toggle ────────────────────────────────────────────────
  let isDark = $state(true);
  const DARK_STYLE  = 'mapbox://styles/mapbox/dark-v11';
  const LIGHT_STYLE = 'mapbox://styles/mapbox/light-v11';

  export function toggleMapStyle() {
    isDark = !isDark;
    mapReady = false;
    if (mapRef) mapRef.setStyle(isDark ? DARK_STYLE : LIGHT_STYLE);
  }

  function lineColor() {
    if (isDark) {
      return ['case',
        ['boolean', ['feature-state', 'selected'], false], '#00d4ff',
        ['boolean', ['feature-state', 'hover'],    false], 'rgba(255,255,255,0.55)',
        'rgba(255,255,255,0.3)',
      ];
    }
    return ['case',
      ['boolean', ['feature-state', 'selected'], false], '#0077cc',
      ['boolean', ['feature-state', 'hover'],    false], 'rgba(0,0,0,0.55)',
      'rgba(0,0,0,0.25)',
    ];
  }

  function buildFoodGroupColorExpr(methodKey) {
    const expr = ['match', methodCodeExpr(methodKey || 'zscore')];
    Object.entries(FOOD_GROUP_COLORS).forEach(([key, { color }]) => {
      const code = FOOD_GROUP_CODES[key];
      if (code !== undefined) expr.push(code, color);
    });
    expr.push('#444444');
    return expr;
  }

  function addAllSources(m) {
    m.addSource('breadbaskets', { type: 'vector', url: `mapbox://${BREADBASKET.id}` });

    m.addSource('countries', {
      type: 'vector',
      url: `mapbox://${COUNTRY_BOUNDARIES.id}`,
      promoteId: { [COUNTRY_BOUNDARIES.layer]: COUNTRY_BOUNDARIES.idKey },
    });

    m.addSource('admin2', {
      type: 'vector',
      url: `mapbox://${ADMIN2_STATES.id}`,
      promoteId: { [ADMIN2_STATES.layer]: ADMIN2_STATES.idKey },
    });

  }

  function addAllLayers(m) {
    // Country fill
    m.addLayer({
      id: 'country-fill', type: 'fill', source: 'countries',
      'source-layer': COUNTRY_BOUNDARIES.layer, maxzoom: 4,
      paint: {
        'fill-color': '#ffffff',
        'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.12, 0.0],
      },
    });

    // Country outline
    m.addLayer({
      id: 'country-outline', type: 'line', source: 'countries',
      'source-layer': COUNTRY_BOUNDARIES.layer, maxzoom: 4,
      paint: {
        'line-color': lineColor(),
        'line-width': ['case',
          ['boolean', ['feature-state', 'selected'], false], 2.5,
          ['boolean', ['feature-state', 'hover'],    false], 1.2,
          0.6,
        ],
      },
    });

    // Admin2 fill
    m.addLayer({
      id: 'admin2-fill', type: 'fill', source: 'admin2',
      'source-layer': ADMIN2_STATES.layer, minzoom: 4,
      paint: {
        'fill-color': '#ffffff',
        'fill-opacity': ['case', ['boolean', ['feature-state', 'hover'], false], 0.12, 0.0],
      },
    });

    // Breadbaskets (dots)
    m.addLayer({
      id: 'breadbaskets-layer', type: 'circle',
      source: 'breadbaskets', 'source-layer': BREADBASKET.layer,
      layout: { visibility: 'visible' },
      paint: {
        'circle-radius':         BREADBASKET_SIZE,
        'circle-color':          buildFoodGroupColorExpr(),
        'circle-opacity':        1.0,
        'circle-stroke-width':   ['interpolate', ['linear'], ['zoom'], 1, 0.6, 4, 0.4, 8, 0.2],
        'circle-stroke-color':   '#ffffff',
        'circle-stroke-opacity': 0.5,
        'circle-blur':           0.0,
      },
    });

    // Admin2 outline (on top of dots)
    m.addLayer({
      id: 'admin2-outline', type: 'line', source: 'admin2',
      'source-layer': ADMIN2_STATES.layer, minzoom: 4,
      paint: {
        'line-color': lineColor(),
        'line-width': ['interpolate', ['linear'], ['zoom'],
          2, 0,
          4, ['case',
            ['boolean', ['feature-state', 'selected'], false], 2.0,
            ['boolean', ['feature-state', 'hover'],    false], 1.0,
            0.4,
          ],
          6, ['case',
            ['boolean', ['feature-state', 'selected'], false], 2.5,
            ['boolean', ['feature-state', 'hover'],    false], 1.2,
            0.6,
          ],
        ],
      },
    });

  }

  // Track hovered/selected features
  let hoveredAdmin2Id = null;
  let selectedAdmin2FeatureId = null;
  let hoveredCountryId = null;
  let selectedCountryFeatureId = null;

  function setupCountryEvents(m) {
    m.on('mousemove', 'country-fill', (e) => {
      if (!e.features?.length) return;
      const feat = e.features[0];
      if (hoveredCountryId !== null && hoveredCountryId !== feat.id) {
        m.setFeatureState({ source: 'countries', sourceLayer: COUNTRY_BOUNDARIES.layer, id: hoveredCountryId }, { hover: false });
      }
      hoveredCountryId = feat.id;
      m.setFeatureState({ source: 'countries', sourceLayer: COUNTRY_BOUNDARIES.layer, id: hoveredCountryId }, { hover: true });
      m.getCanvas().style.cursor = 'pointer';
    });
    m.on('mouseleave', 'country-fill', () => {
      if (hoveredCountryId !== null) {
        m.setFeatureState({ source: 'countries', sourceLayer: COUNTRY_BOUNDARIES.layer, id: hoveredCountryId }, { hover: false });
        hoveredCountryId = null;
      }
      m.getCanvas().style.cursor = '';
    });
  }

  function setupAdmin2Events(m) {
    m.on('mousemove', 'admin2-fill', (e) => {
      if (!e.features?.length) return;
      const feat = e.features[0];
      if (hoveredAdmin2Id !== null && hoveredAdmin2Id !== feat.id) {
        m.setFeatureState({ source: 'admin2', sourceLayer: ADMIN2_STATES.layer, id: hoveredAdmin2Id }, { hover: false });
      }
      hoveredAdmin2Id = feat.id;
      m.setFeatureState({ source: 'admin2', sourceLayer: ADMIN2_STATES.layer, id: hoveredAdmin2Id }, { hover: true });
      m.getCanvas().style.cursor = 'pointer';
    });
    m.on('mouseleave', 'admin2-fill', () => {
      if (hoveredAdmin2Id !== null) {
        m.setFeatureState({ source: 'admin2', sourceLayer: ADMIN2_STATES.layer, id: hoveredAdmin2Id }, { hover: false });
        hoveredAdmin2Id = null;
      }
      m.getCanvas().style.cursor = '';
    });
  }

  // Unified click handler — deck.gl edges take priority over Mapbox fill layers
  function setupClickHandler(m, overlay) {
    m.on('click', (e) => {
      // 1. Try infrastructure edge first via deck.gl picking
      const picked = overlay.pickObject({ x: e.point.x, y: e.point.y, radius: 12 });
      if (picked?.object) {
        onEdgeClick({ object: picked.object, x: e.point.x, y: e.point.y });
        return;
      }

      // 2. Country fill (zoom < 4)
      if (m.getLayer('country-fill')) {
        const features = m.queryRenderedFeatures(e.point, { layers: ['country-fill'] });
        if (features.length) {
          const feat = features[0];
          const iso3 = feat.properties[COUNTRY_BOUNDARIES.idKey];
          if (selectedCountryFeatureId !== null) {
            m.setFeatureState({ source: 'countries', sourceLayer: COUNTRY_BOUNDARIES.layer, id: selectedCountryFeatureId }, { selected: false });
          }
          if (iso3 === selectedCountryId) {
            selectedCountryFeatureId = null;
            onCountrySelect(null);
          } else {
            selectedCountryFeatureId = feat.id;
            m.setFeatureState({ source: 'countries', sourceLayer: COUNTRY_BOUNDARIES.layer, id: feat.id }, { selected: true });
            onCountrySelect(iso3);
          }
          return;
        }
      }

      // 3. Admin2 fill (zoom >= 4)
      if (m.getLayer('admin2-fill')) {
        const features = m.queryRenderedFeatures(e.point, { layers: ['admin2-fill'] });
        if (features.length) {
          const feat = features[0];
          const stateId = feat.properties[ADMIN2_STATES.idKey];
          if (selectedAdmin2FeatureId !== null) {
            m.setFeatureState({ source: 'admin2', sourceLayer: ADMIN2_STATES.layer, id: selectedAdmin2FeatureId }, { selected: false });
          }
          if (stateId === selectedStateId) {
            selectedAdmin2FeatureId = null;
            onStateSelect(null);
          } else {
            selectedAdmin2FeatureId = feat.id;
            m.setFeatureState({ source: 'admin2', sourceLayer: ADMIN2_STATES.layer, id: feat.id }, { selected: true });
            onStateSelect(stateId);
          }
        }
      }
    });
  }

  function setupHoverEvents(m, popup, getActiveLayers) {
    m.on('mouseenter', 'breadbaskets-layer', (e) => {
      if (!getActiveLayers().includes('breadbaskets')) return;
      m.getCanvas().style.cursor = 'crosshair';
      if (!e.features?.length) return;
      const props = e.features[0].properties;
      const methodKey = (BREADBASKET_METHODS[selectedMethod] || BREADBASKET_METHODS.zscore).key;
      const code = decodePackedC(props.c, methodKey);
      const key = FOOD_GROUP_BY_CODE[code];
      const fg = FOOD_GROUP_COLORS[key] || { label: String(code), color: '#888', desc: '' };
      popup
        .setLngLat(e.lngLat)
        .setHTML(`<div class="popup-title">
            <span class="popup-swatch" style="background:${fg.color}"></span>
            ${fg.label}
          </div>
          ${fg.desc ? `<div class="popup-desc">${fg.desc}</div>` : ''}`)
        .addTo(m);
    });
    m.on('mouseleave', 'breadbaskets-layer', () => {
      m.getCanvas().style.cursor = '';
      popup.remove();
    });
  }

  // Expose flyTo for search bar
  export function flyTo(lng, lat, zoom = 5) {
    if (mapRef) mapRef.flyTo({ center: [lng, lat], zoom, duration: 1500 });
  }

  let mapContainer;
  let mapRef = null;
  let overlayRef = null;
  let mapReady = $state(false);
  let activeLayersSnapshot = $derived(activeLayers);
  let eventsSetUp = false;

  function applyBaseStyleOverrides(m) {
    const style = m.getStyle();
    if (!style?.layers) return;
    for (const layer of style.layers) {
      if (layer.id === 'land' && layer.type === 'background') {
        m.setPaintProperty('land', 'background-color', isDark ? '#0d1120' : '#f0ede8');
      }
      if (layer.id === 'water' && layer.type === 'fill') {
        m.setPaintProperty('water', 'fill-color', isDark ? '#080e1c' : '#c8dce8');
      }
      if (layer.id.includes('landuse') || layer.id.includes('landcover')) {
        if (layer.type === 'fill') m.setPaintProperty(layer.id, 'fill-opacity', 0.3);
      }
      if (layer.id.includes('admin') && layer.type === 'line') {
        m.setLayoutProperty(layer.id, 'visibility', 'none');
      }
    }
    if (isDark) {
      m.setFog({
        color:           'rgb(8, 12, 22)',
        'high-color':    'rgb(13, 17, 32)',
        'horizon-blend': 0.008,
        'space-color':   'rgb(4, 6, 12)',
        'star-intensity': 0.5,
      });
    } else {
      m.setFog(null);
    }
  }

  onMount(() => {
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const m = new mapboxgl.Map({
      container: mapContainer,
      style: DARK_STYLE,
      center: [0, 20],
      zoom: 2,
      minZoom: 1,
      maxZoom: 8,
      projection: 'mercator',
      antialias: true,
      hash: true,
    });

    mapRef = m;

    // Set up deck.gl overlay
    const overlay = new MapboxOverlay({ interleaved: true, layers: [] });
    overlayRef = overlay;
    m.addControl(overlay);

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      maxWidth: '320px',
    });

    m.on('style.load', () => {
      applyBaseStyleOverrides(m);
      addAllSources(m);
      addAllLayers(m);
      if (!eventsSetUp) {
        setupHoverEvents(m, popup, () => activeLayersSnapshot);
        setupCountryEvents(m);
        setupAdmin2Events(m);
        setupClickHandler(m, overlay);
        eventsSetUp = true;
      }
      mapReady = true;
    });

    m.addControl(new mapboxgl.NavigationControl({ showCompass: true }), 'top-right');

    return () => {
      m.remove();
      mapRef = null;
      overlayRef = null;
      mapReady = false;
      eventsSetUp = false;
    };
  });

  // ── deck.gl PathLayer — single colour, brightness + width = criticality ──
  $effect(() => {
    if (!overlayRef) return;

    const infraVisible = activeLayers.includes('infrastructure');
    if (!infraVisible || !edgeData || edgeData.length === 0) {
      overlayRef.setProps({ layers: [] });
      return;
    }

    // Warm amber base colour
    const R = 220, G = 155, B = 75;

    function getColor(d) {
      const pct = edgePcts?.data?.[d._idx]?.[0] ?? null; // pctFlow 0–100
      if (pct === null) return [R, G, B, 15];
      const t = Math.pow(pct / 100, 1.2);
      return [R, G, B, Math.round(15 + t * 230)];
    }

    function getWidth(d) {
      const pct = edgePcts?.data?.[d._idx]?.[0] ?? null;
      if (pct === null) return 0.3 * edgeWidthScale;
      return (0.3 + (pct / 100) * 2.2) * edgeWidthScale; // 0.3 → 2.5 px, scaled
    }

    const layer = new PathLayer({
      id: 'infrastructure',
      data: edgeData,
      getPath: (d) => d.coordinates,
      getColor,
      getWidth,
      widthUnits: 'pixels',
      widthMinPixels: 0.4,
      widthMaxPixels: 5,
      pickable: true,
      pickingRadius: 12,
      autoHighlight: true,
      highlightColor: [255, 255, 255, 100],
      parameters: { depthTest: false },
      updateTriggers: {
        getColor: [edgePcts],
        getWidth: [edgePcts, edgeWidthScale],
      },
    });

    overlayRef.setProps({ layers: [layer] });
  });

  // Sync layer visibility & opacity whenever props change
  $effect(() => {
    const m = mapRef;
    if (!m || !mapReady) return;

    const bbActive = activeLayers.includes('breadbaskets');

    if (m.getLayer('breadbaskets-layer')) {
      m.setLayoutProperty('breadbaskets-layer', 'visibility', bbActive ? 'visible' : 'none');
      if (bbActive) {
        m.setPaintProperty('breadbaskets-layer', 'circle-opacity', layerOpacity.breadbaskets);
        m.setPaintProperty('breadbaskets-layer', 'circle-stroke-opacity', layerOpacity.breadbaskets * 0.5);
        const methodKey = (BREADBASKET_METHODS[selectedMethod] || BREADBASKET_METHODS.zscore).key;
        m.setPaintProperty('breadbaskets-layer', 'circle-color', buildFoodGroupColorExpr(methodKey));
      }
      const methodKey = (BREADBASKET_METHODS[selectedMethod] || BREADBASKET_METHODS.zscore).key;
      if (selectedFoodGroup) {
        m.setFilter('breadbaskets-layer', ['==', methodCodeExpr(methodKey), FOOD_GROUP_CODES[selectedFoodGroup]]);
      } else {
        m.setFilter('breadbaskets-layer', null);
      }
    }

    if (selectedCountryId == null && selectedCountryFeatureId !== null) {
      m.setFeatureState({ source: 'countries', sourceLayer: COUNTRY_BOUNDARIES.layer, id: selectedCountryFeatureId }, { selected: false });
      selectedCountryFeatureId = null;
    }
    if (selectedStateId == null && selectedAdmin2FeatureId !== null) {
      m.setFeatureState({ source: 'admin2', sourceLayer: ADMIN2_STATES.layer, id: selectedAdmin2FeatureId }, { selected: false });
      selectedAdmin2FeatureId = null;
    }

    onLegendChange(null);
  });
</script>

<div bind:this={mapContainer} id="map"></div>

<!-- Dark / Light toggle button -->
<button
  class="style-toggle"
  onclick={toggleMapStyle}
  title={isDark ? 'Switch to light map' : 'Switch to dark map'}
>
  {isDark ? '☀ Light map' : '🌙 Dark map'}
</button>

<style>
  .style-toggle {
    position: absolute;
    bottom: 70px;
    left: 16px;
    z-index: 8;
    background: rgba(14, 18, 28, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.14);
    border-radius: 7px;
    cursor: pointer;
    font-size: 0.72rem;
    font-weight: 500;
    color: #c8cdd6;
    font-family: system-ui, -apple-system, sans-serif;
    padding: 6px 14px;
    backdrop-filter: blur(8px);
    transition: all 0.15s;
    white-space: nowrap;
  }
  .style-toggle:hover {
    background: rgba(100, 210, 255, 0.1);
    border-color: rgba(100, 210, 255, 0.3);
    color: #fff;
  }
</style>
