
"use client";

import { useEffect, useState } from "react";
import styles from "./partido.module.css";

const equipoLocal = {
    nombre: "ARGENTINA FC",
    formacion: "4-3-3",
    jugadores: [
        { numero: 1, nombre: "Manuel Belgrano", posicion: "ARQ" },
        { numero: 4, nombre: "José de San Martín", posicion: "DEF" },
        { numero: 2, nombre: "Martín Miguel de Güemes", posicion: "DEF" },
        { numero: 6, nombre: "Juan Manuel de Rosas", posicion: "DEF" },
        { numero: 3, nombre: "Manuel Dorrego", posicion: "DEF" },
        { numero: 5, nombre: "Mariano Moreno", posicion: "MED" },
        { numero: 8, nombre: "Domingo F. Sarmiento", posicion: "MED" },
        { numero: 10, nombre: "Juan B. Alberdi", posicion: "MED" },
        { numero: 7, nombre: "José Artigas", posicion: "DEL" },
        { numero: 9, nombre: "Cornelio Saavedra", posicion: "DEL" },
        { numero: 11, nombre: "Juan José Castelli", posicion: "DEL" },
    ],
};

const equipoVisitante = {
    nombre: "RIVALES FC",
    formacion: "4-4-2",
    jugadores: [
        { numero: 1, nombre: "Jugador visitante 1", posicion: "ARQ" },
        { numero: 2, nombre: "Jugador visitante 2", posicion: "DEF" },
        { numero: 3, nombre: "Jugador visitante 3", posicion: "DEF" },
        { numero: 4, nombre: "Jugador visitante 4", posicion: "DEF" },
        { numero: 5, nombre: "Jugador visitante 5", posicion: "DEF" },
        { numero: 6, nombre: "Jugador visitante 6", posicion: "MED" },
        { numero: 7, nombre: "Jugador visitante 7", posicion: "MED" },
        { numero: 8, nombre: "Jugador visitante 8", posicion: "MED" },
        { numero: 10, nombre: "Jugador visitante 10", posicion: "MED" },
        { numero: 9, nombre: "Jugador visitante 9", posicion: "DEL" },
        { numero: 11, nombre: "Jugador visitante 11", posicion: "DEL" },
    ],
};

const eventosAtaque = [
    "¡Gran jugada colectiva! El equipo avanza al área rival.",
    "¡Remate al arco! El arquero responde y evita el gol.",
    "El equipo recupera la pelota y sale de contraataque.",
    "¡Peligro en el área! La defensa logra despejar la pelota.",
    "El equipo intenta una combinación ofensiva, pero pierde la pelota.",
];

