
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./perfil.module.css";

const API = "http://localhost:4000";

function obtenerNombreJugador(usuario) {
    return (
        usuario?.nombre_usuario ||
        usuario?.nombre ||
        usuario?.username ||
        "Jugador"
    );
}

function obtenerNumero(...valores) {
    for (const valor of valores) {
        if (valor !== null && valor !== undefined && valor !== "") {
            const numero = Number(valor);

            if (Number.isFinite(numero)) {
                return numero;
            }
        }
    }

    return 0;
}

export default function PerfilPage() {
    const [usuario, setUsuario] = useState(null);
    const [estadisticas, setEstadisticas] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function cargarPerfil() {
            try {
                const usuarioGuardado = localStorage.getItem("usuario");

                if (!usuarioGuardado) {
                    setCargando(false);
                    return;
                }

                const datosUsuario = JSON.parse(usuarioGuardado);
                setUsuario(datosUsuario);

                const respuesta = await fetch(`${API}/ranking`, {
                    method: "GET",
                    credentials: "include",
                    cache: "no-store",
                });

                if (!respuesta.ok) {
                    throw new Error("No se pudieron obtener las estadísticas.");
                }

                const datosRanking = await respuesta.json();

                const jugadores = Array.isArray(datosRanking)
                    ? datosRanking
                    : datosRanking.ranking ||
                      datosRanking.usuarios ||
                      datosRanking.data ||
                      [];

                const idUsuario = datosUsuario.id_usuario ?? datosUsuario.id;

                const indice = jugadores.findIndex((jugador) => {
                    const mismoId =
                        idUsuario !== undefined &&
                        String(jugador.id_usuario ?? jugador.id) ===
                            String(idUsuario);

                    const mismoNombre =
                        obtenerNombreJugador(jugador) ===
                        obtenerNombreJugador(datosUsuario);

                    return mismoId || mismoNombre;
                });

                if (indice !== -1) {
                    const jugador = jugadores[indice];

                    const partidas = obtenerNumero(
                        jugador.partidas_jugadas,
                        jugador.partidas,
                        jugador.total_partidas
                    );

                    const victorias = obtenerNumero(
                        jugador.partidas_ganadas,
                        jugador.victorias
                    );

                    const derrotas = obtenerNumero(
                        jugador.derrotas,
                        Math.max(0, partidas - victorias)
                    );

                    setEstadisticas({
                        puntos: obtenerNumero(jugador.puntos),
                        victorias,
                        derrotas,
                        partidas,
                        posicion: obtenerNumero(
                            jugador.posicion,
                            indice + 1
                        ),
                    });
                }
            } catch (error) {
                console.error("Error al cargar el perfil:", error);
                setError("No se pudieron cargar las estadísticas.");
            } finally {
                setCargando(false);
            }
        }

        cargarPerfil();
    }, []);

    if (cargando) {
        return (
            <main className={styles.pagina}>
                <p className={styles.mensajeEstado}>Cargando perfil...</p>
            </main>
        );
    }

    if (!usuario) {
        return (
            <main className={styles.pagina}>
                <div className={styles.sinSesion}>
                    <h2>No hay una sesión iniciada</h2>
                    <p>Iniciá sesión para consultar tu perfil.</p>
                    <Link href="/login" className={styles.boton}>
                        Iniciar sesión
                    </Link>
                </div>
            </main>
        );
    }

    const nombre = obtenerNombreJugador(usuario);
    const correo = usuario.email || "Correo no disponible";
    const esAdmin = usuario.administrador === 1 ||
        usuario.administrador === true;

    return (
        <main className={styles.pagina}>
            <header className={styles.encabezadoSuperior}>
                <div className={styles.barraSuperior}>
                    <div className={styles.marca}>
                        <div className={styles.logo}>AFC</div>

                        <div>
                            <h1>Argentina FC</h1>
                        </div>
                    </div>

                    <div className={styles.conexion}>
                        <span></span>
                        Conectado
                    </div>
                </div>

                <nav className={styles.navbar} aria-label="Navegación principal">
                    <Link href="/inicio" className={styles.enlaceNav}>
                        Inicio
                    </Link>

                    <Link href="/ranking" className={styles.enlaceNav}>
                        Ranking
                    </Link>

                    <Link
                        href="/perfil"
                        className={`${styles.enlaceNav} ${styles.activo}`}
                    >
                        Perfil
                    </Link>
                </nav>
            </header>

            <section className={styles.contenido}>
                <div className={styles.etiqueta}>PERFIL</div>

                <div className={styles.encabezado}>
                    <div>
                        <h2>Tu perfil</h2>
                        <p>Consultá tu información y tu rendimiento en la temporada.</p>
                    </div>
                </div>

                <section className={styles.tarjetaUsuario}>
                    <div className={styles.avatar}>
                        {nombre.charAt(0).toUpperCase()}
                    </div>

                    <div className={styles.datosUsuario}>
                        <h3>{nombre}</h3>
                        <p>{correo}</p>
                        <span className={styles.tipoCuenta}>
                            {esAdmin ? "Administrador" : "Jugador"}
                        </span>
                    </div>
                </section>

                <div className={styles.tituloSeccion}>
                    <h3>Temporada actual</h3>
                    <p>Tu rendimiento en Argentina FC</p>
                </div>

                {error && (
                    <p className={styles.aviso}>{error}</p>
                )}

                <section className={styles.estadisticas}>
                    <article className={styles.tarjetaEstadistica}>
                        <span className={styles.iconoEstadistica}>★</span>
                        <p>Puntos</p>
                        <strong>
                            {estadisticas ? estadisticas.puntos : "—"}
                        </strong>
                    </article>

                    <article className={styles.tarjetaEstadistica}>
                        <span className={styles.iconoEstadistica}>✓</span>
                        <p>Victorias</p>
                        <strong>
                            {estadisticas ? estadisticas.victorias : "—"}
                        </strong>
                    </article>

                    <article className={styles.tarjetaEstadistica}>
                        <span className={styles.iconoEstadistica}>×</span>
                        <p>Derrotas</p>
                        <strong>
                            {estadisticas ? estadisticas.derrotas : "—"}
                        </strong>
                    </article>

                    <article className={styles.tarjetaEstadistica}>
                        <span className={styles.iconoEstadistica}>⚽</span>
                        <p>Partidos jugados</p>
                        <strong>
                            {estadisticas ? estadisticas.partidas : "—"}
                        </strong>
                    </article>
                </section>

                <section className={styles.tarjetaRanking}>
                    <div>
                        <span>POSICIÓN EN EL RANKING</span>
                        <h3>
                            {estadisticas
                                ? `#${estadisticas.posicion}`
                                : "Sin posición"}
                        </h3>
                        <p>
                            {estadisticas
                                ? "Esta es tu ubicación actual entre los jugadores."
                                : "Todavía no hay estadísticas disponibles para este jugador."}
                        </p>
                    </div>

                    <Link href="/ranking" className={styles.botonSecundario}>
                        Ver ranking completo
                    </Link>
                </section>
            </section>
        </main>
    );
}
