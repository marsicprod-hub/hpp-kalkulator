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
  targetProfit: 0,
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

const savedRecipes = safeParse(localStorage.getItem(STORAGE_KEYS.recipes), []);
const formatCurrency = (value) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
const formatNumber = (value, digits = 2) =>
  Number(value || 0).toLocaleString("id-ID", { maximumFractionDigits: digits });
const escapeHTML = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]);

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
  const estimatedProfit = profitPerProduct * productCount;
  const breakEvenUnits = roundedSellingPrice > 0 && roundedSellingPrice > hppPerProduct
    ? Math.ceil(Math.max(0, Number(state.fixedCosts) || 0) / (roundedSellingPrice - hppPerProduct))
    : 0;
  const breakEvenRevenue = breakEvenUnits * roundedSellingPrice;

  return {
    productCount, ingredientTotal, overheadTotal, toppingPerProduct, packagingPerProduct,
    toppingTotal, packagingTotal, totalProductionCost, hppPerProduct,
    sellingPrice: roundedSellingPrice, profitPerProduct, estimatedProfit,
    breakEvenUnits, breakEvenRevenue,
  };
};

app.innerHTML = `
  <header class="app-header">
    <div>
      <p class="eyebrow">PRODUCTION COSTING · UMKM</p>
      <h1>HPP Kalkulator</h1>
      <p class="subtitle">Dari takaran resep sampai harga jual, margin, dan titik impas. Biar jualan pakai hitungan, bukan tebak-tebakan.</p>
    </div>
    <div class="header-actions">
      <button id="saveRecipe" class="button" type="button">Simpan Resep</button>
      <button id="exportData" class="button button-secondary" type="button">Ekspor Backup</button>
      <button id="importData" class="button button-secondary" type="button">Impor Backup</button>
      <input id="backupFile" class="visually-hidden" type="file" accept="application/json,.json" />
      <button id="resetApp" class="button button-secondary" type="button">Reset Data</button>
    </div>
  </header>

  <main>
    <section class="card product-card">
      <div class="section-heading"><div><p class="section-number">01</p><h2>Informasi Produk</h2></div></div>
      <div class="form-grid">
        <label>Nama Produk<input id="productName" type="text" placeholder="Contoh: Donat Cokelat" /></label>
        <label>Target Margin (%)<input id="margin" type="number" min="0" max="99" step="1" /><span class="field-hint">Margin dihitung dari harga jual, bukan markup dari HPP.</span></label>
      </div>
    </section>

    <section class="card">
      <div class="section-heading"><div><p class="section-number">02</p><h2>Rencana Produksi</h2></div><span id="productionBadge" class="badge">0 pcs</span></div>
      <div class="form-grid">
        <label>Total Berat Adonan (gram)<input id="totalDoughWeight" type="number" min="0" step="any" placeholder="2000" /></label>
        <label>Berat per Produk (gram)<input id="productWeight" type="number" min="0" step="any" placeholder="25" /></label>
      </div>
      <div id="productionResult" class="inline-result"></div>
      <div class="field-note">Jumlah produk memakai bilangan bulat ke bawah. Sisa adonan tidak dihitung sebagai produk jadi.</div>
    </section>

    <section class="card">
      <div class="section-heading"><div><p class="section-number">03</p><h2>Bahan Adonan</h2></div><span id="ingredientCount" class="badge">0 bahan</span></div>
      <div class="form-grid ingredient-form">
        <label>Nama Bahan<input id="ingredientName" type="text" placeholder="Tepung terigu" /></label>
        <label>Harga Beli (Rp)<input id="ingredientPrice" type="number" min="0" step="any" placeholder="15000" /></label>
        <label>Isi Kemasan<input id="ingredientWeight" type="number" min="0" step="any" placeholder="1" /></label>
        <label>Satuan Kemasan<select id="ingredientUnit"><option value="g">Gram (g)</option><option value="kg">Kilogram (kg)</option><option value="ml">Mililiter (ml)</option><option value="l">Liter (L)</option><option value="pcs">Butir/pcs</option></select></label>
        <label>Jumlah Dipakai<input id="ingredientUsed" type="number" min="0" step="any" placeholder="250" /></label>
        <label>Satuan Pemakaian<select id="ingredientUsedUnit"><option value="g">Gram (g)</option><option value="kg">Kilogram (kg)</option><option value="ml">Mililiter (ml)</option><option value="l">Liter (L)</option><option value="pcs">Butir/pcs</option></select></label>
      </div>
      <p class="field-note">Konversi g↔kg dan ml↔liter otomatis. Butir/pcs hanya bisa dihitung dengan satuan yang sama. Telur tetap bisa dicatat per butir tanpa dipaksa jadi gram.</p>
      <button id="addIngredient" class="button" type="button">+ Tambah Bahan</button>
      <div id="ingredientList" class="item-list"></div>
      <div class="section-total"><span>Total biaya bahan untuk 1 batch</span><strong id="ingredientTotal">Rp 0</strong></div>
    </section>

    <section class="card">
      <div class="section-heading"><div><p class="section-number">04</p><h2>Overhead Produksi</h2><p>Biaya untuk satu batch, misalnya gas, listrik, atau tenaga kerja.</p></div><strong id="overheadTotal" class="section-total-value">Rp 0</strong></div>
      <div class="form-grid"><label>Nama Biaya<input id="overheadName" type="text" placeholder="Gas, listrik, tenaga kerja..." /></label><label>Total Biaya (Rp)<input id="overheadCost" type="number" min="0" step="any" placeholder="25000" /></label></div>
      <button id="addOverhead" class="button" type="button">+ Tambah Overhead</button><div id="overheadList" class="item-list"></div>
    </section>

    <section class="card">
      <div class="section-heading"><div><p class="section-number">05</p><h2>Topping per Produk</h2><p>Biaya bahan topping yang digunakan untuk satu produk.</p></div><strong id="toppingTotal" class="section-total-value">Rp 0</strong></div>
      <div class="form-grid ingredient-form">
        <label>Nama Topping<input id="toppingName" type="text" placeholder="Cokelat" /></label>
        <label>Harga Beli (Rp)<input id="toppingPrice" type="number" min="0" step="any" placeholder="20000" /></label>
        <label>Isi Kemasan (gram/ml)<input id="toppingWeight" type="number" min="0" step="any" placeholder="200" /></label>
        <label>Pakai per Produk (gram/ml)<input id="toppingUsed" type="number" min="0" step="any" placeholder="10" /></label>
      </div>
      <button id="addTopping" class="button" type="button">+ Tambah Topping</button><div id="toppingList" class="item-list"></div>
    </section>

    <section class="card">
      <div class="section-heading"><div><p class="section-number">06</p><h2>Kemasan per Produk</h2><p>Biaya box, plastik, label, stiker, atau paper bag per produk.</p></div><strong id="packagingTotal" class="section-total-value">Rp 0</strong></div>
      <div class="form-grid"><label>Nama Kemasan<input id="packagingName" type="text" placeholder="Box donat" /></label><label>Harga per Unit (Rp)<input id="packagingPrice" type="number" min="0" step="any" placeholder="1500" /></label></div>
      <button id="addPackaging" class="button" type="button">+ Tambah Kemasan</button><div id="packagingList" class="item-list"></div>
    </section>

    <section class="card">
      <div class="section-heading"><div><p class="section-number">07</p><h2>Biaya Tetap & Target</h2><p>Untuk simulasi titik impas, misalnya biaya sewa atau langganan bulanan.</p></div></div>
      <div class="form-grid"><label>Biaya Tetap Per Periode (Rp)<input id="fixedCosts" type="number" min="0" step="any" placeholder="500000" /></label><label>Target Produk Terjual (pcs)<input id="targetUnits" type="number" min="0" step="1" placeholder="100" /></label></div>
      <p class="field-note">Biaya tetap hanya dipakai untuk menghitung titik impas. Pilih periode konsisten dengan target penjualan yang Anda rencanakan.</p>
    </section>

    <section class="card recipe-card">
      <div class="section-heading"><div><p class="section-number">08</p><h2>Resep Tersimpan</h2><p>Simpan dan buka kembali resep di browser ini.</p></div><span id="recipeCount" class="badge">0 resep</span></div>
      <div id="recipeList" class="recipe-list"></div><div id="recipeEmpty" class="empty-state">Belum ada resep tersimpan.</div>
    </section>

    <section class="card summary-card">
      <div class="section-heading"><div><p class="section-number">09</p><h2>Ringkasan HPP & Harga Jual</h2><p>Nilai diperbarui otomatis saat data diubah.</p></div></div>
      <div class="summary-grid">
        <div><span>Bahan Adonan</span><strong id="summaryIngredient">Rp 0</strong></div>
        <div><span>Overhead Batch</span><strong id="summaryOverhead">Rp 0</strong></div>
        <div><span>Topping Batch</span><strong id="summaryTopping">Rp 0</strong></div>
        <div><span>Kemasan Batch</span><strong id="summaryPackaging">Rp 0</strong></div>
      </div>
      <div class="grand-total"><span>HPP per Produk</span><strong id="finalHpp">Rp 0</strong></div>
      <div class="pricing-grid">
        <div><span>Harga Jual Rekomendasi</span><strong id="sellingPrice">Rp 0</strong></div>
        <div><span>Profit per Produk</span><strong id="profitPerProduct">Rp 0</strong></div>
        <div><span>Estimasi Profit 1 Batch</span><strong id="estimatedProfit">Rp 0</strong></div>
      </div>
      <div class="break-even-panel">
        <div><span>Titik Impas (produk)</span><strong id="breakEvenUnits">0 pcs</strong></div>
        <div><span>Omzet Saat Titik Impas</span><strong id="breakEvenRevenue">Rp 0</strong></div>
        <div><span>Estimasi omzet target</span><strong id="targetRevenue">Rp 0</strong></div>
        <div><span>Estimasi profit target*</span><strong id="targetProfit">Rp 0</strong></div>
      </div>
      <p class="field-note">*Estimasi target mengurangi biaya tetap dari kontribusi profit per produk. Belum termasuk pajak, diskon, produk gagal, atau biaya penjualan lain yang belum dicatat.</p>
      <div class="summary-actions"><button id="printSummary" class="button" type="button">Cetak / Simpan PDF</button><button id="shareSummary" class="button button-secondary" type="button">Salin Ringkasan</button></div>
      <textarea id="summaryText" class="summary-text" readonly aria-label="Ringkasan HPP untuk disalin"></textarea>
    </section>
  </main>
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

function normalizePair(quantity, unit, baseUnit) {
  const factors = {
    g: { g: 1, kg: 1000 },
    kg: { g: 0.001, kg: 1 },
    ml: { ml: 1, l: 1000 },
    l: { ml: 0.001, l: 1 },
    pcs: { pcs: 1 },
  };
  if (factors[unit]?.[baseUnit] === undefined) return null;
  return quantity * factors[unit][baseUnit];
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
  if (!name || !Number.isFinite(price) || price < 0 || cost === null) {
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
  if (!name || !Number.isFinite(price) || price < 0 || weight <= 0 || used <= 0) {
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
  el("breakEvenUnits").textContent = `${totals.breakEvenUnits} pcs`;
  el("breakEvenRevenue").textContent = formatCurrency(totals.breakEvenRevenue);

  const targetUnits = Math.max(0, Math.floor(Number(state.targetUnits) || 0));
  const targetRevenue = targetUnits * totals.sellingPrice;
  const targetProfit = targetUnits * totals.profitPerProduct - Math.max(0, Number(state.fixedCosts) || 0);
  el("targetRevenue").textContent = formatCurrency(targetRevenue);
  el("targetProfit").textContent = formatCurrency(targetProfit);

  el("summaryText").value = makeSummary(totals);
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
