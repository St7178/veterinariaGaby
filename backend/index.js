const port = 4000;
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");

app.use(express.json());
app.use(cors()); // Habilitar CORS para permitir solicitudes desde diferentes dominios

// Conexión a la base de datos MongoDB
mongoose.connect("mongodb+srv://st71782807:007007007@cluster0.6ihoc.mongodb.net/veterinariagaby");

// Creación de la API
app.get("/", (req, res) => {
    res.send("La aplicación Express está en funcionamiento");
});

// Configuración del motor de almacenamiento para las imágenes
const storage = multer.diskStorage({
    destination: './upload/images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage: storage });

// carga de imágenes
app.use('/images', express.static('./upload/images'));

app.post("/upload", upload.single('product'), (req, res) => {
    res.json({
        success: 1,
        image_url: `http://localhost:${port}/images/${req.file.filename}` // URL de la imagen cargada
    });
});

// Esquema para el modelo de Contacto
const Contact = mongoose.model("Contact", {
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

// enviar el formulario de contacto
app.post('/contact', async (req, res) => {
    const { name, email, message } = req.body;
  
    try {
      const newContact = new Contact({ name, email, message });
      await newContact.save(); // Guardar el mensaje en la base de datos
      res.status(201).json({ success: true, message: 'Mensaje enviado correctamente.' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al enviar el mensaje.', error });
    }
});

// Esquema para crear productos
const Product = mongoose.model("Product", {
    id: {
        type: Number,
        required: true,
    },
    nombre: {
        type: String,
        required: true,
    },
    imagen: {
        type: String,
        required: true,
    },
    precio_nuevo: {
        type: Number,
        required: true,
    },
    precio_viejo: {
        type: Number,
        required: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    avilable: {
        type: Boolean,
        default: true,
    },
});

// agregar productos
app.post('/addproduct', async (req, res) => {
    let products = await Product.find({});
    let id;
    if (products.length > 0) {
        let last_product_array = products.slice(-1);
        let last_product = last_product_array[0];
        id = last_product.id + 1; // Obtener el ID del último producto y sumar 1
    } else {
        id = 1; // Si no hay productos, iniciar con el ID 1
    }
    const product = new Product({
        id: id,
        nombre: req.body.nombre,
        imagen: req.body.imagen,
        precio_nuevo: req.body.precio_nuevo,
        precio_viejo: req.body.precio_viejo,
    });
    console.log(product);
    await product.save(); // Guardar el producto en la base de datos
    console.log("Guardado");
    res.json({
        success: true,
        nombre: req.body.nombre,
    });
});

// API para eliminar productos
app.post('/removeproduct', async (req, res) => {
    await Product.findOneAndDelete({ id: req.body.id }); // Eliminar el producto según su ID
    console.log("Eliminado");
    res.json({
        success: true,
        nombre: req.body.nombre
    });
});

// API para obtener todos los productos
app.get('/allproducts', async (req, res) => {
    let products = await Product.find({}); // Obtener todos los productos
    console.log("Productos encontrados");
    res.send(products);
});

// Esquema para el modelo de Usuario
const Users = mongoose.model('Users', {
    name: {
        type: String,
    },
    email: {
        type: String,
        unique: true,
    },
    password: {
        type: String,
    },
    cartData: {
        type: Object,
    },
    date: {
        type: Date,
        default: Date.now,
    }
});

// registrar un usuario
app.post('/signup', async (req, res) => {
    let check = await Users.findOne({ email: req.body.email });
    if (check) {
        return res.status(400).json({ success: false, errors: "Ya existe un usuario con este correo electrónico" });
    }
    let cart = {};
    for (let i = 0; i < 300; i++) {
        cart[i] = 0; // Inicializar el carrito
    }
    const user = new Users({
        name: req.body.nombre,
        email: req.body.email,
        password: req.body.password,
        cartData: cart,
    });

    await user.save(); // Guardar el usuario en la base de datos

    const data = {
        user: {
            id: user.id
        }
    };

    const token = jwt.sign(data, 'secret_ecom'); // Generar un token JWT
    res.json({ success: true, token });
});

// inicio de sesión del usuario
app.post('/login', async (req, res) => {
    let user = await Users.findOne({ email: req.body.email });
    if (user) {
        const passCompare = req.body.password === user.password; // Comparar la contraseña
        if (passCompare) {
            const data = {
                user: {
                    id: user.id
                }
            };
            const token = jwt.sign(data, 'secret_ecom'); // Generar un token JWT
            res.json({ success: true, token });
        } else {
            res.json({ success: false, errors: "Contraseña Incorrecta" });
        }
    } else {
        res.json({ success: false, errors: "Correo Incorrecto" });
    }
});

// obtener datos de productos
app.get('/productosd', async (req, res) => {
    let products = await Product.find({});
    let productdata = products.slice(1).slice(-8); // Obtener los últimos 8 productos
    console.log("Datos de productos encontrados");
    res.send(productdata);
});

// mejores productos
app.get('/mejoresproductos', async (req, res) => {
    let products = await Product.find({});
    let mejoresproductos = products.slice(0, 4); // Obtener los primeros 4 productos
    console.log("Mejores productos encontrados");
    res.send(mejoresproductos);
});

// verificar el usuario
const fetchUser = async (req, res, next) => {
    const token = req.header('auth-token');
    if (!token) {
        res.status(401).send({ errors: "Por favor autentífiquese" });
    } else {
        try {
            const data = jwt.verify(token, 'secret_ecom'); // Verificar el token
            req.user = data.user; // Añadir los datos del usuario a la solicitud
            next();
        } catch (error) {
            res.status(401).send({ errors: "Por favor autentífiquese" });
        }
    }
};

// agregar productos al carrito
app.post('/addtocart', fetchUser, async (req, res) => {
    console.log("Agregado", req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id });
    userData.cartData[req.body.itemId] += 1; // Aumentar la cantidad del producto en el carrito
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData }); // Actualizar el carrito en la base de datos
    res.send("Agregado");
});

// eliminar producto del carrito
app.post('/removedfromcart', fetchUser, async (req, res) => {
    console.log("Eliminado", req.body.itemId);
    let userData = await Users.findOne({ _id: req.user.id });
    if (userData.cartData[req.body.itemId] > 0) {
        userData.cartData[req.body.itemId] -= 1; // Disminuir la cantidad del producto en el carrito
    }
    await Users.findOneAndUpdate({ _id: req.user.id }, { cartData: userData.cartData }); // Actualizar el carrito en la base de datos
    res.send("Eliminado");
});

// obtener los datos del carrito
app.post('/getcart', fetchUser, async (req, res) => {
    console.log("Productos en el carrito");
    let userData = await Users.findOne({ _id: req.user.id });
    res.json(userData.cartData); // Enviar los datos del carrito
});

// Iniciar el servidor
app.listen(port, (error) => {
    if (!error) {
        console.log("Servidor Corriendo En Puerto " + port);
    } else {
        console.log("Error : " + error);
    }
});
