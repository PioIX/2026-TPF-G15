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


io.on("connection", (socket) => {

    socket.on("unirsePartida", async (datos) => {
        try {
            const idPartida = Number(datos.id_partida);
            const usuario = socket.request.session?.usuario;

            if (!usuario || !Number.isInteger(idPartida) || idPartida <= 0) {
                socket.emit("errorPartida", {
                    mensaje: "No se pudo ingresar a la partida."
                });
                return;
            }

            // Verificamos que el usuario participe de la partida
            const partidas = await realizarQuery(`
                SELECT p.id_partida
                FROM Partidas p
                INNER JOIN Equipos el
                    ON p.equipo_local_id = el.id_equipo
                INNER JOIN Equipos ev
                    ON p.equipo_visitante_id = ev.id_equipo
                WHERE p.id_partida = ?
                  AND (el.id_usuario = ? OR ev.id_usuario = ?)
            `, [
                idPartida,
                usuario.id_usuario,
                usuario.id_usuario
            ]);

            if (partidas.length === 0) {
                socket.emit("errorPartida", {
                    mensaje: "No tenés permiso para ingresar a esta partida."
                });
                return;
            }

            socket.join(`partida_${idPartida}`);

            socket.emit("partidaConectada", {
                id_partida: idPartida
            });

        } catch (error) {
            console.error("Error al ingresar a la sala:", error);

            socket.emit("errorPartida", {
                mensaje: "Ocurrió un error al conectarse a la partida."
            });
        }
    });

});


const { realizarQuery, realizarTransaccion } = require("./modulos/mysql");



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
   CONSULTAR TORNEO PENDIENTE
   ========================================================= */

app.get("/torneo/pendiente/:id_modo", async (req, res) => {
    try {
        if (!req.session.usuario) {
            return res.status(401).json({
                mensaje: "Debés iniciar sesión."
            });
        }

        const idUsuario = req.session.usuario.id_usuario;
        const idModo = Number(req.params.id_modo);

        if (![1, 2].includes(idModo)) {
            return res.status(400).json({
                mensaje: "Modo inválido."
            });
        }

        // Buscar la última partida individual del usuario en ese modo.
        const partidas = await realizarQuery(
            `SELECT
                p.id_partida,
                p.estado,
                p.goles_local,
                p.goles_visitante,
                p.instancia,
                p.ganador_penales,
                e.id_equipo,
                e.id_modo
            FROM Partidas p
            INNER JOIN Equipos e
                ON p.equipo_local_id = e.id_equipo
            WHERE e.id_usuario = ?
              AND e.id_modo = ?
              AND p.tipo = 0
            ORDER BY p.id_partida DESC
            LIMIT 1`,
            [idUsuario, idModo]
        );

        // No tiene ninguna partida de torneo.
        if (partidas.length === 0) {
            return res.json({
                pendiente: false
            });
        }

        const partida = partidas[0];

        // Si todavía está jugando, volver a esa misma partida.
        if (
            partida.estado === "En curso" ||
            partida.estado === "Simulando"
        ) {
            return res.json({
                pendiente: true,
                accion: "partido",
                id_partida: partida.id_partida
            });
        }

        // Si todavía no finalizó, no se puede avanzar.
        if (partida.estado !== "Finalizada") {
            return res.json({
                pendiente: false
            });
        }

        // Comprobar si ganó la instancia.
        const gano =
            partida.goles_local > partida.goles_visitante ||
            (
                partida.goles_local === partida.goles_visitante &&
                partida.ganador_penales === "local"
            );

        // Si perdió, no puede continuar ese torneo.
        if (!gano) {
            return res.json({
                pendiente: false
            });
        }

        // Determinar la siguiente instancia.
        const siguientesInstancias = {
            Octavos: "Cuartos",
            Cuartos: "Semifinal",
            Semifinal: "Final"
        };

        const siguienteInstancia =
            siguientesInstancias[partida.instancia];

        // Si ganó la Final, completó el torneo.
        if (!siguienteInstancia) {
            return res.json({
                pendiente: false,
                completado: true
            });
        }

        return res.json({
            pendiente: true,
            accion: "prepartido",
            id_equipo: partida.id_equipo,
            id_modo: partida.id_modo,
            instancia: siguienteInstancia
        });

    } catch (error) {
        console.error("Error al consultar torneo pendiente:", error);

        return res.status(500).json({
            mensaje: "Error al consultar el torneo pendiente."
        });
    }
});

/* =========================================================
   EQUIPOS: CREAR EQUIPO
   ========================================================= */

