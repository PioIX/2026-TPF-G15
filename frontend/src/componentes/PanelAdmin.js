
"use client";

import { useEffect, useState } from "react";
import "./PanelAdmin.module.css";

const API = "http://localhost:4000";

const personajeVacio = {
    id_modo: "1",
    nombre: "",
    descripcion: "",
    posicion_natural: "Delantero",
    ataque: 50,
    defensa: 50,
    velocidad: 50,
    habilidad: 50
};

const usuarioVacio = {
    nombre_usuario: "",
    email: "",
    contrasena: ""
};

export default function PanelAdmin({ abierto, cerrar }) {
    const [seccion, setSeccion] = useState("personajes");
    const [usuarios, setUsuarios] = useState([]);
    const [personajes, setPersonajes] = useState([]);
    const [personaje, setPersonaje] = useState(personajeVacio);
    const [usuario, setUsuario] = useState(usuarioVacio);
    const [personajeEditando, setPersonajeEditando] = useState(null);
    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        if (abierto) {
            cargarDatos();
        }
    }, [abierto]);

    async function cargarDatos() {
        setCargando(true);
        setMensaje("");

        try {
            const respuestaUsuarios = await fetch(`${API}/usuarios`, {
                credentials: "include"
            });

            if (!respuestaUsuarios.ok) {
                throw new Error("No tenés permisos para acceder al panel.");
            }

            const datosUsuarios = await respuestaUsuarios.json();
            setUsuarios(datosUsuarios);

            const respuestaPersonajes = await fetch(`${API}/personajes`, {
                credentials: "include"
            });

            if (!respuestaPersonajes.ok) {
                throw new Error("No se pudieron cargar los personajes.");
            }

            const datosPersonajes = await respuestaPersonajes.json();
            setPersonajes(datosPersonajes);
        } catch (error) {
            setMensaje(error.message);
        } finally {
            setCargando(false);
        }
    }

    function cambiarSeccion(nuevaSeccion) {
        setSeccion(nuevaSeccion);
        setMensaje("");
        setPersonajeEditando(null);
        setUsuarioEditando(null);
        setPersonaje(personajeVacio);
        setUsuario(usuarioVacio);
    }

    function cambiarDatoPersonaje(event) {
        const { name, value } = event.target;

        setPersonaje({
            ...personaje,
            [name]: value
        });
    }

    function cambiarDatoUsuario(event) {
        const { name, value } = event.target;

        setUsuario({
            ...usuario,
            [name]: value
        });
    }

    async function guardarPersonaje(event) {
        event.preventDefault();
        setMensaje("");

        const editando = personajeEditando !== null;
        const url = editando
            ? `${API}/personajes/${personajeEditando}`
            : `${API}/personajes`;

        try {
            const respuesta = await fetch(url, {
                method: editando ? "PUT" : "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    ...personaje,
                    id_modo: Number(personaje.id_modo),
                    ataque: Number(personaje.ataque),
                    defensa: Number(personaje.defensa),
                    velocidad: Number(personaje.velocidad),
                    habilidad: Number(personaje.habilidad)
                })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.mensaje || "No se pudo guardar el personaje.");
            }

            setMensaje(datos.mensaje);
            setPersonaje(personajeVacio);
            setPersonajeEditando(null);
            await cargarDatos();
        } catch (error) {
            setMensaje(error.message);
        }
    }

    function editarPersonaje(p) {
        setPersonajeEditando(p.id_personaje);
        setPersonaje({
            id_modo: String(p.id_modo),
            nombre: p.nombre,
            descripcion: p.descripcion || "",
            posicion_natural: p.posicion_natural,
            ataque: p.ataque,
            defensa: p.defensa,
            velocidad: p.velocidad,
            habilidad: p.habilidad
        });

        document.getElementById("formulario-admin")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    async function eliminarPersonaje(id) {
        if (!window.confirm("¿Seguro que querés eliminar este personaje?")) {
            return;
        }

        try {
            const respuesta = await fetch(`${API}/personajes/${id}`, {
                method: "DELETE",
                credentials: "include"
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.mensaje || "No se pudo eliminar el personaje.");
            }

            setMensaje(datos.mensaje);
            await cargarDatos();
        } catch (error) {
            setMensaje(error.message);
        }
    }

    async function guardarUsuario(event) {
        event.preventDefault();
        setMensaje("");

        try {
            // Para agregar un usuario usamos la ruta de registro existente.
            const respuesta = await fetch(`${API}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(usuario)
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.mensaje || "No se pudo registrar el usuario.");
            }

            setMensaje(datos.mensaje);
            setUsuario(usuarioVacio);
            await cargarDatos();
        } catch (error) {
            setMensaje(error.message);
        }
    }

    function editarUsuario(u) {
        setUsuarioEditando(u);
    }

    async function cambiarAdministrador(u, nuevoValor) {
        try {
            const respuesta = await fetch(
                `${API}/usuarios/${u.id_usuario}/administrador`,
                {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ administrador: nuevoValor })
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.mensaje || "No se pudieron modificar los permisos.");
            }

            setMensaje(datos.mensaje);
            setUsuarioEditando(null);
            await cargarDatos();
        } catch (error) {
            setMensaje(error.message);
        }
    }

    async function eliminarUsuario(id) {
        if (!window.confirm("¿Seguro que querés eliminar este usuario?")) {
            return;
        }

        try {
            const respuesta = await fetch(`${API}/usuarios/${id}`, {
                method: "DELETE",
                credentials: "include"
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.mensaje || "No se pudo eliminar el usuario.");
            }

            setMensaje(datos.mensaje);
            await cargarDatos();
        } catch (error) {
            setMensaje(error.message);
        }
    }

    if (!abierto) {
        return null;
    }

    return (
        <div className="admin-fondo" onClick={cerrar}>
            <section
                className="admin-ventana"
                onClick={(event) => event.stopPropagation()}
            >
                <button
                    className="admin-cerrar"
                    onClick={cerrar}
                    type="button"
                    aria-label="Cerrar panel"
                >
                    ×
                </button>

                <h2>Panel de administración</h2>
                <p>Administrá los usuarios y los personajes de Argentina FC.</p>

                <div className="admin-switch">
                    <button
                        type="button"
                        className={seccion === "personajes" ? "activo" : ""}
                        onClick={() => cambiarSeccion("personajes")}
                    >
                        Personajes
                    </button>

                    <button
                        type="button"
                        className={seccion === "usuarios" ? "activo" : ""}
                        onClick={() => cambiarSeccion("usuarios")}
                    >
                        Usuarios
                    </button>
                </div>

                {mensaje && (
                    <p className="admin-mensaje" role="status">
                        {mensaje}
                    </p>
                )}

                {cargando ? (
                    <p>Cargando información...</p>
                ) : (
                    <>
                        {seccion === "personajes" ? (
                            <>
                                <form
                                    id="formulario-admin"
                                    className="admin-formulario"
                                    onSubmit={guardarPersonaje}
                                >
                                    <h3>
                                        {personajeEditando
                                            ? "Editar personaje"
                                            : "Agregar personaje"}
                                    </h3>

                                    <label>
                                        Modo
                                        <select
                                            name="id_modo"
                                            value={personaje.id_modo}
                                            onChange={cambiarDatoPersonaje}
                                            required
                                        >
                                            <option value="1">Próceres argentinos</option>
                                            <option value="2">Profes del Pío IX</option>
                                        </select>
                                    </label>

                                    <label>
                                        Nombre
                                        <input
                                            name="nombre"
                                            value={personaje.nombre}
                                            onChange={cambiarDatoPersonaje}
                                            required
                                        />
                                    </label>

                                    <label>
                                        Descripción
                                        <textarea
                                            name="descripcion"
                                            value={personaje.descripcion}
                                            onChange={cambiarDatoPersonaje}
                                        />
                                    </label>

                                    <label>
                                        Posición natural
                                        <select
                                            name="posicion_natural"
                                            value={personaje.posicion_natural}
                                            onChange={cambiarDatoPersonaje}
                                            required
                                        >
                                            <option>Arquero</option>
                                            <option>Defensor</option>
                                            <option>Mediocampista</option>
                                            <option>Delantero</option>
                                        </select>
                                    </label>

                                    <div className="admin-estadisticas">
                                        {["ataque", "defensa", "velocidad", "habilidad"].map((estadistica) => (
                                            <label key={estadistica}>
                                                {estadistica.charAt(0).toUpperCase() + estadistica.slice(1)}
                                                <input
                                                    type="number"
                                                    name={estadistica}
                                                    min="0"
                                                    max="100"
                                                    value={personaje[estadistica]}
                                                    onChange={cambiarDatoPersonaje}
                                                    required
                                                />
                                            </label>
                                        ))}
                                    </div>

                                    <div className="admin-botones-form">
                                        <button type="submit">
                                            {personajeEditando ? "Guardar cambios" : "Agregar personaje"}
                                        </button>

                                        {personajeEditando && (
                                            <button
                                                type="button"
                                                className="secundario"
                                                onClick={() => {
                                                    setPersonajeEditando(null);
                                                    setPersonaje(personajeVacio);
                                                }}
                                            >
                                                Cancelar edición
                                            </button>
                                        )}
                                    </div>
                                </form>

                                <h3>Personajes registrados</h3>

                                <div className="admin-tabla-contenedor">
                                    <table className="admin-tabla">
                                        <thead>
                                            <tr>
                                                <th>Nombre</th>
                                                <th>Modo</th>
                                                <th>Posición</th>
                                                <th>Ataque</th>
                                                <th>Defensa</th>
                                                <th>Velocidad</th>
                                                <th>Habilidad</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {personajes.map((p) => (
                                                <tr key={p.id_personaje}>
                                                    <td>{p.nombre}</td>
                                                    <td>{p.nombre_modo || p.id_modo}</td>
                                                    <td>{p.posicion_natural}</td>
                                                    <td>{p.ataque}</td>
                                                    <td>{p.defensa}</td>
                                                    <td>{p.velocidad}</td>
                                                    <td>{p.habilidad}</td>
                                                    <td className="admin-acciones">
                                                        <button
                                                            type="button"
                                                            onClick={() => editarPersonaje(p)}
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="eliminar"
                                                            onClick={() => eliminarPersonaje(p.id_personaje)}
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {personajes.length === 0 && (
                                                <tr>
                                                    <td colSpan="8">No hay personajes registrados.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <>
                                <form
                                    id="formulario-admin"
                                    className="admin-formulario"
                                    onSubmit={guardarUsuario}
                                >
                                    <h3>Agregar usuario</h3>

                                    <label>
                                        Nombre de usuario
                                        <input
                                            name="nombre_usuario"
                                            value={usuario.nombre_usuario}
                                            onChange={cambiarDatoUsuario}
                                            required
                                        />
                                    </label>

                                    <label>
                                        Email
                                        <input
                                            type="email"
                                            name="email"
                                            value={usuario.email}
                                            onChange={cambiarDatoUsuario}
                                            required
                                        />
                                    </label>

                                    <label>
                                        Contraseña
                                        <input
                                            type="password"
                                            name="contrasena"
                                            value={usuario.contrasena}
                                            onChange={cambiarDatoUsuario}
                                            required
                                        />
                                    </label>

                                    <button type="submit">Agregar usuario</button>
                                </form>

                                <h3>Usuarios registrados</h3>

                                <div className="admin-tabla-contenedor">
                                    <table className="admin-tabla">
                                        <thead>
                                            <tr>
                                                <th>Usuario</th>
                                                <th>Email</th>
                                                <th>Partidas</th>
                                                <th>Victorias</th>
                                                <th>Administrador</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usuarios.map((u) => (
                                                <tr key={u.id_usuario}>
                                                    <td>{u.nombre_usuario}</td>
                                                    <td>{u.email}</td>
                                                    <td>{u.partidas_jugadas}</td>
                                                    <td>{u.partidas_ganadas}</td>
                                                    <td>{Number(u.administrador) === 1 ? "Sí" : "No"}</td>
                                                    <td className="admin-acciones">
                                                        <button
                                                            type="button"
                                                            onClick={() => editarUsuario(u)}
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="eliminar"
                                                            onClick={() => eliminarUsuario(u.id_usuario)}
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {usuarios.length === 0 && (
                                                <tr>
                                                    <td colSpan="6">No hay usuarios registrados.</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {usuarioEditando && (
                                    <div className="admin-editar-permisos">
                                        <h3>Editar usuario: {usuarioEditando.nombre_usuario}</h3>
                                        <p>Podés cambiar sus permisos de administrador.</p>

                                        <button
                                            type="button"
                                            onClick={() => cambiarAdministrador(
                                                usuarioEditando,
                                                Number(usuarioEditando.administrador) === 1 ? 0 : 1
                                            )}
                                        >
                                            {Number(usuarioEditando.administrador) === 1
                                                ? "Quitar administrador"
                                                : "Hacer administrador"}
                                        </button>

                                        <button
                                            type="button"
                                            className="secundario"
                                            onClick={() => setUsuarioEditando(null)}
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </section>
        </div>
    );
}
