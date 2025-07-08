const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Statik dosyaları servis et
app.use(express.static(path.join(__dirname, 'public')));

const dbDir = path.join(__dirname, 'db');
const productsPath = path.join(dbDir, 'products.json');
const categoriesPath = path.join(dbDir, 'categories.json');
const brandsPath = path.join(dbDir, 'brands.json');

// Ana sayfa route'u
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ürünler
app.get('/api/products', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Veri okunamadı' });
  }
});

app.post('/api/products', (req, res) => {
  try {
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    // En yüksek ID'yi bulup 1 ekleyerek yeni number ID oluştur
    const maxId = products.length > 0 ? Math.max(...products.map(p => Number(p.id) || 0)) : 0;
    const newProduct = { ...req.body, id: maxId + 1 };
    products.push(newProduct);
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    res.json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Ürün eklenemedi' });
  }
});

app.put('/api/products/:id', (req, res) => {
  try {
    const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    const idx = products.findIndex(p => Number(p.id) === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ message: 'Ürün bulunamadı' });
    products[idx] = { ...products[idx], ...req.body, id: Number(req.params.id) };
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    res.json(products[idx]);
  } catch (err) {
    res.status(500).json({ message: 'Ürün güncellenemedi' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    let products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    products = products.filter(p => Number(p.id) !== Number(req.params.id));
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Ürün silinemedi' });
  }
});

// Kategoriler
app.get('/api/categories', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(categoriesPath, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Veri okunamadı' });
  }
});

// Markalar
app.get('/api/brands', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Veri okunamadı' });
  }
});

app.post('/api/brands', (req, res) => {
  try {
    const brands = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));
    const maxId = brands.length > 0 ? Math.max(...brands.map(b => Number(b.id) || 0)) : 0;
    const newBrand = { ...req.body, id: maxId + 1 };
    brands.push(newBrand);
    fs.writeFileSync(brandsPath, JSON.stringify(brands, null, 2));
    res.json(newBrand);
  } catch (err) {
    res.status(500).json({ message: 'Marka eklenemedi' });
  }
});

app.put('/api/brands/:id', (req, res) => {
  try {
    const brands = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));
    const idx = brands.findIndex(b => Number(b.id) === Number(req.params.id));
    if (idx === -1) return res.status(404).json({ message: 'Marka bulunamadı' });
    brands[idx] = { ...brands[idx], ...req.body, id: Number(req.params.id) };
    fs.writeFileSync(brandsPath, JSON.stringify(brands, null, 2));
    res.json(brands[idx]);
  } catch (err) {
    res.status(500).json({ message: 'Marka güncellenemedi' });
  }
});

app.delete('/api/brands/:id', (req, res) => {
  try {
    let brands = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));
    brands = brands.filter(b => Number(b.id) !== Number(req.params.id));
    fs.writeFileSync(brandsPath, JSON.stringify(brands, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Marka silinemedi' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API çalışıyor: http://localhost:${PORT}`);
});
