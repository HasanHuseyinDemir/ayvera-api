const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

// Statik dosyaları servis et
app.use(express.static(path.join(__dirname, 'public')));

const dbDir = path.join(__dirname, 'db');
const productsPath = path.join(dbDir, 'products.json');
const categoriesPath = path.join(dbDir, 'categories.json');
const brandsPath = path.join(dbDir, 'brands.json');
const settingsPath = path.join(dbDir, 'settings.json');

// Client IP'sini almak için helper fonksiyon
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null);
}

// Ayar dosyasını initialize et
function initializeSettings() {
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  if (!fs.existsSync(settingsPath)) {
    const defaultPassword = 'admin';
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(defaultPassword, salt);
    const defaultSettings = {
      password: hash,
      allowedIPs: ['127.0.0.1', '::1', 'localhost']
    };
    fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
  }
}

// IP kontrolü middleware
function checkIPAccess(req, res, next) {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const clientIP = getClientIP(req);
    
    // IP kontrolü - localhost ve 127.0.0.1 her zaman izinli
    const allowedIPs = settings.allowedIPs || [];
    const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === 'localhost' || clientIP?.includes('127.0.0.1');
    
    if (isLocalhost || allowedIPs.includes(clientIP)) {
      next();
    } else {
      res.status(403).json({ message: 'Bu IP adresinden erişim izni yok: ' + clientIP });
    }
  } catch (err) {
    res.status(500).json({ message: 'Erişim kontrolü hatası' });
  }
}

// Uygulama başlatılırken ayarları initialize et
initializeSettings();

// Ana sayfa route'u - IP kontrolü ile korunuyor
app.get('/', checkIPAccess, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// IP kontrolü endpoint'i - panel girişi için
app.get('/api/auth/check-ip', (req, res) => {
  try {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    const clientIP = getClientIP(req);
    
    // IP kontrolü - localhost ve 127.0.0.1 her zaman izinli
    const allowedIPs = settings.allowedIPs || [];
    const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === 'localhost' || clientIP?.includes('127.0.0.1');
    
    if (isLocalhost || allowedIPs.includes(clientIP)) {
      res.json({ success: true, message: 'IP adresi izinli', ip: clientIP });
    } else {
      res.status(403).json({ success: false, message: 'Bu IP adresinden erişim izni yok: ' + clientIP });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erişim kontrolü hatası' });
  }
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

app.post('/api/products', checkIPAccess, (req, res) => {
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

app.put('/api/products/:id', checkIPAccess, (req, res) => {
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

app.delete('/api/products/:id', checkIPAccess, (req, res) => {
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

app.post('/api/brands', checkIPAccess, (req, res) => {
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

app.put('/api/brands/:id', checkIPAccess, (req, res) => {
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

app.delete('/api/brands/:id', checkIPAccess, (req, res) => {
  try {
    let brands = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));
    brands = brands.filter(b => Number(b.id) !== Number(req.params.id));
    fs.writeFileSync(brandsPath, JSON.stringify(brands, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Marka silinemedi' });
  }
});

// Authentication endpoints - kaldırıldı

// IP yönetimi endpoints - kaldırıldı

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API çalışıyor: http://localhost:${PORT}`);
});
