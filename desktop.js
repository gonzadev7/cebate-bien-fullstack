// Lupa sobre la imagen ampliada en el overlay
document.addEventListener("mousemove", function (e) {
  const lens = document.querySelector(".zoom-lens");
  const zoomedImg = document.querySelector(".zoomed-img");
  const closeBtn = document.querySelector(".zoom-close-btn");
  if (!lens || !zoomedImg) return;
  // Si el mouse está sobre el botón de cerrar, ocultar la lupa y salir
  if (closeBtn) {
    const btnRect = closeBtn.getBoundingClientRect();
    if (
      e.clientX >= btnRect.left &&
      e.clientX <= btnRect.right &&
      e.clientY >= btnRect.top &&
      e.clientY <= btnRect.bottom
    ) {
      lens.style.display = "none";
      return;
    }
  }
  const rect = zoomedImg.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
    lens.style.display = "none";
    return;
  }
  lens.style.display = "block";
  const lensSize = lens.offsetWidth / 2;
  lens.style.left = rect.left + x - lensSize + "px";
  lens.style.top = rect.top + y - lensSize + "px";
  const bgX = (x / rect.width) * 100;
  const bgY = (y / rect.height) * 100;
  lens.style.backgroundPosition = `${bgX}% ${bgY}%`;
});

document.addEventListener(
  "mouseenter",
  function (e) {
    const zoomedImg = e.target;
    if (zoomedImg.classList && zoomedImg.classList.contains("zoomed-img")) {
      let lens = document.querySelector(".zoom-lens");
      if (!lens) {
        lens = document.createElement("div");
        lens.className = "zoom-lens";
        document.body.appendChild(lens);
      }
      lens.style.backgroundImage = `url('${zoomedImg.src}')`;
      lens.style.display = "block";
    }
  },
  true
);

document.addEventListener(
  "mouseleave",
  function (e) {
    const zoomedImg = e.target;
    if (zoomedImg.classList && zoomedImg.classList.contains("zoomed-img")) {
      const lens = document.querySelector(".zoom-lens");
      if (lens) lens.style.display = "none";
    }
  },
  true
);
// --- Carga de productos desde JSON y render dinámico ---
async function cargarProductos() {
  const contenedor = document.getElementById("productos");
  try {
    const res = await fetch("assets/products.json", { cache: "no-store" });
    if (!res.ok) throw new Error("No se pudo cargar products.json");
    const productos = await res.json();
    renderizarProductos(productos);
  } catch (err) {
    console.error(err);
    const loading = document.getElementById("productos-loading");
    if (loading) loading.textContent = "No se pudieron cargar los productos.";
  }
}

function crearCard(producto) {
  const card = document.createElement("div");
  card.className = "card";
  const imgSrc =
    producto.imagen && String(producto.imagen).trim() !== ""
      ? producto.imagen
      : "assets/logo2.png";
  const precioNum = Number(producto.precio) || 0;
  card.innerHTML = `
    <img src="${imgSrc}" alt="${
    producto.alt || producto.nombre || "Producto"
  }" class="product-image" />
    <h3>${producto.nombre || "Producto sin nombre"}</h3>
    ${
      Array.isArray(producto.caracteristicas) && producto.caracteristicas.length
        ? `<ul>${producto.caracteristicas
            .map((c) => `<li>· ${c}</li>`)
            .join("")}</ul>`
        : ""
    }
    <div class="precio">$${formatearPrecio(precioNum)}${
    producto.notaPrecio ? ` (${producto.notaPrecio})` : ""
  }</div>
    <button class="btn-agregar" data-nombre="${
      producto.nombre || "Producto"
    }" data-precio="${precioNum}">Agregar</button>
  `;
  return card;
}

function renderizarProductos(productos) {
  const contenedor = document.getElementById("productos");
  const loading = document.getElementById("productos-loading");
  if (loading) loading.remove();
  contenedor.innerHTML = "";
  productos.forEach((p) => contenedor.appendChild(crearCard(p)));
  // Wire up eventos de agregar y zoom para las nuevas imágenes
  contenedor.querySelectorAll(".btn-agregar").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const nombre = btn.getAttribute("data-nombre");
      const precio = parseFloat(btn.getAttribute("data-precio"));
      agregarAlCarrito(nombre, precio);
    });
  });
  // Reaplicar listeners de zoom a las nuevas imágenes
  inicializarZoomEnImagenes();
}

function inicializarZoomEnImagenes() {
  document.querySelectorAll(".product-image").forEach((img) => {
    img.addEventListener("click", function (e) {
      e.stopPropagation();
      if (document.querySelector(".zoom-overlay")) return;
      const overlay = document.createElement("div");
      overlay.className = "zoom-overlay";
      const zoomImg = document.createElement("img");
      zoomImg.src = img.src;
      zoomImg.alt = img.alt;
      zoomImg.className = "zoomed-img";
      const closeBtn = document.createElement("button");
      closeBtn.className = "zoom-close-btn";
      closeBtn.innerHTML = "&times;";
      closeBtn.title = "Cerrar";
      closeBtn.addEventListener("click", function (ev) {
        ev.stopPropagation();
        overlay.remove();
        const lens = document.querySelector(".zoom-lens");
        if (lens) lens.remove();
      });
      const imgContainer = document.createElement("div");
      imgContainer.className = "zoomed-img-container";
      imgContainer.appendChild(zoomImg);
      imgContainer.appendChild(closeBtn);
      overlay.appendChild(imgContainer);
      document.body.appendChild(overlay);
      overlay.addEventListener("click", function (ev) {
        if (ev.target === overlay) {
          overlay.remove();
          const lens = document.querySelector(".zoom-lens");
          if (lens) lens.remove();
        }
      });
    });
  });
}
// Efecto de zoom profesional para imágenes de producto con botón de cerrar (igual que mobile)
// Inicializar zoom para cualquier imagen inicial (por si el contenedor ya trae imágenes)
inicializarZoomEnImagenes();
// Carrito de compras versión desktop (idéntico a mobile.js)
let carrito = [];