app.post("/equipos", async (req, res) => {
    try {
        // 1. Verificar que el usuario haya iniciado sesión
        if (!req.session.usuario) {
            return res.status(401).json({
                mensaje: "Tenés que iniciar sesión para crear un equipo"
            });
        }

        const id_usuario = req.session.usuario.id_usuario;

        const {
            id_modo,
            id_formacion,
            estrategia,
            personajes
        } = req.body;

        // 2. Validar los datos generales
        if (
            !Number.isInteger(Number(id_modo)) ||
            Number(id_modo) <= 0 ||
            !Number.isInteger(Number(id_formacion)) ||
            Number(id_formacion) <= 0 ||
            typeof estrategia !== "string" ||
            !estrategia.trim() ||
            !Array.isArray(personajes) ||
            personajes.length !== 11
        ) {
            return res.status(400).json({
                mensaje: "Los datos del equipo son incorrectos"
            });
        }

        // 3. Validar que no haya personajes repetidos
        const idsPersonajes = personajes.map(p => Number(p.personaje_id));

        if (
            idsPersonajes.some(id => !Number.isInteger(id) || id <= 0) ||
            new Set(idsPersonajes).size !== 11
        ) {
            return res.status(400).json({
                mensaje: "El equipo debe tener 11 personajes diferentes"
            });
        }

        // 4. Validar posiciones y orden
        const posicionesValidas = ["ARQ", "DEF", "MED", "DEL"];

        const datosValidos = personajes.every(p =>
            posicionesValidas.includes(p.posicion) &&
            Number.isInteger(Number(p.orden)) &&
            Number(p.orden) >= 1 &&
            Number(p.orden) <= 11
        );

        const ordenes = personajes.map(p => Number(p.orden));

        if (
            !datosValidos ||
            new Set(ordenes).size !== 11 ||
            !personajes.some(p => p.posicion === "ARQ")
        ) {
            return res.status(400).json({
                mensaje: "Las posiciones u órdenes de los jugadores no son válidos"
            });
        }

        // 5. Comprobar que la formación exista
        const formaciones = await realizarQuery(
            `SELECT *
             FROM Formaciones
             WHERE id_formacion = ?`,
            [Number(id_formacion)]
        );

        if (formaciones.length === 0) {
            return res.status(400).json({
                mensaje: "La formación seleccionada no existe"
            });
        }

        const formacion = formaciones[0];

        // 6. Comprobar que las posiciones coincidan con la formación
        const cantidadArqueros = personajes.filter(p => p.posicion === "ARQ").length;
        const cantidadDefensores = personajes.filter(p => p.posicion === "DEF").length;
        const cantidadMediocampistas = personajes.filter(p => p.posicion === "MED").length;
        const cantidadDelanteros = personajes.filter(p => p.posicion === "DEL").length;

        if (
            cantidadArqueros !== 1 ||
            cantidadDefensores !== formacion.cant_defensores ||
            cantidadMediocampistas !== formacion.cant_mediocampistas ||
            cantidadDelanteros !== formacion.cant_delanteros
        ) {
            return res.status(400).json({
                mensaje: "Los jugadores no coinciden con la formación seleccionada"
            });
        }

        // 7. Comprobar que los 11 personajes pertenezcan al modo elegido
        const placeholders = idsPersonajes.map(() => "?").join(",");

        const personajesExistentes = await realizarQuery(
            `SELECT id_personaje
             FROM Personajes
             WHERE id_modo = ?
             AND id_personaje IN (${placeholders})`,
            [Number(id_modo), ...idsPersonajes]
        );

        if (personajesExistentes.length !== 11) {
            return res.status(400).json({
                mensaje: "Uno o más personajes no pertenecen al modo seleccionado"
            });
        }

        // 8. Guardar el equipo y sus personajes en una transacción
        const id_equipo = await realizarTransaccion(async (conexion) => {

            // Crear el equipo
            const [equipoCreado] = await conexion.execute(
                `INSERT INTO Equipos
                    (id_usuario, id_modo, id_formacion, estrategia, nombre)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    id_usuario,
                    Number(id_modo),
                    Number(id_formacion),
                    estrategia.trim(),
                    `Equipo de ${req.session.usuario.nombre_usuario}`
                ]
            );

            const nuevoIdEquipo = equipoCreado.insertId;

            // Agregar los 11 personajes al equipo
            for (const personaje of personajes) {
                await conexion.execute(
                    `INSERT INTO EquiposPersonajes
                        (equipo_id, personaje_id, posicion, orden)
                     VALUES (?, ?, ?, ?)`,
                    [
                        nuevoIdEquipo,
                        Number(personaje.personaje_id),
                        personaje.posicion,
                        Number(personaje.orden)
                    ]
                );
            }

            return nuevoIdEquipo;
        });

        // 9. Responder al frontend
        res.status(201).json({
            mensaje: "Equipo creado correctamente",
            id_equipo
        });

    } catch (error) {
        console.log("Error al crear el equipo:", error);

        res.status(500).json({
            mensaje: "No se pudo crear el equipo"
        });
    }
});

/* =========================================================
   PARTIDAS: CREAR PARTIDA INDIVIDUAL CONTRA BOT
   ========================================================= */

app.post("/partidas/individual", async (req, res) => {
    try {
        // 1. Verificar que el usuario haya iniciado sesión
        if (!req.session.usuario) {
            return res.status(401).json({
                mensaje: "Tenés que iniciar sesión para jugar"
            });
        }

        const id_usuario = req.session.usuario.id_usuario;
        const id_equipo = Number(req.body.id_equipo);
        const id_modo = Number(req.body.id_modo);
        const instancia = req.body.instancia || "Octavos";

        const instanciasValidas = [
            "Octavos",
            "Cuartos",
            "Semifinal",
            "Final"
        ];

        const indiceInstancia = instanciasValidas.indexOf(instancia);

        // 2. Validar los datos recibidos
        if (
            !Number.isInteger(id_equipo) || id_equipo <= 0 ||
            !Number.isInteger(id_modo) || id_modo <= 0 ||
            indiceInstancia === -1
        ) {
            return res.status(400).json({
                mensaje: "Los datos del equipo, del modo o de la instancia no son válidos"
            });
        }

        // 3. Comprobar que el equipo pertenezca al usuario
        const equipos = await realizarQuery(
            `SELECT
                e.id_equipo,
                e.id_modo,
                e.id_formacion,
                e.estrategia,
                e.nombre,
                f.cant_defensores,
                f.cant_mediocampistas,
                f.cant_delanteros,
                m.nombre AS nombre_modo
             FROM Equipos e
             INNER JOIN Formaciones f
                ON e.id_formacion = f.id_formacion
             INNER JOIN Modos m
                ON e.id_modo = m.id_modo
             WHERE e.id_equipo = ?
               AND e.id_usuario = ?`,
            [id_equipo, id_usuario]
        );

        if (equipos.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró tu equipo"
            });
        }

        const equipoUsuario = equipos[0];

        // 4. Comprobar que el equipo pertenezca al modo seleccionado
        if (Number(equipoUsuario.id_modo) !== id_modo) {
            return res.status(400).json({
                mensaje: "El equipo no pertenece al modo seleccionado"
            });
        }

        // 5. Comprobar que haya ganado la instancia anterior
        if (instancia !== "Octavos") {

            const instanciaAnterior = instanciasValidas[indiceInstancia - 1];

            const partidasAnteriores = await realizarQuery(
                `SELECT
                    estado,
                    goles_local,
                    goles_visitante,
                    ganador_penales
                 FROM Partidas
                 WHERE equipo_local_id = ?
                   AND tipo = 0
                   AND instancia = ?
                 ORDER BY id_partida DESC
                 LIMIT 1`,
                [id_equipo, instanciaAnterior]
            );

            if (
                partidasAnteriores.length === 0 ||
                partidasAnteriores[0].estado !== "Finalizada"
            ) {
                return res.status(409).json({
                    mensaje: "Todavía no completaste la instancia anterior."
                });
            }

            const anterior = partidasAnteriores[0];

            const ganoAnterior =
                Number(anterior.goles_local) > Number(anterior.goles_visitante) ||
                (
                    Number(anterior.goles_local) === Number(anterior.goles_visitante) &&
                    anterior.ganador_penales === "local"
                );

            if (!ganoAnterior) {
                return res.status(403).json({
                    mensaje: "No clasificaste a la siguiente instancia."
                });
            }
        }

        // 6. Comprobar si ya existe una partida de esta instancia
        const partidasExistentes = await realizarQuery(
            `SELECT
                p.id_partida,
                p.instancia,
                p.estado,
                eu.id_equipo,
                eu.nombre AS nombre_equipo_usuario,
                eb.id_equipo AS id_equipo_bot,
                eb.nombre AS nombre_equipo_bot
             FROM Partidas p
             INNER JOIN Equipos eu
                ON p.equipo_local_id = eu.id_equipo
             INNER JOIN Equipos eb
                ON p.equipo_visitante_id = eb.id_equipo
             WHERE p.equipo_local_id = ?
               AND p.tipo = 0
               AND p.instancia = ?
             ORDER BY p.id_partida DESC
             LIMIT 1`,
            [id_equipo, instancia]
        );

        if (partidasExistentes.length > 0) {

            const partidaExistente = partidasExistentes[0];

            // Si ya terminó, no permitimos volver a jugar la misma instancia
            if (
                partidaExistente.estado !== "En curso" &&
                partidaExistente.estado !== "Simulando"
            ) {
                return res.status(409).json({
                    mensaje: "Ya disputaste esta instancia del torneo."
                });
            }

            // Recuperar los personajes del equipo BOT existente
            const personajesExistentes = await realizarQuery(
                `SELECT
                    p.id_personaje,
                    p.nombre,
                    ep.posicion,
                    ep.orden
                 FROM EquiposPersonajes ep
                 INNER JOIN Personajes p
                    ON ep.personaje_id = p.id_personaje
                 WHERE ep.equipo_id = ?
                 ORDER BY ep.orden`,
                [partidaExistente.id_equipo_bot]
            );

            return res.status(200).json({
                mensaje: "Se recuperó la partida individual existente",
                id_partida: partidaExistente.id_partida,
                instancia: partidaExistente.instancia,

                equipo_usuario: {
                    id_equipo: partidaExistente.id_equipo,
                    nombre: partidaExistente.nombre_equipo_usuario
                },

                equipo_bot: {
                    id_equipo: partidaExistente.id_equipo_bot,
                    nombre: partidaExistente.nombre_equipo_bot,
                    personajes: personajesExistentes
                }
            });
        }

        // 7. Comprobar que exista el usuario reservado para los bots
        const bots = await realizarQuery(
            `SELECT id_usuario
             FROM Usuarios_TPF
             WHERE id_usuario = 5`
        );

        if (bots.length === 0) {
            return res.status(500).json({
                mensaje: "No se encontró el usuario reservado para los bots"
            });
        }

        // 8. Elegir 11 personajes aleatorios del mismo modo
        const personajesBot = await realizarQuery(
            `SELECT
                id_personaje,
                nombre,
                posicion_natural,
                ataque,
                defensa,
                velocidad,
                habilidad
             FROM Personajes
             WHERE id_modo = ?
             ORDER BY RAND()
             LIMIT 11`,
            [id_modo]
        );

        if (personajesBot.length < 11) {
            return res.status(400).json({
                mensaje: "No hay suficientes personajes en este modo para generar un equipo rival"
            });
        }

        // 9. Armar las posiciones según la formación del usuario
        const posicionesBot = [
            "ARQ",
            ...Array(equipoUsuario.cant_defensores).fill("DEF"),
            ...Array(equipoUsuario.cant_mediocampistas).fill("MED"),
            ...Array(equipoUsuario.cant_delanteros).fill("DEL")
        ];

        if (posicionesBot.length !== 11) {
            return res.status(400).json({
                mensaje: "La formación seleccionada no tiene una distribución válida"
            });
        }

        // 10. Crear el equipo BOT y la partida en una transacción
        const resultado = await realizarTransaccion(async (conexion) => {

            // Crear el equipo rival
            const [equipoCreado] = await conexion.execute(
                `INSERT INTO Equipos
                    (id_usuario, id_modo, id_formacion, estrategia, nombre)
                 VALUES (?, ?, ?, ?, ?)`,
                [
                    5,
                    id_modo,
                    equipoUsuario.id_formacion,
                    equipoUsuario.estrategia,
                    `Bot - ${equipoUsuario.nombre_modo}`
                ]
            );

            const id_equipo_bot = equipoCreado.insertId;

            // Asociar los 11 personajes al equipo BOT
            for (let i = 0; i < personajesBot.length; i++) {
                await conexion.execute(
                    `INSERT INTO EquiposPersonajes
                        (equipo_id, personaje_id, posicion, orden)
                     VALUES (?, ?, ?, ?)`,
                    [
                        id_equipo_bot,
                        personajesBot[i].id_personaje,
                        posicionesBot[i],
                        i + 1
                    ]
                );
            }

            // Crear la partida: usuario como local y BOT como visitante
            const [partidaCreada] = await conexion.execute(
                `INSERT INTO Partidas
                    (
                        equipo_local_id,
                        equipo_visitante_id,
                        tipo,
                        estado,
                        goles_local,
                        goles_visitante,
                        instancia,
                        ganador_penales
                    )
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    id_equipo,
                    id_equipo_bot,
                    0,
                    "En curso",
                    0,
                    0,
                    instancia,
                    null
                ]
            );

            return {
                id_equipo_bot,
                id_partida: partidaCreada.insertId
            };
        });

        // 11. Responder al frontend
        res.status(201).json({
            mensaje: "Partida individual creada correctamente",
            id_partida: resultado.id_partida,
            instancia: instancia,

            equipo_usuario: {
                id_equipo: equipoUsuario.id_equipo,
                nombre: equipoUsuario.nombre
            },

            equipo_bot: {
                id_equipo: resultado.id_equipo_bot,
                nombre: `Bot - ${equipoUsuario.nombre_modo}`,
                personajes: personajesBot.map((personaje, i) => ({
                    id_personaje: personaje.id_personaje,
                    nombre: personaje.nombre,
                    posicion: posicionesBot[i],
                    orden: i + 1
                }))
            }
        });

    } catch (error) {
        console.log("Error al crear la partida individual:", error);

        res.status(500).json({
            mensaje: "No se pudo crear la partida individual"
        });
    }
});

