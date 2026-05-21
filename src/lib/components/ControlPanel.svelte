<script>
  import { LAYER_DESCRIPTIONS } from '$lib/layers/tilesetIds.js';

  let { activeLayers, layerOpacity, onToggle, onOpacityChange } = $props();

  // Tooltip state
  let tooltipKey = $state(null);
  let tooltipPos = $state({ top: 0, left: 0 });
  let infoTooltipVisible = $state(false);
  let infoTooltipPos = $state({ top: 0, left: 0 });

  function showTooltip(event, key) {
    const rect = event.currentTarget.getBoundingClientRect();
    tooltipPos = { top: rect.top + rect.height / 2, left: rect.right + 12 };
    tooltipKey = key;
  }

  function hideTooltip() {
    tooltipKey = null;
  }

  function showInfoTooltip(event) {
    const rect = event.currentTarget.getBoundingClientRect();
    infoTooltipPos = { top: rect.bottom + 6, left: rect.left };
    infoTooltipVisible = true;
  }

  function hideInfoTooltip() {
    infoTooltipVisible = false;
  }

  let breadbasketActive = $derived(activeLayers.includes('breadbaskets'));
  let infraActive       = $derived(activeLayers.includes('infrastructure'));
</script>

<div class="control-panel">
  <!-- Panel header -->
  <div class="panel-header">
    <div class="panel-title">Global Food<br />Transport Infrastructure</div>
    <button
      class="info-btn"
      onmouseenter={showInfoTooltip}
      onmouseleave={hideInfoTooltip}
      aria-label="About this data"
    >ⓘ</button>
  </div>
  <hr class="panel-divider" />

  <!-- Base Layer -->
  <div class="panel-section-label">Base Layer</div>

  <div class="layer-btn-wrapper">
    <button
      class="layer-btn {breadbasketActive ? 'active' : ''}"
      style="--btn-color: #e6a532"
      onclick={() => onToggle('breadbaskets')}
      onmouseenter={(e) => showTooltip(e, 'breadbaskets')}
      onmouseleave={hideTooltip}
    >
      <span class="layer-dot"></span>
      <span class="layer-btn-text">
        <span class="layer-btn-label">Food Production Zones</span>
        <span class="layer-btn-unit">by food group</span>
      </span>
    </button>
  </div>

  {#if breadbasketActive}
    <div class="opacity-slider-row">
      <input
        type="range"
        class="opacity-slider"
        min="0" max="1" step="0.05"
        value={layerOpacity.breadbaskets}
        oninput={(e) => onOpacityChange('breadbaskets', parseFloat(e.target.value))}
        style="--slider-color: #e6a532"
      />
      <span class="opacity-value">{Math.round(layerOpacity.breadbaskets * 100)}%</span>
    </div>
  {/if}

  <hr class="panel-divider" />

  <!-- Transport Network -->
  <div class="panel-section-label">Transport Network</div>

  <div class="layer-btn-wrapper">
    <button
      class="layer-btn {infraActive ? 'active' : ''}"
      style="--btn-color: #38bdf8"
      onclick={() => onToggle('infrastructure')}
      onmouseenter={(e) => showTooltip(e, 'infrastructure')}
      onmouseleave={hideTooltip}
    >
      <span class="layer-dot"></span>
      <span class="layer-btn-text">
        <span class="layer-btn-label">Infrastructure Edges</span>
        <span class="layer-btn-unit">click any edge for details</span>
      </span>
    </button>
  </div>

</div>

<!-- Layer description tooltip -->
{#if tooltipKey && LAYER_DESCRIPTIONS[tooltipKey]}
  {@const info = LAYER_DESCRIPTIONS[tooltipKey]}
  <div
    class="layer-tooltip"
    style="top: {tooltipPos.top}px; left: {tooltipPos.left}px; transform: translate(0, -50%)"
  >
    {info.text}
    {#if info.source}
      <span class="tooltip-source">{info.source}</span>
    {/if}
  </div>
{/if}

<!-- Info button tooltip -->
{#if infoTooltipVisible}
  <div
    class="layer-tooltip"
    style="top: {infoTooltipPos.top}px; left: {infoTooltipPos.left}px; transform: translate(0, 0)"
  >
    FAO / Plotline food transport network · Global Food Twin
    <span class="tooltip-source">Plotline (2024)</span>
  </div>
{/if}