const carritoIcono = document.getElementById("carrito-icono");
const carritoContenido = document.getElementById("carrito-contenido");
const contadorCarrito = document.getElementById("contador-carrito");
const totalPrecio = document.getElementById("total-precio");
const cerrarCarrito = document.getElementById("cerrar-carrito");
const vaciarCarrito = document.getElementById("vaciar-carrito");
const enviarWsp = document.getElementById("enviar-wsp");

function agregarAlCarrito(producto, precio) {
  carrito.push({ nombre: producto, precio: precio });
  actualizarCarrito();
  animarContador();
}

function formatearPrecio(precio) {
  return precio.toLocaleString("es-AR");
}

function actualizarCarrito() {
  const lista = document.getElementById("lista-carrito");
  const totalItems = carrito.length;
  contadorCarrito.textContent = totalItems;
  const total = carrito.reduce((sum, item) => sum + item.precio, 0);
  totalPrecio.textContent = formatearPrecio(total);
  if (totalItems > 0) {
    contadorCarrito.classList.add("visible");
  } else {
    contadorCarrito.classList.remove("visible");
  }
  lista.innerHTML = "";
  const productosUnicos = {};
  carrito.forEach((item) => {
    if (!productosUnicos[item.nombre]) {
      productosUnicos[item.nombre] = { cantidad: 0, precio: item.precio };
    }
    productosUnicos[item.nombre].cantidad++;
  });
  Object.entries(productosUnicos).forEach(([producto, data], index) => {
    const li = document.createElement("li");
    const subtotal = data.precio * data.cantidad;
    li.innerHTML = `
			<span class="item-nombre">${producto}</span>
			<span class="item-precio">$${formatearPrecio(subtotal)}</span>
			<span style="display: flex; align-items: center; gap: 4px;">
				<span class="item-cantidad">${data.cantidad}</span>
				<button class="quitar-producto" data-producto="${producto}" title="Quitar uno">✕</button>
			</span>
		`;
    li.style.animationDelay = `${index * 0.1}s`;
    lista.appendChild(li);
  });
  document.querySelectorAll(".quitar-producto").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      quitarUnProducto(this.dataset.producto);
    });
  });
  function quitarUnProducto(nombreProducto) {
    const index = carrito.findIndex((item) => item.nombre === nombreProducto);
    if (index !== -1) {
      carrito.splice(index, 1);
      actualizarCarrito();
    }
  }
  enviarWsp.disabled = totalItems === 0;
}

function animarContador() {
  contadorCarrito.style.transform = "scale(1.3)";
  setTimeout(() => {
    contadorCarrito.style.transform = "scale(1)";
  }, 200);
}

function mostrarCarrito() {
  carritoContenido.classList.remove("carrito-oculto");
  carritoContenido.classList.add("carrito-visible");
}

function ocultarCarrito() {
  carritoContenido.classList.remove("carrito-visible");
  carritoContenido.classList.add("carrito-oculto");
}

function vaciarCarritoCompleto() {
  carrito = [];
  actualizarCarrito();
  const lista = document.getElementById("lista-carrito");
  lista.style.opacity = "0.5";
  setTimeout(() => {
    lista.style.opacity = "1";
  }, 300);
}

carritoIcono.addEventListener("click", mostrarCarrito);
cerrarCarrito.addEventListener("click", ocultarCarrito);
vaciarCarrito.addEventListener("click", vaciarCarritoCompleto);
document.addEventListener("click", (e) => {
  if (!document.getElementById("carrito-flotante").contains(e.target)) {
    ocultarCarrito();
  }
});
enviarWsp.addEventListener("click", () => {
  if (carrito.length === 0) return;
  enviarWsp.style.transform = "scale(0.95)";
  setTimeout(() => {
    enviarWsp.style.transform = "";
  }, 150);
  const productosUnicos = {};
  carrito.forEach((item) => {
    if (!productosUnicos[item.nombre]) {
      productosUnicos[item.nombre] = { cantidad: 0, precio: item.precio };
    }
    productosUnicos[item.nombre].cantidad++;
  });
  const total = carrito.reduce((sum, item) => sum + item.precio, 0);
  const mensajeItems = Object.entries(productosUnicos)
    .map(([producto, data]) => {
      const subtotal = data.precio * data.cantidad;
      return `- ${producto} (x${data.cantidad}) - $${formatearPrecio(
        subtotal
      )}`;
    })
    .join("\n");
  const mensaje = encodeURIComponent(
    `Hola! Quiero pedir:\n${mensajeItems}\n\n*Total: $${formatearPrecio(
      total
    )}*`
  );
  const url = `https://wa.me/541127030674?text=${mensaje}`;
  window.open(url, "_blank");
});
actualizarCarrito();

// Cargar productos al final para escritorio (soporta script inyectado)
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", cargarProductos);
} else {
  cargarProductos();
}
