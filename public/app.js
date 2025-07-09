// API Base URL
const API_BASE = '/api';

// Global değişkenler
let products = [];
let brands = [];

// Sayfa yüklendiğinde çalışacak fonksiyonlar
document.addEventListener('DOMContentLoaded', function() {
    // IP kontrolü yap ve paneli otomatik yükle
    checkIPAndLoadPanel();
});

// IP kontrolü ve panel yükleme
async function checkIPAndLoadPanel() {
    try {
        const response = await fetch(`${API_BASE}/auth/check-ip`);
        const data = await response.json();
        
        if (data.success) {
            // IP izinli - paneli göster
            document.getElementById('accessDeniedContainer').style.display = 'none';
            document.getElementById('panelContainer').style.display = 'block';
            
            // Panel içeriğini yükle
            loadProducts();
            loadBrands();
            loadBrandOptions();
            
            // Form event listeners
            document.getElementById('productForm').addEventListener('submit', handleProductSubmit);
            document.getElementById('brandForm').addEventListener('submit', handleBrandSubmit);
        } else {
            // IP izinli değil - uyarı göster
            document.getElementById('currentIP').textContent = data.ip || 'Bilinmiyor';
            document.getElementById('panelContainer').style.display = 'none';
            document.getElementById('accessDeniedContainer').style.display = 'block';
        }
    } catch (error) {
        showAlert('IP kontrolü başarısız: ' + error.message, 'danger');
        document.getElementById('panelContainer').style.display = 'none';
        document.getElementById('accessDeniedContainer').style.display = 'block';
    }
}

// Alert gösterme fonksiyonu
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    alertContainer.appendChild(alert);
    
    // 5 saniye sonra otomatik kapat
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 5000);
}

// ÜRÜN İŞLEMLERİ
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        products = await response.json();
        renderProductsTable();
    } catch (error) {
        showAlert('Ürünler yüklenemedi: ' + error.message, 'danger');
    }
}

