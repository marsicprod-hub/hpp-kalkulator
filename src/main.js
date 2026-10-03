import "./style.css";

const app = document.querySelector("#app");

const state = JSON.parse(localStorage.getItem("hpp-kalkulator-state")) || {
  productName: "",
  totalDoughWeight: 0,
  productWeight: 0,
  margin: 30,
  ingredients: [],
  overheads: [],
  toppings: [],
  packaging: [],
};

const formatCurrency = (value) =>
  `Rp ${Number(value || 0).toLocaleString("id-ID", {
    maximumFractionDigits: 0,
  })}`;

const saveState = () => {
  localStorage.setItem("hpp-kalkulator-state", JSON.stringify(state));
};

const calculateProductCount = () => {
  if (state.totalDoughWeight <= 0 || state.productWeight <= 0) return 0;
  return state.totalDoughWeight / state.productWeight;
};

const calculateIngredientTotal = () =>
  state.ingredients.reduce((total, item) => total + item.cost, 0);

const calculateOverheadTotal = () =>
  state.overheads.reduce((total, item) => total + item.cost, 0);

const calculateToppingTotal = () =>
  state.toppings.reduce((total, item) => total + item.cost, 0);

const calculatePackagingTotal = () =>
  state.packaging.reduce((total, item) => total + item.cost, 0);

const calculateTotals = () => {
  const productCount = calculateProductCount();
  const ingredientTotal = calculateIngredientTotal();
  const overheadTotal = calculateOverheadTotal();
  const toppingTotal = calculateToppingTotal() * productCount;
  const packagingTotal = calculatePackagingTotal() * productCount;
  const totalProductionCost =
    ingredientTotal + overheadTotal + toppingTotal + packagingTotal;
  const hppPerProduct =
    productCount > 0 ? totalProductionCost / productCount : 0;
  const sellingPrice =
    hppPerProduct > 0 ? hppPerProduct / (1 - state.margin / 100) : 0;
  const profitPerProduct = sellingPrice - hppPerProduct;
  const estimatedProfit = profitPerProduct * productCount;

  return {
    productCount,
    ingredientTotal,
    overheadTotal,
    toppingTotal,
    packagingTotal,
    totalProductionCost,
    hppPerProduct,
    sellingPrice,
    profitPerProduct,
    estimatedProfit,
  };
};

