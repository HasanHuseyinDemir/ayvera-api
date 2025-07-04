const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const dbDir = path.join(__dirname, 'db');
const productsPath = path.join(dbDir, 'products.json');
const categoriesPath = path.join(dbDir, 'categories.json');
const brandsPath = path.join(dbDir, 'brands.json');

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
    // Math.random ile benzersiz id oluştur
    const newProduct = { ...req.body, id: Math.random().toString(36).substr(2, 9) };
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
    const idx = products.findIndex(p => p.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Ürün bulunamadı' });
    products[idx] = { ...products[idx], ...req.body };
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    res.json(products[idx]);
  } catch (err) {
    res.status(500).json({ message: 'Ürün güncellenemedi' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  try {
    let products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    products = products.filter(p => p.id !== req.params.id);
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API çalışıyor: http://localhost:${PORT}`);
});