function renderProductsTable() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    
    products.forEach(product => {
        const row = document.createElement('tr');
        console.log(product.img)
        row.innerHTML = `
            <td>${product.id}</td>
            <td><img src="${product.img || '/stock/default.png'}" alt="Ürün Resmi" style="width:50px; height:50px; object-fit:cover; border-radius:4px;"></td>
            <td>${product.title || ''}</td>
            <td>${product.category || ''}</td>
            <td>${product.brand || ''}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editProduct('${product.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function handleProductSubmit(e) {
    e.preventDefault();
    
    const productData = {
        title: document.getElementById('productTitle').value,
        desc: document.getElementById('productDesc').value,
        img: document.getElementById('productImg').value,
        category: document.getElementById('productCategory').value,
        brand: document.getElementById('productBrand').value,
        features: document.getElementById('productFeatures').value.split(',').map(f => f.trim()).filter(f => f),
        driver: document.getElementById('productDriver').value,
        pdf: document.getElementById('productPdf').value,
        gallery: document.getElementById('productGallery').value.split(',').map(g => g.trim()).filter(g => g)
    };
    
    const productId = document.getElementById('productId').value;
    
    try {
        let response;
        if (productId) {
            // Güncelleme
            response = await fetch(`${API_BASE}/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
        } else {
            // Yeni ekleme
            response = await fetch(`${API_BASE}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(productData)
            });
        }
        
        if (response.ok) {
            showAlert(productId ? 'Ürün başarıyla güncellendi!' : 'Ürün başarıyla eklendi!');
            clearProductForm();
            loadProducts();
        } else {
            const error = await response.json();
            showAlert(error.message || 'Bir hata oluştu!', 'danger');
        }
    } catch (error) {
        showAlert('Ürün kaydedilemedi: ' + error.message, 'danger');
    }
}

function editProduct(id) {
    const product = products.find(p => p.id == id);
    if (!product) return;
    
    document.getElementById('productId').value = product.id;
    document.getElementById('productTitle').value = product.title || '';
    document.getElementById('productDesc').value = product.desc || '';
    document.getElementById('productImg').value = product.img || '';
    document.getElementById('productCategory').value = product.category || '';
    document.getElementById('productBrand').value = product.brand || '';
    document.getElementById('productFeatures').value = Array.isArray(product.features) ? product.features.join(', ') : '';
    document.getElementById('productDriver').value = product.driver || '';
    document.getElementById('productPdf').value = product.pdf || '';
    document.getElementById('productGallery').value = Array.isArray(product.gallery) ? product.gallery.join(', ') : '';
}

async function deleteProduct(id) {
    if (!confirm('Bu ürünü silmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/products/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('Ürün başarıyla silindi!');
            loadProducts();
        } else {
            const error = await response.json();
            showAlert(error.message || 'Ürün silinemedi!', 'danger');
        }
    } catch (error) {
        showAlert('Ürün silinemedi: ' + error.message, 'danger');
    }
}

function clearProductForm() {
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
}

// MARKA İŞLEMLERİ
async function loadBrands() {
    try {
        const response = await fetch(`${API_BASE}/brands`);
        brands = await response.json();
        renderBrandsTable();
        loadBrandOptions();
    } catch (error) {
        showAlert('Markalar yüklenemedi: ' + error.message, 'danger');
    }
}

function renderBrandsTable() {
    const tbody = document.getElementById('brandsTableBody');
    tbody.innerHTML = '';
    
    brands.forEach(brand => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${brand.id}</td>
            <td><img src="${brand.logo || '/stock/default-logo.png'}" alt="Marka Logosu" style="width:50px; height:50px; object-fit:cover; border-radius:4px;"></td>
            <td>${brand.name || ''}</td>
            <td>${brand.website ? `<a href="${brand.website}" target="_blank">${brand.website}</a>` : ''}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary me-1" onclick="editBrand('${brand.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteBrand('${brand.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function loadBrandOptions() {
    const select = document.getElementById('productBrand');
    select.innerHTML = '<option value="">Marka Seçin</option>';
    
    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand.name;
        option.textContent = brand.name;
        select.appendChild(option);
    });
}

async function handleBrandSubmit(e) {
    e.preventDefault();
    
    const brandData = {
        name: document.getElementById('brandName').value,
        logo: document.getElementById('brandLogo').value,
        website: document.getElementById('brandWebsite').value,
        description: document.getElementById('brandDescription').value
    };
    
    const brandId = document.getElementById('brandId').value;
    
    try {
        let response;
        if (brandId) {
            // Güncelleme
            response = await fetch(`${API_BASE}/brands/${brandId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(brandData)
            });
        } else {
            // Yeni ekleme
            response = await fetch(`${API_BASE}/brands`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(brandData)
            });
        }
        
        if (response.ok) {
            showAlert(brandId ? 'Marka başarıyla güncellendi!' : 'Marka başarıyla eklendi!');
            clearBrandForm();
            loadBrands();
        } else {
            const error = await response.json();
            showAlert(error.message || 'Bir hata oluştu!', 'danger');
        }
    } catch (error) {
        showAlert('Marka kaydedilemedi: ' + error.message, 'danger');
    }
}

function editBrand(id) {
    const brand = brands.find(b => b.id == id);
    if (!brand) return;
    
    document.getElementById('brandId').value = brand.id;
    document.getElementById('brandName').value = brand.name || '';
    document.getElementById('brandLogo').value = brand.logo || '';
    document.getElementById('brandWebsite').value = brand.website || '';
    document.getElementById('brandDescription').value = brand.description || '';
}

async function deleteBrand(id) {
    if (!confirm('Bu markayı silmek istediğinizden emin misiniz?')) return;
    
    try {
        const response = await fetch(`${API_BASE}/brands/${id}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('Marka başarıyla silindi!');
            loadBrands();
        } else {
            const error = await response.json();
            showAlert(error.message || 'Marka silinemedi!', 'danger');
        }
    } catch (error) {
        showAlert('Marka silinemedi: ' + error.message, 'danger');
    }
}

function clearBrandForm() {
    document.getElementById('brandForm').reset();
    document.getElementById('brandId').value = '';
}
