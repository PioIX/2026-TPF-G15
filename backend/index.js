const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { Server } = require("socket.io");

require("dotenv").config({ path: ".pio.env" });

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
    console.log({ email, password })
    try {
        
        const usuarios = await realizarQuery(
            `SELECT *
             FROM Usuarios
             WHERE mail = ? AND contrasena = ?`,
            [email, password]
        );
        console.log(usuarios)
        if (usuarios.length === 0) {
            return res.status(401).json({
                mensaje: "Mail o contraseña incorrectos"
            });
        }

        res.json({
            mensaje: "Login correcto",
            usuario: usuarios[0]
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: "Error al realizar el login"
        });
    }
});


/* =========================================================
   REGISTRO
   ========================================================= */

app.post("/register", async (req, res) => {

    const {
        username,
        mail,
        contrasena,
        foto
    } = req.body;

    try {

        // Verificar si ya existe el mail
        const usuarioExistente = await realizarQuery(
            `SELECT *
             FROM Usuarios
             WHERE mail = ?`,
            [mail]
        );

        if (usuarioExistente.length > 0) {
            return res.status(400).json({
                mensaje: "El mail ya está registrado"
            });
        }

        // Verificar si ya existe el username
        const usernameExistente = await realizarQuery(
            `SELECT *
             FROM Usuarios
             WHERE username = ?`,
            [username]
        );

        if (usernameExistente.length > 0) {
            return res.status(400).json({
                mensaje: "El username ya está registrado"
            });
        }

        // Crear usuario
        const resultado = await realizarQuery(
            `INSERT INTO Usuarios
            (username, mail, contrasena, foto)
            VALUES (?, ?, ?, ?)`,
            [
                username,
                mail,
                contrasena,
                foto || null
            ]
        );

        res.json({
            mensaje: "Usuario registrado correctamente",
            id_usuario: resultado.insertId
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: "Error al registrar usuario"
        });
    }
});


/* =========================================================
   LISTAR CHATS DE UN USUARIO
   ========================================================= */
app.get("/chats/:id_usuario", async (req, res) => {

    const { id_usuario } = req.params;

    try {

        const chats = await realizarQuery(
            `
            SELECT
                c.id_chat,
                c.tipo_chat,
                c.fecha_creado,
                c.foto,
                c.nombre_grupo,

                (
                    SELECT u.id_usuario
                    FROM UsuariosPorChat upc2
                    INNER JOIN Usuarios u
                        ON upc2.id_usuario = u.id_usuario
                    WHERE upc2.id_chat = c.id_chat
                    AND upc2.id_usuario != ?
                    LIMIT 1
                ) AS id_contacto,

                (
                    SELECT u.username
                    FROM UsuariosPorChat upc2
                    INNER JOIN Usuarios u
                        ON upc2.id_usuario = u.id_usuario
                    WHERE upc2.id_chat = c.id_chat
                    AND upc2.id_usuario != ?
                    LIMIT 1
                ) AS nombre_contacto,

                (
                    SELECT u.foto
                    FROM UsuariosPorChat upc2
                    INNER JOIN Usuarios u
                        ON upc2.id_usuario = u.id_usuario
                    WHERE upc2.id_chat = c.id_chat
                    AND upc2.id_usuario != ?
                    LIMIT 1
                ) AS foto_contacto,

                (
                    SELECT u.mail
                    FROM UsuariosPorChat upc2
                    INNER JOIN Usuarios u
                        ON upc2.id_usuario = u.id_usuario
                    WHERE upc2.id_chat = c.id_chat
                    AND upc2.id_usuario != ?
                    LIMIT 1
                ) AS mail_contacto

            FROM Chats c

            INNER JOIN UsuariosPorChat upc
                ON c.id_chat = upc.id_chat

            WHERE upc.id_usuario = ?

            ORDER BY c.fecha_creado DESC
            `,
            [
                id_usuario,
                id_usuario,
                id_usuario,
                id_usuario,
                id_usuario
            ]
        );

        res.json(chats);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: "Error al obtener los chats"
        });
    }
});




/* =========================================================
   CREAR CHAT INDIVIDUAL
   ========================================================= */

app.post("/chats", async (req, res) => {

    const {
        id_usuario,
        mail_contacto
    } = req.body;

    try {

        // Buscar al otro usuario
        const usuarios = await realizarQuery(
            `SELECT *
             FROM Usuarios
             WHERE mail = ?`,
            [mail_contacto]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                mensaje: "El usuario no existe"
            });
        }

        const contacto = usuarios[0];

        // Verificar que no exista ya un chat entre ambos
        const chatsExistentes = await realizarQuery(
            `
            SELECT c.id_chat
            FROM Chats c

            INNER JOIN UsuariosPorChat u1
                ON c.id_chat = u1.id_chat

            INNER JOIN UsuariosPorChat u2
                ON c.id_chat = u2.id_chat

            WHERE c.tipo_chat = FALSE
            AND u1.id_usuario = ?
            AND u2.id_usuario = ?
            `,
            [id_usuario, contacto.id_usuario]
        );

        if (chatsExistentes.length > 0) {
            return res.status(400).json({
                mensaje: "El chat ya existe",
                id_chat: chatsExistentes[0].id_chat
            });
        }

        // Crear chat
        const nuevoChat = await realizarQuery(
            `
            INSERT INTO Chats
            (tipo_chat)
            VALUES (FALSE)
            `
        );

        const id_chat = nuevoChat.insertId;

        // Agregar usuarios al chat
        await realizarQuery(
            `
            INSERT INTO UsuariosPorChat
            (id_usuario, id_chat)
            VALUES (?, ?), (?, ?)
            `,
            [
                id_usuario,
                id_chat,
                contacto.id_usuario,
                id_chat
            ]
        );

        res.json({
            mensaje: "Chat creado correctamente",
            id_chat: id_chat
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: "Error al crear el chat"
        });
    }
});


