import "./style.css";

const app = document.querySelector("#app");
const STORAGE_KEYS = {
  state: "hpp-kalkulator-state",
  recipes: "hpp-kalkulator-recipes",
};

const DEFAULT_STATE = {
  productName: "",
  totalDoughWeight: 0,
  productWeight: 0,
  margin: 30,
  ingredients: [],
  overheads: [],
  toppings: [],
  packaging: [],
  fixedCosts: 0,
  targetUnits: 0,
};

const safeParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const loadedState = safeParse(localStorage.getItem(STORAGE_KEYS.state), {});
const state = {
  ...DEFAULT_STATE,
  ...loadedState,
  ingredients: Array.isArray(loadedState.ingredients) ? loadedState.ingredients : [],
  overheads: Array.isArray(loadedState.overheads) ? loadedState.overheads : [],
  toppings: Array.isArray(loadedState.toppings) ? loadedState.toppings : [],
  packaging: Array.isArray(loadedState.packaging) ? loadedState.packaging : [],
};

const loadedRecipes = safeParse(localStorage.getItem(STORAGE_KEYS.recipes), []);
const savedRecipes = Array.isArray(loadedRecipes) ? loadedRecipes : [];
const formatCurrency = (value) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
const formatNumber = (value, digits = 2) =>
  Number(value || 0).toLocaleString("id-ID", { maximumFractionDigits: digits });
const saveState = () => localStorage.setItem(STORAGE_KEYS.state, JSON.stringify(state));
const saveRecipes = () => localStorage.setItem(STORAGE_KEYS.recipes, JSON.stringify(savedRecipes));
const calculateProductCount = () => {
  if (state.totalDoughWeight <= 0 || state.productWeight <= 0) return 0;
  return Math.floor(state.totalDoughWeight / state.productWeight);
};
const sumCosts = (items) => items.reduce((total, item) => total + Number(item.cost || 0), 0);
const calculateIngredientTotal = () => sumCosts(state.ingredients);
const calculateOverheadTotal = () => sumCosts(state.overheads);
const calculateToppingPerProduct = () => sumCosts(state.toppings);
const calculatePackagingPerProduct = () => sumCosts(state.packaging);

const calculateTotals = () => {
  const productCount = calculateProductCount();
  const ingredientTotal = calculateIngredientTotal();
  const overheadTotal = calculateOverheadTotal();
  const toppingPerProduct = calculateToppingPerProduct();
  const packagingPerProduct = calculatePackagingPerProduct();
  const toppingTotal = toppingPerProduct * productCount;
  const packagingTotal = packagingPerProduct * productCount;
  const totalProductionCost = ingredientTotal + overheadTotal + toppingTotal + packagingTotal;
  const hppPerProduct = productCount > 0 ? totalProductionCost / productCount : 0;
  const margin = Math.min(99, Math.max(0, Number(state.margin) || 0));
  const sellingPrice = hppPerProduct > 0 ? hppPerProduct / (1 - margin / 100) : 0;
  const roundedSellingPrice = sellingPrice > 0 ? Math.ceil(sellingPrice / 100) * 100 : 0;
  const profitPerProduct = roundedSellingPrice - hppPerProduct;
  const actualMargin = roundedSellingPrice > 0 ? (profitPerProduct / roundedSellingPrice) * 100 : 0;
  const estimatedProfit = profitPerProduct * productCount;
  const breakEvenUnits = roundedSellingPrice > 0 && roundedSellingPrice > hppPerProduct
    ? Math.ceil(Math.max(0, Number(state.fixedCosts) || 0) / (roundedSellingPrice - hppPerProduct))
    : 0;
  const breakEvenRevenue = breakEvenUnits * roundedSellingPrice;

  return {
    productCount, ingredientTotal, overheadTotal, toppingPerProduct, packagingPerProduct,
    toppingTotal, packagingTotal, totalProductionCost, hppPerProduct,
    sellingPrice: roundedSellingPrice, profitPerProduct, actualMargin, estimatedProfit,
    breakEvenUnits, breakEvenRevenue,
  };
};