/* =========================================================
   PARTIDAS: OBTENER INFORMACIÓN PARA SIMULAR
   ========================================================= */

app.get("/partidas/:id_partida", async (req, res) => {
    try {
        // Verificar que el usuario haya iniciado sesión.
        if (!req.session.usuario) {
            return res.status(401).json({
                mensaje: "Tenés que iniciar sesión para ver esta partida"
            });
        }

        const id_partida = Number(req.params.id_partida);
        const id_usuario = req.session.usuario.id_usuario;

        if (!Number.isInteger(id_partida) || id_partida <= 0) {
            return res.status(400).json({
                mensaje: "El identificador de la partida no es válido"
            });
        }

        // Obtener la partida y los dos equipos.
        const partidas = await realizarQuery(
            `SELECT
                p.id_partida,
                p.tipo,
                p.estado,
                p.goles_local,
                p.goles_visitante,
                p.instancia,
                p.ganador_penales,

                el.id_equipo AS id_equipo_local,
                el.id_usuario AS usuario_local,
                el.nombre AS nombre_local,
                el.id_modo AS id_modo_local,
                el.estrategia AS estrategia_local,
                fl.nombre AS formacion_local,

                ev.id_equipo AS id_equipo_visitante,
                ev.id_usuario AS usuario_visitante,
                ev.nombre AS nombre_visitante,
                ev.estrategia AS estrategia_visitante,
                fv.nombre AS formacion_visitante

            FROM Partidas p

            INNER JOIN Equipos el
                ON p.equipo_local_id = el.id_equipo

            INNER JOIN Equipos ev
                ON p.equipo_visitante_id = ev.id_equipo

            INNER JOIN Formaciones fl
                ON el.id_formacion = fl.id_formacion

            INNER JOIN Formaciones fv
                ON ev.id_formacion = fv.id_formacion

            WHERE p.id_partida = ?`,
            [id_partida]
        );

        if (partidas.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró la partida"
            });
        }

        const partida = partidas[0];

        // Comprobar que el usuario sea dueño de alguno de los equipos.
        if (
            Number(partida.usuario_local) !== Number(id_usuario) &&
            Number(partida.usuario_visitante) !== Number(id_usuario)
        ) {
            return res.status(403).json({
                mensaje: "No tenés permiso para acceder a esta partida"
            });
        }

        // Obtener los personajes de ambos equipos.
        const personajes = await realizarQuery(
            `SELECT
                ep.equipo_id,
                ep.personaje_id,
                ep.posicion,
                ep.orden,
                p.nombre,
                p.descripcion,
                p.posicion_natural,
                p.ataque,
                p.defensa,
                p.velocidad,
                p.habilidad

            FROM EquiposPersonajes ep

            INNER JOIN Personajes p
                ON ep.personaje_id = p.id_personaje

            WHERE ep.equipo_id IN (?, ?)
            ORDER BY ep.equipo_id, ep.orden`,
            [
                partida.id_equipo_local,
                partida.id_equipo_visitante
            ]
        );

        const jugadoresLocales = personajes
            .filter(
                (personaje) =>
                    Number(personaje.equipo_id) ===
                    Number(partida.id_equipo_local)
            )
            .map((personaje) => ({
                id_personaje: personaje.personaje_id,
                numero: personaje.orden,
                nombre: personaje.nombre,
                posicion: personaje.posicion,
                posicion_natural: personaje.posicion_natural,
                ataque: personaje.ataque,
                defensa: personaje.defensa,
                velocidad: personaje.velocidad,
                habilidad: personaje.habilidad
            }));

        const jugadoresVisitantes = personajes
            .filter(
                (personaje) =>
                    Number(personaje.equipo_id) ===
                    Number(partida.id_equipo_visitante)
            )
            .map((personaje) => ({
                id_personaje: personaje.personaje_id,
                numero: personaje.orden,
                nombre: personaje.nombre,
                posicion: personaje.posicion,
                posicion_natural: personaje.posicion_natural,
                ataque: personaje.ataque,
                defensa: personaje.defensa,
                velocidad: personaje.velocidad,
                habilidad: personaje.habilidad
            }));

        res.json({
            id_partida: partida.id_partida,
            tipo: partida.tipo,
            estado: partida.estado,
            instancia: partida.instancia,
            goles_local: partida.goles_local,
            goles_visitante: partida.goles_visitante,
            ganador_penales: partida.ganador_penales,
            id_modo: partida.id_modo_local,

            equipo_local: {
                id_equipo: partida.id_equipo_local,
                nombre: partida.nombre_local,
                formacion: partida.formacion_local,
                estrategia: partida.estrategia_local,
                jugadores: jugadoresLocales
            },

            equipo_visitante: {
                id_equipo: partida.id_equipo_visitante,
                nombre: partida.nombre_visitante,
                formacion: partida.formacion_visitante,
                estrategia: partida.estrategia_visitante,
                jugadores: jugadoresVisitantes
            }
        });

    } catch (error) {
        console.log("Error al obtener la partida:", error);

        res.status(500).json({
            mensaje: "No se pudo obtener la información de la partida"
        });
    }
});



