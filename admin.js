document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTOS DEL DOM ---
  const productList = document.getElementById("productList");
  const productForm = document.getElementById("productForm");
  const productIdInput = document.getElementById("productId");
  const nombreInput = document.getElementById("nombre");
  const precioInput = document.getElementById("precio");
  const caracteristicasInput = document.getElementById("caracteristicas");
  const imagenInput = document.getElementById("imagen");
  const formTitle = document.getElementById("formTitle");
  const submitButton = document.getElementById("submitButton");
  const cancelEditButton = document.getElementById("cancelEdit");

  // --- FUNCIONES ---

  // Carga y muestra todos los productos
  function loadProducts() {
    fetch("http://localhost:3000/api/products")
      .then((response) => response.json())
      .then((products) => {
        productList.innerHTML = "";
        products.forEach((product) => {
          const productDiv = document.createElement("div");
          productDiv.className = "product";
          productDiv.innerHTML = `
              <img src="${product.imagen}" alt="${product.nombre}">
              <h3>${product.nombre}</h3>
              <p>Precio: $${product.precio}</p>
              <p>ID: ${product.id}</p>
              <button class="edit-btn" data-id="${product.id}">Editar</button>
              <button class="delete-btn" data-id="${product.id}">Eliminar</button>
          `;
          productList.appendChild(productDiv);
        });
      })
      .catch((error) => console.error("Error al cargar los productos:", error));
  }

  // Resetea el formulario a su estado inicial (para añadir producto)
  function resetForm() {
    productForm.reset();
    productIdInput.value = "";
    formTitle.textContent = "Añadir Producto";
    submitButton.textContent = "Guardar Producto";
    cancelEditButton.style.display = "none";
    imagenInput.required = true;
  }

  // Prepara el formulario para editar un producto
  function setupEditForm(product) {
    productIdInput.value = product.id;
    nombreInput.value = product.nombre;
    precioInput.value = product.precio;
    caracteristicasInput.value = product.caracteristicas.join(", ");
    
    formTitle.textContent = "Editar Producto";
    submitButton.textContent = "Actualizar Producto";
    cancelEditButton.style.display = "inline-block";
    imagenInput.required = false;

    productForm.scrollIntoView({ behavior: "smooth" });
  }

  // --- EVENT LISTENERS ---

  // Envío del formulario (Añadir o Editar)
  productForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const id = productIdInput.value;
    const isEditing = !!id;

    const formData = new FormData();
    formData.append("nombre", nombreInput.value);
    formData.append("precio", precioInput.value);
    formData.append("caracteristicas", caracteristicasInput.value);

    if (imagenInput.files.length > 0) {
      formData.append("imagen", imagenInput.files[0]);
    }

    const url = isEditing ? `http://localhost:3000/api/products/${id}` : "http://localhost:3000/api/products";
    const method = isEditing ? "PUT" : "POST";

    fetch(url, {
      method: method,
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.message || 'Error en la petición') });
        }
        // Para PUT, la respuesta puede no tener cuerpo o no ser JSON, lo manejamos aquí
        if (method === 'PUT' && response.status === 200) {
             return response.json();
        }
        return response.json();
      })
      .then((data) => {
        console.log(`Producto ${isEditing ? "actualizado" : "añadido"}:`, data);
        resetForm();
        loadProducts();
      })
      .catch((error) => console.error(`Error al ${isEditing ? "actualizar" : "añadir"} el producto:`, error));
  });

  // Clics en la lista de productos (Editar o Eliminar)
  productList.addEventListener("click", (event) => {
    const target = event.target;
    const id = target.dataset.id;

    if (!id) return;

    if (target.classList.contains("edit-btn")) {
      fetch(`http://localhost:3000/api/products`)
        .then(res => res.json())
        .then(products => {
          const product = products.find(p => p.id == id);
          if (product) {
            setupEditForm(product);
          }
        });
    }

    if (target.classList.contains("delete-btn")) {
      if (confirm(`¿Estás seguro de que quieres eliminar el producto con ID ${id}?`)) {
        fetch(`http://localhost:3000/api/products/${id}`, {
          method: "DELETE",
        })
          .then((response) => {
            if (response.ok) {
              console.log("Producto eliminado");
              loadProducts();
            } else {
              throw new Error("Error al eliminar el producto");
            }
          })
          .catch((error) => console.error("Error:", error));
      }
    }
  });

  // Clic en el botón de cancelar edición
  cancelEditButton.addEventListener("click", resetForm);

  // --- INICIALIZACIÓN ---
  loadProducts();
});