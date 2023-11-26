const express = require('express');
const exphbs = require('express-handlebars');
const http = require('http');
const socketIO = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// express-handlebars engine
const hbs = exphbs.create({
    extname: 'handlebars',
    defaultLayout: false, // deshabilita el default layout
});

// Configurar Handlebars como el motor de templates
app.engine('handlebars', hbs.engine);
app.set('view engine', 'handlebars');

// Datos de productos
let products = [
    { id: uuidv4(), name: 'Papas' },
    { id: uuidv4(), name: 'Patatas' },
    { id: uuidv4(), name: 'Batata' },
    { id: uuidv4(), name: 'Chips' },
];

// Rutas
app.get('/', (req, res) => {
    // Renderiza la vista home.handlebars
    res.render('home', { products: products });
});

app.get('/realtimeproducts', (req, res) => {
    // Renderizar la vista realTimeProducts.handlebars
    res.render('realTimeProducts');
});

// WebSocket
io.on('connection', (socket) => {
    const userId = uuidv4();
    console.log(`Un usuario se ha conectado con ID: ${userId}`);

    // Envia la lista de productos al cliente al conectarse
    socket.emit('updateProducts', products);

    // Eventos de WebSocket
    socket.on('newProduct', (product) => {
        // +Nuevo producto con ID único
        const newProduct = { id: uuidv4(), name: product.name };
        products.push(newProduct);
        io.emit('updateProducts', products);//Emite +newProd
    });

    socket.on('deleteProduct', (productId) => {
        console.log(`Se borró  ID = ${productId}`);

        // Verifica si el producto con el ID dado existe antes de intentar eliminarlo
        const existingProductIndex = products.findIndex((product) => product.id === productId);

        if (existingProductIndex !== -1) {
            // Elimina el producto
            products.splice(existingProductIndex, 1);
            io.emit('updateProducts', products);//Emite delete update
        } else {
            console.log(`Product with ID ${productId} not found.`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`Usuario: ${userId} partió, que descanse en paz (;-;)`);
    });
});

// Iniciar el servidor
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Servidor en funcionamiento en el puerto ${PORT}`);
});