// ==========================================
// FUNCIONES PARA SIMULAR LOS PARTIDOS
// ==========================================

const eventosAtaque = [
    "¡Gran jugada colectiva! El equipo avanza al área rival.",
    "¡Remate al arco! El arquero responde y evita el gol.",
    "El equipo recupera la pelota y sale de contraataque.",
    "¡Peligro en el área! La defensa logra despejar la pelota.",
    "El equipo intenta una combinación ofensiva, pero pierde la pelota."
];

function numeroAleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function elegirElemento(lista) {
    return lista[numeroAleatorio(0, lista.length - 1)];
}

function elegirJugador(equipo) {
    if (!equipo.jugadores || equipo.jugadores.length === 0) {
        return null;
    }

    return elegirElemento(equipo.jugadores);
}

function elegirDelantero(equipo) {
    const delanteros = equipo.jugadores.filter(
        jugador => jugador.posicion === "DEL"
    );

    if (delanteros.length > 0) {
        return elegirElemento(delanteros);
    }

    return elegirJugador(equipo);
}

// Obtiene los datos de los dos equipos de una partida
async function obtenerDatosPartida(idPartida) {
    const partidas = await realizarQuery(`
        SELECT
            p.*,
            el.nombre AS nombre_local,
            ev.nombre AS nombre_visitante
        FROM Partidas p
        INNER JOIN Equipos el
            ON p.equipo_local_id = el.id_equipo
        INNER JOIN Equipos ev
            ON p.equipo_visitante_id = ev.id_equipo
        WHERE p.id_partida = ?
    `, [idPartida]);

    if (partidas.length === 0) {
        throw new Error("No se encontró la partida.");
    }

    const partida = partidas[0];

    const jugadoresLocal = await realizarQuery(`
        SELECT
            per.id_personaje,
            per.nombre,
            ep.posicion,
            ep.orden
        FROM EquiposPersonajes ep
        INNER JOIN Personajes per
            ON ep.personaje_id = per.id_personaje
        WHERE ep.equipo_id = ?
        ORDER BY ep.orden
    `, [partida.equipo_local_id]);

    const jugadoresVisitante = await realizarQuery(`
        SELECT
            per.id_personaje,
            per.nombre,
            ep.posicion,
            ep.orden
        FROM EquiposPersonajes ep
        INNER JOIN Personajes per
            ON ep.personaje_id = per.id_personaje
        WHERE ep.equipo_id = ?
        ORDER BY ep.orden
    `, [partida.equipo_visitante_id]);

    return {
        ...partida,
        equipoLocal: {
            id: partida.equipo_local_id,
            nombre: partida.nombre_local,
            jugadores: jugadoresLocal
        },
        equipoVisitante: {
            id: partida.equipo_visitante_id,
            nombre: partida.nombre_visitante,
            jugadores: jugadoresVisitante
        }
    };
}

