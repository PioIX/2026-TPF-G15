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

            GROUP BY u.id_usuario, u.nombre_usuario

            ORDER BY puntos DESC, victorias DESC,
                     partidas DESC, u.nombre_usuario ASC`
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
        // Comprobar que haya un usuario con sesión iniciada
        if (!req.session.usuario) {
            return res.status(401).json({
                mensaje: "Debés iniciar sesión"
            });
        }

        const idUsuario = req.session.usuario.id_usuario;

        // Obtener las estadísticas del usuario
        const usuarios = await realizarQuery(
            `SELECT partidas_jugadas, partidas_ganadas
             FROM Usuarios_TPF
             WHERE id_usuario = ?`,
            [idUsuario]
        );

        if (usuarios.length === 0) {
            return res.status(404).json({
                mensaje: "No se encontró el usuario"
            });
        }

        const usuario = usuarios[0];

        // Calcular el puesto según la cantidad de victorias
        const resultadoRanking = await realizarQuery(
            `SELECT COUNT(*) + 1 AS ranking
             FROM Usuarios_TPF
             WHERE partidas_ganadas > ?`,
            [usuario.partidas_ganadas]
        );

        res.json({
            victorias: usuario.partidas_ganadas,
            partidasJugadas: usuario.partidas_jugadas,
            ranking: resultadoRanking[0].ranking
        });

    } catch (error) {
        console.log("Error al obtener las estadísticas:", error);
        res.status(500).json({
            mensaje: "Error al obtener las estadísticas"
        });
    }
});


