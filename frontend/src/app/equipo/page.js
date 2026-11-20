"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";


import styles from "./equipo.module.css";

import ConfiguracionEquipo from "@/componentes/ConfiguracionEquipo";
import Cancha from "@/componentes/Cancha";
import BandejaPersonajes from "@/componentes/BandejaPersonajes";
import { API } from "../page";

function generarPosiciones(formacion, estrategia) {
  if (!formacion) return [];

  const posiciones = [];

  // El arquero siempre ocupa la primera posición.
  posiciones.push({
    orden: 1,
    posicion: "ARQ",
    x: 50,
    y: 90,
  });

  // Cada estrategia modifica la altura de las líneas.
  const distribuciones = {
    Defensiva: {
      DEF: 80,
      MED: 65,
      DEL: 43,
    },
    Equilibrada: {
      DEF: 72,
      MED: 50,
      DEL: 29,
    },
    Ofensiva: {
      DEF: 62,
      MED: 39,
      DEL: 17,
    },
  };

  const distribucionElegida =
    distribuciones[estrategia] || distribuciones.Equilibrada;

  const lineas = [
    {
      posicion: "DEF",
      cantidad: Number(formacion.cant_defensores),
    },
    {
      posicion: "MED",
      cantidad: Number(formacion.cant_mediocampistas),
    },
    {
      posicion: "DEL",
      cantidad: Number(formacion.cant_delanteros),
    },
  ];

  let orden = 2;

  lineas.forEach((linea) => {
    for (let i = 0; i < linea.cantidad; i++) {
      const x = ((i + 1) * 100) / (linea.cantidad + 1);

      posiciones.push({
        orden,
        posicion: linea.posicion,
        x,
        y: distribucionElegida[linea.posicion],
      });

      orden++;
    }
  });

  return posiciones;
}

function EquipoContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const id_modo = searchParams.get("id_modo");

  const [id_formacion, setIdFormacion] = useState("");
  const [estrategia, setEstrategia] = useState("Equilibrada");
  const [tipoPartida, setTipoPartida] = useState("individual");