app.innerHTML = `
  <header class="app-header">
    <a class="brand-lockup" href="#step-setup" aria-label="HPP Studio, ke awal kalkulator">
      <span class="brand-mark">H</span>
      <span class="brand-copy">
        <strong>hpp<span>studio</span></strong>
        <small>WORKSPACE UMKM</small>
      </span>
    </a>
    <div class="header-context">
      <span class="header-context-dot"></span>
      <span>Ruang kerja produksi</span>
      <span class="header-context-separator">/</span>
      <span id="headerProductName">Produk baru</span>
    </div>
    <div class="header-actions">
      <button id="saveRecipe" class="button button-primary" type="button"><span class="button-icon">＋</span> Simpan resep</button>
      <div class="action-menu">
        <button id="backupMenu" class="button button-secondary" type="button" aria-label="Pilihan backup" aria-expanded="false"><span class="button-icon">↕</span><span class="backup-label">Backup</span><span aria-hidden="true">⌄</span></button>
        <div id="backupPopover" class="action-popover" hidden>
          <button id="exportData" type="button"><span>↗</span><span><strong>Ekspor data</strong><small>Unduh file backup JSON</small></span></button>
          <button id="importData" type="button"><span>↙</span><span><strong>Impor data</strong><small>Pulihkan dari file backup</small></span></button>
        </div>
        <input id="backupFile" class="visually-hidden" type="file" accept="application/json,.json" />
      </div>
      <button id="resetApp" class="icon-utility" type="button" aria-label="Reset kalkulator" title="Reset data aktif">↺</button>
    </div>
  </header>

  <div class="app-shell">
    <aside class="workflow-sidebar" aria-label="Navigasi alur kerja">
      <div class="sidebar-overline">ALUR KERJA</div>
      <div class="workflow-nav" role="navigation" aria-label="Langkah kalkulator">
        <a class="workflow-link is-active" href="#step-setup" data-workflow-link="setup">
          <span class="workflow-link-icon">01</span>
          <span class="workflow-link-copy"><strong>Mulai produk</strong><small>Identitas & hasil batch</small></span>
          <span class="workflow-link-status" aria-hidden="true">•</span>
        </a>
        <a class="workflow-link" href="#step-materials" data-workflow-link="materials">
          <span class="workflow-link-icon">02</span>
          <span class="workflow-link-copy"><strong>Bahan adonan</strong><small>Takaran & biaya bahan</small></span>
          <span class="workflow-link-status" aria-hidden="true">•</span>
        </a>
        <a class="workflow-link" href="#step-overheads" data-workflow-link="overheads">
          <span class="workflow-link-icon">03</span>
          <span class="workflow-link-copy"><strong>Biaya tambahan</strong><small>Overhead, topping, kemasan</small></span>
          <span class="workflow-link-status" aria-hidden="true">•</span>
        </a>
        <a class="workflow-link" href="#step-planning" data-workflow-link="planning">
          <span class="workflow-link-icon">04</span>
          <span class="workflow-link-copy"><strong>Target & resep</strong><small>Titik impas dan simpanan</small></span>
          <span class="workflow-link-status" aria-hidden="true">•</span>
        </a>
        <a class="workflow-link" href="#summary-card" data-workflow-link="summary">
          <span class="workflow-link-icon workflow-result-icon">↗</span>
          <span class="workflow-link-copy"><strong>Ringkasan HPP</strong><small>Harga jual & profit</small></span>
          <span class="workflow-link-status" aria-hidden="true">•</span>
        </a>
      </div>

      <div class="sidebar-progress">
        <div class="sidebar-progress-top"><span>Kelengkapan</span><strong id="workflowProgressText">0 dari 5 bagian</strong></div>
        <div class="progress-track"><span id="workflowProgressBar"></span></div>
        <p>Isi data bertahap. Hasil HPP diperbarui otomatis saat ada perubahan.</p>
      </div>

      <a class="sidebar-recipe-shortcut" href="#recipe-card">
        <span class="shortcut-icon">▤</span>
        <span><strong>Perpustakaan resep</strong><small id="sidebarRecipeCount">0 resep tersimpan</small></span>
        <span class="shortcut-arrow">↗</span>
      </a>
      <div class="sidebar-footnote"><span class="privacy-icon">⌑</span><span>Data tersimpan di browser ini. Ekspor backup sebelum pindah perangkat.</span></div>
    </aside>

    <main class="workflow-main">
      <div class="workspace-heading">
        <div>
          <div class="workspace-kicker"><span class="kicker-line"></span> PRODUCTION WORKSPACE</div>
          <h1>Hitung biaya.<br /><span>Jual dengan yakin.</span></h1>
          <p>Bangun resep, hitung biaya produksi, lalu temukan harga jual yang masuk akal.</p>
        </div>
        <div class="workspace-date"><span class="date-indicator"></span><span>Mode kalkulasi lokal</span></div>
      </div>

      <section id="step-setup" class="workflow-stage" data-workflow-panel="setup">
        <div class="stage-heading">
          <div class="stage-number">01</div>
          <div><p class="stage-kicker">MULAI DARI SINI</p><h2>Kenali produkmu</h2><p>Atur identitas produk dan target hasil produksi.</p></div>
        </div>
        <div class="stage-grid setup-grid">
          <section class="card product-card">
            <div class="card-heading">
              <div class="card-heading-symbol product-symbol">✳</div>
              <div><h3>Informasi produk</h3><p>Nama dan target margin keuntungan.</p></div>
            </div>
            <div class="form-grid">
              <label>Nama produk<input id="productName" type="text" placeholder="Contoh: Donat Cokelat" /></label>
              <label>Target margin (%)<input id="margin" type="number" min="0" max="99" step="1" /><span class="field-hint">Margin dihitung dari harga jual, bukan markup HPP.</span></label>
            </div>
          </section>

          <section class="card production-card">
            <div class="card-heading">
              <div class="card-heading-symbol production-symbol">◉</div>
              <div><h3>Hasil produksi</h3><p>Berapa produk yang dihasilkan dari satu batch?</p></div>
              <span id="productionBadge" class="badge badge-accent">0 pcs</span>
            </div>
            <div class="form-grid">
              <label>Total berat adonan (g)<input id="totalDoughWeight" type="number" min="0" step="any" placeholder="2000" /></label>
              <label>Berat per produk (g)<input id="productWeight" type="number" min="0" step="any" placeholder="25" /></label>
            </div>
            <div id="productionResult" class="inline-result">Masukkan berat adonan dan produk.</div>
            <p class="field-note">Hasil produksi memakai jumlah produk utuh. Sisa adonan dihitung terpisah.</p>
          </section>
        </div>
      </section>

      <section id="step-materials" class="workflow-stage" data-workflow-panel="materials">
        <div class="stage-heading">
          <div class="stage-number">02</div>
          <div><p class="stage-kicker">RESEP DASAR</p><h2>Masukkan bahan adonan</h2><p>Biaya dihitung otomatis dari harga beli dan jumlah yang digunakan.</p></div>
          <span id="ingredientCount" class="badge">0 bahan</span>
        </div>
        <section class="card ingredient-card">
          <div class="card-heading">
            <div class="card-heading-symbol ingredient-symbol">⌁</div>
            <div><h3>Komposisi bahan</h3><p>Isi satuan kemasan dan satuan pemakaian. Konversi yang sesuai akan dihitung otomatis.</p></div>
          </div>
          <div class="form-grid ingredient-form">
            <label class="field-wide">Nama bahan<input id="ingredientName" type="text" placeholder="Tepung terigu" /></label>
            <label>Harga beli (Rp)<input id="ingredientPrice" type="number" min="0" step="any" placeholder="15000" /></label>
            <label>Isi kemasan<input id="ingredientWeight" type="number" min="0" step="any" placeholder="1" /></label>
            <label>Satuan kemasan<select id="ingredientUnit"><option value="g">Gram (g)</option><option value="kg">Kilogram (kg)</option><option value="ml">Mililiter (ml)</option><option value="l">Liter (L)</option><option value="pcs">Butir/pcs</option></select></label>
            <label>Jumlah dipakai<input id="ingredientUsed" type="number" min="0" step="any" placeholder="250" /></label>
            <label>Satuan pemakaian<select id="ingredientUsedUnit"><option value="g">Gram (g)</option><option value="kg">Kilogram (kg)</option><option value="ml">Mililiter (ml)</option><option value="l">Liter (L)</option><option value="pcs">Butir/pcs</option></select></label>
          </div>
          <div class="form-note-row"><span class="note-check">✓</span><p>Gram ↔ kilogram dan ml ↔ liter didukung. Butir/pcs hanya dikonversi ke satuan yang sama, karena telur tidak otomatis berubah jadi gram tanpa asumsi.</p></div>
          <div class="card-action-row"><button id="addIngredient" class="button button-primary" type="button"><span class="button-icon">＋</span> Tambah bahan</button><span class="action-hint">Bisa tambah bahan sebanyak yang dibutuhkan.</span></div>
          <div id="ingredientList" class="item-list"></div>
          <div class="section-total"><span>Total biaya bahan · 1 batch</span><strong id="ingredientTotal">Rp 0</strong></div>
        </section>
      </section>

      <section id="step-overheads" class="workflow-stage" data-workflow-panel="overheads">
        <div class="stage-heading">
          <div class="stage-number">03</div>
          <div><p class="stage-kicker">BIAYA PENDUKUNG</p><h2>Lengkapi biaya produksi</h2><p>Jangan sampai ada biaya kecil yang diam-diam menggerus keuntungan.</p></div>
        </div>
        <div class="stage-grid cost-grid">
          <section class="card cost-card overhead-card">
            <div class="card-heading">
              <div class="card-heading-symbol overhead-symbol">⌂</div>
              <div><h3>Overhead batch</h3><p>Gas, listrik, tenaga kerja, atau biaya produksi lain.</p></div>
            </div>
            <div class="form-grid"><label>Nama biaya<input id="overheadName" type="text" placeholder="Gas, listrik, tenaga kerja..." /></label><label>Total biaya (Rp)<input id="overheadCost" type="number" min="0" step="any" placeholder="25000" /></label></div>
            <button id="addOverhead" class="button button-secondary" type="button"><span class="button-icon">＋</span> Tambah overhead</button>
            <div id="overheadList" class="item-list"></div>
            <div class="section-total"><span>Subtotal overhead</span><strong id="overheadTotal">Rp 0</strong></div>
          </section>

          <section class="card cost-card topping-card">
            <div class="card-heading">
              <div class="card-heading-symbol topping-symbol">✺</div>
              <div><h3>Topping per produk</h3><p>Hitung biaya topping sesuai takaran per produk.</p></div>
            </div>
            <div class="form-grid"><label>Nama topping<input id="toppingName" type="text" placeholder="Cokelat" /></label><label>Harga beli (Rp)<input id="toppingPrice" type="number" min="0" step="any" placeholder="20000" /></label><label>Isi kemasan (g/ml)<input id="toppingWeight" type="number" min="0" step="any" placeholder="200" /></label><label>Pakai per produk (g/ml)<input id="toppingUsed" type="number" min="0" step="any" placeholder="10" /></label></div>
            <button id="addTopping" class="button button-secondary" type="button"><span class="button-icon">＋</span> Tambah topping</button>
            <div id="toppingList" class="item-list"></div>
            <div class="section-total"><span>Biaya topping per produk</span><strong id="toppingTotal">Rp 0 / produk</strong></div>
          </section>

          <section class="card cost-card packaging-card">
            <div class="card-heading">
              <div class="card-heading-symbol packaging-symbol">▱</div>
              <div><h3>Kemasan per produk</h3><p>Box, plastik, label, stiker, atau paper bag.</p></div>
            </div>
            <div class="form-grid"><label>Nama kemasan<input id="packagingName" type="text" placeholder="Box donat" /></label><label>Harga per unit (Rp)<input id="packagingPrice" type="number" min="0" step="any" placeholder="1500" /></label></div>
            <button id="addPackaging" class="button button-secondary" type="button"><span class="button-icon">＋</span> Tambah kemasan</button>
            <div id="packagingList" class="item-list"></div>
            <div class="section-total"><span>Biaya kemasan per produk</span><strong id="packagingTotal">Rp 0 / produk</strong></div>
          </section>
        </div>
      </section>

      <section id="step-planning" class="workflow-stage" data-workflow-panel="planning">
        <div class="stage-heading">
          <div class="stage-number">04</div>
          <div><p class="stage-kicker">PERENCANAAN USAHA</p><h2>Rencanakan target dan simpan resep</h2><p>Gunakan angka biaya tetap untuk simulasi titik impas. Simpan resep agar mudah dipakai lagi.</p></div>
        </div>
        <div class="stage-grid planning-grid">
          <section class="card planning-card">
            <div class="card-heading">
              <div class="card-heading-symbol target-symbol">◎</div>
              <div><h3>Target penjualan</h3><p>Periode biaya tetap dan target produk harus konsisten.</p></div>
            </div>
            <div class="form-grid"><label>Biaya tetap per periode (Rp)<input id="fixedCosts" type="number" min="0" step="any" placeholder="500000" /></label><label>Target produk terjual (pcs)<input id="targetUnits" type="number" min="0" step="1" placeholder="100" /></label></div>
            <p class="field-note">Biaya tetap bisa berupa sewa, langganan, atau biaya lain yang tidak bergantung langsung pada jumlah produk.</p>
          </section>

          <section id="recipe-card" class="card recipe-card">
            <div class="card-heading">
              <div class="card-heading-symbol recipe-symbol">▤</div>
              <div><h3>Perpustakaan resep</h3><p>Simpan versi resep dan buka lagi saat produksi berikutnya.</p></div>
              <span id="recipeCount" class="badge">0 resep</span>
            </div>
            <div id="recipeList" class="recipe-list"></div>
            <div id="recipeEmpty" class="empty-state"><span class="empty-state-icon">＋</span><strong>Belum ada resep tersimpan</strong><span>Selesaikan data produk, lalu pilih “Simpan resep”.</span></div>
          </section>
        </div>
      </section>
      <footer class="workspace-footer"><span>HPP Studio</span><span>Periksa hasil kalkulasi sebelum menentukan harga jual.</span></footer>
    </main>

    <aside class="summary-rail" aria-label="Ringkasan HPP">
      <section id="summary-card" class="card summary-card" data-workflow-panel="summary">
        <div class="summary-rail-heading"><div><p class="stage-kicker">LIVE CALCULATION</p><h2>Ringkasan HPP</h2></div><span class="live-pill"><span></span> Live</span></div>
        <p id="summaryProductName" class="summary-product-name">Produk belum diberi nama</p>
        <div class="summary-output">
          <span class="summary-output-label">HPP per produk</span>
          <strong id="finalHpp">Rp 0</strong>
          <span class="summary-output-caption">Modal produksi untuk satu produk</span>
        </div>
        <div class="summary-price-highlight"><div><span>Harga jual rekomendasi</span><strong id="sellingPrice">Rp 0</strong></div><span class="price-arrow">↗</span></div>
        <div class="summary-profit-row">
          <div><span>Profit / produk</span><strong id="profitPerProduct">Rp 0</strong></div>
          <div><span>Margin aktual</span><strong id="actualMargin">0%</strong></div>
        </div>
        <div class="summary-breakdown-heading"><h3>Rincian biaya batch</h3><span id="summaryBatchCount">0 pcs</span></div>
        <div class="summary-breakdown">
          <div><span><i class="breakdown-dot ingredient-dot"></i>Bahan adonan</span><strong id="summaryIngredient">Rp 0</strong></div>
          <div><span><i class="breakdown-dot overhead-dot"></i>Overhead</span><strong id="summaryOverhead">Rp 0</strong></div>
          <div><span><i class="breakdown-dot topping-dot"></i>Topping</span><strong id="summaryTopping">Rp 0</strong></div>
          <div><span><i class="breakdown-dot packaging-dot"></i>Kemasan</span><strong id="summaryPackaging">Rp 0</strong></div>
        </div>
        <div class="summary-total-row"><span>Total biaya satu batch</span><strong id="summaryTotalCost">Rp 0</strong></div>
        <div class="summary-batch-profit"><span>Estimasi profit satu batch</span><strong id="estimatedProfit">Rp 0</strong></div>
        <div class="summary-break-even">
          <div><span>Titik impas</span><strong id="breakEvenUnits">0 pcs</strong></div>
          <div><span>Omzet titik impas</span><strong id="breakEvenRevenue">Rp 0</strong></div>
          <div><span>Omzet target</span><strong id="targetRevenue">Rp 0</strong></div>
          <div><span>Profit target*</span><strong id="targetProfit">Rp 0</strong></div>
        </div>
        <p class="summary-disclaimer">*Estimasi berdasarkan data yang dimasukkan, belum termasuk pajak, diskon, produk gagal, dan biaya penjualan lain yang belum dicatat.</p>
        <div class="summary-actions"><button id="printSummary" class="button button-primary" type="button"><span class="button-icon">↧</span> Cetak / simpan PDF</button><button id="shareSummary" class="button button-secondary" type="button"><span class="button-icon">▣</span> Salin ringkasan</button></div>
        <textarea id="summaryText" class="summary-text" readonly aria-label="Ringkasan HPP untuk disalin"></textarea>
      </section>
    </aside>
  </div>

  <div id="mobileSummaryDock" class="mobile-summary-dock">
    <div class="mobile-summary-copy"><span>HPP / produk</span><strong id="mobileHpp">Rp 0</strong></div>
    <div class="mobile-summary-divider"></div>
    <div class="mobile-summary-copy"><span>Harga jual</span><strong id="mobileSellingPrice">Rp 0</strong></div>
    <a href="#summary-card" class="mobile-summary-open">Lihat hasil <span>↗</span></a>
  </div>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
`;

