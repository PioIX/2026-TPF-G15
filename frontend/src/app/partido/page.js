
"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { io } from "socket.io-client";
import styles from "./partido.module.css";

export default function PartidoPage() {
    return (
        <Suspense fallback={<p>Cargando partido...</p>}>
            <PartidoContenido />
        </Suspense>
    );
}

function PartidoContenido() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const idPartida = searchParams.get("id_partida");

    const [tipoPartida, setTipoPartida] = useState(null);
    const [instanciaPartida, setInstanciaPartida] = useState("");
    const [idModo, setIdModo] = useState(null);

    const [equipoLocal, setEquipoLocal] = useState(null);
    const [equipoVisitante, setEquipoVisitante] = useState(null);


    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState("");

    const [minuto, setMinuto] = useState(0);
    const [golesLocal, setGolesLocal] = useState(0);
    const [golesVisitante, setGolesVisitante] = useState(0);
    const [eventos, setEventos] = useState([]);
    const [goleadores, setGoleadores] = useState([]);
    const [amonestados, setAmonestados] = useState([]);

    const [fase, setFase] = useState("partido");
    const [ganador, setGanador] = useState("");

    const [penalesLocal, setPenalesLocal] = useState([]);
    const [penalesVisitante, setPenalesVisitante] = useState([]);

    // Referencia para consultar la fase actual desde Socket.IO.
    const faseActual = useRef("partido");

    const golesPenalesLocal = penalesLocal.filter(Boolean).length;
    const golesPenalesVisitante = penalesVisitante.filter(Boolean).length;

    const huboTanda =
        penalesLocal.length > 0 || penalesVisitante.length > 0;

    useEffect(() => {
        faseActual.current = fase;
    }, [fase]);

    // Carga los datos, recupera eventos y conecta Socket.IO.
    useEffect(() => {
        let socket;
        let componenteActivo = true;

        async function cargarPartido() {
            if (!idPartida) {
                setError("No se recibió el identificador de la partida.");
                setCargando(false);
                return;
            }

            try {
                // 1. Obtener la partida y los equipos.
                const respuesta = await fetch(
                    `http://localhost:4000/partidas/${idPartida}`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                const datos = await respuesta.json();

                if (!respuesta.ok) {
                    throw new Error(
                        datos.mensaje || "No se pudo cargar la partida."
                    );
                }

                if (!componenteActivo) return;

                setEquipoLocal(datos.equipo_local);
                setEquipoVisitante(datos.equipo_visitante);
                setTipoPartida(Number(datos.tipo));
                setInstanciaPartida(datos.instancia);
                setIdModo(Number(datos.id_modo));

                setGolesLocal(Number(datos.goles_local) || 0);
                setGolesVisitante(Number(datos.goles_visitante) || 0);

                // 2. Obtener los eventos que ya están guardados.
                const respuestaEventos = await fetch(
                    `http://localhost:4000/partidas/${idPartida}/eventos`,
                    {
                        method: "GET",
                        credentials: "include",
                    }
                );

                const datosEventos = await respuestaEventos.json();

                if (!respuestaEventos.ok) {
                    throw new Error(
                        datosEventos.mensaje ||
                        "No se pudieron recuperar los eventos."
                    );
                }

                if (!componenteActivo) return;

                // Identifica al jugador mencionado en la descripción.
                function buscarJugador(descripcion) {
                    const jugadores = [
                        ...datos.equipo_local.jugadores.map(jugador => ({
                            ...jugador,
                            equipo: "local",
                        })),
                        ...datos.equipo_visitante.jugadores.map(jugador => ({
                            ...jugador,
                            equipo: "visitante",
                        })),
                    ];

                    return jugadores.find(jugador =>
                        descripcion.includes(jugador.nombre)
                    ) || null;
                }

                // Convierte los eventos de MySQL al formato de la pantalla.
                function convertirEvento(evento) {
                    const descripcion = evento.descripcion || "";
                    const tipoBD = evento.tipo_evento;

                    let tipo = "ataque";
                    let tipoGol = "normal";

                    if (tipoBD.startsWith("GOL")) {
                        tipo = "gol";

                        if (tipoBD === "GOL_PENAL") {
                            tipoGol = "penal";
                        } else if (
                            tipoBD === "GOL_TIRO_LIBRE" ||
                            tipoBD === "GOL_TIROLIBRE_CABEZA"
                        ) {
                            tipoGol = "tiroLibre";
                        }
                    } else if (tipoBD === "TARJETA") {
                        tipo = "tarjeta";
                    } else if (tipoBD === "CORNER") {
                        tipo = "corner";
                    } else if (tipoBD === "TIRO_LIBRE") {
                        tipo = "tiroLibre";
                    } else if (tipoBD === "PENAL_FALLADO") {
                        tipo = "penal";
                    }

                    const jugador = buscarJugador(descripcion);

                    let nombreEquipo = evento.equipo || null;

                    if (!nombreEquipo && jugador) {
                        nombreEquipo =
                            jugador.equipo === "local"
                                ? datos.equipo_local.nombre
                                : datos.equipo_visitante.nombre;
                    }

                    if (!nombreEquipo) {
                        if (descripcion.includes(datos.equipo_local.nombre)) {
                            nombreEquipo = datos.equipo_local.nombre;
                        } else if (
                            descripcion.includes(datos.equipo_visitante.nombre)
                        ) {
                            nombreEquipo = datos.equipo_visitante.nombre;
                        }
                    }

                    return {
                        id_evento: evento.id_evento,
                        minuto: Number(evento.minuto),
                        tipo,
                        tipoGol,
                        tipo_evento: tipoBD,
                        descripcion,
                        nombreEquipo,
                        jugador,
                    };
                }

                const eventosRecuperados = datosEventos
                    .map(convertirEvento)
                    .sort((a, b) => a.minuto - b.minuto);

                setEventos([...eventosRecuperados].reverse());

                if (eventosRecuperados.length > 0) {
                    setMinuto(
                        Math.max(
                            ...eventosRecuperados.map(evento => evento.minuto)
                        )
                    );
                }

                // Recuperar goleadores.
                setGoleadores(
                    eventosRecuperados
                        .filter(evento =>
                            evento.tipo === "gol" && evento.jugador
                        )
                        .map(evento => ({
                            nombre: evento.jugador.nombre,
                            numero: evento.jugador.numero,
                            equipo: evento.jugador.equipo,
                            tipo: evento.tipoGol,
                        }))
                );

                // Recuperar tarjetas.
                setAmonestados(
                    eventosRecuperados
                        .filter(evento =>
                            evento.tipo === "tarjeta" && evento.jugador
                        )
                        .map(evento => ({
                            nombre: evento.jugador.nombre,
                            numero: evento.jugador.numero,
                            equipo: evento.jugador.equipo,
                        }))
                );

                // Si la partida ya terminó, mostrar el resultado.
                if (datos.estado === "Finalizada") {
                    setFase("final");

                    if (datos.ganador_penales) {
                        setGanador(datos.ganador_penales);
                    } else {
                        setGanador(
                            Number(datos.goles_local) >
                                Number(datos.goles_visitante)
                                ? "local"
                                : "visitante"
                        );
                    }
                }

                // 3. Conectarse a Socket.IO.
                socket = io("http://localhost:4000", {
                    withCredentials: true,
                });

                socket.on("connect", () => {
                    socket.emit("unirsePartida", {
                        id_partida: Number(idPartida),
                    });
                });

                socket.on("connect_error", error => {
                    console.error("Error de conexión Socket.IO:", error);
                    setError("No se pudo conectar con el servidor del partido.");
                });

                // El backend confirma que ingresamos a la sala.
                socket.on("partidaConectada", async () => {
                    // Solo iniciamos si todavía está en curso.
                    if (datos.estado === "En curso") {
                        try {
                            const respuestaSimulacion = await fetch(
                                `http://localhost:4000/partidas/${idPartida}/simular`,
                                {
                                    method: "POST",
                                    credentials: "include",
                                }
                            );

                            const resultado = await respuestaSimulacion.json();

                            // Un 409 puede significar que otro cliente
                            // ya inició la simulación.
                            if (
                                !respuestaSimulacion.ok &&
                                respuestaSimulacion.status !== 409
                            ) {
                                throw new Error(
                                    resultado.mensaje ||
                                    "No se pudo iniciar el partido."
                                );
                            }
                        } catch (error) {
                            console.error(
                                "Error al iniciar la simulación:",
                                error
                            );

                            setError(error.message);
                        }
                    }
                });

                // 4. Recibir eventos nuevos.
                socket.on("nuevoEvento", evento => {
                    const eventoConvertido = convertirEvento(evento);

                    setEventos(anteriores => [
                        eventoConvertido,
                        ...anteriores,
                    ]);

                    // Goleadores.
                    if (
                        eventoConvertido.tipo === "gol" &&
                        eventoConvertido.jugador
                    ) {
                        setGoleadores(anteriores => [
                            ...anteriores,
                            {
                                nombre: eventoConvertido.jugador.nombre,
                                numero: eventoConvertido.jugador.numero,
                                equipo: eventoConvertido.jugador.equipo,
                                tipo: eventoConvertido.tipoGol,
                            },
                        ]);
                    }

                    // Tarjetas amarillas.
                    if (
                        eventoConvertido.tipo === "tarjeta" &&
                        eventoConvertido.jugador
                    ) {
                        setAmonestados(anteriores => {
                            const yaTieneAmarilla = anteriores.some(a =>
                                a.nombre === eventoConvertido.jugador.nombre &&
                                a.equipo === eventoConvertido.jugador.equipo
                            );

                            if (yaTieneAmarilla) return anteriores;

                            return [
                                ...anteriores,
                                {
                                    nombre: eventoConvertido.jugador.nombre,
                                    numero: eventoConvertido.jugador.numero,
                                    equipo: eventoConvertido.jugador.equipo,
                                },
                            ];
                        });
                    }

                    // Penales de la tanda.
                    if (
                        (faseActual.current === "penales" ||
                            faseActual.current === "mataMata") &&
                        (
                            evento.tipo_evento === "GOL_PENAL" ||
                            evento.tipo_evento === "PENAL_FALLADO"
                        )
                    ) {
                        const convertido =
                            evento.tipo_evento === "GOL_PENAL";

                        if (evento.equipo === datos.equipo_local.nombre) {
                            setPenalesLocal(anteriores => [
                                ...anteriores,
                                convertido,
                            ]);
                        } else if (
                            evento.equipo === datos.equipo_visitante.nombre
                        ) {
                            setPenalesVisitante(anteriores => [
                                ...anteriores,
                                convertido,
                            ]);
                        }
                    }
                });

                // 5. Recibir el avance del reloj y el marcador.
                socket.on("actualizacionPartido", actualizacion => {
                    if (actualizacion.minuto !== undefined) {
                        setMinuto(actualizacion.minuto);
                    }

                    if (actualizacion.goles_local !== undefined) {
                        setGolesLocal(actualizacion.goles_local);
                    }

                    if (actualizacion.goles_visitante !== undefined) {
                        setGolesVisitante(actualizacion.goles_visitante);
                    }
                });

                // Comienza la tanda.
                socket.on("inicioPenales", () => {
                    setFase("penales");
                });

                // La partida terminó.
                socket.on("partidoFinalizado", resultado => {
                    setGolesLocal(resultado.goles_local);
                    setGolesVisitante(resultado.goles_visitante);

                    if (resultado.ganador_penales) {
                        setGanador(resultado.ganador_penales);
                    } else {
                        setGanador(
                            resultado.goles_local > resultado.goles_visitante
                                ? "local"
                                : "visitante"
                        );
                    }

                    setFase("final");
                });

                socket.on("errorPartida", datosError => {
                    console.error(datosError.mensaje);
                    setError(datosError.mensaje);
                });

            } catch (error) {
                console.error("Error al cargar la partida:", error);

                if (componenteActivo) {
                    setError(error.message);
                }
            } finally {
                if (componenteActivo) {
                    setCargando(false);
                }
            }
        }

        cargarPartido();

        return () => {
            componenteActivo = false;

            if (socket) {
                socket.disconnect();
            }
        };
    }, [idPartida]);

    // Cuenta los goles de cada jugador.
    function contarGoles(jugador, equipo) {
        return goleadores.filter(
            gol =>
                gol.nombre === jugador.nombre &&
                gol.numero === jugador.numero &&
                gol.equipo === equipo
        );
    }

    // Comprueba si el jugador recibió una amarilla.
    function tieneAmarilla(jugador, equipo) {
        return amonestados.some(
            amonestado =>
                amonestado.nombre === jugador.nombre &&
                amonestado.numero === jugador.numero &&
                amonestado.equipo === equipo
        );
    }

    // Mientras se consultan los datos de MySQL.
    if (cargando) {
        return (
            <main className={styles.pagina}>
                <p>Cargando partido...</p>
            </main>
        );
    }

    // Si ocurrió un error.
    if (error) {
        return (
            <main className={styles.pagina}>
                <h2>No se pudo cargar el partido</h2>
                <p>{error}</p>
            </main>
        );
    }

    // Evita mostrar la página si no llegaron los equipos.
    if (!equipoLocal || !equipoVisitante) {
        return (
            <main className={styles.pagina}>
                <p>No se encontraron los equipos de esta partida.</p>
            </main>
        );
    }

    const nombreGanador =
        ganador === "local"
            ? equipoLocal.nombre
            : equipoVisitante.nombre;

    const siguienteInstancia = {
        Octavos: "Cuartos",
        Cuartos: "Semifinal",
        Semifinal: "Final"
    }[instanciaPartida];

function continuarTorneo() {
    console.log("Siguiente instancia:", siguienteInstancia);
    console.log("Equipo local:", equipoLocal);
    console.log("ID equipo:", equipoLocal?.id_equipo);
    console.log("ID modo:", idModo);

    if (!siguienteInstancia) {
        alert("No se encontró la siguiente instancia.");
        return;
    }

    if (!equipoLocal?.id_equipo) {
        alert("No se encontró el ID del equipo.");
        return;
    }

    if (!idModo) {
        alert("No se encontró el ID del modo.");
        return;
    }

    router.push(
        `/prepartido?tipo=individual&modo=${idModo}&instancia=${siguienteInstancia}&id_equipo=${equipoLocal.id_equipo}`
    );
}

    function volverAlInicio() {
        router.push("/inicio");
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
                                <div
                                    className={styles.filaTandaPenales}
                                    key={indice}
                                >
                                    <span className={styles.nombreTandaPenales}>
                                        {equipo.nombre}
                                    </span>

                                    <div className={styles.casillerosTanda}>
                                        {Array.from({
                                            length: cantidadCasilleros,
                                        }).map((_, i) => {
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
                                        })}
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
                        {[equipoLocal, equipoVisitante].map(
                            (equipo, indice) => {
                                const identificador =
                                    indice === 0 ? "local" : "visitante";

                                return (
                                    <div
                                        key={identificador}
                                        className={styles.listaEquipo}
                                    >
                                        <h4>{equipo.nombre}</h4>

                                        {equipo.jugadores.map(jugador => (
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
                            }
                        )}
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
                                    key={
                                        evento.id_evento ||
                                        `${evento.minuto}-${indice}`
                                    }
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

                            {tipoPartida === 0 && (
                                <>
                                    {ganador === "local" && siguienteInstancia && (
                                        <>
                                            <h3>¡Felicitaciones! Clasificaste.</h3>

                                            <p>
                                                Tu próximo desafío será:
                                                {" "}{siguienteInstancia}.
                                            </p>

                                            <button
                                                className={styles.botonFinal}
                                                onClick={continuarTorneo}
                                            >
                                                Continuar torneo
                                            </button>
                                        </>
                                    )}

                                    {ganador !== "local" && (
                                        <>
                                            <h3>¡Fin del torneo!</h3>

                                            <p>
                                                Tu equipo quedó eliminado.
                                                ¡Volvé a intentarlo!
                                            </p>

                                            <button
                                                className={styles.botonFinal}
                                                onClick={volverAlInicio}
                                            >
                                                Volver al inicio
                                            </button>
                                        </>
                                    )}

                                    {ganador === "local" && instanciaPartida === "Final" && (
                                        <>
                                            <h3>¡Sos el campeón de Argentina FC!</h3>

                                            <button
                                                className={styles.botonFinal}
                                                onClick={volverAlInicio}
                                            >
                                                Volver al inicio
                                            </button>
                                        </>
                                    )}
                                </>
                            )}

                            {tipoPartida === 1 && (
                                <button
                                    className={styles.botonFinal}
                                    onClick={volverAlInicio}
                                >
                                    Volver al inicio
                                </button>
                            )}
                        </div>
                    )}
                </aside>
            </section>
        </main>
    );
}