export default function PartidoPage() {
    const [minuto, setMinuto] = useState(0);
    const [golesLocal, setGolesLocal] = useState(0);
    const [golesVisitante, setGolesVisitante] = useState(0);
    const [eventos, setEventos] = useState([]);
    const [goleadores, setGoleadores] = useState([]);
    const [amonestados, setAmonestados] = useState([]);
    const [finalizado, setFinalizado] = useState(false);

    // Hace avanzar el reloj hasta el minuto 90.
    useEffect(() => {
        if (finalizado) return;

        const intervalo = setInterval(() => {
            setMinuto((minutoActual) => {
                if (minutoActual >= 90) {
                    setFinalizado(true);
                    return 90;
                }

                return Math.min(minutoActual + 5, 90);
            });
        }, 1500);

        return () => clearInterval(intervalo);
    }, [finalizado]);

    // Registra un gol y lo identifica según su tipo.
    function registrarGol(jugador, local, descripcion, tipoGol = "normal") {
        const equipo = local ? "local" : "visitante";
        const nombreEquipo = local
            ? equipoLocal.nombre
            : equipoVisitante.nombre;

        if (local) {
            setGolesLocal((goles) => goles + 1);
        } else {
            setGolesVisitante((goles) => goles + 1);
        }

        setGoleadores((anteriores) => [
            ...anteriores,
            {
                nombre: jugador.nombre,
                numero: jugador.numero,
                equipo,
                tipo: tipoGol,
            },
        ]);

        setEventos((anteriores) => [
            {
                minuto,
                tipo: "gol",
                tipoGol,
                descripcion,
                nombreEquipo,
            },
            ...anteriores,
        ]);
    }

    // Elige un delantero para el equipo que genera la jugada.
    function elegirDelantero(local) {
        const jugadores = local
            ? equipoLocal.jugadores
            : equipoVisitante.jugadores;

        const delanteros = jugadores.filter(
            (jugador) => jugador.posicion === "DEL"
        );

        return delanteros[
            Math.floor(Math.random() * delanteros.length)
        ];
    }

    // Genera los eventos del partido.
    useEffect(() => {
        if (minuto === 0 || finalizado) return;

        const local = Math.random() < 0.5;
        const nombreEquipo = local
            ? equipoLocal.nombre
            : equipoVisitante.nombre;

        // Gol durante una jugada normal.
        if (Math.random() < 0.22) {
            const jugador = elegirDelantero(local);

            registrarGol(
                jugador,
                local,
                `¡GOOOL de ${jugador.nombre}!`
            );

            return;
        }

        const azar = Math.random() * 100;

        // Ataques.
        if (azar < 35) {
            const descripcion =
                eventosAtaque[
                    Math.floor(Math.random() * eventosAtaque.length)
                ];

            setEventos((anteriores) => [
                {
                    minuto,
                    tipo: "ataque",
                    descripcion,
                    nombreEquipo,
                },
                ...anteriores,
            ]);

            return;
        }

        // Tarjetas amarillas: una como máximo por jugador.
        if (azar < 52) {
            const equipo = local ? "local" : "visitante";
            const jugadores = local
                ? equipoLocal.jugadores
                : equipoVisitante.jugadores;

            const jugadoresSinAmarilla = jugadores.filter(
                (jugador) =>
                    !amonestados.some(
                        (amonestado) =>
                            amonestado.nombre === jugador.nombre &&
                            amonestado.numero === jugador.numero &&
                            amonestado.equipo === equipo
                    )
            );

            if (jugadoresSinAmarilla.length > 0) {
                const jugador =
                    jugadoresSinAmarilla[
                        Math.floor(
                            Math.random() * jugadoresSinAmarilla.length
                        )
                    ];

                setAmonestados((anteriores) => [
                    ...anteriores,
                    {
                        nombre: jugador.nombre,
                        numero: jugador.numero,
                        equipo,
                    },
                ]);

                setEventos((anteriores) => [
                    {
                        minuto,
                        tipo: "tarjeta",
                        descripcion: `Tarjeta amarilla para ${jugador.nombre} por una infracción.`,
                        nombreEquipo,
                    },
                    ...anteriores,
                ]);
            } else {
                setEventos((anteriores) => [
                    {
                        minuto,
                        tipo: "ataque",
                        descripcion:
                            "El árbitro deja seguir el juego. El equipo recupera la pelota.",
                        nombreEquipo,
                    },
                    ...anteriores,
                ]);
            }

            return;
        }

        // Córners.
        if (azar < 72) {
            setEventos((anteriores) => [
                {
                    minuto,
                    tipo: "corner",
                    descripcion: `¡Tiro de esquina para ${nombreEquipo}! El equipo prepara el centro al área.`,
                    nombreEquipo,
                },
                ...anteriores,
            ]);

            return;
        }

        // Tiros libres.
        if (azar < 93) {
            const resultadoTiroLibre = Math.random();

            if (resultadoTiroLibre < 0.25) {
                const jugador = elegirDelantero(local);

                registrarGol(
                    jugador,
                    local,
                    `¡GOOOL de ${jugador.nombre}! ¡Golazo de tiro libre directo!`,
                    "tiroLibre"
                );

                return;
            }

            if (resultadoTiroLibre < 0.5) {
                setEventos((anteriores) => [
                    {
                        minuto,
                        tipo: "tiroLibre",
                        descripcion:
                            `Tiro libre para ${nombreEquipo}. El centro llega al área, pero nadie logra conectar el cabezazo.`,
                        nombreEquipo,
                    },
                    ...anteriores,
                ]);

                return;
            }

            if (resultadoTiroLibre < 0.75) {
                const jugador = elegirDelantero(local);

                registrarGol(
                    jugador,
                    local,
                    `¡GOOOL de ${jugador.nombre}! Gran centro de tiro libre y cabezazo a la red.`,
                    "tiroLibre"
                );

                return;
            }

            setEventos((anteriores) => [
                {
                    minuto,
                    tipo: "tiroLibre",
                    descripcion:
                        `Tiro libre para ${nombreEquipo}. ¡El remate se va desviado por encima del travesaño!`,
                    nombreEquipo,
                },
                ...anteriores,
            ]);

            return;
        }

        // Penales: gol o fallo.
        const conviertePenal = Math.random() < 0.5;

        if (conviertePenal) {
            const jugador = elegirDelantero(local);

            registrarGol(
                jugador,
                local,
                `¡GOOOL de ${jugador.nombre}! ¡Convierte el penal!`,
                "penal"
            );
        } else {
            setEventos((anteriores) => [
                {
                    minuto,
                    tipo: "penal",
                    descripcion:
                        `¡Penal para ${nombreEquipo}! El remate no termina en gol: el arquero lo ataja o el disparo se va desviado.`,
                    nombreEquipo,
                },
                ...anteriores,
            ]);
        }
    }, [minuto, finalizado]);

    // Cuenta los goles de un jugador dentro de su equipo.
    function contarGoles(jugador, equipo) {
        return goleadores.filter(
            (gol) =>
                gol.nombre === jugador.nombre &&
                gol.numero === jugador.numero &&
                gol.equipo === equipo
        ).length;
    }

    // Comprueba si el jugador recibió una tarjeta amarilla.
    function tieneAmarilla(jugador, equipo) {
        return amonestados.some(
            (amonestado) =>
                amonestado.nombre === jugador.nombre &&
                amonestado.numero === jugador.numero &&
                amonestado.equipo === equipo
        );
    }

    // Reinicia el partido.
    function reiniciarPartido() {
        setMinuto(0);
        setGolesLocal(0);
        setGolesVisitante(0);
        setEventos([]);
        setGoleadores([]);
        setAmonestados([]);
        setFinalizado(false);
    }

    return (
        <main className={styles.pagina}>
            <header className={styles.encabezado}>
                <div className={styles.equipoCabecera}>
                    <div className={styles.escudo}>🇦🇷</div>
                    <h2>{equipoLocal.nombre}</h2>
                    <p>{equipoLocal.formacion}</p>
                </div>

                <div className={styles.marcador}>
                    <p className={styles.competicion}>
                        ARGENTINA FC · PARTIDO
                    </p>

                    <div className={styles.resultado}>
                        <span>{golesLocal}</span>
                        <span className={styles.guion}>-</span>
                        <span>{golesVisitante}</span>
                    </div>

                    <p className={styles.reloj}>
                        {finalizado ? "FINAL DEL PARTIDO" : `${minuto}'`}
                    </p>
                </div>

                <div className={styles.equipoCabecera}>
                    <div className={styles.escudo}>⚽</div>
                    <h2>{equipoVisitante.nombre}</h2>
                    <p>{equipoVisitante.formacion}</p>
                </div>
            </header>

            <section className={styles.contenido}>
                <div className={styles.alineaciones}>
                    <div className={styles.tituloPanel}>
                        <h3>Alineaciones</h3>
                    </div>

                    <div className={styles.dosEquipos}>
                        <div className={styles.listaEquipo}>
                            <h4>{equipoLocal.nombre}</h4>

                            {equipoLocal.jugadores.map((jugador) => (
                                <div
                                    key={jugador.numero}
                                    className={styles.jugador}
                                >
                                    <span className={styles.numero}>
                                        {jugador.numero}
                                    </span>

                                    <span className={styles.nombreJugador}>
                                        {jugador.nombre}
                                    </span>

                                    {goleadores
                                        .filter(
                                            (gol) =>
                                                gol.nombre === jugador.nombre &&
                                                gol.numero === jugador.numero &&
                                                gol.equipo === "local"
                                        )
                                        .map((gol, indice) => (
                                            <span
                                                key={`gol-${indice}`}
                                                title={
                                                    gol.tipo === "penal"
                                                        ? "Gol de penal"
                                                        : gol.tipo === "tiroLibre"
                                                            ? "Gol de tiro libre"
                                                            : "Gol"
                                                }
                                            >
                                                {gol.tipo === "penal"
                                                    ? "⚽🎯"
                                                    : gol.tipo === "tiroLibre"
                                                        ? "⚽🥅"
                                                        : "⚽"}
                                            </span>
                                        ))}

                                    {tieneAmarilla(jugador, "local") && (
                                        <span title="Tarjeta amarilla">🟨</span>
                                    )}

                                    <span className={styles.posicion}>
                                        {jugador.posicion}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className={styles.listaEquipo}>
                            <h4>{equipoVisitante.nombre}</h4>

                            {equipoVisitante.jugadores.map((jugador) => (
                                <div
                                    key={jugador.numero}
                                    className={styles.jugador}
                                >
                                    <span className={styles.numero}>
                                        {jugador.numero}
                                    </span>

                                    <span className={styles.nombreJugador}>
                                        {jugador.nombre}
                                    </span>

                                    {goleadores
                                        .filter(
                                            (gol) =>
                                                gol.nombre === jugador.nombre &&
                                                gol.numero === jugador.numero &&
                                                gol.equipo === "visitante"
                                        )
                                        .map((gol, indice) => (
                                            <span
                                                key={`gol-${indice}`}
                                                title={
                                                    gol.tipo === "penal"
                                                        ? "Gol de penal"
                                                        : gol.tipo === "tiroLibre"
                                                            ? "Gol de tiro libre"
                                                            : "Gol"
                                                }
                                            >
                                                {gol.tipo === "penal"
                                                    ? "⚽🎯"
                                                    : gol.tipo === "tiroLibre"
                                                        ? "⚽🥅"
                                                        : "⚽"}
                                            </span>
                                        ))}

                                    {tieneAmarilla(jugador, "visitante") && (
                                        <span title="Tarjeta amarilla">🟨</span>
                                    )}

                                    <span className={styles.posicion}>
                                        {jugador.posicion}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <aside className={styles.panelEventos}>
                    <div className={styles.tituloPanel}>
                        <h3>Eventos del partido</h3>
                        <span>{minuto}'</span>
                    </div>

                    <div className={styles.listaEventos}>
                        {eventos.length === 0 ? (
                            <p className={styles.sinEventos}>
                                El árbitro está por dar comienzo al partido...
                            </p>
                        ) : (
                            eventos.map((evento, indice) => (
                                <article
                                    key={`${evento.minuto}-${indice}`}
                                    className={`${styles.evento} ${
                                        evento.tipo === "gol"
                                            ? styles.eventoGol
                                            : ""
                                    }`}
                                >
                                    <span className={styles.minutoEvento}>
                                        {evento.minuto}'
                                    </span>

                                    <span className={styles.iconoEvento}>
                                        {evento.tipo === "gol"
                                            ? evento.tipoGol === "penal"
                                                ? "🎯"
                                                : evento.tipoGol === "tiroLibre"
                                                    ? "🥅"
                                                    : "⚽"
                                            : evento.tipo === "tarjeta"
                                                ? "🟨"
                                                : evento.tipo === "corner"
                                                    ? "🚩"
                                                    : evento.tipo === "tiroLibre"
                                                        ? "🥅"
                                                        : evento.tipo === "penal"
                                                            ? "🎯"
                                                            : "•"}
                                    </span>

                                    <div className={styles.descripcionEvento}>
                                        <p>{evento.descripcion}</p>

                                        {evento.nombreEquipo && (
                                            <span className={styles.equipoGol}>
                                                {evento.nombreEquipo}
                                            </span>
                                        )}
                                    </div>
                                </article>
                            ))
                        )}
                    </div>

                    {finalizado && (
                        <div className={styles.final}>
                            <h3>¡Partido finalizado!</h3>

                            <p>
                                {golesLocal > golesVisitante
                                    ? `Ganó ${equipoLocal.nombre}`
                                    : golesVisitante > golesLocal
                                        ? `Ganó ${equipoVisitante.nombre}`
                                        : "El partido terminó en empate"}
                            </p>

                            <button onClick={reiniciarPartido}>
                                Simular nuevamente
                            </button>
                        </div>
                    )}
                </aside>
            </section>
        </main>
    );
}