const el = (id) => document.getElementById(id);
const inputs = {
  productName: el("productName"), margin: el("margin"),
  totalDoughWeight: el("totalDoughWeight"), productWeight: el("productWeight"),
  ingredientName: el("ingredientName"), ingredientPrice: el("ingredientPrice"),
  ingredientWeight: el("ingredientWeight"), ingredientUnit: el("ingredientUnit"),
  ingredientUsed: el("ingredientUsed"), ingredientUsedUnit: el("ingredientUsedUnit"),
  overheadName: el("overheadName"), overheadCost: el("overheadCost"),
  toppingName: el("toppingName"), toppingPrice: el("toppingPrice"),
  toppingWeight: el("toppingWeight"), toppingUsed: el("toppingUsed"),
  packagingName: el("packagingName"), packagingPrice: el("packagingPrice"),
  fixedCosts: el("fixedCosts"), targetUnits: el("targetUnits"),
};
const BASIC_FIELDS = new Set([
  "productName", "margin", "totalDoughWeight", "productWeight", "fixedCosts", "targetUnits",
]);

function showToast(message) {
  const toast = el("toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2800);
}

function normalizePair(quantity, unit, targetUnit) {
  const unitMeta = {
    g: { group: "mass", factor: 1 },
    kg: { group: "mass", factor: 1000 },
    ml: { group: "volume", factor: 1 },
    l: { group: "volume", factor: 1000 },
    pcs: { group: "count", factor: 1 },
  };
  const source = unitMeta[unit];
  const target = unitMeta[targetUnit];
  if (!source || !target || source.group !== target.group) return null;
  return (quantity * source.factor) / target.factor;
}

function costFromPackage(price, packageQuantity, packageUnit, usedQuantity, usedUnit) {
  const packageInBase = normalizePair(packageQuantity, packageUnit, packageUnit);
  const usedInBase = normalizePair(usedQuantity, usedUnit, packageUnit);
  if (packageInBase === null || usedInBase === null || packageInBase <= 0 || usedInBase <= 0) return null;
  return (price / packageInBase) * usedInBase;
}

function updateInputState() {
  state.productName = inputs.productName.value;
  state.margin = Math.min(99, Math.max(0, Number(inputs.margin.value) || 0));
  inputs.margin.value = state.margin;
  state.totalDoughWeight = Math.max(0, Number(inputs.totalDoughWeight.value) || 0);
  state.productWeight = Math.max(0, Number(inputs.productWeight.value) || 0);
  state.fixedCosts = Math.max(0, Number(inputs.fixedCosts.value) || 0);
  state.targetUnits = Math.max(0, Math.floor(Number(inputs.targetUnits.value) || 0));
  saveState();
  render();
}

Object.entries(inputs).forEach(([key, input]) => {
  if (BASIC_FIELDS.has(key)) input.addEventListener("input", updateInputState);
});

const addItem = (type, item) => {
  state[type].push(item);
  saveState();
  render();
};
const removeItem = (type, index) => {
  state[type].splice(index, 1);
  saveState();
  render();
};
const clearInputs = (keys) => keys.forEach((key) => { inputs[key].value = ""; });

el("addIngredient").addEventListener("click", () => {
  const price = Number(inputs.ingredientPrice.value);
  const packageQuantity = Number(inputs.ingredientWeight.value);
  const usedQuantity = Number(inputs.ingredientUsed.value);
  const packageUnit = inputs.ingredientUnit.value;
  const usedUnit = inputs.ingredientUsedUnit.value;
  const name = inputs.ingredientName.value.trim();
  const cost = costFromPackage(price, packageQuantity, packageUnit, usedQuantity, usedUnit);
  if (!name || inputs.ingredientPrice.value === "" || !Number.isFinite(price) || price < 0 || cost === null) {
    showToast("Periksa nama, harga, isi kemasan, dan satuan pemakaian.");
    return;
  }
  addItem("ingredients", {
    name, cost, used: usedQuantity, usedUnit, packageQuantity, packageUnit, price,
  });
  clearInputs(["ingredientName", "ingredientPrice", "ingredientWeight", "ingredientUsed"]);
});

el("addOverhead").addEventListener("click", () => {
  const name = inputs.overheadName.value.trim();
  const cost = Number(inputs.overheadCost.value);
  if (!name || !Number.isFinite(cost) || cost < 0 || inputs.overheadCost.value === "") {
    showToast("Isi nama dan biaya overhead yang valid.");
    return;
  }
  addItem("overheads", { name, cost });
  clearInputs(["overheadName", "overheadCost"]);
});

el("addTopping").addEventListener("click", () => {
  const name = inputs.toppingName.value.trim();
  const price = Number(inputs.toppingPrice.value);
  const weight = Number(inputs.toppingWeight.value);
  const used = Number(inputs.toppingUsed.value);
  if (!name || inputs.toppingPrice.value === "" || !Number.isFinite(price) || price < 0 || weight <= 0 || used <= 0) {
    showToast("Isi topping, harga, isi kemasan, dan pemakaian yang valid.");
    return;
  }
  addItem("toppings", { name, cost: (price / weight) * used, used, unit: "g/ml", packageQuantity: weight, price });
  clearInputs(["toppingName", "toppingPrice", "toppingWeight", "toppingUsed"]);
});

el("addPackaging").addEventListener("click", () => {
  const name = inputs.packagingName.value.trim();
  const price = Number(inputs.packagingPrice.value);
  if (!name || !Number.isFinite(price) || price < 0 || inputs.packagingPrice.value === "") {
    showToast("Isi nama dan harga kemasan yang valid.");
    return;
  }
  addItem("packaging", { name, cost: price });
  clearInputs(["packagingName", "packagingPrice"]);
});

el("resetApp").addEventListener("click", () => {
  if (!confirm("Hapus data kalkulator yang sedang aktif? Resep tersimpan tidak ikut dihapus.")) return;
  Object.assign(state, structuredClone(DEFAULT_STATE));
  saveState();
  syncInputsFromState();
  render();
  showToast("Data kalkulator aktif sudah direset.");
});

const createRecipeSnapshot = () => structuredClone(state);

function syncInputsFromState() {
  for (const key of ["productName", "margin", "totalDoughWeight", "productWeight", "fixedCosts", "targetUnits"]) {
    inputs[key].value = state[key] ?? "";
  }
}

function renderRecipes() {
  const container = el("recipeList");
  container.innerHTML = "";
  el("recipeCount").textContent = `${savedRecipes.length} resep`;
  el("recipeEmpty").hidden = savedRecipes.length > 0;

  savedRecipes.forEach((recipe, index) => {
    const card = document.createElement("div");
    card.className = "recipe-row";
    const info = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = recipe.productName || "Produk Tanpa Nama";
    const metadata = document.createElement("span");
    const savedDate = new Date(recipe.savedAt);
    metadata.textContent = `${Number.isNaN(savedDate.getTime()) ? "Tanggal tidak diketahui" : savedDate.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })} · ${recipe.data?.ingredients?.length || 0} bahan`;
    info.append(title, metadata);

    const actions = document.createElement("div");
    actions.className = "recipe-actions";
    const openButton = document.createElement("button");
    openButton.className = "button button-small";
    openButton.type = "button";
    openButton.textContent = "Buka";
    openButton.addEventListener("click", () => {
      const recipeState = recipe.data || {};
      Object.assign(state, structuredClone(DEFAULT_STATE), structuredClone(recipeState));
      saveState();
      syncInputsFromState();
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
      showToast(`Resep "${recipe.productName}" dibuka.`);
    });
    const deleteButton = document.createElement("button");
    deleteButton.className = "icon-button";
    deleteButton.type = "button";
    deleteButton.setAttribute("aria-label", `Hapus resep ${recipe.productName || ""}`);
    deleteButton.textContent = "×";
    deleteButton.addEventListener("click", () => {
      savedRecipes.splice(index, 1);
      saveRecipes();
      renderRecipes();
      showToast("Resep dihapus.");
    });
    actions.append(openButton, deleteButton);
    card.append(info, actions);
    container.appendChild(card);
  });
}

el("saveRecipe").addEventListener("click", () => {
  const name = state.productName.trim();
  if (!name) {
    inputs.productName.focus();
    showToast("Isi nama produk sebelum menyimpan resep.");
    return;
  }
  const existing = savedRecipes.findIndex((recipe) => recipe.productName.toLowerCase() === name.toLowerCase());
  const recipe = {
    id: crypto.randomUUID(),
    productName: name,
    savedAt: new Date().toISOString(),
    data: createRecipeSnapshot(),
  };
  if (existing >= 0) {
    if (!confirm(`Resep "${name}" sudah ada. Ganti dengan versi terbaru?`)) return;
    savedRecipes.splice(existing, 1);
  }
  savedRecipes.unshift(recipe);
  saveRecipes();
  renderRecipes();
  showToast("Resep berhasil disimpan.");
});

function renderList(containerId, type, formatter) {
  const container = el(containerId);
  container.innerHTML = "";
  state[type].forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "item-row";
    const info = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = item.name;
    const details = document.createElement("span");
    details.textContent = formatter(item);
    info.append(title, details);

    const actions = document.createElement("div");
    actions.className = "item-actions";
    const cost = document.createElement("strong");
    cost.textContent = formatCurrency(item.cost);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.setAttribute("aria-label", `Hapus ${item.name}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => removeItem(type, index));
    actions.append(cost, remove);
    row.append(info, actions);
    container.appendChild(row);
  });
}

function makeSummary(totals) {
  const name = state.productName.trim() || "Produk tanpa nama";
  return [
    `*RINGKASAN HPP · ${name}*`,
    `Jumlah produksi: ${totals.productCount} pcs`,
    `Total biaya bahan adonan: ${formatCurrency(totals.ingredientTotal)}`,
    `Overhead per batch: ${formatCurrency(totals.overheadTotal)}`,
    `Topping per batch: ${formatCurrency(totals.toppingTotal)}`,
    `Kemasan per batch: ${formatCurrency(totals.packagingTotal)}`,
    `Total biaya produksi: ${formatCurrency(totals.totalProductionCost)}`,
    `HPP per produk: ${formatCurrency(totals.hppPerProduct)}`,
    `Harga jual rekomendasi: ${formatCurrency(totals.sellingPrice)}`,
    `Margin aktual setelah pembulatan: ${formatNumber(totals.actualMargin, 1)}%`,
    `Estimasi profit per produk: ${formatCurrency(totals.profitPerProduct)}`,
    `Estimasi profit per batch: ${formatCurrency(totals.estimatedProfit)}`,
    `Titik impas: ${totals.breakEvenUnits} pcs / ${formatCurrency(totals.breakEvenRevenue)}`,
    `Catatan: hitungan estimasi, belum termasuk biaya lain yang belum dicatat.`,
  ].join("\n");
}

function render() {
  const totals = calculateTotals();
  el("productionBadge").textContent = `${totals.productCount} pcs`;
  const leftover = state.totalDoughWeight > 0 && state.productWeight > 0
    ? state.totalDoughWeight - totals.productCount * state.productWeight
    : 0;
  el("productionResult").textContent = totals.productCount > 0
    ? `1 batch menghasilkan ${totals.productCount} produk, sisa adonan ${formatNumber(leftover)} g.`
    : "Masukkan berat adonan dan berat per produk.";
  el("ingredientCount").textContent = `${state.ingredients.length} bahan`;

  el("ingredientTotal").textContent = formatCurrency(totals.ingredientTotal);
  el("overheadTotal").textContent = formatCurrency(totals.overheadTotal);
  el("toppingTotal").textContent = `${formatCurrency(totals.toppingPerProduct)} / produk`;
  el("packagingTotal").textContent = `${formatCurrency(totals.packagingPerProduct)} / produk`;
  el("summaryIngredient").textContent = formatCurrency(totals.ingredientTotal);
  el("summaryOverhead").textContent = formatCurrency(totals.overheadTotal);
  el("summaryTopping").textContent = formatCurrency(totals.toppingTotal);
  el("summaryPackaging").textContent = formatCurrency(totals.packagingTotal);
  el("finalHpp").textContent = formatCurrency(totals.hppPerProduct);
  el("sellingPrice").textContent = formatCurrency(totals.sellingPrice);
  el("profitPerProduct").textContent = formatCurrency(totals.profitPerProduct);
  el("estimatedProfit").textContent = formatCurrency(totals.estimatedProfit);
  el("actualMargin").textContent = `${formatNumber(totals.actualMargin, 1)}%`;
  el("breakEvenUnits").textContent = `${totals.breakEvenUnits} pcs`;
  el("breakEvenRevenue").textContent = formatCurrency(totals.breakEvenRevenue);

  const targetUnits = Math.max(0, Math.floor(Number(state.targetUnits) || 0));
  const targetRevenue = targetUnits * totals.sellingPrice;
  const targetProfit = targetUnits * totals.profitPerProduct - Math.max(0, Number(state.fixedCosts) || 0);
  el("targetRevenue").textContent = formatCurrency(targetRevenue);
  el("targetProfit").textContent = formatCurrency(targetProfit);
  el("summaryBatchCount").textContent = `${totals.productCount} pcs`;
  el("summaryTotalCost").textContent = formatCurrency(totals.totalProductionCost);
  el("mobileHpp").textContent = formatCurrency(totals.hppPerProduct);
  el("mobileSellingPrice").textContent = formatCurrency(totals.sellingPrice);
  el("headerProductName").textContent = state.productName.trim() || "Produk baru";
  el("summaryProductName").textContent = state.productName.trim() || "Produk belum diberi nama";
  el("summaryText").value = makeSummary(totals);
  updateWorkflowUI(totals);
  renderList("ingredientList", "ingredients", (item) => {
    const quantity = item.usedUnit ? `${formatNumber(item.used)} ${item.usedUnit}` : `${formatNumber(item.used)} g`;
    const purchased = item.packageUnit ? ` · beli ${formatNumber(item.packageQuantity)} ${item.packageUnit}` : "";
    return `${quantity} dipakai${purchased}`;
  });
  renderList("overheadList", "overheads", () => "Biaya per batch");
  renderList("toppingList", "toppings", (item) => `${formatNumber(item.used)} g/ml per produk`);
  renderList("packagingList", "packaging", () => "Biaya per produk");
  renderRecipes();
}

el("exportData").addEventListener("click", () => {
  const backup = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    state,
    recipes: savedRecipes,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `hpp-kalkulator-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  showToast("File backup berhasil dibuat.");
});

el("importData").addEventListener("click", () => el("backupFile").click());
el("backupFile").addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    if (!imported || typeof imported !== "object" || !imported.state || typeof imported.state !== "object") {
      throw new Error("Format backup tidak dikenal.");
    }
    const lists = ["ingredients", "overheads", "toppings", "packaging"];
    const nextState = { ...DEFAULT_STATE, ...imported.state };
    if (!lists.every((key) => Array.isArray(nextState[key]))) throw new Error("Data daftar biaya tidak valid.");
    if (!Array.isArray(imported.recipes ?? [])) throw new Error("Data resep tidak valid.");
    if (!confirm("Impor akan mengganti data aktif dan resep tersimpan pada browser ini. Lanjutkan?")) return;
    Object.assign(state, nextState);
    savedRecipes.splice(0, savedRecipes.length, ...(imported.recipes ?? []));
    saveState();
    saveRecipes();
    syncInputsFromState();
    render();
    showToast("Backup berhasil diimpor.");
  } catch (error) {
    showToast(error instanceof Error ? error.message : "File backup tidak bisa dibaca.");
  } finally {
    event.target.value = "";
  }
});

