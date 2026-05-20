<script>
  import { INFRA_COLORS, EDGE_FOOD_GROUP_COLORS } from '$lib/layers/tilesetIds.js';

  let { edge, foodGroups, destCountries, totalDestCount = 0, edgePcts, position, onClose } = $props();

  function formatNum(val) {
    if (!val || val === 0) return '0';
    const abs = Math.abs(val);
    if (abs >= 1e12) return (val / 1e12).toFixed(1) + 'T';
    if (abs >= 1e9)  return (val / 1e9).toFixed(1) + 'B';
    if (abs >= 1e6)  return (val / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3)  return (val / 1e3).toFixed(1) + 'K';
    return val.toFixed(0);
  }

  let x = $derived.by(() => {
    const px = position?.x ?? 300;
    if (typeof window === 'undefined') return px;
    return Math.min(Math.max(10, px - 220), window.innerWidth - 460);
  });

  let y = $derived.by(() => {
    const py = position?.y ?? 200;
    if (typeof window === 'undefined') return py + 20;
    return Math.min(Math.max(10, py + 20), window.innerHeight - 580);
  });

  let infraColor = $derived(INFRA_COLORS[edge?.infraType]?.color || '#6b7280');
  let maxEnergy  = $derived(foodGroups?.length ? foodGroups[0].energy : 1);
</script>