// Guarda un evento en MySQL y lo comunica por Socket.IO
async function guardarEvento(idPartida, evento) {
    const resultado = await realizarQuery(`
        INSERT INTO EventosPartida
            (id_partida, minuto, tipo_evento, descripcion)
        VALUES (?, ?, ?, ?)
    `, [
        idPartida,
        evento.minuto,
        evento.tipo_evento,
        evento.descripcion
    ]);

    const eventoGuardado = {
        id_evento: resultado.insertId,
        ...evento
    };

    io.to(`partida_${idPartida}`).emit(
        "nuevoEvento",
        eventoGuardado
    );

    return eventoGuardado;
}

// Actualiza el marcador en la base de datos
async function actualizarMarcador(idPartida, golesLocal, golesVisitante) {
    await realizarQuery(`
        UPDATE Partidas
        SET goles_local = ?, goles_visitante = ?
        WHERE id_partida = ?
    `, [golesLocal, golesVisitante, idPartida]);

    io.to(`partida_${idPartida}`).emit("actualizacionPartido", {
        goles_local: golesLocal,
        goles_visitante: golesVisitante
    });
}

// Genera un evento aleatorio para un intervalo del partido
function generarEventoAleatorio(partida, minuto) {
    const equipoLocal = partida.equipoLocal;
    const equipoVisitante = partida.equipoVisitante;

    const equipo = Math.random() < 0.5
        ? equipoLocal
        : equipoVisitante;

    const nombreEquipo = equipo.nombre;

    // 15% de probabilidad de un gol normal
    if (Math.random() * 100 < 15) {
        const jugador = elegirDelantero(equipo);

        return {
            minuto,
            tipo_evento: "GOL",
            descripcion: `¡GOOOOL de ${nombreEquipo}! ${jugador ? jugador.nombre : "El equipo"} convierte para su equipo.`,
            equipo: nombreEquipo,
            tipoGol: "normal"
        };
    }

    const azar = Math.random() * 100;

    // Ataque: 35%
    if (azar < 35) {
        return {
            minuto,
            tipo_evento: "ATAQUE",
            descripcion: `${nombreEquipo}: ${elegirElemento(eventosAtaque)}`,
            equipo: nombreEquipo
        };
    }

    // Tarjeta amarilla: 17%
    if (azar < 52) {
        const jugador = elegirJugador(equipo);

        return {
            minuto,
            tipo_evento: "TARJETA",
            descripcion: `Tarjeta amarilla para ${jugador ? jugador.nombre : "un jugador"} de ${nombreEquipo}.`,
            equipo: nombreEquipo,
            jugador: jugador ? jugador.nombre : null
        };
    }

    // Córner: 20%
    if (azar < 72) {
        return {
            minuto,
            tipo_evento: "CORNER",
            descripcion: `Tiro de esquina para ${nombreEquipo}.`,
            equipo: nombreEquipo
        };
    }

    // Tiro libre: 21%
    if (azar < 93) {
        const resultado = Math.random() * 100;

        // 20%: gol directo
        if (resultado < 20) {
            const jugador = elegirDelantero(equipo);

            return {
                minuto,
                tipo_evento: "GOL_TIRO_LIBRE",
                descripcion: `¡Golazo de tiro libre de ${jugador ? jugador.nombre : nombreEquipo}!`,
                equipo: nombreEquipo,
                jugador: jugador ? jugador.nombre : null,
                tipoGol: "tiroLibre"
            };
        }

        // 30%: pelota al centro del área
        if (resultado < 50) {
            return {
                minuto,
                tipo_evento: "TIRO_LIBRE",
                descripcion: `Tiro libre para ${nombreEquipo}. La pelota llega al área, pero la defensa despeja.`,
                equipo: nombreEquipo
            };
        }

        // 5%: gol de cabeza
        if (resultado < 55) {
            const jugador = elegirJugador(equipo);

            return {
                minuto,
                tipo_evento: "GOL_TIROLIBRE_CABEZA",
                descripcion: `¡Gol de cabeza de ${jugador ? jugador.nombre : nombreEquipo} tras un tiro libre!`,
                equipo: nombreEquipo,
                jugador: jugador ? jugador.nombre : null,
                tipoGol: "tiroLibre"
            };
        }

        // 45%: tiro libre desperdiciado
        return {
            minuto,
            tipo_evento: "TIRO_LIBRE",
            descripcion: `El tiro libre de ${nombreEquipo} se va desviado.`,
            equipo: nombreEquipo
        };
    }

    // Penal: 7%
    const convierte = Math.random() < 0.5;

    if (convierte) {
        const jugador = elegirDelantero(equipo);

        return {
            minuto,
            tipo_evento: "GOL_PENAL",
            descripcion: `¡Gol de penal de ${jugador ? jugador.nombre : nombreEquipo}!`,
            equipo: nombreEquipo,
            jugador: jugador ? jugador.nombre : null,
            tipoGol: "penal"
        };
    }

    return {
        minuto,
        tipo_evento: "PENAL_FALLADO",
        descripcion: `¡El penal de ${nombreEquipo} no termina en gol!`,
        equipo: nombreEquipo
    };
}



