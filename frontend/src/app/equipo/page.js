
"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

import styles from "./equipo.module.css";

import ConfiguracionEquipo from "@/componentes/ConfiguracionEquipo";
import Cancha from "@/componentes/Cancha";
import BandejaPersonajes from "@/componentes/BandejaPersonajes";

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

    const distribucion = [
        {
            posicion: "DEF",
            cantidad: Number(formacion.cant_defensores),
            y: estrategia === "Defensiva" ? 65 :
                estrategia === "Ofensiva" ? 79 : 76
        },
        {
            posicion: "MED",
            cantidad: Number(formacion.cant_mediocampistas),
            y: estrategia === "Defensiva" ? 43 :
                estrategia === "Ofensiva" ? 57 : 57
        },
        {
            posicion: "DEL",
            cantidad: Number(formacion.cant_delanteros),
            y: estrategia === "Defensiva" ? 23 :
                estrategia === "Ofensiva" ? 17 : 30
        },
    ];

    let orden = 2;

    distribucion.forEach((linea) => {
        for (let i = 0; i < linea.cantidad; i++) {
            const x = ((i + 1) * 100) / (linea.cantidad + 1);

            posiciones.push({
                orden,
                posicion: linea.posicion,
                x,
                y: linea.y
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
    const [ordenSeleccionado, setOrdenSeleccionado] = useState(null);

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
                    `http://localhost:4000/modos/${id_modo}/personajes`
                );

                if (!response.ok) {
                    throw new Error("No se pudieron obtener los personajes.");
                }

                const data = await response.json();

                const listaPersonajes = Array.isArray(data)
                    ? data
                    : data.personajes;

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

                const response = await fetch("http://localhost:4000/formaciones");

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
        setOrdenSeleccionado(null);
        setIdFormacion(nuevoId);
    }

    // Asignar un personaje a la posición seleccionada.
    function seleccionarPersonaje(personaje) {
        if (ordenSeleccionado === null) {
            alert("Primero seleccioná una posición en la cancha.");
            return;
        }

        const puesto = posicionesActuales.find(
            (posicion) => posicion.orden === ordenSeleccionado
        );

        if (!puesto) return;

        const jugadorAnterior = equipo[ordenSeleccionado]?.personaje;

        setEquipo((actual) => ({
            ...actual,
            [ordenSeleccionado]: {
                equipo_id: null,
                personaje_id: personaje.id_personaje,
                posicion: puesto.posicion,
                orden: puesto.orden,
                personaje: personaje,
            },
        }));

        setPersonajes((actuales) => {
            const disponibles = actuales.filter(
                (p) => p.id_personaje !== personaje.id_personaje
            );

            if (jugadorAnterior) {
                disponibles.push(jugadorAnterior);
            }

            return disponibles;
        });

        setOrdenSeleccionado(null);
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
        const respuesta = await fetch("http://localhost:4000/equipos", {
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

        console.log("Equipo creado:", datos);

        // Ir al prepartido
        router.push(`/prepartido?tipo=${tipoPartida}&modo=${id_modo}`);

    } catch (error) {

        console.error("Error al crear el equipo:", error);

        alert("No se pudo conectar con el servidor. Revisá que el backend esté funcionando.");

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

                <div className={styles.estado}>
                    Conectado
                </div>

                <nav className={styles.nav}>
                    <Link href="/inicio">Inicio</Link>
                    <span className={styles.activo}>Mi equipo</span>
                    <Link href="/ranking">Rankings</Link>
                    <Link href="/perfil">Perfil</Link>
                </nav>
            </header>

            <section className={styles.contenido}>
                <span className={styles.etiqueta}>CENTRO TÁCTICO</span>

                <h2>Armá tu equipo</h2>

                <p className={styles.introduccion}>
                    Desafío: {
                        id_modo === "1"
                            ? "Próceres argentinos"
                            : id_modo === "2"
                                ? "Profes del Pío IX"
                                : "Sin modo seleccionado"
                    } - Elegí una posición en la cancha y después asignale un personaje.
                </p>

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
                            ordenSeleccionado={ordenSeleccionado}
                            onSeleccionarPosicion={setOrdenSeleccionado}
                        />

                        <div className={styles.confirmacion}>
                            <button
                                onClick={confirmarEquipo}
                                disabled={
                                    cargandoFormaciones ||
                                    !!errorFormaciones ||
                                    !id_formacion
                                }
                            >
                                Confirmar equipo
                            </button>

                            <span>
                                {Object.keys(equipo).length} de 11 puestos ocupados
                            </span>
                        </div>
                    </section>

                    <BandejaPersonajes
                        personajes={personajes}
                        onSeleccionarPersonaje={seleccionarPersonaje}
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
