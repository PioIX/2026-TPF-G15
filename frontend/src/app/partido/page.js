
"use client";

import { useEffect, useRef, useState } from "react";
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

    // Fases: partido, definicion, penales, mataMata y final.
    const [fase, setFase] = useState("partido");
    const [ganador, setGanador] = useState("");

    // Cada elemento es true si se convirtió y false si se falló.
    const [penalesLocal, setPenalesLocal] = useState([]);
    const [penalesVisitante, setPenalesVisitante] = useState([]);

    // Evita generar dos eventos para el mismo minuto.
    const ultimoMinutoProcesado = useRef(0);

    const golesPenalesLocal = penalesLocal.filter(Boolean).length;
    const golesPenalesVisitante = penalesVisitante.filter(Boolean).length;

    const huboTanda = penalesLocal.length > 0 ||
        penalesVisitante.length > 0;

    // Hace avanzar el reloj durante los 90 minutos.
    useEffect(() => {
        if (fase !== "partido") return;

        const intervalo = setInterval(() => {
            setMinuto((actual) => Math.min(actual + 5, 90));
        }, 1500);

        return () => clearInterval(intervalo);
    }, [fase]);

    // Al llegar al minuto 90, decide si hace falta una tanda.
    useEffect(() => {
        if (minuto < 90 || fase !== "partido") return;

        setFase("definicion");
    }, [minuto, fase]);

    // Registra un gol durante el partido.
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

    // Elige un delantero del equipo indicado.
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

    // Genera los eventos de los 90 minutos.
    useEffect(() => {
        if (
            minuto === 0 ||
            fase !== "partido" ||
            ultimoMinutoProcesado.current === minuto
        ) {
            return;
        }

        ultimoMinutoProcesado.current = minuto;

        const local = Math.random() < 0.5;
        const nombreEquipo = local
            ? equipoLocal.nombre
            : equipoVisitante.nombre;

        // Gol durante una jugada normal.
        if (Math.random() < 0.15) {
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

            if (resultadoTiroLibre < 0.20) {
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

            if (resultadoTiroLibre < 0.55) {
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

        // Penales durante el partido: gol o fallo.
        if (Math.random() < 0.5) {
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
                        `¡Penal para ${nombreEquipo}! El arquero lo ataja o el disparo se va desviado.`,
                    nombreEquipo,
                },
                ...anteriores,
            ]);
        }
    }, [minuto, fase, amonestados]);

    // Decide el ganador al terminar los 90 minutos.
    useEffect(() => {
        if (fase !== "definicion") return;

        if (golesLocal > golesVisitante) {
            setGanador("local");
            setFase("final");
        } else if (golesVisitante > golesLocal) {
            setGanador("visitante");
            setFase("final");
        } else {
            setEventos((anteriores) => [
                {
                    minuto: 90,
                    tipo: "penal",
                    descripcion:
                        "¡El partido terminó empatado! La definición se decidirá por penales.",
                    nombreEquipo: "Definición por penales",
                },
                ...anteriores,
            ]);

            setFase("penales");
        }
    }, [fase, golesLocal, golesVisitante]);

    // Ejecuta automáticamente los penales y el mata-mata.
    useEffect(() => {
        if (fase !== "penales" && fase !== "mataMata") return;

        const cantidadLocal = penalesLocal.length;
        const cantidadVisitante = penalesVisitante.length;

        // Terminó la tanda inicial de cinco penales por equipo.
        if (
            fase === "penales" &&
            cantidadLocal === 5 &&
            cantidadVisitante === 5
        ) {
            if (golesPenalesLocal !== golesPenalesVisitante) {
                setGanador(
                    golesPenalesLocal > golesPenalesVisitante
                        ? "local"
                        : "visitante"
                );

                setEventos((anteriores) => [
                    {
                        minuto: 90,
                        tipo: "penal",
                        descripcion:
                            `Final de la tanda: ${golesPenalesLocal} a ${golesPenalesVisitante}.`,
                        nombreEquipo: "Definición por penales",
                    },
                    ...anteriores,
                ]);

                setFase("final");
            } else {
                setEventos((anteriores) => [
                    {
                        minuto: 90,
                        tipo: "penal",
                        descripcion:
                            `¡La tanda sigue empatada ${golesPenalesLocal} a ${golesPenalesVisitante}! Comienza el mata-mata.`,
                        nombreEquipo: "Definición por penales",
                    },
                    ...anteriores,
                ]);

                setFase("mataMata");
            }

            return;
        }

        // En el mata-mata se comparan los resultados después
        // de que ambos equipos ejecutaron un penal en esa ronda.
        if (
            fase === "mataMata" &&
            cantidadLocal === cantidadVisitante &&
            cantidadLocal > 5 &&
            golesPenalesLocal !== golesPenalesVisitante
        ) {
            setGanador(
                golesPenalesLocal > golesPenalesVisitante
                    ? "local"
                    : "visitante"
            );

            setEventos((anteriores) => [
                {
                    minuto: 90,
                    tipo: "penal",
                    descripcion:
                        `¡Se definió el mata-mata! Resultado de la tanda: ${golesPenalesLocal} a ${golesPenalesVisitante}.`,
                    nombreEquipo: "Definición por penales",
                },
                ...anteriores,
            ]);

            setFase("final");
            return;
        }

        // Local ejecuta primero. Luego ejecuta el visitante.
        const local = cantidadLocal === cantidadVisitante;
        const equipo = local ? "local" : "visitante";
        const nombreEquipo = local
            ? equipoLocal.nombre
            : equipoVisitante.nombre;
        const numeroPenal = local
            ? cantidadLocal + 1
            : cantidadVisitante + 1;

        const ronda =
            numeroPenal <= 5
                ? `Penal ${numeroPenal} de 5`
                : `Mata-mata, ronda ${numeroPenal - 5}`;

        const temporizador = setTimeout(() => {
            const convertido = Math.random() < 0.75;

            if (local) {
                setPenalesLocal((anteriores) => [
                    ...anteriores,
                    convertido,
                ]);
            } else {
                setPenalesVisitante((anteriores) => [
                    ...anteriores,
                    convertido,
                ]);
            }

            setEventos((anteriores) => [
                {
                    minuto: 90,
                    tipo: "penal",
                    descripcion: convertido
                        ? `¡Gol de ${nombreEquipo}! ${ronda} convertido.`
                        : `¡Falló ${nombreEquipo}! ${ronda} errado.`,
                    nombreEquipo,
                },
                ...anteriores,
            ]);
        }, 1200);

        return () => clearTimeout(temporizador);
    }, [
        fase,
        penalesLocal,
        penalesVisitante,
        golesPenalesLocal,
        golesPenalesVisitante,
    ]);

    // Cuenta los goles de cada jugador.
    function contarGoles(jugador, equipo) {
        return goleadores.filter(
            (gol) =>
                gol.nombre === jugador.nombre &&
                gol.numero === jugador.numero &&
                gol.equipo === equipo
        );
    }

    // Comprueba si el jugador recibió una amarilla.
    function tieneAmarilla(jugador, equipo) {
        return amonestados.some(
            (amonestado) =>
                amonestado.nombre === jugador.nombre &&
                amonestado.numero === jugador.numero &&
                amonestado.equipo === equipo
        );
    }

    // Reinicia todo el partido y la definición.
    function reiniciarPartido() {
        setMinuto(0);
        setGolesLocal(0);
        setGolesVisitante(0);
        setEventos([]);
        setGoleadores([]);
        setAmonestados([]);
        setPenalesLocal([]);
        setPenalesVisitante([]);
        setGanador("");
        setFase("partido");
        ultimoMinutoProcesado.current = 0;
    }

    const nombreGanador =
        ganador === "local"
            ? equipoLocal.nombre
            : equipoVisitante.nombre;

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
                        {fase === "final"
                            ? "FINAL DEL PARTIDO"
                            : fase === "penales" || fase === "mataMata"
                                ? fase === "mataMata"
                                    ? "DEFINICIÓN · MATA-MATA"
                                    : "DEFINICIÓN POR PENALES"
                                : `${minuto}'`}
                    </p>

                    {huboTanda && (
                        <p>
                            Tanda: {golesPenalesLocal} - {golesPenalesVisitante}
                        </p>
                    )}
                </div>

                <div className={styles.equipoCabecera}>
                    <div className={styles.escudo}>⚽</div>
                    <h2>{equipoVisitante.nombre}</h2>
                    <p>{equipoVisitante.formacion}</p>
                </div>
            </header>

            {(fase === "penales" ||
                fase === "mataMata" ||
                (fase === "final" && huboTanda)) && (
                    <section className={styles.panelDefinicionPenales}>
                        <h2>
                            {fase === "mataMata"
                                ? "¡Definición por mata-mata!"
                                : "Definición por penales"}
                        </h2>

                        <p className={styles.resultadoTanda}>
                            {golesPenalesLocal} - {golesPenalesVisitante}
                        </p>

                        {[
                            {
                                nombre: equipoLocal.nombre,
                                penales: penalesLocal,
                            },
                            {
                                nombre: equipoVisitante.nombre,
                                penales: penalesVisitante,
                            },
                        ].map((equipo, indice) => {
                            const cantidadCasilleros = Math.max(
                                5,
                                penalesLocal.length,
                                penalesVisitante.length
                            );

                            return (
                                <div className={styles.filaTandaPenales} key={indice}>
                                    <span className={styles.nombreTandaPenales}>
                                        {equipo.nombre}
                                    </span>

                                    <div className={styles.casillerosTanda}>
                                        {Array.from({ length: cantidadCasilleros }).map(
                                            (_, i) => {
                                                const resultado = equipo.penales[i];

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`${styles.casilleroTanda} ${resultado === true
                                                                ? styles.penalConvertido
                                                                : resultado === false
                                                                    ? styles.penalFallado
                                                                    : ""
                                                            }`}
                                                    >
                                                        {resultado === true
                                                            ? "⚽"
                                                            : resultado === false
                                                                ? "❌"
                                                                : "◯"}
                                                    </div>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </section>
                )}

            <section className={styles.contenido}>
                <div className={styles.alineaciones}>
                    <div className={styles.tituloPanel}>
                        <h3>Alineaciones</h3>
                    </div>

                    <div className={styles.dosEquipos}>
                        {[equipoLocal, equipoVisitante].map((equipo, indice) => {
                            const identificador =
                                indice === 0 ? "local" : "visitante";

                            return (
                                <div
                                    key={identificador}
                                    className={styles.listaEquipo}
                                >
                                    <h4>{equipo.nombre}</h4>

                                    {equipo.jugadores.map((jugador) => (
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

                                            {contarGoles(
                                                jugador,
                                                identificador
                                            ).map((gol, indiceGol) => (
                                                <span
                                                    key={`gol-${indiceGol}`}
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

                                            {tieneAmarilla(
                                                jugador,
                                                identificador
                                            ) && (
                                                    <span title="Tarjeta amarilla">
                                                        🟨
                                                    </span>
                                                )}

                                            <span className={styles.posicion}>
                                                {jugador.posicion}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <aside className={styles.panelEventos}>
                    <div className={styles.tituloPanel}>
                        <h3>Eventos del partido</h3>
                        <span>
                            {fase === "penales" || fase === "mataMata"
                                ? "PEN"
                                : `${minuto}'`}
                        </span>
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
                                    className={`${styles.evento} ${evento.tipo === "gol"
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

                    {fase === "final" && (
                        <div className={styles.final}>
                            <h3>¡Partido finalizado!</h3>

                            <p>
                                Ganó {nombreGanador}
                                {huboTanda
                                    ? ` por penales (${golesPenalesLocal}-${golesPenalesVisitante})`
                                    : ""}
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