// Espera una cantidad de milisegundos
function esperar(milisegundos) {
    return new Promise(resolve => setTimeout(resolve, milisegundos));
}

// Simula la tanda de penales si el partido termina empatado
async function simularPenales(idPartida, partida, golesLocal, golesVisitante) {
    let penalesLocal = 0;
    let penalesVisitante = 0;

    const equipoLocal = partida.equipoLocal;
    const equipoVisitante = partida.equipoVisitante;

    // Primera tanda: cinco penales por equipo
    for (let i = 0; i < 5; i++) {
        const convierteLocal = Math.random() < 0.75;

        if (convierteLocal) {
            penalesLocal++;
        }

        await guardarEvento(idPartida, {
            minuto: 90,
            tipo_evento: convierteLocal ? "GOL_PENAL" : "PENAL_FALLADO",
            descripcion: convierteLocal
                ? `¡Gol de ${equipoLocal.nombre} en la tanda de penales!`
                : `${equipoLocal.nombre} falla su penal.`,
            equipo: equipoLocal.nombre,
            tipoGol: convierteLocal ? "penal" : null
        });

        io.to(`partida_${idPartida}`).emit("actualizacionPenales", {
            penales_local: penalesLocal,
            penales_visitante: penalesVisitante
        });

        const convierteVisitante = Math.random() < 0.75;

        if (convierteVisitante) {
            penalesVisitante++;
        }

        await guardarEvento(idPartida, {
            minuto: 90,
            tipo_evento: convierteVisitante ? "GOL_PENAL" : "PENAL_FALLADO",
            descripcion: convierteVisitante
                ? `¡Gol de ${equipoVisitante.nombre} en la tanda de penales!`
                : `${equipoVisitante.nombre} falla su penal.`,
            equipo: equipoVisitante.nombre,
            tipoGol: convierteVisitante ? "penal" : null
        });

        io.to(`partida_${idPartida}`).emit("actualizacionPenales", {
            penales_local: penalesLocal,
            penales_visitante: penalesVisitante
        });
    }

    // Si siguen empatados, se ejecuta un penal por equipo
    // hasta que uno convierta y el otro falle.
    while (penalesLocal === penalesVisitante) {
        const convierteLocal = Math.random() < 0.75;

        if (convierteLocal) {
            penalesLocal++;
        }

        await guardarEvento(idPartida, {
            minuto: 90,
            tipo_evento: convierteLocal ? "GOL_PENAL" : "PENAL_FALLADO",
            descripcion: convierteLocal
                ? `¡Gol de ${equipoLocal.nombre} en la muerte súbita!`
                : `${equipoLocal.nombre} falla su penal en la muerte súbita.`,
            equipo: equipoLocal.nombre,
            tipoGol: convierteLocal ? "penal" : null
        });

        const convierteVisitante = Math.random() < 0.75;

        if (convierteVisitante) {
            penalesVisitante++;
        }

        await guardarEvento(idPartida, {
            minuto: 90,
            tipo_evento: convierteVisitante ? "GOL_PENAL" : "PENAL_FALLADO",
            descripcion: convierteVisitante
                ? `¡Gol de ${equipoVisitante.nombre} en la muerte súbita!`
                : `${equipoVisitante.nombre} falla su penal en la muerte súbita.`,
            equipo: equipoVisitante.nombre,
            tipoGol: convierteVisitante ? "penal" : null
        });

        io.to(`partida_${idPartida}`).emit("actualizacionPenales", {
            penales_local: penalesLocal,
            penales_visitante: penalesVisitante
        });
    }

    return penalesLocal > penalesVisitante ? "local" : "visitante";
}

