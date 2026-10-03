import "./style.css";
const app = document.querySelector("#app");
app.innerHTML = `
  <header>
    <h1>Hpp Kalkulator</h1>
    <p>Hitung biaya produksi dengan mudah.</p>
  </header>
  
  <main>
    <section>
      <h2>Informasi Produk</h2>
      <label for="productName">Nama Produk</label>
        <input
          id="productName"
          type="text"
          placeholder="Contoh: Donat Cokelat"
        />
    </section>
    <section>
      <h2>Bahan</h2>
      <div>
        <label for="ingredientName">Nama Bahan</label>
        <input
          id="ingredientName"
          type="text"
          placeholder="Contoh: Tepung Terigu"
        />
      </div>
      <div>
        <label for="ingredientPrice">Harga Beli</label>
        <input
          id="ingredientPrice"
          type="number"
          placeholder="Contoh: 15000"
        />
      </div>
      <div>
        <label for="ingredientWeight">Berat Bersih</label>
        <input
          id="ingredientWeight"
          type="number"
          placeholder="Contoh: 1000"
        />
      </div>
      <div>
        <label for="ingredientUsed">Jumlah Dipakai</label>
        <input
          id="ingredientUsed"
          type="number"
          placeholder="Contoh: 250"
        />
      </div>
        <button id="addIngredient" type="button">
        Tambah Bahan
        </button>
        <div id="ingredientList"></div>
        <div id="ingredientTotal"></div>
    </section>  
  </main>`;
const addIngredientButton = document.querySelector("#addIngredient");
const ingredientNameInput = document.querySelector("#ingredientName");
const ingredientPriceInput = document.querySelector("#ingredientPrice");
const ingredientWeightInput = document.querySelector("#ingredientWeight");
const ingredientUsedInput = document.querySelector("#ingredientUsed");
const ingredientList = document.querySelector("#ingredientList");
const ingredientTotal = document.querySelector("#ingredientTotal");
const ingredients = [];

addIngredientButton.addEventListener("click", () => {
  const ingredientPrice = Number(ingredientPriceInput.value);
  const ingredientWeight = Number(ingredientWeightInput.value);
  const ingredientUsed = Number(ingredientUsedInput.value);
  const pricePerGram = ingredientPrice / ingredientWeight;
  const ingredientCost = pricePerGram * ingredientUsed;
  const ingredient = {
    name: ingredientNameInput.value,
    price: ingredientPrice,
    weight: ingredientWeight,
    used: ingredientUsed,
    cost: ingredientCost,
  };
  ingredients.push(ingredient);
  renderIngredients();
  const totalCost = ingredients.reduce((total, item) => {
    return total + item.cost;
  }, 0);
  ingredientTotal.textContent = `Total Biaya Bahan: Rp ${totalCost.toLocaleString("id-ID")}`;
  ingredientNameInput.value = "";
  ingredientPriceInput.value = "";
  ingredientWeightInput.value = "";
  ingredientUsedInput.value = "";
});
function renderIngredients() {
  ingredientList.innerHTML = "";

  ingredients.forEach((item) => {
    const card = document.createElement("div");
    card.innerHTML = `
      <strong>${item.name}</strong>
      (${item.used}g)
      Rp ${item.cost.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
    ingredientList.appendChild(card);
  });
}
