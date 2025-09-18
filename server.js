// -----------------
// 1. IMPORTACIONES
// -----------------
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// -----------------
// 2. INICIALIZACIÓN Y CONFIGURACIÓN DE MULTER
// -----------------
const app = express();
const PORT = process.env.PORT || 3000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'assets/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// -----------------
// 3. MIDDLEWARES
// -----------------
app.use(cors());
app.use(express.static('.'));
app.use(express.json());

// -----------------
// 4. RUTAS (ENDPOINTS)
// -----------------

// RUTA GET para obtener todos los productos
app.get('/api/products', (req, res) => {
  fs.readFile('assets/products.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al leer los productos.' });
    }
    res.json(JSON.parse(data));
  });
});

// RUTA POST para AÑADIR un nuevo producto
app.post('/api/products', upload.single('imagen'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No se ha subido ninguna imagen.' });
  }

  const imagePath = req.file.path.replace(/\\/g, "/");
  const newProductData = req.body;

  fs.readFile('assets/products.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al leer la base de datos.' });
    }

    const products = JSON.parse(data);
    const maxId = products.reduce((max, p) => p.id > max ? p.id : max, 0);

    const newProduct = {
      id: maxId + 1,
      nombre: newProductData.nombre,
      precio: parseInt(newProductData.precio),
      imagen: imagePath,
      alt: newProductData.nombre,
      caracteristicas: newProductData.caracteristicas.split(',').map(s => s.trim())
    };

    products.push(newProduct);

    fs.writeFile('assets/products.json', JSON.stringify(products, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al guardar el producto.' });
      }
      res.status(201).json(newProduct);
    });
  });
});

// RUTA PUT para ACTUALIZAR un producto existente
app.put('/api/products/:id', upload.single('imagen'), (req, res) => {
  const idToUpdate = parseInt(req.params.id);
  const updatedData = req.body;

  fs.readFile('assets/products.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al leer la base de datos.' });
    }

    let products = JSON.parse(data);
    const productIndex = products.findIndex(p => p.id === idToUpdate);

    if (productIndex === -1) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    const productToUpdate = products[productIndex];

    productToUpdate.nombre = updatedData.nombre || productToUpdate.nombre;
    productToUpdate.precio = parseInt(updatedData.precio) || productToUpdate.precio;
    productToUpdate.caracteristicas = updatedData.caracteristicas.split(',').map(s => s.trim()) || productToUpdate.caracteristicas;
    productToUpdate.alt = updatedData.nombre || productToUpdate.alt;

    if (req.file) {
      const oldImagePath = productToUpdate.imagen;
      const newImagePath = req.file.path.replace(/\\/g, "/");
      productToUpdate.imagen = newImagePath;

      if (oldImagePath && oldImagePath.includes('imagen-')) {
        fs.unlink(path.join(__dirname, oldImagePath), (unlinkErr) => {
          if (unlinkErr) {
            console.error('Error al borrar la imagen antigua:', unlinkErr);
          }
        });
      }
    }

    products[productIndex] = productToUpdate;

    fs.writeFile('assets/products.json', JSON.stringify(products, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al actualizar el producto.' });
      }
      res.status(200).json(productToUpdate);
    });
  });
});

// RUTA DELETE para BORRAR un producto por su ID
app.delete('/api/products/:id', (req, res) => {
  const idToDelete = parseInt(req.params.id);

  fs.readFile('assets/products.json', 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al leer los productos.' });
    }

    let products = JSON.parse(data);
    const productToDelete = products.find(p => p.id === idToDelete);
    const updatedProducts = products.filter(p => p.id !== idToDelete);

    if (products.length === updatedProducts.length) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    if (productToDelete && productToDelete.imagen && productToDelete.imagen.includes('imagen-')) {
        fs.unlink(path.join(__dirname, productToDelete.imagen), (unlinkErr) => {
            if (unlinkErr) {
                console.error('Error al borrar el archivo de imagen:', unlinkErr);
            }
        });
    }

    fs.writeFile('assets/products.json', JSON.stringify(updatedProducts, null, 2), (err) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al eliminar el producto.' });
      }
      res.status(204).send();
    });
  });
});

// -----------------
// 5. INICIAR SERVIDOR
// -----------------
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