app.innerHTML = `
  <header class="app-header">
    <div>
      <p class="eyebrow">PRODUCTION COSTING</p>
      <h1>HPP Kalkulator</h1>
      <p class="subtitle">Hitung biaya produksi, HPP, harga jual, dan estimasi profit dalam satu tempat.</p>
    </div>
    <button id="resetApp" class="button button-secondary" type="button">Reset Data</button>
  </header>

  <main>
    <section class="card product-card">
      <div class="section-heading">
        <div>
          <p class="section-number">01</p>
          <h2>Informasi Produk</h2>
        </div>
      </div>
      <div class="form-grid">
        <label>
          Nama Produk
          <input id="productName" type="text" placeholder="Contoh: Donat Cokelat" />
        </label>
        <label>
          Margin Keuntungan
          <input id="margin" type="number" min="0" max="99" step="1" placeholder="Contoh: 30" />
          <span class="field-hint">Persentase margin dari harga jual.</span>
        </label>
      </div>
    </section>

    <section class="card">
      <div class="section-heading">
        <div>
          <p class="section-number">02</p>
          <h2>Informasi Produksi</h2>
        </div>
        <span id="productionBadge" class="badge">0 pcs</span>
      </div>
      <div class="form-grid">
        <label>
          Total Berat Adonan (gram)
          <input id="totalDoughWeight" type="number" min="0" placeholder="Contoh: 2000" />
        </label>
        <label>
          Berat per Produk (gram)
          <input id="productWeight" type="number" min="0" placeholder="Contoh: 25" />
        </label>
      </div>
      <div id="productionResult" class="inline-result"></div>
    </section>

    <section class="card">
      <div class="section-heading">
        <div>
          <p class="section-number">03</p>
          <h2>Bahan Baku</h2>
        </div>
        <span id="ingredientCount" class="badge">0 bahan</span>
      </div>
      <div class="form-grid ingredient-form">
        <label>Nama Bahan<input id="ingredientName" type="text" placeholder="Tepung Terigu" /></label>
        <label>Harga Beli<input id="ingredientPrice" type="number" min="0" placeholder="15000" /></label>
        <label>Berat Bersih (gram)<input id="ingredientWeight" type="number" min="0" placeholder="1000" /></label>
        <label>Jumlah Dipakai (gram)<input id="ingredientUsed" type="number" min="0" placeholder="250" /></label>
      </div>
      <button id="addIngredient" class="button" type="button">+ Tambah Bahan</button>
      <div id="ingredientList" class="item-list"></div>
      <div class="section-total"><span>Total Biaya Bahan</span><strong id="ingredientTotal">Rp 0</strong></div>
    </section>

    <section class="card">
      <div class="section-heading">
        <div>
          <p class="section-number">04</p>
          <h2>Overhead Produksi</h2>
          <p>Biaya produksi yang tidak langsung masuk ke bahan.</p>
        </div>
        <strong id="overheadTotal" class="section-total-value">Rp 0</strong>
      </div>
      <div class="form-grid">
        <label>Nama Biaya<input id="overheadName" type="text" placeholder="Gas, listrik, tenaga kerja..." /></label>
        <label>Total Biaya<input id="overheadCost" type="number" min="0" placeholder="50000" /></label>
      </div>
      <button id="addOverhead" class="button" type="button">+ Tambah Overhead</button>
      <div id="overheadList" class="item-list"></div>
    </section>

    <section class="card">
      <div class="section-heading">
        <div>
          <p class="section-number">05</p>
          <h2>Topping per Produk</h2>
          <p>Masukkan harga kemasan topping dan berat yang digunakan per produk.</p>
        </div>
        <strong id="toppingTotal" class="section-total-value">Rp 0</strong>
      </div>
      <div class="form-grid ingredient-form">
        <label>Nama Topping<input id="toppingName" type="text" placeholder="Cokelat" /></label>
        <label>Harga Beli<input id="toppingPrice" type="number" min="0" placeholder="20000" /></label>
        <label>Berat Bersih (gram)<input id="toppingWeight" type="number" min="0" placeholder="500" /></label>
        <label>Pakai per Produk (gram)<input id="toppingUsed" type="number" min="0" placeholder="15" /></label>
      </div>
      <button id="addTopping" class="button" type="button">+ Tambah Topping</button>
      <div id="toppingList" class="item-list"></div>
    </section>

    <section class="card">
      <div class="section-heading">
        <div>
          <p class="section-number">06</p>
          <h2>Kemasan per Produk</h2>
        </div>
        <strong id="packagingTotal" class="section-total-value">Rp 0</strong>
      </div>
      <div class="form-grid">
        <label>Nama Kemasan<input id="packagingName" type="text" placeholder="Box Donat" /></label>
        <label>Harga per Kemasan<input id="packagingPrice" type="number" min="0" placeholder="1500" /></label>
      </div>
      <button id="addPackaging" class="button" type="button">+ Tambah Kemasan</button>
      <div id="packagingList" class="item-list"></div>
    </section>

    <section class="card summary-card">
      <div class="section-heading">
        <div>
          <p class="section-number">07</p>
          <h2>Ringkasan HPP</h2>
          <p>Semua komponen biaya produksi dirangkum otomatis.</p>
        </div>
      </div>
      <div class="summary-grid">
        <div><span>Bahan</span><strong id="summaryIngredient">Rp 0</strong></div>
        <div><span>Overhead</span><strong id="summaryOverhead">Rp 0</strong></div>
        <div><span>Topping</span><strong id="summaryTopping">Rp 0</strong></div>
        <div><span>Kemasan</span><strong id="summaryPackaging">Rp 0</strong></div>
      </div>
      <div class="grand-total">
        <span>HPP per Produk</span>
        <strong id="finalHpp">Rp 0</strong>
      </div>
      <div class="pricing-grid">
        <div><span>Harga Jual Rekomendasi</span><strong id="sellingPrice">Rp 0</strong></div>
        <div><span>Profit per Produk</span><strong id="profitPerProduct">Rp 0</strong></div>
        <div><span>Estimasi Profit 1 Batch</span><strong id="estimatedProfit">Rp 0</strong></div>
      </div>
    </section>
  </main>
`;

const el = (id) => document.querySelector(`#${id}`);

const inputs = {
  productName: el("productName"),
  margin: el("margin"),
  totalDoughWeight: el("totalDoughWeight"),
  productWeight: el("productWeight"),
  ingredientName: el("ingredientName"),
  ingredientPrice: el("ingredientPrice"),
  ingredientWeight: el("ingredientWeight"),
  ingredientUsed: el("ingredientUsed"),
  overheadName: el("overheadName"),
  overheadCost: el("overheadCost"),
  toppingName: el("toppingName"),
  toppingPrice: el("toppingPrice"),
  toppingWeight: el("toppingWeight"),
  toppingUsed: el("toppingUsed"),
  packagingName: el("packagingName"),
  packagingPrice: el("packagingPrice"),
};

const updateInputState = () => {
  state.productName = inputs.productName.value;
  state.margin = Number(inputs.margin.value) || 0;
  state.totalDoughWeight = Number(inputs.totalDoughWeight.value) || 0;
  state.productWeight = Number(inputs.productWeight.value) || 0;
  saveState();
  render();
};

