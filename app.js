// === Firebase Config (غيّرها بـ config بتاعك من Firebase) ===
const firebaseConfig = {
  apiKey: "AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "company-elevators.firebaseapp.com",
  databaseURL: "https://company-elevators-default-rtdb.firebaseio.com",
  projectId: "company-elevators",
  storageBucket: "company-elevators.appspot.com",
  messagingSenderId: "1234567890",
  appId: "1:1234567890:web:abcdef1234567890"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const productsRef = db.ref("products");

const ADMIN = { user: "alpha", pass: "Alph2025" };
let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const perPage = 12;
let editIndex = -1;

// تحميل المنتجات من Firebase
function loadFromFirebase() {
    productsRef.on("value", (snapshot) => {
        const data = snapshot.val();
        allProducts = data ? Object.keys(data).map(key => ({
            id: key,
            ...data[key]
        })) : [];

        if (document.getElementById("product-list")) {
            filteredProducts = allProducts;
            renderProducts(filteredProducts, 1);
        }
        if (document.getElementById("admin-list")) {
            loadAdmin();
        }
    });
}

// حفظ في Firebase
function saveToFirebase() {
    const plainObj = {};
    allProducts.forEach(p => {
        plainObj[p.id] = { name: p.name, image: p.image, desc: p.desc, price: p.price };
    });
    productsRef.set(plainObj);
}

// تشغيل تلقائي
document.addEventListener("DOMContentLoaded", () => {
    loadFromFirebase();

    if (document.getElementById("product-list")) initHome();
    if (document.getElementById("login-form")) initAdmin();
});

// ======== الـ Home ========
function initHome() {
    const searchInput = document.getElementById("search");
    searchInput.addEventListener("input", () => {
        const q = searchInput.value.toLowerCase();
        filteredProducts = allProducts.filter(p =>
            p.name.toLowerCase().includes(q) || (p.desc && p.desc.toLowerCase().includes(q))
        );
        currentPage = 1;
        renderProducts(filteredProducts, currentPage);
    });
}

function renderProducts(items, page) {
    const list = document.getElementById("product-list");
    const counter = document.getElementById("counter");
    const pagination = document.getElementById("pagination");

    const start = (page - 1) * perPage;
    const end = start + perPage;
    const paginated = items.slice(start, end);

    counter.innerText = `${items.length} منتج`;
    list.innerHTML = paginated.map(p => `
        <div class="col">
            <div class="product-card h-100">
                <img src="${p.image}" class="card-img-top" alt="${p.name}">
                <div class="card-body d-flex flex-column">
                    <h5 class="card-title text-primary">${p.name}</h5>
                    <p class="text-muted small">${p.desc || ''}</p>
                    <p class="h5 text-success">${p.price || ''}</p>
                    <a href="https://wa.me/201020203040?text=أريد ${encodeURIComponent(p.name)}" class="btn btn-success mt-auto">اطلب</a>
                </div>
            </div>
        </div>
    `).join('');

    // Pagination
    const totalPages = Math.ceil(items.length / perPage);
    if (totalPages <= 1) {
        pagination.innerHTML = ''; return;
    }
    let pagHTML = '<nav><ul class="pagination justify-content-center">';
    for (let i = 1; i <= totalPages; i++) {
        pagHTML += `<li class="page-item ${i === page ? 'active' : ''}">
            <a class="page-link" href="javascript:void(0)" onclick="changePage(${i})">${i}</a>
        </li>`;
    }
    pagHTML += '</ul></nav>';
    pagination.innerHTML = pagHTML;
}

window.changePage = (page) => {
    currentPage = page;
    renderProducts(filteredProducts, currentPage);
};

// ======== الأدمن ========
function initAdmin() {
    const loginForm = document.getElementById("login-form");
    const addForm = document.getElementById("add-form");

    // تسجيل الدخول
    loginForm.addEventListener("submit", e => {
        e.preventDefault();
        const user = document.getElementById("username").value.trim();
        const pass = document.getElementById("password").value;
        if (user === ADMIN.user && pass === ADMIN.pass) {
            document.getElementById("login-box").classList.add("d-none");
            document.getElementById("admin-panel").classList.remove("d-none");
            loadAdmin();
            showToast("أهلاً يا أدمن");
        } else {
            showToast("بيانات خاطئة", "danger");
        }
    });

    // إضافة منتج
    addForm.addEventListener("submit", e => {
        e.preventDefault();
        const name = document.getElementById("name").value.trim();
        const image = document.getElementById("image").value.trim();
        const desc = document.getElementById("desc").value.trim();
        const price = document.getElementById("price").value.trim();

        if (!name || !image) return showToast("الاسم ورابط الصورة مطلوبين", "danger");

        const newProduct = { name, image, desc, price, id: Date.now().toString() };
        allProducts.push(newProduct);
        saveToFirebase();
        addForm.reset();
        showToast("تم الإضافة عند الكل");
    });
}

function loadAdmin() {
    const list = document.getElementById("admin-list");
    list.innerHTML = allProducts.map((p, i) => `
        <li class="list-group-item d-flex justify-content-between align-items-center p-3 bg-white shadow-sm rounded mb-2">
            <div><strong>${p.name}</strong><br><small class="text-muted">${p.desc || "لا وصف"}</small></div>
            <div>
                <button class="btn btn-sm btn-warning" onclick="editProduct(${i})">تعديل</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProduct('${p.id}')">حذف</button>
            </div>
        </li>
    `).join('');
}

window.editProduct = (i) => {
    const p = allProducts[i];
    editIndex = i;
    document.getElementById("edit-name").value = p.name;
    document.getElementById("edit-image").value = p.image;
    document.getElementById("edit-desc").value = p.desc || "";
    document.getElementById("edit-price").value = p.price || "";
    new bootstrap.Modal(document.getElementById("editModal")).show();
};

window.saveEdit = () => {
    const name = document.getElementById("edit-name").value.trim();
    const image = document.getElementById("edit-image").value.trim();
    const desc = document.getElementById("edit-desc").value.trim();
    const price = document.getElementById("edit-price").value.trim();

    if (!name || !image) return showToast("الاسم والصورة مطلوبين", "danger");

    allProducts[editIndex] = { ...allProducts[editIndex], name, image, desc, price };
    saveToFirebase();
    bootstrap.Modal.getInstance(document.getElementById("editModal")).hide();
    loadAdmin();
    showToast("تم التعديل عند الكل");
};

window.deleteProduct = (id) => {
    if (confirm("متأكد من الحذف؟")) {
        allProducts = allProducts.filter(p => p.id !== id);
        saveToFirebase();
        loadAdmin();
        showToast("تم الحذف عند الجميع", "danger");
    }
};

// Toast
function showToast(msg, type = "success") {
    const container = document.body.appendChild(document.createElement("div"));
    container.className = "toast-container position-fixed bottom-0 end-0 p-3";
    container.style.zIndex = "9999";

    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-bg-${type} border-0`;
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${msg}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    container.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
    bsToast.show();
    toast.addEventListener("hidden.bs.toast", () => container.remove());
}