{#if edge}
  <div class="detail-popup" style="left: {x}px; top: {y}px;">
    <button class="detail-close" onclick={onClose}>&times;</button>

    <!-- Header -->
    <div class="detail-header">
      <span class="detail-badge" style="background: {infraColor}">{edge.infraType}</span>
      {#if edge.country}
        <span class="detail-country">{edge.country}</span>
      {/if}
    </div>
    <div class="detail-edge-id">{edge.id}</div>

    <!-- Key metrics -->
    <div class="detail-metrics">
      <div class="detail-metric-card">
        <div class="detail-metric-value">{formatNum(edge.flow)}</div>
        <div class="detail-metric-label">tonnes</div>
      </div>
      <div class="detail-metric-card">
        <div class="detail-metric-value">{formatNum(edge.energy)}</div>
        <div class="detail-metric-label">kcal</div>
      </div>
      <div class="detail-metric-card">
        <div class="detail-metric-value" style="color: #e07a5f">{formatNum(edge.peopleFed)}</div>
        <div class="detail-metric-label">people fed / yr</div>
      </div>
    </div>

    <!-- Nutrient row -->
    <div class="detail-nutrient-row">
      <span>Protein: <strong>{formatNum(edge.protein)} kg</strong></span>
      <span>Fat: <strong>{formatNum(edge.fat)} kg</strong></span>
    </div>

    <!-- Criticality score -->
    {#if edgePcts}
      <div class="detail-section">
        <div class="detail-section-title">Criticality Score</div>
        <div class="detail-pct-subtitle">
          Score out of 100 — higher means this link moves more food than most other infrastructure
        </div>
        <div class="detail-pct-grid">
          <div class="detail-pct-item">
            <span class="detail-pct-value">{edgePcts.pctFlow.toFixed(1)}</span>
            <span class="detail-pct-label">Quantities</span>
          </div>
          <div class="detail-pct-item">
            <span class="detail-pct-value">{edgePcts.pctEnergy.toFixed(1)}</span>
            <span class="detail-pct-label">Energy</span>
          </div>
          <div class="detail-pct-item">
            <span class="detail-pct-value">{edgePcts.pctProtein.toFixed(1)}</span>
            <span class="detail-pct-label">Protein</span>
          </div>
          <div class="detail-pct-item">
            <span class="detail-pct-value">{edgePcts.pctFat.toFixed(1)}</span>
            <span class="detail-pct-label">Fat</span>
          </div>
        </div>
      </div>
    {/if}

    <!-- Food group breakdown -->
    {#if foodGroups && foodGroups.length > 0}
      <div class="detail-section">
        <div class="detail-section-title">Food Groups (by energy)</div>
        <div class="detail-bars">
          {#each foodGroups as fg}
            {@const color = EDGE_FOOD_GROUP_COLORS[fg.name] || '#888'}
            {@const pct = (fg.energy / maxEnergy) * 100}
            <div class="detail-bar-row">
              <div class="detail-bar-label">{fg.name}</div>
              <div class="detail-bar-track">
                <div class="detail-bar-fill" style="width: {pct}%; background: {color}"></div>
              </div>
              <div class="detail-bar-value">{formatNum(fg.energy)}</div>
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="detail-section">
        <div class="detail-section-title">Food Groups</div>
        <div class="detail-no-data">Food group breakdown not available for this edge</div>
      </div>
    {/if}

    <!-- Top destination countries -->
    {#if destCountries && destCountries.length > 0}
      <div class="detail-section">
        <div class="detail-section-title">
          Most Dependent Countries
          {#if totalDestCount > 0}
            <span class="detail-country-total"> ({totalDestCount} total destinations)</span>
          {/if}
        </div>
        <div class="detail-country-list">
          {#each destCountries as c}
            <div class="detail-country-row-item">
              <span class="detail-country-rank">#{c.rank}</span>
              <span class="detail-country-fullname">{c.name}</span>
              <span class="detail-country-iso-small">({c.iso3})</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .detail-popup {
    position: fixed;
    z-index: 20;
    width: 440px;
    max-height: 580px;
    overflow-y: auto;
    background: rgba(14, 18, 28, 0.97);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 10px;
    padding: 16px 16px 14px;
    color: #e0e0e0;
    font-family: system-ui, -apple-system, sans-serif;
    font-size: 13px;
    backdrop-filter: blur(8px);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.55);
  }

  .detail-close {
    position: absolute;
    top: 8px;
    right: 10px;
    background: none;
    border: none;
    color: #888;
    font-size: 18px;
    cursor: pointer;
    line-height: 1;
    padding: 2px 6px;
  }
  .detail-close:hover { color: #fff; }

  .detail-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
    padding-right: 24px;
    flex-wrap: wrap;
  }

  .detail-badge {
    display: inline-block;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #0a0a0a;
    padding: 2px 8px;
    border-radius: 3px;
  }

  .detail-country {
    font-size: 12px;
    color: #9aa3b2;
  }

  .detail-edge-id {
    font-size: 11px;
    color: #6f7886;
    margin-bottom: 10px;
    word-break: break-word;
  }

  .detail-metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
    margin-bottom: 8px;
  }

  .detail-metric-card {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 6px;
    padding: 8px 10px;
    text-align: center;
  }

  .detail-metric-value {
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }

  .detail-metric-label {
    font-size: 10px;
    color: #7a8494;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    margin-top: 2px;
  }

  .detail-nutrient-row {
    display: flex;
    gap: 16px;
    font-size: 11.5px;
    color: #9aa3b2;
    margin-bottom: 10px;
  }
  .detail-nutrient-row strong { color: #d4d8e0; }

  .detail-section {
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
  }

  .detail-section-title {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #6f7886;
    margin-bottom: 6px;
  }

  .detail-pct-subtitle {
    font-size: 10.5px;
    color: #6f7886;
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .detail-pct-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  }

  .detail-pct-item {
    background: rgba(255, 255, 255, 0.04);
    border-radius: 4px;
    padding: 6px 4px;
    text-align: center;
  }

  .detail-pct-value {
    display: block;
    font-size: 17px;
    font-weight: 700;
    color: #64d2ff;
    font-variant-numeric: tabular-nums;
  }

  .detail-pct-label {
    display: block;
    font-size: 9px;
    color: #7a8494;
    text-transform: uppercase;
    letter-spacing: 0.3px;
    margin-top: 2px;
  }

  .detail-bars {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .detail-bar-row {
    display: grid;
    grid-template-columns: 96px 1fr 40px;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
  }

  .detail-bar-label {
    color: #c8cdd6;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .detail-bar-track {
    height: 8px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 2px;
    overflow: hidden;
  }

  .detail-bar-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.2s ease;
  }

  .detail-bar-value {
    color: #c8cdd6;
    font-variant-numeric: tabular-nums;
    text-align: right;
    font-size: 11px;
  }

  .detail-no-data {
    font-size: 12px;
    color: #6f7886;
    font-style: italic;
  }

  .detail-country-total {
    color: #6f7886;
    font-weight: 400;
    text-transform: none;
    letter-spacing: 0;
    font-size: 10.5px;
  }

  .detail-country-list {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .detail-country-row-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    padding: 2px 0;
  }

  .detail-country-rank {
    font-size: 10px;
    color: #64d2ff;
    font-weight: 600;
    min-width: 28px;
  }

  .detail-country-fullname {
    color: #c8cdd6;
    flex: 1;
  }

  .detail-country-iso-small {
    color: #6f7886;
    font-size: 10.5px;
  }
</style>