function updateWorkflowUI(totals) {
  const completion = {
    setup: Boolean(state.productName.trim()) && totals.productCount > 0,
    materials: state.ingredients.length > 0,
    overheads: state.overheads.length > 0 || state.toppings.length > 0 || state.packaging.length > 0,
    planning: Number(state.fixedCosts) > 0 || Number(state.targetUnits) > 0 || savedRecipes.length > 0,
    summary: totals.hppPerProduct > 0 && totals.sellingPrice > 0,
  };
  const done = Object.values(completion).filter(Boolean).length;
  el("workflowProgressText").textContent = `${done} dari 5 bagian`;
  el("workflowProgressBar").style.width = `${(done / 5) * 100}%`;
  el("sidebarRecipeCount").textContent = `${savedRecipes.length} resep tersimpan`;

  document.querySelectorAll("[data-workflow-link]").forEach((link) => {
    const isComplete = completion[link.dataset.workflowLink];
    link.dataset.complete = String(Boolean(isComplete));
    const status = link.querySelector(".workflow-link-status");
    if (status) status.textContent = isComplete ? "✓" : "•";
  });
}

const workflowLinks = [...document.querySelectorAll("[data-workflow-link]")];
const setActiveWorkflowLink = (key) => {
  workflowLinks.forEach((link) => {
    const active = link.dataset.workflowLink === key;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "step");
    else link.removeAttribute("aria-current");
  });
};

