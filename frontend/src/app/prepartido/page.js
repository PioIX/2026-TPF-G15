
"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import styles from "./prepartido.module.css";

export default function PrepartidoPage() {
    return (
        <Suspense fallback={<p>Cargando prepartido...</p>}>
            <PrepartidoContenido />
        </Suspense>
    );
}

function PrepartidoContenido() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const tipo = searchParams.get("tipo");
    const modo = searchParams.get("modo");

    // Datos para continuar el torneo
    const instancia = searchParams.get("instancia") || "Octavos";
    const idEquipoParam = searchParams.get("id_equipo");

    const [cargando, setCargando] = useState(false);
    const [partida, setPartida] = useState(null);
    const [error, setError] = useState("");

    // Evita duplicar la creación para la misma instancia si React repite el efecto.
    const solicitudIniciada = useRef("");

    const esIndividual = tipo === "individual";
    const esMultijugador = tipo === "multijugador";

    const nombreModo =
        modo === "1" || modo === "proceres"
            ? "Próceres argentinos"
            : modo === "2" || modo === "profes"
                ? "Profesores del Pío IX"
                : "Modo de juego";

    const nombreInstancia = {
        Octavos: "Octavos de final",
        Cuartos: "Cuartos de final",
        Semifinal: "Semifinal",
        Final: "Final"
    }[instancia] || "Instancia del torneo";

    useEffect(() => {
        const claveSolicitud = [
            modo,
            instancia,
            idEquipoParam || "",
        ].join("|");

        if (
            !esIndividual ||
            solicitudIniciada.current === claveSolicitud
        ) {
            return;
        }

        solicitudIniciada.current = claveSolicitud;
        setPartida(null);
        setCargando(true);
        setError("");

        async function crearPartida() {
            try {
                // Recuperar el equipo de la URL o de sessionStorage.
                const equipoGuardado = sessionStorage.getItem("equipoPendiente");

                const equipo = equipoGuardado
                    ? JSON.parse(equipoGuardado)
                    : null;

                // Si viene por URL, tiene prioridad.
                const idEquipo = idEquipoParam
                    ? Number(idEquipoParam)
                    : equipo?.id_equipo;

                if (!idEquipo || !modo) {
                    throw new Error(
                        "Faltan datos del equipo o del modo de juego."
                    );
                }

                // Pedirle al backend que genere el BOT y cree la partida.
                const respuesta = await fetch(
                    "http://localhost:4000/partidas/individual",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        credentials: "include",
                        body: JSON.stringify({
                            id_equipo: idEquipo,
                            id_modo: Number(modo),
                            instancia: instancia
                        })
                    }
                );

                const datos = await respuesta.json();

                if (!respuesta.ok) {
                    throw new Error(
                        datos.mensaje || "No se pudo crear la partida."
                    );
                }

                if (solicitudIniciada.current !== claveSolicitud) {
                    return;
                }

                // Guardar los datos recibidos para mostrarlos en pantalla.
                setPartida(datos);

            } catch (error) {
                console.error("Error al preparar la partida:", error);
                if (solicitudIniciada.current === claveSolicitud) {
                    setError(error.message);
                }
            } finally {
                if (solicitudIniciada.current === claveSolicitud) {
                    setCargando(false);
                }
            }
        }

        crearPartida();
    }, [esIndividual, modo, instancia, idEquipoParam]);

    function comenzarPartido() {
        if (!partida?.id_partida) {
            return;
        }

        router.push(`/partido?id_partida=${partida.id_partida}`);
    }

    function cancelar() {
        router.push("/");
    }

    if (!esIndividual && !esMultijugador) {
        return (
            <main className={styles.contenedor}>
                <h1>Preparación del partido</h1>
                <p>No se especificó una modalidad válida.</p>
                <button onClick={cancelar}>Volver al inicio</button>
            </main>
        );
    }

    return (
        <main className={styles.contenedor}>
            <header className={styles.encabezado}>
                <p>ARGENTINA FC</p>
                <h1>Preparación del partido</h1>
                <span>{nombreModo}</span>
            </header>

            {esIndividual && (
                <section className={styles.contenido}>
                    <h2>¡Continúa el torneo!</h2>

                    <p className={styles.descripcion}>
                        Enfrentate a diferentes equipos y convertite en campeón.
                    </p>

                    <div className={styles.instancia}>
                        <span>TORNEO INDIVIDUAL</span>
                        <h2>{nombreInstancia}</h2>
                    </div>

                    {cargando && (
                        <p>
                            Estamos preparando tu partido y generando al rival...
                        </p>
                    )}

                    {error && (
                        <div>
                            <p>{error}</p>
                            <button onClick={cancelar}>
                                Volver al inicio
                            </button>
                        </div>
                    )}

                    {partida && (
                        <>
                            <div className={styles.enfrentamiento}>
                                <article className={styles.equipo}>
                                    <div className={styles.escudo}>TU</div>
                                    <h3>{partida.equipo_usuario.nombre}</h3>
                                    <p>Tu equipo</p>
                                </article>

                                <div className={styles.vs}>VS</div>

                                <article className={styles.equipo}>
                                    <div className={styles.escudo}>BOT</div>
                                    <h3>{partida.equipo_bot.nombre}</h3>
                                    <p>Rival generado por la máquina</p>
                                </article>
                            </div>

                            <p className={styles.aviso}>
                                Tu rival fue generado automáticamente con personajes
                                del modo {nombreModo}.
                            </p>

                            <button
                                className={styles.botonPrincipal}
                                onClick={comenzarPartido}
                            >
                                Comenzar partido
                            </button>
                        </>
                    )}
                </section>
            )}

            {esMultijugador && (
                <section className={styles.contenido}>
                    <h2>Buscando contrincante</h2>

                    <p className={styles.descripcion}>
                        Estamos buscando otro jugador que quiera competir
                        en el mismo modo.
                    </p>

                    <div className={styles.sala}>
                        <div className={styles.jugador}>
                            <div className={styles.escudo}>TU</div>
                            <h3>Tu equipo</h3>
                            <span className={styles.conectado}>
                                <span className={styles.punto}></span>
                                Listo para jugar
                            </span>
                        </div>

                        <div className={styles.vs}>VS</div>

                        <div className={styles.jugador}>
                            <div className={styles.escudo}>?</div>
                            <h3>Contrincante</h3>
                            <span className={styles.buscando}>
                                <span className={styles.puntoAnimado}></span>
                                Buscando jugador...
                            </span>
                        </div>
                    </div>

                    <p className={styles.aviso}>
                        Cuando encontremos un jugador del mismo modo,
                        se preparará el partido.
                    </p>

                    <button
                        className={styles.botonSecundario}
                        onClick={cancelar}
                    >
                        Cancelar búsqueda
                    </button>
                </section>
            )}
        </main>
    );
}
