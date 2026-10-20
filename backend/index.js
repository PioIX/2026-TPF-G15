const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { Server } = require("socket.io");

require("dotenv").config({ path: ".home.env" });

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true
}));

app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend funcionando correctamente");
});

const sessionMiddleware = session({
    secret: "supersarasa",
    resave: false,
    saveUninitialized: false,
});
app.use(sessionMiddleware);

const server = app.listen(PORT, () => {
  console.log(`Servidor NodeJS corriendo en http://localhost:${PORT}/`);
});

const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true,
    },
});

io.use((socket, next) => {
  sessionMiddleware(socket.request, {}, next);
});

const { realizarQuery } = require("./modulos/mysql");



/* =========================================================
   LOGIN
   ========================================================= */

app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                mensaje: "Completá el email y la contraseña"
            });
        }

        // Primero buscamos si existe el email
        const usuarios = await realizarQuery(
            `SELECT *
             FROM Usuarios_TPF
             WHERE email = ?`,
            [email]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                mensaje: "Ese email no está registrado"
            });
        }

        // Después verificamos la contraseña
        const usuario = usuarios[0];

        if (usuario.contrasena !== password) {
            return res.status(401).json({
                mensaje: "La contraseña es incorrecta"
            });
        }

        // No enviar la contraseña al frontend
        delete usuario.contrasena;

        console.log("Login correcto:", usuario.nombre_usuario);

        return res.json({
            mensaje: "Login correcto",
            usuario: usuario
        });

    } catch (error) {
        console.log("Error en el login:", error);

        return res.status(500).json({
            mensaje: "Error al realizar el login. Revisá el backend."
        });
    }
});


/* =========================================================
   REGISTRO
   ========================================================= */

app.post("/register", async (req, res) => {
    const { nombre_usuario, email, contrasena } = req.body;

    try {
        console.log("Solicitud de registro recibida:", {
            nombre_usuario,
            email
        });

        if (!nombre_usuario || !email || !contrasena) {
            return res.status(400).json({
                mensaje: "Completá todos los campos"
            });
        }

        // Comprobar si el email ya existe
        const emailExistente = await realizarQuery(
            `SELECT id_usuario
             FROM Usuarios_TPF
             WHERE email = ?`,
            [email]
        );

        if (emailExistente.length > 0) {
            return res.status(400).json({
                mensaje: "Ese email ya está en uso"
            });
        }

        // Comprobar si el nombre de usuario ya existe
        const usuarioExistente = await realizarQuery(
            `SELECT id_usuario
             FROM Usuarios_TPF
             WHERE nombre_usuario = ?`,
            [nombre_usuario]
        );

        if (usuarioExistente.length > 0) {
            return res.status(400).json({
                mensaje: "Ese nombre de usuario ya está en uso"
            });
        }

        // Crear el usuario
        const resultado = await realizarQuery(
            `INSERT INTO Usuarios_TPF
             (nombre_usuario, email, contrasena)
             VALUES (?, ?, ?)`,
            [nombre_usuario, email, contrasena]
        );

        console.log("Registro correcto. ID:", resultado.insertId);

        return res.status(201).json({
            mensaje: "¡Te registraste correctamente!",
            id_usuario: resultado.insertId
        });

    } catch (error) {
        console.log("Error en el registro:", error);

        return res.status(500).json({
            mensaje: "Error al registrar usuario. Revisá la terminal del backend."
        });
    }
});