// Ejecuta la simulación completa de un partido
async function simularPartido(idPartida) {
    try {
        const partida = await obtenerDatosPartida(idPartida);

        let golesLocal = 0;
        let golesVisitante = 0;
        let minutoAnterior = 0;

        // El partido tiene 18 intervalos de cinco minutos
        for (let i = 1; i <= 18; i++) {
            await esperar(1500);

            const minutoActual = i * 5;

            // Generamos como máximo un evento por intervalo
            const evento = generarEventoAleatorio(
                partida,
                numeroAleatorio(minutoAnterior + 1, minutoActual)
            );

            if (evento) {
                await guardarEvento(idPartida, evento);

                const esGol = evento.tipo_evento.startsWith("GOL");

                if (esGol) {
                    if (evento.equipo === partida.equipoLocal.nombre) {
                        golesLocal++;
                    } else {
                        golesVisitante++;
                    }

                    await actualizarMarcador(
                        idPartida,
                        golesLocal,
                        golesVisitante
                    );
                }
            }

            minutoAnterior = minutoActual;

            // Le avisamos al frontend que avanzó el reloj
            io.to(`partida_${idPartida}`).emit("actualizacionPartido", {
                minuto: minutoActual,
                goles_local: golesLocal,
                goles_visitante: golesVisitante
            });
        }

        let ganadorPenales = null;

        // Si hay empate, se define por penales
        if (golesLocal === golesVisitante) {
            io.to(`partida_${idPartida}`).emit("inicioPenales");

            ganadorPenales = await simularPenales(
                idPartida,
                partida,
                golesLocal,
                golesVisitante
            );
        }

        // Finalizamos la partida y actualizamos las estadísticas
        // dentro de una única transacción.

        const partidaFinalizada = await realizarTransaccion(async (conexion) => {

            // Obtener los usuarios dueños de ambos equipos.
            const [partidas] = await conexion.execute(`
        SELECT
            p.estado,
            el.id_usuario AS usuario_local,
            ev.id_usuario AS usuario_visitante
        FROM Partidas p
        INNER JOIN Equipos el
            ON p.equipo_local_id = el.id_equipo
        INNER JOIN Equipos ev
            ON p.equipo_visitante_id = ev.id_equipo
        WHERE p.id_partida = ?
        FOR UPDATE
    `, [idPartida]);

            if (partidas.length === 0) {
                throw new Error("No se encontró la partida al finalizar.");
            }

            if (partidas[0].estado !== "Simulando") {
                return false;
            }

            const usuarioLocal = Number(partidas[0].usuario_local);
            const usuarioVisitante = Number(partidas[0].usuario_visitante);

            // Determinar quién ganó.
            let ganoLocal;

            if (golesLocal > golesVisitante) {
                ganoLocal = true;
            } else if (golesVisitante > golesLocal) {
                ganoLocal = false;
            } else if (ganadorPenales === "local") {
                ganoLocal = true;
            } else if (ganadorPenales === "visitante") {
                ganoLocal = false;
            } else {
                throw new Error("La partida terminó empatada sin un ganador por penales.");
            }

            // Actualizar el resultado definitivo.
            const [actualizacion] = await conexion.execute(`
        UPDATE Partidas
        SET
            goles_local = ?,
            goles_visitante = ?,
            ganador_penales = ?,
            estado = 'Finalizada'
        WHERE id_partida = ?
          AND estado = 'Simulando'
    `, [golesLocal, golesVisitante, ganadorPenales, idPartida]);

            if (actualizacion.affectedRows !== 1) {
                return false;
            }

            // Actualizar las estadísticas del usuario local.
            if (usuarioLocal !== 5) {
                const [resultadoLocal] = await conexion.execute(`
            UPDATE Usuarios_TPF
            SET
                partidas_jugadas = partidas_jugadas + 1,
                partidas_ganadas = partidas_ganadas + ?
            WHERE id_usuario = ?
        `, [ganoLocal ? 1 : 0, usuarioLocal]);

                if (resultadoLocal.affectedRows !== 1) {
                    throw new Error(
                        `No se pudieron actualizar las estadísticas del usuario local ${usuarioLocal}`
                    );
                }
            }

            // Actualizar las estadísticas del usuario visitante.
            if (usuarioVisitante !== 5 && usuarioVisitante !== usuarioLocal) {
                const [resultadoVisitante] = await conexion.execute(`
            UPDATE Usuarios_TPF
            SET
                partidas_jugadas = partidas_jugadas + 1,
                partidas_ganadas = partidas_ganadas + ?
            WHERE id_usuario = ?
        `, [ganoLocal ? 0 : 1, usuarioVisitante]);

                if (resultadoVisitante.affectedRows !== 1) {
                    throw new Error(
                        `No se pudieron actualizar las estadísticas del usuario visitante ${usuarioVisitante}`
                    );
                }
            }

            console.log("Estadísticas actualizadas:", {
                partida: idPartida,
                usuarioLocal,
                usuarioVisitante,
                ganoLocal
            });

            return true;
        });


        // Si la partida ya había sido finalizada, no volvemos a emitir el resultado.
        if (!partidaFinalizada) {
            return;
        }

        io.to(`partida_${idPartida}`).emit("partidoFinalizado", {
            goles_local: golesLocal,
            goles_visitante: golesVisitante,
            ganador_penales: ganadorPenales
        });

    } catch (error) {
        console.error("Error al simular el partido:", error);

        // Si falla la simulación, dejamos la partida disponible
        await realizarQuery(`
            UPDATE Partidas
            SET estado = 'En curso'
            WHERE id_partida = ? AND estado = 'Simulando'
        `, [idPartida]);
    }
}



// ==========================================
// INICIAR SIMULACIÓN DE UNA PARTIDA
// ==========================================

app.post("/partidas/:id_partida/simular", async (req, res) => {
    try {
        if (!req.session.usuario) {
            return res.status(401).send({
                mensaje: "Tenés que iniciar sesión."
            });
        }

        const idPartida = Number(req.params.id_partida);
        const idUsuario = req.session.usuario.id_usuario;

        if (!Number.isInteger(idPartida) || idPartida <= 0) {
            return res.status(400).send({
                mensaje: "ID de partida inválido."
            });
        }

        // Verificamos que el usuario participe de la partida
        const partidas = await realizarQuery(`
            SELECT p.id_partida, p.estado
            FROM Partidas p
            INNER JOIN Equipos el
                ON p.equipo_local_id = el.id_equipo
            INNER JOIN Equipos ev
                ON p.equipo_visitante_id = ev.id_equipo
            WHERE p.id_partida = ?
              AND (el.id_usuario = ? OR ev.id_usuario = ?)
        `, [idPartida, idUsuario, idUsuario]);

        if (partidas.length === 0) {
            return res.status(403).send({
                mensaje: "No tenés permiso para simular esta partida."
            });
        }

        if (partidas[0].estado !== "En curso") {
            return res.status(409).send({
                mensaje: "Esta partida ya fue iniciada o finalizada."
            });
        }

        // Cambiamos el estado antes de iniciar la simulación.
        // Esto evita que dos solicitudes la inicien al mismo tiempo.
        const actualizacion = await realizarQuery(`
            UPDATE Partidas
            SET estado = 'Simulando'
            WHERE id_partida = ? AND estado = 'En curso'
        `, [idPartida]);

        if (actualizacion.affectedRows === 0) {
            return res.status(409).send({
                mensaje: "La partida ya está siendo simulada."
            });
        }

        // No esperamos a que termine: la simulación corre en segundo plano
        simularPartido(idPartida);

        return res.status(202).send({
            mensaje: "La simulación comenzó.",
            id_partida: idPartida
        });

    } catch (error) {
        console.error("Error al iniciar la simulación:", error);

        return res.status(500).send({
            mensaje: "No se pudo iniciar la simulación."
        });
    }
});


// ==========================================
// OBTENER LOS EVENTOS DE UNA PARTIDA
// ==========================================