const [equipo, setEquipo] = useState({});
const [personajeSeleccionado, setPersonajeSeleccionado] = useState(null);

  const [personajes, setPersonajes] = useState([]);
  const [cargandoPersonajes, setCargandoPersonajes] = useState(true);
  const [errorPersonajes, setErrorPersonajes] = useState(null);

  const [formaciones, setFormaciones] = useState([]);
  const [cargandoFormaciones, setCargandoFormaciones] = useState(true);
  const [errorFormaciones, setErrorFormaciones] = useState(null);

  // Buscamos la formación elegida.
  const formacionSeleccionada = formaciones.find(
    (formacion) => Number(formacion.id_formacion) === Number(id_formacion)
  );

  // Generamos las posiciones según la formación y estrategia.
  const posicionesActuales = generarPosiciones(
    formacionSeleccionada,
    estrategia
  );

  // Cargar personajes del modo seleccionado.
  useEffect(() => {
    async function obtenerPersonajes() {
      if (!id_modo) {
        setErrorPersonajes("No se seleccionó ningún modo.");
        setCargandoPersonajes(false);
        setPersonajes([]);
        return;
      }

      try {
        setCargandoPersonajes(true);
        setErrorPersonajes(null);

        const response = await fetch(
          `${API}/modos/${id_modo}/personajes`
        );

        if (!response.ok) {
          throw new Error("No se pudieron obtener los personajes.");
        }

        const data = await response.json();

        const listaPersonajes = Array.isArray(data) ? data : data.personajes;

        if (!Array.isArray(listaPersonajes)) {
          throw new Error("El servidor devolvió un formato inesperado.");
        }

        setPersonajes(listaPersonajes);
      } catch (error) {
        console.error("Error al obtener personajes:", error);
        setErrorPersonajes(error.message);
      } finally {
        setCargandoPersonajes(false);
      }
    }

    obtenerPersonajes();
  }, [id_modo]);

  // Cargar formaciones desde la base de datos.
  useEffect(() => {
    async function obtenerFormaciones() {
      try {
        setCargandoFormaciones(true);
        setErrorFormaciones(null);

        const response = await fetch(`${API}/formaciones`);

        if (!response.ok) {
          throw new Error("No se pudieron obtener las formaciones.");
        }

        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
          throw new Error("No hay formaciones cargadas en la base de datos.");
        }

        setFormaciones(data);

        // Seleccionamos automáticamente la primera formación.
        setIdFormacion(data[0].id_formacion);
      } catch (error) {
        console.error("Error al obtener las formaciones:", error);
        setErrorFormaciones(error.message);
      } finally {
        setCargandoFormaciones(false);
      }
    }

    obtenerFormaciones();
  }, []);

  // Cambiar de formación y liberar los jugadores asignados.
  function cambiarFormacion(nuevoId) {
    const personajesAsignados = Object.values(equipo).map(
      (puesto) => puesto.personaje
    );

    setPersonajes((actuales) => {
      const idsActuales = actuales.map((p) => p.id_personaje);

      const personajesNuevos = personajesAsignados.filter(
        (p) => !idsActuales.includes(p.id_personaje)
      );

      return [...actuales, ...personajesNuevos];
    });

    setEquipo({});
  setPersonajeSeleccionado(null);
    setIdFormacion(nuevoId);
  }

  // Asignar un personaje a la posición seleccionada.
  function seleccionarPersonaje(personaje) {
    setPersonajeSeleccionado((actual) =>{
      if (actual?.id_personaje === personaje.id_personaje) { //compara el personaje ya seleccionado con el que se quiere seleccionar
        return null; // Deselecciona si es el mismo personaje
      }
      return personaje; // Selecciona el nuevo personaje
    });
  }
  function asignarPersonaje(posicion) {
    if (!personajeSeleccionado) { //comprueba si no hay un personaje seleccionado antes de asignarlo a una posición
      alert("Primero seleccioná un personaje de la bandeja.");
      return; 
    }

    const puesto = posicionesActuales.find(
      (p) => p.orden === posicion
    ); 

    if(!puesto) return;

    const jugadorAnterior = equipo[posicion]?.personaje;

    setEquipo((actual) => ({
      ...actual,
      [posicion]: {
        equipo_id: null,
        personaje_id: personajeSeleccionado.id_personaje,
        posicion: puesto.posicion,
        orden: puesto.orden,
        personaje: personajeSeleccionado,
      },
   }));

  setPersonajes((actuales) => {
      const disponibles = actuales.filter(
        (p) => p.id_personaje !== personajeSeleccionado.id_personaje
      );

      if (jugadorAnterior) {
        disponibles.push(jugadorAnterior);
      }

      return disponibles;
    });

    setPersonajeSeleccionado(null);
  }

  // Confirmar y continuar al prepartido.
  async function confirmarEquipo() {
    if (Object.keys(equipo).length !== 11) {
      alert("Tenés que completar los 11 puestos antes de continuar");
      return;
    }

    const equipoPreparado = {
      id_modo: Number(id_modo),
      id_formacion: Number(id_formacion),
      estrategia,
      tipoPartida,
      personajes: Object.values(equipo).map((puesto) => ({
        personaje_id: puesto.personaje_id,
        posicion: puesto.posicion,
        orden: puesto.orden,
      })),
    };

    try {
      // Enviar el equipo al backend
      const respuesta = await fetch(`${API}/equipos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(equipoPreparado),
      });

      const datos = await respuesta.json();

      // Comprobar si el backend respondió correctamente
      if (!respuesta.ok) {
        alert(datos.mensaje || "No se pudo crear el equipo");
        return;
      }

      // Guardar los datos para la página de prepartido
      sessionStorage.setItem(
        "equipoPendiente",
        JSON.stringify({
          ...equipoPreparado,
          id_equipo: datos.id_equipo,
        })
      );

      sessionStorage.setItem("tipoPartida", tipoPartida);

      console.log("Equipo creado:", datos);

      // Ir al prepartido
      router.push(`/prepartido?tipo=${tipoPartida}&modo=${id_modo}`);
    } catch (error) {
      console.error("Error al crear el equipo:", error);

      alert(
        "No se pudo conectar con el servidor. Revisá que el backend esté funcionando."
      );
    }
  }

  return (
    <div className={styles.pagina}>
      <header className={styles.encabezado}>
        <div className={styles.marca}>
          <div className={styles.logo}>AFC</div>

          <div>
            <h1>Argentina FC</h1>
            <p>Armá tu equipo</p>
          </div>
        </div>

        <div className={styles.estado}>Conectado</div>

        <nav className={styles.nav}>
          <Link href="/inicio">Inicio</Link>
          <Link href="/equipo" className={styles.activo}>
            Mi equipo
          </Link>
          <Link href="/ranking">Rankings</Link>
          <Link href="/perfil">Perfil</Link>
        </nav>
      </header>

      <section className={styles.contenido}>
        <span className={styles.etiqueta}>CENTRO TÁCTICO</span>

        <h2>Armá tu equipo</h2>

        <p className={styles.introduccion}>
          Desafío:{" "}
          {id_modo === "1"
            ? "Próceres argentinos"
            : id_modo === "2"
              ? "Profes del Pío IX"
              : "Sin modo seleccionado"}{" "}
          - Elegí un personaje y luego asignalo a una posición en la cancha.
        </p>
        <div className={styles.avisoPosiciones}>
          <span className={styles.iconoAviso}>ⓘ</span>

          <div>
            <strong>Posiciones recomendadas</strong>
            <p>
              Cada personaje tiene una posición natural en la que aprovecha mejor
              sus habilidades. Podés ubicarlo en cualquier otra posición, pero
              su rendimiento podría disminuir.
            </p>
          </div>
        </div>

        <div className={styles.columnas}>
          <section className={styles.panelEquipo}>
            {cargandoFormaciones ? (
              <p>Cargando formaciones...</p>
            ) : errorFormaciones ? (
              <p>{errorFormaciones}</p>
            ) : (
              <ConfiguracionEquipo
                formaciones={formaciones}
                id_formacion={id_formacion}
                setIdFormacion={cambiarFormacion}
                estrategia={estrategia}
                setEstrategia={setEstrategia}
                tipoPartida={tipoPartida}
                setTipoPartida={setTipoPartida}
              />
            )}

            <Cancha
              posiciones={posicionesActuales}
              equipo={equipo}
              onSeleccionarPosicion={asignarPersonaje}
            />

            <div className={styles.confirmacion}>
              <button
                onClick={confirmarEquipo}
                disabled={
                  cargandoFormaciones || !!errorFormaciones || !id_formacion
                }
              >
                Confirmar equipo
              </button>

              <span>{Object.keys(equipo).length} de 11 puestos ocupados</span>
            </div>
          </section>

          <BandejaPersonajes
            personajes={personajes}
            onSeleccionarPersonaje={seleccionarPersonaje}
            personajeSeleccionado={personajeSeleccionado}
            cargando={cargandoPersonajes}
            error={errorPersonajes}
          />
        </div>
      </section>
    </div>
  );
}

export default function EquipoPage() {
  return (
    <Suspense fallback={<p>Cargando equipo...</p>}>
      <EquipoContenido />
    </Suspense>
  );
}
