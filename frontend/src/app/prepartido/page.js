"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useState, useEffect, useRef } from "react";
import styles from "./prepartido.module.css";

const API = "http://localhost:4000";

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
  const instancia = searchParams.get("instancia") || "Octavos";
  const idEquipoParam = searchParams.get("id_equipo");

  const esIndividual = tipo === "individual";
  const esMultijugador = tipo === "multijugador";

  const idModo =
    modo === "1" || modo === "proceres"
      ? 1
      : modo === "2" || modo === "profes"
      ? 2
      : null;

  const nombreModo =
    idModo === 1
      ? "Próceres argentinos"
      : idModo === 2
      ? "Profesores del Pío IX"
      : "Modo de juego";

  const nombreInstancia =
    {
      Octavos: "Octavos de final",
      Cuartos: "Cuartos de final",
      Semifinal: "Semifinal",
      Final: "Final",
    }[instancia] || "Instancia del torneo";

  // Estados del modo individual
  const [cargando, setCargando] = useState(false);
  const [partida, setPartida] = useState(null);
  const [error, setError] = useState("");
  const solicitudIniciada = useRef("");

  // Estados del modo multijugador
  const [idEquipo, setIdEquipo] = useState(null);
  const [cargandoEquipo, setCargandoEquipo] = useState(true);
  const [salas, setSalas] = useState([]);
  const [cargandoSalas, setCargandoSalas] = useState(false);
  const [salaCreada, setSalaCreada] = useState(null);
  const [codigoPrivado, setCodigoPrivado] = useState("");
  const [codigoIngresado, setCodigoIngresado] = useState("");
  const [errorMultijugador, setErrorMultijugador] = useState("");
  const [accionEnCurso, setAccionEnCurso] = useState(false);

  const navegando = useRef(false);

  // =====================================================
  // OBTENER EL EQUIPO DEL USUARIO
  // =====================================================

  useEffect(() => {
    if (!esMultijugador) return;

    try {
      const equipoGuardado = sessionStorage.getItem("equipoPendiente");
      const equipo = equipoGuardado ? JSON.parse(equipoGuardado) : null;

      const id = idEquipoParam ? Number(idEquipoParam) : equipo?.id_equipo;

      if (!id || !Number.isInteger(Number(id))) {
        setErrorMultijugador(
          "No se encontró tu equipo. Volvé a crearlo antes de jugar."
        );
      } else {
        setIdEquipo(Number(id));
      }
    } catch (error) {
      console.error("Error al recuperar el equipo:", error);
      setErrorMultijugador("No se pudieron recuperar los datos de tu equipo.");
    } finally {
      setCargandoEquipo(false);
    }
  }, [esMultijugador, idEquipoParam]);

  // =====================================================
  // MODO INDIVIDUAL: CREAR PARTIDA CONTRA BOT
  // =====================================================

  useEffect(() => {
    const claveSolicitud = [modo, instancia, idEquipoParam || ""].join("|");

    if (!esIndividual || solicitudIniciada.current === claveSolicitud) {
      return;
    }

    solicitudIniciada.current = claveSolicitud;
    setPartida(null);
    setCargando(true);
    setError("");

    async function crearPartida() {
      try {
        const equipoGuardado = sessionStorage.getItem("equipoPendiente");

        const equipo = equipoGuardado ? JSON.parse(equipoGuardado) : null;

        const id = idEquipoParam ? Number(idEquipoParam) : equipo?.id_equipo;

        if (!id || !idModo) {
          throw new Error("Faltan datos del equipo o del modo de juego.");
        }

        const respuesta = await fetch(`${API}/partidas/individual`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            id_equipo: id,
            id_modo: idModo,
            instancia,
          }),
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(datos.mensaje || "No se pudo crear la partida.");
        }

        if (solicitudIniciada.current === claveSolicitud) {
          setPartida(datos);
        }
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
  }, [esIndividual, modo, instancia, idEquipoParam, idModo]);

  // =====================================================
  // CARGAR SALAS PÚBLICAS
  // =====================================================

  async function cargarSalas() {
    setCargandoSalas(true);
    setErrorMultijugador("");

    try {
      const respuesta = await fetch(`${API}/salas/publicas`, {
        credentials: "include",
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudieron cargar las salas.");
      }

      const lista = Array.isArray(datos) ? datos : datos.salas || [];

      // Mostrar solamente las salas del modo seleccionado.
      setSalas(lista.filter((sala) => Number(sala.id_modo) === idModo));
    } catch (error) {
      console.error("Error al cargar salas:", error);
      setErrorMultijugador(error.message);
    } finally {
      setCargandoSalas(false);
    }
  }

  useEffect(() => {
    if (!esMultijugador || !idEquipo || !idModo || salaCreada) {
      return;
    }

    cargarSalas();
  }, [esMultijugador, idEquipo, idModo, salaCreada]);

  // =====================================================
  // CREAR SALA PÚBLICA O PRIVADA
  // =====================================================

  async function crearSala(tipoSala) {
    if (!idEquipo || !idModo) {
      setErrorMultijugador("No se encontraron los datos de tu equipo.");
      return;
    }

    setAccionEnCurso(true);
    setErrorMultijugador("");

    try {
      const respuesta = await fetch(`${API}/salas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id_equipo: idEquipo,
          id_modo: idModo,
          tipo: tipoSala,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo crear la sala.");
      }

      setSalaCreada(datos);

      if (tipoSala === "privada") {
        setCodigoPrivado(datos.codigo);
      }
    } catch (error) {
      console.error("Error al crear sala:", error);
      setErrorMultijugador(error.message);
    } finally {
      setAccionEnCurso(false);
    }
  }

  // =====================================================
  // UNIRSE A UNA SALA PÚBLICA
  // =====================================================

  async function unirseSalaPublica(idSala) {
    if (!idEquipo) return;

    setAccionEnCurso(true);
    setErrorMultijugador("");

    try {
      const respuesta = await fetch(`${API}/salas/${idSala}/unirse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          id_equipo: idEquipo,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo ingresar a la sala.");
      }

      irAPartida(datos.id_partida);
    } catch (error) {
      console.error("Error al unirse a la sala:", error);
      setErrorMultijugador(error.message);
      cargarSalas();
    } finally {
      setAccionEnCurso(false);
    }
  }

  // =====================================================
  // UNIRSE A UNA SALA PRIVADA
  // =====================================================

  async function unirseSalaPrivada() {
    if (!idEquipo || !codigoIngresado.trim()) {
      setErrorMultijugador("Ingresá el código de la sala.");
      return;
    }

    setAccionEnCurso(true);
    setErrorMultijugador("");
    console.log("Datos para unirse a sala privada:", {
      codigo: codigoIngresado.trim().toUpperCase(),
      id_equipo: idEquipo,
      tipoIdEquipo: typeof idEquipo,
    });
    try {
      const respuesta = await fetch(`${API}/salas/privadas/unirse`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          codigo: codigoIngresado.trim().toUpperCase(),
          id_equipo: idEquipo,
        }),
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || "No se pudo ingresar a la sala.");
      }

      irAPartida(datos.id_partida);
    } catch (error) {
      console.error("Error al unirse a la sala privada:", error);
      setErrorMultijugador(error.message);
    } finally {
      setAccionEnCurso(false);
    }
  }

  // =====================================================
  // ESPERAR A QUE SE UNA OTRO JUGADOR
  // =====================================================

  useEffect(() => {
    if (!salaCreada?.id_sala) return;

    let activo = true;

    async function consultarSala() {
      try {
        const respuesta = await fetch(`${API}/salas/${salaCreada.id_sala}`, {
          credentials: "include",
        });

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(datos.mensaje || "No se pudo consultar la sala.");
        }

        if (!activo) return;

        if (datos.estado === "Llena" && datos.id_partida) {
          irAPartida(datos.id_partida);
        }

        if (datos.estado === "Cancelada") {
          setErrorMultijugador("La sala fue cancelada.");
          setSalaCreada(null);
          setCodigoPrivado("");
        }
      } catch (error) {
        if (activo) {
          console.error("Error al consultar la sala:", error);
        }
      }
    }

    consultarSala();

    const intervalo = setInterval(consultarSala, 2000);

    return () => {
      activo = false;
      clearInterval(intervalo);
    };
  }, [salaCreada]);

  // =====================================================
  // NAVEGAR A LA PARTIDA
  // =====================================================

  function irAPartida(idPartida) {
    if (!idPartida || navegando.current) return;

    navegando.current = true;
    router.push(`/partido?id_partida=${idPartida}`);
  }

  function comenzarPartido() {
    if (!partida?.id_partida) return;

    router.push(`/partido?id_partida=${partida.id_partida}`);
  }

  // =====================================================
  // CANCELAR / SALIR
  // =====================================================

  async function cancelar() {
    if (salaCreada?.id_sala) {
      try {
        await fetch(`${API}/salas/${salaCreada.id_sala}`, {
          method: "DELETE",
          credentials: "include",
        });
      } catch (error) {
        console.error("Error al cancelar la sala:", error);
      }
    }

    router.push("/");
  }

  function volverALista() {
    setSalaCreada(null);
    setCodigoPrivado("");
    setErrorMultijugador("");
    cargarSalas();
  }

  // =====================================================
  // VALIDACIÓN DE MODALIDAD
  // =====================================================

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

      {/* =================================================
                MODO INDIVIDUAL
            ================================================= */}

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
            <p>Estamos preparando tu partido y generando al rival...</p>
          )}

          {error && (
            <div>
              <p>{error}</p>
              <button onClick={cancelar}>Volver al inicio</button>
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
                Tu rival fue generado automáticamente con personajes del modo{" "}
                {nombreModo}.
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

      {/* =================================================
                MODO MULTIJUGADOR
            ================================================= */}

      {esMultijugador && (
        <section className={styles.contenido}>
          <h2>Partida multijugador</h2>

          <p className={styles.descripcion}>
            Creá una sala para jugar contra otra persona o unite a una sala que
            ya esté esperando un jugador.
          </p>

          {cargandoEquipo && <p>Cargando tu equipo...</p>}

          {!cargandoEquipo && !idEquipo && (
            <div>
              <p>{errorMultijugador}</p>
              <button onClick={cancelar}>Volver al inicio</button>
            </div>
          )}

          {idEquipo && !salaCreada && (
            <>
              {/* CREAR SALAS */}

              <div style={{ marginBottom: "30px" }}>
                <h3>Crear una sala</h3>

                <p className={styles.aviso}>
                  Elegí si querés que cualquier jugador pueda encontrar tu sala
                  o si preferís compartir un código.
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    gap: "15px",
                    flexWrap: "wrap",
                    marginTop: "20px",
                  }}
                >
                  <button
                    className={styles.botonPrincipal}
                    onClick={() => crearSala("publica")}
                    disabled={accionEnCurso}
                  >
                    Crear sala pública
                  </button>

                  <button
                    className={styles.botonSecundario}
                    onClick={() => crearSala("privada")}
                    disabled={accionEnCurso}
                  >
                    Crear sala privada
                  </button>
                </div>
              </div>

              <hr style={{ margin: "25px 0", opacity: 0.25 }} />

              {/* UNIRSE A SALA PÚBLICA */}

              <div style={{ marginBottom: "30px" }}>
                <h3>Salas públicas disponibles</h3>

                <button
                  className={styles.botonSecundario}
                  onClick={cargarSalas}
                  disabled={cargandoSalas}
                  style={{ marginTop: "10px" }}
                >
                  {cargandoSalas ? "Actualizando..." : "Actualizar salas"}
                </button>

                {cargandoSalas && <p>Buscando salas...</p>}

                {!cargandoSalas && salas.length === 0 && (
                  <p style={{ marginTop: "15px" }}>
                    No hay salas públicas disponibles para este modo.
                  </p>
                )}

                {salas.map((sala) => (
                  <div
                    key={sala.id_sala}
                    style={{
                      border: "1px solid rgba(255,255,255,0.2)",
                      borderRadius: "10px",
                      padding: "15px",
                      marginTop: "15px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "15px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <h4>
                        {sala.nombre_equipo ||
                          sala.equipo_creador ||
                          "Equipo del jugador"}
                      </h4>
                      <p>
                        Creada por:{" "}
                        {sala.nombre_creador || sala.creador || "Jugador"}
                      </p>
                    </div>

                    <button
                      className={styles.botonPrincipal}
                      onClick={() => unirseSalaPublica(sala.id_sala)}
                      disabled={accionEnCurso}
                    >
                      Unirse
                    </button>
                  </div>
                ))}
              </div>

              <hr style={{ margin: "25px 0", opacity: 0.25 }} />

              {/* UNIRSE A SALA PRIVADA */}

              <div>
                <h3>Unirse a una sala privada</h3>

                <p className={styles.aviso}>
                  Ingresá el código que te compartió el otro jugador.
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginTop: "15px",
                  }}
                >
                  <input
                    type="text"
                    value={codigoIngresado}
                    onChange={(e) =>
                      setCodigoIngresado(e.target.value.toUpperCase())
                    }
                    placeholder="Código de sala"
                    maxLength={8}
                    style={{
                      padding: "12px",
                      borderRadius: "8px",
                      border: "1px solid #999",
                      textAlign: "center",
                      textTransform: "uppercase",
                      width: "180px",
                    }}
                  />

                  <button
                    className={styles.botonPrincipal}
                    onClick={unirseSalaPrivada}
                    disabled={accionEnCurso}
                  >
                    Unirse con código
                  </button>
                </div>
              </div>
            </>
          )}

          {/* SALA CREADA: ESPERAR AL SEGUNDO JUGADOR */}

          {salaCreada && (
            <div style={{ marginTop: "25px" }}>
              <h3>
                {salaCreada.tipo === "privada"
                  ? "Sala privada creada"
                  : "Sala pública creada"}
              </h3>

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
                    Esperando jugador...
                  </span>
                </div>
              </div>

              {salaCreada.tipo === "privada" && codigoPrivado && (
                <div style={{ margin: "25px 0" }}>
                  <p>Compartí este código con tu contrincante:</p>
                  <h2
                    style={{
                      letterSpacing: "5px",
                      margin: "12px 0",
                    }}
                  >
                    {codigoPrivado}
                  </h2>
                  <button
                    className={styles.botonSecundario}
                    onClick={() => navigator.clipboard.writeText(codigoPrivado)}
                  >
                    Copiar código
                  </button>
                </div>
              )}

              <p className={styles.aviso}>
                La pantalla se actualizará automáticamente cuando otro jugador
                se una a tu sala.
              </p>

              <button className={styles.botonSecundario} onClick={cancelar}>
                Cancelar sala
              </button>
            </div>
          )}

          {errorMultijugador && (
            <p style={{ marginTop: "20px" }}>{errorMultijugador}</p>
          )}
        </section>
      )}
    </main>
  );
}