Object.entries(inputs).forEach(([key, input]) => {
  if (["ingredientName","ingredientPrice","ingredientWeight","ingredientUsed","overheadName","overheadCost","toppingName","toppingPrice","toppingWeight","toppingUsed","packagingName","packagingPrice"].includes(key)) return;
  input.addEventListener("input", updateInputState);
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

const clearInputs = (keys) => keys.forEach((key) => {
  inputs[key].value = "";
});

el("addIngredient").addEventListener("click", () => {
  const price = Number(inputs.ingredientPrice.value);
  const weight = Number(inputs.ingredientWeight.value);
  const used = Number(inputs.ingredientUsed.value);
  if (!inputs.ingredientName.value.trim() || price <= 0 || weight <= 0 || used <= 0) return;
  addItem("ingredients", {
    name: inputs.ingredientName.value.trim(),
    cost: (price / weight) * used,
    used,
  });
  clearInputs(["ingredientName","ingredientPrice","ingredientWeight","ingredientUsed"]);
});

el("addOverhead").addEventListener("click", () => {
  const cost = Number(inputs.overheadCost.value);
  if (!inputs.overheadName.value.trim() || cost <= 0) return;
  addItem("overheads", { name: inputs.overheadName.value.trim(), cost });
  clearInputs(["overheadName","overheadCost"]);
});

el("addTopping").addEventListener("click", () => {
  const price = Number(inputs.toppingPrice.value);
  const weight = Number(inputs.toppingWeight.value);
  const used = Number(inputs.toppingUsed.value);
  if (!inputs.toppingName.value.trim() || price <= 0 || weight <= 0 || used <= 0) return;
  addItem("toppings", {
    name: inputs.toppingName.value.trim(),
    cost: (price / weight) * used,
    used,
  });
  clearInputs(["toppingName","toppingPrice","toppingWeight","toppingUsed"]);
});

el("addPackaging").addEventListener("click", () => {
  const price = Number(inputs.packagingPrice.value);
  if (!inputs.packagingName.value.trim() || price <= 0) return;
  addItem("packaging", { name: inputs.packagingName.value.trim(), cost: price });
  clearInputs(["packagingName","packagingPrice"]);
});

el("resetApp").addEventListener("click", () => {
  if (!confirm("Hapus semua data kalkulator?")) return;
  localStorage.removeItem("hpp-kalkulator-state");
  location.reload();
});

const renderList = (containerId, type, formatter) => {
  const container = el(containerId);
  container.innerHTML = "";
  state[type].forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "item-row";
    row.innerHTML = `
      <div>
        <strong>${item.name}</strong>
        <span>${formatter(item)}</span>
      </div>
      <div class="item-actions">
        <strong>${formatCurrency(item.cost)}</strong>
        <button type="button" data-type="${type}" data-index="${index}" aria-label="Hapus ${item.name}">×</button>
      </div>
    `;
    row.querySelector("button").addEventListener("click", () => removeItem(type, index));
    container.appendChild(row);
  });
};

function render() {
  const totals = calculateTotals();

  el("productionBadge").textContent = `${totals.productCount.toLocaleString("id-ID", { maximumFractionDigits: 0 })} pcs`;
  el("productionResult").textContent = totals.productCount > 0
    ? `1 batch menghasilkan sekitar ${totals.productCount.toLocaleString("id-ID", { maximumFractionDigits: 0 })} produk.`
    : "Masukkan berat adonan dan berat per produk.";

  el("ingredientCount").textContent = `${state.ingredients.length} bahan`;
  el("ingredientTotal").textContent = formatCurrency(totals.ingredientTotal);
  el("overheadTotal").textContent = formatCurrency(totals.overheadTotal);
  el("toppingTotal").textContent = formatCurrency(calculateToppingTotal());
  el("packagingTotal").textContent = formatCurrency(calculatePackagingTotal());

  el("summaryIngredient").textContent = formatCurrency(totals.ingredientTotal);
  el("summaryOverhead").textContent = formatCurrency(totals.overheadTotal);
  el("summaryTopping").textContent = formatCurrency(totals.toppingTotal);
  el("summaryPackaging").textContent = formatCurrency(totals.packagingTotal);
  el("finalHpp").textContent = formatCurrency(totals.hppPerProduct);
  el("sellingPrice").textContent = formatCurrency(totals.sellingPrice);
  el("profitPerProduct").textContent = formatCurrency(totals.profitPerProduct);
  el("estimatedProfit").textContent = formatCurrency(totals.estimatedProfit);

  renderList("ingredientList", "ingredients", (item) => `${item.used}g dipakai`);
  renderList("overheadList", "overheads", () => "Biaya produksi");
  renderList("toppingList", "toppings", (item) => `${item.used}g per produk`);
  renderList("packagingList", "packaging", () => "per produk");
}

inputs.productName.value = state.productName;
inputs.margin.value = state.margin;
inputs.totalDoughWeight.value = state.totalDoughWeight || "";
inputs.productWeight.value = state.productWeight || "";
render();
