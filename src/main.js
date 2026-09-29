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
    </section>  
  </main>`;
const addIngredientButton = document.querySelector("#addIngredient");
const ingredientNameInput = document.querySelector("#ingredientName");
const ingredientPriceInput = document.querySelector("#ingredientPrice");
const ingredientWeightInput = document.querySelector("#ingredientWeight");
const ingredientUsedInput = document.querySelector("#ingredientUsed");
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
  alert(
    `Nama Bahan: ${ingredientNameInput.value}\nHarga Beli: ${ingredientPrice}\nBerat Bersih: ${ingredientWeight}\nJumlah Dipakai: ${ingredientUsed}\nHarga Per Gram: ${pricePerGram.toFixed(2)}\nBiaya Bahan: ${ingredientCost.toFixed(2)}`,
  );
});
