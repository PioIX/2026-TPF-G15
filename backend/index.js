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

        // Guardar el usuario en la sesión para verificar permisos.
        req.session.usuario = usuario;

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


/* =========================================================
   PANEL DE ADMINISTRACIÓN
   ========================================================= */


/* =========================================================
   FUNCIÓN PARA VERIFICAR SI EL USUARIO ES ADMINISTRADOR
   ========================================================= */

function verificarAdmin(req, res, next) {
    const usuario = req.session.usuario;

    if (!usuario) {
        return res.status(401).json({
            mensaje: "Tenés que iniciar sesión para realizar esta acción"
        });
    }

    if (Number(usuario.administrador) !== 1) {
        return res.status(403).json({
            mensaje: "No tenés permisos de administrador"
        });
    }

    next();
}


/* =========================================================
   USUARIOS: OBTENER TODOS
   ========================================================= */

app.get("/usuarios", verificarAdmin, async (req, res) => {
    try {
        const usuarios = await realizarQuery(
            `SELECT
                id_usuario,
                nombre_usuario,
                email,
                administrador,
                partidas_jugadas,
                partidas_ganadas
             FROM Usuarios_TPF
             ORDER BY id_usuario`
        );

        res.json(usuarios);

    } catch (error) {
        console.log("Error al obtener usuarios:", error);

        res.status(500).json({
            mensaje: "Error al obtener los usuarios"
        });
    }
});


/* =========================================================
   USUARIOS: DAR O QUITAR PERMISOS DE ADMINISTRADOR
   ========================================================= */

// Recibe:
// { "administrador": 1 } para hacerlo administrador.
// { "administrador": 0 } para quitarle el permiso.

app.put("/usuarios/:id/administrador",
    verificarAdmin,
    async (req, res) => {
        try {
            const idUsuario = Number(req.params.id);
            const { administrador } = req.body;

            if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
                return res.status(400).json({
                    mensaje: "El ID del usuario no es válido"
                });
            }

            if (
                administrador !== 0 &&
                administrador !== 1 &&
                administrador !== "0" &&
                administrador !== "1"
            ) {
                return res.status(400).json({
                    mensaje: "El permiso debe ser 1 o 0"
                });
            }

            // Evitar que el administrador se quite sus propios permisos.
            if (
                idUsuario === Number(req.session.usuario.id_usuario) &&
                Number(administrador) === 0
            ) {
                return res.status(400).json({
                    mensaje: "No podés quitarte tus propios permisos"
                });
            }

            const resultado = await realizarQuery(
                `UPDATE Usuarios_TPF
                 SET administrador = ?
                 WHERE id_usuario = ?`,
                [Number(administrador), idUsuario]
            );

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: "No se encontró el usuario"
                });
            }

            res.json({
                mensaje: Number(administrador) === 1
                    ? "Usuario convertido en administrador"
                    : "Permisos de administrador eliminados"
            });

        } catch (error) {
            console.log("Error al cambiar permisos:", error);

            res.status(500).json({
                mensaje: "Error al modificar los permisos"
            });
        }
    }
);


/* =========================================================
   USUARIOS: ELIMINAR
   ========================================================= */

app.delete("/usuarios/:id",
    verificarAdmin,
    async (req, res) => {
        try {
            const idUsuario = Number(req.params.id);

            if (!Number.isInteger(idUsuario) || idUsuario <= 0) {
                return res.status(400).json({
                    mensaje: "El ID del usuario no es válido"
                });
            }

            // Evitar que el administrador se elimine a sí mismo.
            if (
                idUsuario === Number(req.session.usuario.id_usuario)
            ) {
                return res.status(400).json({
                    mensaje: "No podés eliminar tu propia cuenta desde el panel"
                });
            }

            const usuarios = await realizarQuery(
                `SELECT id_usuario
                 FROM Usuarios_TPF
                 WHERE id_usuario = ?`,
                [idUsuario]
            );

            if (usuarios.length === 0) {
                return res.status(404).json({
                    mensaje: "No se encontró el usuario"
                });
            }

            // Comprobar si el usuario tiene equipos asociados.
            const equipos = await realizarQuery(
                `SELECT id_equipo
                 FROM Equipos
                 WHERE id_usuario = ?`,
                [idUsuario]
            );

            if (equipos.length > 0) {
                return res.status(409).json({
                    mensaje: "No se puede eliminar este usuario porque tiene equipos asociados. Primero hay que resolver sus equipos y las partidas relacionadas."
                });
            }

            await realizarQuery(
                `DELETE FROM Usuarios_TPF
                 WHERE id_usuario = ?`,
                [idUsuario]
            );

            res.json({
                mensaje: "Usuario eliminado correctamente"
            });

        } catch (error) {
            console.log("Error al eliminar usuario:", error);

            res.status(500).json({
                mensaje: "No se pudo eliminar el usuario. Revisá las claves foráneas de la base de datos."
            });
        }
    }
);


/* =========================================================
   PERSONAJES: OBTENER TODOS
   ========================================================= */

