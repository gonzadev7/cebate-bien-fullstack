// -----------------
// 1. IMPORTACIONES // Forzando re-deploy
// -----------------
const express = require("express");
const cors = require("cors");
const fs = require("fs").promises; // Usamos la versión de promesas de fs
const path = require("path");
const multer = require("multer");
const admin = require("firebase-admin");

// -----------------
// 2. INICIALIZACIÓN Y CONFIGURACIÓN
// -----------------
const app = express();
const PORT = process.env.PORT || 3000;

// --- Configuración de Firebase ---
const serviceAccount = require("./firebase-credentials.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const db = admin.firestore();
const productsCollection = db.collection("products");

// --- Configuración de Multer (para subida de archivos) ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "assets/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage: storage });

// -----------------
// 3. MIDDLEWARES
// -----------------
app.use(cors());
app.use("/assets", express.static(path.join(__dirname, "assets")));
app.use(express.json());

// -----------------
// 4. RUTAS (ENDPOINTS) CON FIRESTORE
// -----------------

// RUTA GET para obtener todos los productos
app.get("/api/products", async (req, res) => {
  try {
    const snapshot = await productsCollection.get();
    if (snapshot.empty) {
      return res.status(200).json([]);
    }
    const products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(products);
  } catch (error) {
    console.error("Error al obtener productos:", error);
    res.status(500).json({ message: "Error al leer los productos." });
  }
});

// RUTA POST para AÑADIR un nuevo producto
app.post("/api/products", upload.single("imagen"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "No se ha subido ninguna imagen." });
    }

    const imagePath = req.file.path.replace(/\\/g, "/");
    const newProductData = req.body;

    const newProduct = {
      nombre: newProductData.nombre,
      precio: parseInt(newProductData.precio, 10),
      imagen: imagePath,
      alt: newProductData.nombre,
      caracteristicas: newProductData.caracteristicas
        .split(",")
        .map((s) => s.trim()),
    };

    const docRef = await productsCollection.add(newProduct);
    res.status(201).json({ id: docRef.id, ...newProduct });
  } catch (error) {
    console.error("Error al añadir producto:", error);
    res.status(500).json({ message: "Error al guardar el producto." });
  }
});

// RUTA PUT para ACTUALIZAR un producto existente
app.put("/api/products/:id", upload.single("imagen"), async (req, res) => {
  try {
    const idToUpdate = req.params.id;
    const updatedData = req.body;
    const docRef = productsCollection.doc(idToUpdate);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    const productToUpdate = doc.data();

    const updatePayload = {
      nombre: updatedData.nombre || productToUpdate.nombre,
      precio: parseInt(updatedData.precio, 10) || productToUpdate.precio,
      caracteristicas:
        updatedData.caracteristicas?.split(",").map((s) => s.trim()) ||
        productToUpdate.caracteristicas,
      alt: updatedData.nombre || productToUpdate.alt,
    };

    if (req.file) {
      const oldImagePath = productToUpdate.imagen;
      const newImagePath = req.file.path.replace(/\\/g, "/");
      updatePayload.imagen = newImagePath;

      // Borrar imagen antigua si existe
      if (oldImagePath) {
        try {
          await fs.unlink(path.join(__dirname, oldImagePath));
        } catch (unlinkErr) {
          console.error("Error al borrar la imagen antigua:", unlinkErr);
        }
      }
    }

    await docRef.update(updatePayload);
    res.status(200).json({ id: docRef.id, ...updatePayload });
  } catch (error) {
    console.error("Error al actualizar producto:", error);
    res.status(500).json({ message: "Error al actualizar el producto." });
  }
});

// RUTA DELETE para BORRAR un producto por su ID
app.delete("/api/products/:id", async (req, res) => {
  try {
    const idToDelete = req.params.id;
    const docRef = productsCollection.doc(idToDelete);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Producto no encontrado." });
    }

    const productToDelete = doc.data();

    // Borrar la imagen asociada
    if (productToDelete.imagen) {
      try {
        await fs.unlink(path.join(__dirname, productToDelete.imagen));
      } catch (unlinkErr) {
        console.error("Error al borrar el archivo de imagen:", unlinkErr);
      }
    }

    await docRef.delete();
    res.status(204).send();
  } catch (error) {
    console.error("Error al eliminar producto:", error);
    res.status(500).json({ message: "Error al eliminar el producto." });
  }
});

// -----------------
// 5. MIGRACIÓN INICIAL Y ARRANQUE DEL SERVIDOR
// -----------------

const migrateData = async () => {
  try {
    const snapshot = await productsCollection.get();
    if (!snapshot.empty) {
      console.log(
        "La base de datos de Firestore ya tiene productos. No se requiere migración."
      );
      return;
    }

    console.log(
      "Base de datos vacía, iniciando migración desde products.json..."
    );
    const data = await fs.readFile("assets/products.json", "utf8");
    const products = JSON.parse(data);

    const batch = db.batch();
    products.forEach((product) => {
      // Firestore generará IDs automáticos, eliminamos los viejos
      const { id, ...productData } = product;
      const docRef = productsCollection.doc(); // Nuevo documento con ID automático
      batch.set(docRef, productData);
    });

    await batch.commit();
    console.log(
      `Migración completada: ${products.length} productos importados a Firestore.`
    );
  } catch (error) {
    console.error("Error durante la migración de datos:", error);
    // No detenemos el servidor si la migración falla, pero sí lo advertimos.
  }
};

app.listen(PORT, async () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
  await migrateData();
});
