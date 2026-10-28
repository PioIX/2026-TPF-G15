
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

const eventosPosibles = [
    {
        tipo: "ataque",
        descripcion: "¡Gran jugada colectiva! El equipo avanza al área rival.",
    },
    {
        tipo: "ataque",
        descripcion: "¡Remate al arco! El arquero responde y evita el gol.",
    },
    {
        tipo: "tarjeta",
        descripcion: "Tarjeta amarilla por una infracción en el mediocampo.",
    },
    {
        tipo: "ataque",
        descripcion: "El equipo recupera la pelota y sale de contraataque.",
    },
];

export default function PartidoPage() {
    const [minuto, setMinuto] = useState(0);
    const [golesLocal, setGolesLocal] = useState(0);
    const [golesVisitante, setGolesVisitante] = useState(0);
    const [eventos, setEventos] = useState([]);
    const [goleadores, setGoleadores] = useState([]);
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

    // Genera los eventos del partido.
    useEffect(() => {
        if (minuto === 0 || finalizado) return;

        const puedeHaberGol = Math.random() < 0.22;

        if (puedeHaberGol) {
            const local = Math.random() < 0.5;

            const jugador = local
                ? equipoLocal.jugadores[
                    8 + Math.floor(Math.random() * 3)
                ]
                : equipoVisitante.jugadores[
                    9 + Math.floor(Math.random() * 2)
                ];

            const nombreEquipo = local
                ? equipoLocal.nombre
                : equipoVisitante.nombre;

            if (local) {
                setGolesLocal((goles) => goles + 1);
            } else {
                setGolesVisitante((goles) => goles + 1);
            }

            // Registramos al goleador y su equipo.
            setGoleadores((anteriores) => [
                ...anteriores,
                {
                    nombre: jugador.nombre,
                    numero: jugador.numero,
                    equipo: local ? "local" : "visitante",
                },
            ]);

            // Mostramos el gol en los eventos.
            setEventos((anteriores) => [
                {
                    minuto,
                    tipo: "gol",
                    descripcion: `¡GOOOL de ${jugador.nombre}!`,
                    nombreEquipo,
                },
                ...anteriores,
            ]);
        } else {
            const evento =
                eventosPosibles[
                    Math.floor(Math.random() * eventosPosibles.length)
                ];

            setEventos((anteriores) => [
                {
                    ...evento,
                    minuto,
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

    // Reinicia el partido y borra sus eventos anteriores.
    function reiniciarPartido() {
        setMinuto(0);
        setGolesLocal(0);
        setGolesVisitante(0);
        setEventos([]);
        setGoleadores([]);
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

                                    {Array.from({
                                        length: contarGoles(jugador, "local"),
                                    }).map((_, indice) => (
                                        <span
                                            key={indice}
                                            title="Gol de este jugador"
                                        >
                                            ⚽
                                        </span>
                                    ))}

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

                                    {Array.from({
                                        length: contarGoles(
                                            jugador,
                                            "visitante"
                                        ),
                                    }).map((_, indice) => (
                                        <span
                                            key={indice}
                                            title="Gol de este jugador"
                                        >
                                            ⚽
                                        </span>
                                    ))}

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
                                            ? "⚽"
                                            : evento.tipo === "tarjeta"
                                                ? "🟨"
                                                : "•"}
                                    </span>

                                    <div className={styles.descripcionEvento}>
                                        <p>{evento.descripcion}</p>

                                        {evento.tipo === "gol" && (
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
