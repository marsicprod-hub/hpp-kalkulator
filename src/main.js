import './style.css';
const app = document.querySelector('#app');
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
  </main>`;