app.get("/personajes", verificarAdmin, async (req, res) => {
    try {
        const personajes = await realizarQuery(
            `SELECT
                p.*,
                m.nombre AS nombre_modo
             FROM Personajes p
             INNER JOIN Modos m
                ON p.id_modo = m.id_modo
             ORDER BY p.id_personaje`
        );

        res.json(personajes);

    } catch (error) {
        console.log("Error al obtener personajes:", error);

        res.status(500).json({
            mensaje: "Error al obtener los personajes"
        });
    }
});


/* =========================================================
   PERSONAJES: AGREGAR UNO NUEVO
   ========================================================= */

// Datos esperados:
// {
//   "id_modo": 1,
//   "nombre": "Manuel Belgrano",
//   "descripcion": "Prócer argentino",
//   "posicion_natural": "Mediocampista",
//   "ataque": 70,
//   "defensa": 80,
//   "velocidad": 65,
//   "habilidad": 85
// }

app.post("/personajes", verificarAdmin, async (req, res) => {
    try {
        const {
            id_modo,
            nombre,
            descripcion,
            posicion_natural,
            ataque,
            defensa,
            velocidad,
            habilidad
        } = req.body;

        if (
            !Number.isInteger(Number(id_modo)) ||
            Number(id_modo) <= 0 ||
            typeof nombre !== "string" ||
            !nombre.trim() ||
            typeof descripcion !== "string" ||
            typeof posicion_natural !== "string" ||
            !posicion_natural.trim()
        ) {
            return res.status(400).json({
                mensaje: "Completá correctamente los datos del personaje"
            });
        }

        // Las cuatro estadísticas deben ser números entre 0 y 100.
        const estadisticas = [
            ataque,
            defensa,
            velocidad,
            habilidad
        ];

        const estadisticasValidas = estadisticas.every(valor =>
            valor !== "" &&
            valor !== null &&
            valor !== undefined &&
            Number.isFinite(Number(valor)) &&
            Number(valor) >= 0 &&
            Number(valor) <= 100
        );

        if (!estadisticasValidas) {
            return res.status(400).json({
                mensaje: "Ataque, defensa, velocidad y habilidad deben estar entre 0 y 100"
            });
        }

        const modos = await realizarQuery(
            `SELECT id_modo
             FROM Modos
             WHERE id_modo = ?`,
            [Number(id_modo)]
        );

        if (modos.length === 0) {
            return res.status(400).json({
                mensaje: "El modo seleccionado no existe"
            });
        }

        const resultado = await realizarQuery(
            `INSERT INTO Personajes
                (
                    id_modo,
                    nombre,
                    descripcion,
                    posicion_natural,
                    ataque,
                    defensa,
                    velocidad,
                    habilidad
                )
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                Number(id_modo),
                nombre.trim(),
                descripcion.trim(),
                posicion_natural.trim(),
                Number(ataque),
                Number(defensa),
                Number(velocidad),
                Number(habilidad)
            ]
        );

        res.status(201).json({
            mensaje: "Personaje creado correctamente",
            id_personaje: resultado.insertId
        });

    } catch (error) {
        console.log("Error al crear personaje:", error);

        res.status(500).json({
            mensaje: "Error al crear el personaje"
        });
    }
});


/* =========================================================
   PERSONAJES: MODIFICAR DATOS Y ESTADÍSTICAS
   ========================================================= */

app.put("/personajes/:id", verificarAdmin, async (req, res) => {
    try {
        const idPersonaje = Number(req.params.id);

        const {
            id_modo,
            nombre,
            descripcion,
            posicion_natural,
            ataque,
            defensa,
            velocidad,
            habilidad
        } = req.body;

        if (!Number.isInteger(idPersonaje) || idPersonaje <= 0) {
            return res.status(400).json({
                mensaje: "El ID del personaje no es válido"
            });
        }

        if (
            !Number.isInteger(Number(id_modo)) ||
            Number(id_modo) <= 0 ||
            typeof nombre !== "string" ||
            !nombre.trim() ||
            typeof descripcion !== "string" ||
            typeof posicion_natural !== "string" ||
            !posicion_natural.trim()
        ) {
            return res.status(400).json({
                mensaje: "Completá correctamente los datos del personaje"
            });
        }

        const estadisticas = [
            ataque,
            defensa,
            velocidad,
            habilidad
        ];

        const estadisticasValidas = estadisticas.every(valor =>
            valor !== "" &&
            valor !== null &&
            valor !== undefined &&
            Number.isFinite(Number(valor)) &&
            Number(valor) >= 0 &&
            Number(valor) <= 100
        );

        if (!estadisticasValidas) {
            return res.status(400).json({
                mensaje: "Las estadísticas deben estar entre 0 y 100"
            });
        }

        const personajeExistente = await realizarQuery(
            `SELECT id_personaje
             FROM Personajes
             WHERE id_personaje = ?`,
            [idPersonaje]
        );

        if (personajeExistente.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el personaje"
            });
        }

        const modoExistente = await realizarQuery(
            `SELECT id_modo
             FROM Modos
             WHERE id_modo = ?`,
            [Number(id_modo)]
        );

        if (modoExistente.length === 0) {
            return res.status(400).json({
                mensaje: "El modo seleccionado no existe"
            });
        }

        await realizarQuery(
            `UPDATE Personajes
             SET
                id_modo = ?,
                nombre = ?,
                descripcion = ?,
                posicion_natural = ?,
                ataque = ?,
                defensa = ?,
                velocidad = ?,
                habilidad = ?
             WHERE id_personaje = ?`,
            [
                Number(id_modo),
                nombre.trim(),
                descripcion.trim(),
                posicion_natural.trim(),
                Number(ataque),
                Number(defensa),
                Number(velocidad),
                Number(habilidad),
                idPersonaje
            ]
        );

        res.json({
            mensaje: "Personaje modificado correctamente"
        });

    } catch (error) {
        console.log("Error al modificar personaje:", error);

        res.status(500).json({
            mensaje: "Error al modificar el personaje"
        });
    }
});


/* =========================================================
   PERSONAJES: ELIMINAR
   ========================================================= */

app.delete("/personajes/:id",
    verificarAdmin,
    async (req, res) => {
        try {
            const idPersonaje = Number(req.params.id);

            if (!Number.isInteger(idPersonaje) || idPersonaje <= 0) {
                return res.status(400).json({
                    mensaje: "El ID del personaje no es válido"
                });
            }

            const personajes = await realizarQuery(
                `SELECT id_personaje
                 FROM Personajes
                 WHERE id_personaje = ?`,
                [idPersonaje]
            );

            if (personajes.length === 0) {
                return res.status(404).json({
                    mensaje: "No se encontró el personaje"
                });
            }

            // Evitar borrar un personaje que forma parte de un equipo.
            const asociaciones = await realizarQuery(
                `SELECT equipo_id
                 FROM EquiposPersonajes
                 WHERE personaje_id = ?`,
                [idPersonaje]
            );

            if (asociaciones.length > 0) {
                return res.status(409).json({
                    mensaje: "No se puede eliminar el personaje porque forma parte de uno o más equipos"
                });
            }

            await realizarQuery(
                `DELETE FROM Personajes
                 WHERE id_personaje = ?`,
                [idPersonaje]
            );

            res.json({
                mensaje: "Personaje eliminado correctamente"
            });

        } catch (error) {
            console.log("Error al eliminar personaje:", error);

            res.status(500).json({
                mensaje: "No se pudo eliminar el personaje. Revisá las claves foráneas."
            });
        }
    }
);


//FUNCIONAMIENTO PAGINA

/* OBTENER MODOS */
app.get("/modos", async (req, res) => {
    try {
        const modos = await realizarQuery(
            `SELECT id_modo, nombre
             FROM Modos
             ORDER BY id_modo`
        );

        res.json(modos);
    } catch (error) {
        console.log("Error al obtener los modos:", error);
        res.status(500).json({
            mensaje: "Error al obtener los modos"
        });
    }
});

/* OBTENER FORMACIONES */
app.get("/formaciones", async (req, res) => {
    try {
        const formaciones = await realizarQuery(
            `SELECT id_formacion, nombre, cant_defensores,
                    cant_mediocampistas, cant_delanteros
             FROM Formaciones
             ORDER BY id_formacion`
        );

        res.json(formaciones);
    } catch (error) {
        console.log("Error al obtener las formaciones:", error);
        res.status(500).json({
            mensaje: "Error al obtener las formaciones"
        });
    }
});

/* OBTENER PERSONAJES POR MODO */
app.get("/modos/:id_modo/personajes", async (req, res) => {
    try {
        const idModo = Number(req.params.id_modo);

        if (!Number.isInteger(idModo) || idModo <= 0) {
            return res.status(400).json({
                mensaje: "El modo seleccionado no es válido"
            });
        }

        const personajes = await realizarQuery(
            `SELECT id_personaje, id_modo, nombre, descripcion,
                    posicion_natural, ataque, defensa, velocidad, habilidad
             FROM Personajes
             WHERE id_modo = ?
             ORDER BY nombre`,
            [idModo]
        );

        res.json(personajes);
    } catch (error) {
        console.log("Error al obtener los personajes:", error);
        res.status(500).json({
            mensaje: "Error al obtener los personajes"
        });
    }
});

/* =========================================================
   RANKING DE JUGADORES
   ========================================================= */

app.get("/ranking", async (req, res) => {
    try {
        const ranking = await realizarQuery(
            `SELECT
                id_usuario,
                nombre_usuario AS nombre,
                COALESCE(partidas_ganadas, 0) * 100 AS puntos,
                COALESCE(partidas_ganadas, 0) AS victorias,
                COALESCE(partidas_jugadas, 0) AS partidas
             FROM Usuarios_TPF
             ORDER BY
                puntos DESC,
                victorias DESC,
                partidas DESC,
                nombre_usuario ASC`
        );

        res.json(ranking);

    } catch (error) {
        console.log("Error al obtener el ranking:", error);

        res.status(500).json({
            mensaje: "Error al obtener el ranking"
        });
    }
});