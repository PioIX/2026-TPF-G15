"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./ranking.module.css";

const API = "http://localhost:4000";

function obtenerNombreJugador(usuario) {
    if (!usuario) return "Tu jugador";

    return (
        usuario.nombre_usuario ||
        usuario.nombre_usuario_tpf ||
        usuario.nombre ||
        usuario.username ||
        usuario.usuario ||
        usuario.mail ||
        "Tu jugador"
    );
}

function normalizarJugador(jugador, indice) {
    return {
        id:
            jugador.id_usuario ??
            jugador.usuario_id ??
            jugador.id ??
            indice,
        nombre:
            jugador.nombre ??
            jugador.nombre_usuario ??
            jugador.usuario ??
            jugador.username ??
            `Jugador ${indice + 1}`,
        puntos: Number(
            jugador.puntos ??
            jugador.puntaje ??
            jugador.total_puntos ??
            0
        ),
        victorias: Number(
            jugador.victorias ??
            jugador.partidas_ganadas ??
            jugador.ganadas ??
            0
        ),
        partidas: Number(
            jugador.partidas ??
            jugador.partidas_jugadas ??
            jugador.total_partidas ??
            0
        ),
    };
}

export default function RankingPage() {
    const [ranking, setRanking] = useState([]);
    const [desafio, setDesafio] = useState("Próceres Argentinos");
    const [usuarioActual, setUsuarioActual] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [mensaje, setMensaje] = useState("");

    useEffect(() => {
        try {
            const usuarioGuardado = localStorage.getItem("usuario");

            if (usuarioGuardado) {
                setUsuarioActual(JSON.parse(usuarioGuardado));
            }

            const desafioGuardado =
                localStorage.getItem("desafioSeleccionado") ||
                localStorage.getItem("modoSeleccionado") ||
                localStorage.getItem("desafio") ||
                localStorage.getItem("modo");

            if (desafioGuardado) {
                try {
                    const objeto = JSON.parse(desafioGuardado);

                    setDesafio(
                        typeof objeto === "string"
                            ? objeto
                            : objeto.nombre ||
                              objeto.titulo ||
                              objeto.descripcion ||
                              "Próceres Argentinos"
                    );
                } catch {
                    setDesafio(desafioGuardado);
                }
            }
        } catch {
            // La página sigue funcionando aunque no se pueda leer localStorage.
        }
    }, []);

    async function cargarRanking() {
        setCargando(true);
        setMensaje("");

        try {
            const respuesta = await fetch(`${API}/ranking`, {
                credentials: "include",
                cache: "no-store",
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    datos.mensaje || "No se pudo cargar el ranking."
                );
            }

            const lista = Array.isArray(datos)
                ? datos
                : datos.ranking ||
                  datos.resultados ||
                  datos.usuarios ||
                  [];

            if (!Array.isArray(lista)) {
                throw new Error("El formato del ranking no es válido.");
            }

            const ordenados = lista
                .map((jugador, indice) =>
                    normalizarJugador(jugador, indice)
                )
                .sort(
                    (a, b) =>
                        b.puntos - a.puntos ||
                        b.victorias - a.victorias ||
                        b.partidas - a.partidas
                );

            setRanking(ordenados);

            if (ordenados.length === 0) {
                setMensaje(
                    "Todavía no hay resultados guardados para mostrar."
                );
            }
        } catch {
            setRanking([]);
            setMensaje(
                "No se pudo conectar con el ranking. Verificá que el backend esté iniciado y que exista la ruta GET /ranking."
            );
        } finally {
            setCargando(false);
        }
    }

    useEffect(() => {
        cargarRanking();
    }, []);

    const nombreActual = useMemo(
        () => obtenerNombreJugador(usuarioActual),
        [usuarioActual]
    );

    const idActual =
        usuarioActual?.id_usuario ??
        usuarioActual?.id ??
        usuarioActual?.usuario_id;

    const posicionActual = ranking.findIndex(
        (jugador) => String(jugador.id) === String(idActual)
    );

    return (
        <main className={styles.pagina}>
            <nav
                className={styles.navbar}
                aria-label="Navegación principal"
            >
                <Link href="/inicio" className={styles.enlaceNav}>
                    Inicio
                </Link>

                <Link href="/equipo" className={styles.enlaceNav}>
                    Mi equipo
                </Link>

                <Link href="/partido" className={styles.enlaceNav}>
                    Partidas
                </Link>

                <Link
                    href="/ranking"
                    className={`${styles.enlaceNav} ${styles.activo}`}
                >
                    Ranking
                </Link>

                <Link href="/perfil" className={styles.enlaceNav}>
                    Perfil
                </Link>
            </nav>

            <section className={styles.contenido}>
                <div className={styles.avisoDesafio}>
                    Desafío seleccionado: {desafio}.
                </div>

                <div className={styles.etiqueta}>
                    CLASIFICACIÓN
                </div>

                <header className={styles.encabezado}>
                    <div>
                        <h1>Ranking</h1>
                        <p>
                            Jugadores y resultados de Argentina FC.
                        </p>
                    </div>

                    <button
                        className={styles.botonActualizar}
                        type="button"
                        onClick={cargarRanking}
                        disabled={cargando}
                    >
                        {cargando ? "Actualizando..." : "Actualizar"}
                    </button>
                </header>

                {posicionActual >= 0 && (
                    <p className={styles.miPosicion}>
                        Tu posición:{" "}
                        <strong>#{posicionActual + 1}</strong>
                        {" — "}
                        {nombreActual}
                    </p>
                )}

                <div className={styles.tablaContenedor}>
                    <table className={styles.tabla}>
                        <thead>
                            <tr>
                                <th>Posición</th>
                                <th>Jugador</th>
                                <th>Puntos</th>
                                <th>Victorias</th>
                                <th>Partidas</th>
                            </tr>
                        </thead>

                        <tbody>
                            {cargando ? (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className={styles.estado}
                                    >
                                        Cargando ranking...
                                    </td>
                                </tr>
                            ) : ranking.length > 0 ? (
                                ranking.map((jugador, indice) => {
                                    const esActual =
                                        idActual !== undefined &&
                                        idActual !== null &&
                                        String(jugador.id) ===
                                            String(idActual);

                                    return (
                                        <tr
                                            key={jugador.id}
                                            className={
                                                esActual
                                                    ? styles.filaActual
                                                    : ""
                                            }
                                        >
                                            <td className={styles.posicion}>
                                                #{indice + 1}
                                            </td>

                                            <td>
                                                {esActual
                                                    ? nombreActual
                                                    : jugador.nombre}
                                            </td>

                                            <td>
                                                {jugador.puntos.toLocaleString(
                                                    "es-AR"
                                                )}
                                            </td>

                                            <td>{jugador.victorias}</td>

                                            <td>{jugador.partidas}</td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className={styles.estado}
                                    >
                                        {mensaje ||
                                            "Todavía no hay jugadores en el ranking."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <p className={styles.aclaracion}>
                    El ranking se ordena por puntos; en caso de empate,
                    se priorizan las victorias y luego la cantidad de
                    partidas.
                </p>
            </section>
        </main>
    );
}
