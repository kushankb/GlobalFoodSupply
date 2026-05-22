<script>
  let open = $state(false);
</script>

<div class="info-panel {open ? 'open' : 'closed'}">
  <button class="info-toggle" onclick={() => { open = !open; }}>
    {open ? "\u2715 Close" : "\u2139 About this map"}
  </button>

  {#if open}
    <div class="info-content">
      <p class="info-desc">
        This map visualises the global food system \u2014 where food is grown and the infrastructure that moves it around the world.
      </p>

      <div class="info-section-title">Food Production Zones</div>
      <p class="info-desc">
        Dots show food-producing areas coloured by their dominant food group \u2014 the crop type most unusually concentrated in that location relative to its global distribution. Zoom in to explore subnational detail. Click any country or state to see a breakdown by food group.
      </p>

      <div class="info-section-title">Critical Infrastructure</div>
      <p class="info-desc">
        Lines represent global food transport edges \u2014 maritime routes, railways, roads, and inland waterways. Brightness and width reflect each link's criticality: how much of the world's food quantity flows through it relative to all other infrastructure. Click any edge to see food flow, nutrient content, and the countries most dependent on it.
      </p>

      <div class="info-section-title">Data Sources</div>
      <div class="info-sources">
        <div class="info-source-row">
          <span class="info-source-label">Food production zones</span>
          <span class="info-source-value">Plotline production dataset \u00B7 Z-score classification</span>
        </div>
        <div class="info-source-row">
          <span class="info-source-label">Transport network</span>
          <span class="info-source-value">FAO / Plotline Global Food Twin</span>
        </div>
        <div class="info-source-row">
          <span class="info-source-label">Subnational stats</span>
          <span class="info-source-value">FAOSTAT \u00B7 Global Food Twin</span>
        </div>
      </div>

      <div class="info-built-by">
        Built by
        <a
          href="https://kushankbajaj.com"
          target="_blank"
          rel="noopener noreferrer"
          class="info-cite-link"
        >Kushank Bajaj</a>
      </div>
    </div>
  {/if}
</div>