/* =========================================================
   CREAR CHAT GRUPAL
   ========================================================= */

app.post("/grupos", async (req, res) => {

    const {
        id_usuario,
        nombre_grupo,
        foto,
        mails
    } = req.body;

    try {

        // Buscar todos los usuarios
        const usuarios = [];

        for (const mail of mails) {

            const resultado = await realizarQuery(
                `SELECT *
                 FROM Usuarios
                 WHERE mail = ?`,
                [mail]
            );

            if (resultado.length === 0) {

                return res.status(404).json({
                    mensaje: `No existe el usuario con mail ${mail}`
                });
            }

            usuarios.push(resultado[0]);
        }

        // Crear el chat
        const nuevoChat = await realizarQuery(
            `
            INSERT INTO Chats
            (tipo_chat, foto, nombre_grupo)
            VALUES (TRUE, ?, ?)
            `,
            [
                foto || null,
                nombre_grupo
            ]
        );

        const id_chat = nuevoChat.insertId;

        // Agregar al creador
        await realizarQuery(
            `
            INSERT INTO UsuariosPorChat
            (id_usuario, id_chat)
            VALUES (?, ?)
            `,
            [
                id_usuario,
                id_chat
            ]
        );

        // Agregar los demás usuarios
        for (const usuario of usuarios) {

            // Evitar agregar dos veces al creador
            if (usuario.id_usuario != id_usuario) {

                await realizarQuery(
                    `
                    INSERT INTO UsuariosPorChat
                    (id_usuario, id_chat)
                    VALUES (?, ?)
                    `,
                    [
                        usuario.id_usuario,
                        id_chat
                    ]
                );
            }
        }

        res.json({
            mensaje: "Grupo creado correctamente",
            id_chat: id_chat
        });

    } catch (error) {

        console.log(error);

        res.status(500).json({
            mensaje: "Error al crear el grupo"
        });
    }
});


/* =========================================================
   HISTORIAL DE MENSAJES
   ========================================================= */

app.get("/mensajes/:id_chat", async (req, res) => {

    const { id_chat } = req.params

    try {

        const mensajes = await realizarQuery(
            `
            SELECT
                m.id_mensaje,
                m.id_usuario,
                m.id_chat,
                m.contenido,
                m.fecha_hora,
                m.estado,
                u.username AS nombre,
                u.mail
            FROM Mensajes m
            INNER JOIN Usuarios u
                ON m.id_usuario = u.id_usuario
            WHERE m.id_chat = ?
            ORDER BY m.fecha_hora ASC
            `,
            [id_chat]
        )

        res.json(mensajes)

    } catch (error) {

        console.log(error)

        res.status(500).json({
            mensaje: "Error al obtener los mensajes"
        })
    }
})


/* =========================================================
   SOCKET.IO
   ========================================================= */

io.on("connection", (socket) => {

    console.log("Usuario conectado:", socket.id);


    // Entrar a un chat
    socket.on("joinChat", (id_chat) => {

        socket.join(`chat_${id_chat}`);

        console.log(
            `Socket ${socket.id} entró al chat ${id_chat}`
        );
    });


    // Salir de un chat
    socket.on("leaveChat", (id_chat) => {

        socket.leave(`chat_${id_chat}`);

        console.log(
            `Socket ${socket.id} salió del chat ${id_chat}`
        );
    });


    // Enviar mensaje
    socket.on("sendMessage", async (datos) => {

        const {
            id_usuario,
            id_chat,
            contenido
        } = datos;

        try {

            // Guardar mensaje en MySQL
            const resultado = await realizarQuery(
                `
                INSERT INTO Mensajes
                (id_usuario, id_chat, contenido)
                VALUES (?, ?, ?)
                `,
                [
                    id_usuario,
                    id_chat,
                    contenido
                ]
            );

            // Obtener mensaje completo
            const mensajes = await realizarQuery(
                `
                SELECT
                    m.id_mensaje,
                    m.id_usuario,
                    m.id_chat,
                    m.contenido,
                    m.fecha_hora,
                    m.estado,
                    u.username,
                    u.mail

                FROM Mensajes m

                INNER JOIN Usuarios u
                    ON m.id_usuario = u.id_usuario

                WHERE m.id_mensaje = ?
                `,
                [resultado.insertId]
            );

            // Enviar a todos los usuarios
            // que están dentro de ese chat
            io.to(`chat_${id_chat}`).emit(
                "newMessage",
                mensajes[0]
            );

        } catch (error) {

            console.log(
                "Error guardando mensaje:",
                error
            );

            socket.emit("messageError", {
                mensaje: "No se pudo guardar el mensaje"
            });
        }
    });


    // Desconexión
    socket.on("disconnect", () => {

        console.log(
            "Usuario desconectado:",
            socket.id
        );
    });

});