workflowLinks.forEach((link) => {
  link.addEventListener("click", () => setActiveWorkflowLink(link.dataset.workflowLink));
});

if ("IntersectionObserver" in window) {
  const workflowObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter((entry) => entry.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
    if (visible.length) setActiveWorkflowLink(visible[0].target.dataset.workflowPanel);
  }, { rootMargin: "-18% 0px -68% 0px", threshold: 0 });
  document.querySelectorAll('[data-workflow-panel]:not([data-workflow-panel="summary"])').forEach((panel) => workflowObserver.observe(panel));
}

el("backupMenu").addEventListener("click", () => {
  const popover = el("backupPopover");
  const open = popover.hidden;
  popover.hidden = !open;
  el("backupMenu").setAttribute("aria-expanded", String(open));
});
document.addEventListener("click", (event) => {
  if (event.target.closest(".action-menu")) return;
  el("backupPopover").hidden = true;
  el("backupMenu").setAttribute("aria-expanded", "false");
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    el("backupPopover").hidden = true;
    el("backupMenu").setAttribute("aria-expanded", "false");
  }
});

el("printSummary").addEventListener("click", () => window.print());
el("shareSummary").addEventListener("click", async () => {
  const text = el("summaryText").value;
  try {
    await navigator.clipboard.writeText(text);
    showToast("Ringkasan HPP disalin.");
  } catch {
    el("summaryText").focus();
    el("summaryText").select();
    showToast("Pilih teks ringkasan lalu salin secara manual.");
  }
});

syncInputsFromState();
render();