app.get("/partidas/:id_partida/eventos", async (req, res) => {
    try {
        if (!req.session.usuario) {
            return res.status(401).send({
                mensaje: "Tenés que iniciar sesión."
            });
        }

        const idPartida = Number(req.params.id_partida);
        const idUsuario = req.session.usuario.id_usuario;

        if (!Number.isInteger(idPartida) || idPartida <= 0) {
            return res.status(400).send({
                mensaje: "ID de partida inválido."
            });
        }

        const partidas = await realizarQuery(`
            SELECT p.id_partida
            FROM Partidas p
            INNER JOIN Equipos el
                ON p.equipo_local_id = el.id_equipo
            INNER JOIN Equipos ev
                ON p.equipo_visitante_id = ev.id_equipo
            WHERE p.id_partida = ?
              AND (el.id_usuario = ? OR ev.id_usuario = ?)
        `, [idPartida, idUsuario, idUsuario]);

        if (partidas.length === 0) {
            return res.status(403).send({
                mensaje: "No tenés permiso para consultar esta partida."
            });
        }

        const eventos = await realizarQuery(`
            SELECT
                id_evento,
                minuto,
                tipo_evento,
                descripcion
            FROM EventosPartida
            WHERE id_partida = ?
            ORDER BY minuto ASC, id_evento ASC
        `, [idPartida]);

        return res.send(eventos);

    } catch (error) {
        console.error("Error al obtener los eventos:", error);

        return res.status(500).send({
            mensaje: "No se pudieron obtener los eventos."
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
                u.id_usuario,
                u.nombre_usuario AS nombre,

                COALESCE(SUM(
                    CASE
                        WHEN (
                            p.goles_local > p.goles_visitante
                            AND p.ganador_penales IS NULL
                            AND e.id_equipo = p.equipo_local_id
                        ) OR (
                            p.goles_visitante > p.goles_local
                            AND p.ganador_penales IS NULL
                            AND e.id_equipo = p.equipo_visitante_id
                        ) OR (
                            p.ganador_penales = 'local'
                            AND e.id_equipo = p.equipo_local_id
                        ) OR (
                            p.ganador_penales = 'visitante'
                            AND e.id_equipo = p.equipo_visitante_id
                        )
                        THEN 3
                        ELSE 0
                    END
                ), 0) AS puntos,

                COALESCE(SUM(
                    CASE
                        WHEN (
                            (p.goles_local > p.goles_visitante
                             AND p.ganador_penales IS NULL
                             AND e.id_equipo = p.equipo_local_id)
                            OR
                            (p.goles_visitante > p.goles_local
                             AND p.ganador_penales IS NULL
                             AND e.id_equipo = p.equipo_visitante_id)
                            OR
                            (p.ganador_penales = 'local'
                             AND e.id_equipo = p.equipo_local_id)
                            OR
                            (p.ganador_penales = 'visitante'
                             AND e.id_equipo = p.equipo_visitante_id)
                        )
                        THEN 1
                        ELSE 0
                    END
                ), 0) AS victorias,

                COUNT(p.id_partida) AS partidas

            FROM Usuarios_TPF u

            LEFT JOIN Equipos e
                ON e.id_usuario = u.id_usuario

            LEFT JOIN Partidas p
                ON (
                    p.equipo_local_id = e.id_equipo
                    OR p.equipo_visitante_id = e.id_equipo
                )
                AND p.estado = 'Finalizada'

            WHERE u.id_usuario <> 5

            GROUP BY u.id_usuario, u.nombre_usuario

            ORDER BY puntos DESC, victorias DESC,
                     partidas ASC, u.nombre_usuario ASC`
        );

        res.json(ranking);

    } catch (error) {
        console.log("Error al obtener el ranking:", error);

        res.status(500).json({
            mensaje: "Error al obtener el ranking"
        });
    }
});

app.get("/estadisticas", async (req, res) => {
    try {
        if (!req.session.usuario) {
            return res.status(401).json({
                mensaje: "No estás autenticado."
            });
        }

        const idUsuario = req.session.usuario.id_usuario;

        // Obtenemos el ranking utilizando exactamente
        // los mismos criterios que la página de ranking.
        const ranking = await realizarQuery(`
            SELECT
                u.id_usuario,
                u.nombre_usuario AS nombre,

                COALESCE(SUM(
                    CASE
                        WHEN (
                            (p.goles_local > p.goles_visitante
                                AND p.equipo_local_id = e.id_equipo)
                            OR
                            (p.goles_visitante > p.goles_local
                                AND p.equipo_visitante_id = e.id_equipo)
                            OR
                            (p.goles_local = p.goles_visitante
                                AND p.ganador_penales = 'local'
                                AND p.equipo_local_id = e.id_equipo)
                            OR
                            (p.goles_local = p.goles_visitante
                                AND p.ganador_penales = 'visitante'
                                AND p.equipo_visitante_id = e.id_equipo)
                        )
                        THEN 3
                        ELSE 0
                    END
                ), 0) AS puntos,

                COALESCE(SUM(
                    CASE
                        WHEN (
                            (p.goles_local > p.goles_visitante
                                AND p.equipo_local_id = e.id_equipo)
                            OR
                            (p.goles_visitante > p.goles_local
                                AND p.equipo_visitante_id = e.id_equipo)
                            OR
                            (p.goles_local = p.goles_visitante
                                AND p.ganador_penales = 'local'
                                AND p.equipo_local_id = e.id_equipo)
                            OR
                            (p.goles_local = p.goles_visitante
                                AND p.ganador_penales = 'visitante'
                                AND p.equipo_visitante_id = e.id_equipo)
                        )
                        THEN 1
                        ELSE 0
                    END
                ), 0) AS victorias,

                COUNT(p.id_partida) AS partidas

            FROM Usuarios_TPF u

            LEFT JOIN Equipos e
                ON e.id_usuario = u.id_usuario

            LEFT JOIN Partidas p
                ON (
                    p.equipo_local_id = e.id_equipo
                    OR p.equipo_visitante_id = e.id_equipo
                )
                AND p.estado = 'Finalizada'

            WHERE u.id_usuario <> 5

            GROUP BY u.id_usuario, u.nombre_usuario

            ORDER BY
                puntos DESC,
                victorias DESC,
                partidas ASC,
                u.nombre_usuario ASC
        `);

        // Buscamos la posición del usuario dentro del ranking.
        const posicion = ranking.findIndex(
            usuario => Number(usuario.id_usuario) === Number(idUsuario)
        );

        if (posicion === -1) {
            return res.status(404).json({
                mensaje: "No se encontró al usuario en el ranking."
            });
        }

        const usuario = ranking[posicion];

        res.json({
            puntos: Number(usuario.puntos),
            victorias: Number(usuario.victorias),
            partidasJugadas: Number(usuario.partidas),
            ranking: posicion + 1
        });

    } catch (error) {
        console.error("Error al obtener estadísticas:", error);

        res.status(500).json({
            mensaje: "Error al obtener las estadísticas."
        });
    }
});

