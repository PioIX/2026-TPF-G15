"use client"

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

import styles from "./equipo.module.css";

import ConfiguracionEquipo from "@/componentes/ConfiguracionEquipo";
import Cancha from "@/componentes/Cancha";
import BandejaPersonajes from "@/componentes/BandejaPersonajes";

const formacionesIniciales = [
    {
        id_formacion: 1,
        nombre: "4-3-3", 
        cant_defensores: 4,
        cant_mediocampistas: 3,
        cant_delanteros: 3,
    },
    {
        id_formacion: 2, 
        nombre: "4-4-2",
        cant_defensores: 4,
        cant_mediocampistas: 4, 
        cant_delanteros: 2, 
    }, 
    {
        id_formacion: 3,
        nombre: "3-5-2", 
        cant_defensores: 3,
        cant_mediocampistas: 5, 
        cant_delanteros: 2, 
    }
]; 

const posicionesIniciales = [
    {orden: 1, posicion: "ARQ", x: 50, y: 90},
    {orden: 2, posicion: "DEF", x: 17, y: 76},
    {orden: 3, posicion: "DEF", x: 39, y: 79},
    {orden: 4, posicion: "DEF", x: 61, y: 79},
    {orden: 5, posicion: "DEF", x: 83, y: 76},
    {orden: 6, posicion: "MED", x: 26, y: 57},
    {orden: 7, posicion: "MED", x: 50, y: 62},
    {orden: 8, posicion: "MED", x: 74, y: 57},
    {orden: 9, posicion: "DEL", x: 21, y: 30},
    {orden: 10, posicion: "DEL", x: 50, y: 24},
    {orden: 11, posicion: "DEL", x: 79, y: 30},
];

function EquipoContenido(){
    const [id_formacion, setIdFormacion] = useState(1);
    const [estrategia, setEstrategia] = useState("Equilibrada");
    const [tipoPartida, setTipoPartida] = useState("Individual"); 
    const [equipo, setEquipo] = useState({});
    const [ordenSeleccionado, setOrdenSeleccionado] = useState(null);
    const [personajes,setPersonajes] = useState([]);
    const [cargandoPersonajes,setCargandoPersonajes] = useState(true);
    const [errorPersonajes,setErrorPersonajes] = useState(null);

    const searchParams = useSearchParams();

    const id_modo = searchParams.get("id_modo"); 

    useEffect(()=>{
        async function obtenerPersonajes(){
            if (!id_modo){
                setErrorPersonajes("No se selecciono ningun modo");
                setCargandoPersonajes(false);
                setPersonajes([]);
                return;
            }

            try{ 
                setCargandoPersonajes(true);
                setErrorPersonajes(null);

                console.log("Id del modo: ", id_modo);
                console.log("URL: ", `http://localhost:4000/modos/${id_modo}/personajes`)

                const response = await fetch(
                  `http://localhost:4000/modos/${id_modo}/personajes`
                );

                if (!response.ok){
                    throw new Error ("No se pudieron obtener los personajes");
                }

                const data = await response.json();

                console.log("Personajes recibidos", data);

                setPersonajes(data);

            } catch (error){
                console.log("Error al obtener el personaje", error);
                setErrorPersonajes("Ocurrio un error al cargar los personajes");
            } finally {
                setCargandoPersonajes(false);
            }
        }

        obtenerPersonajes();
    }, [id_modo]);

    function seleccionarPersonaje(personaje) {
        if (ordenSeleccionado === null){
            alert("Primero seleccioná una posición en la cancha.");
            return;
        }
    

        const puesto = posicionesIniciales.find(
            (posicion) => posicion.orden=== ordenSeleccionado
        )

        const jugadorAnterior = equipo[ordenSeleccionado]?.personaje;

        setEquipo((actual)=>({
            ...actual, 
            [ordenSeleccionado]: {
                equipo_id: null,
                personaje_id: personaje.id_personaje, 
                posicion: puesto.posicion, 
                orden: puesto.orden,
                personaje,
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

function confirmarEquipo(){
    if (Object.keys(equipo).length !== 11){
        alert ("Debes asignar los 11 jugadores antes de confirmar");
        return;
    }

    alert("Equipo completo. La conexion con el backend esta pendiente"); 
}

return (
    <div className={styles.pagina}>
        <header className={styles.encabezado}>
            <div className={styles.marca}>
                <div className={styles.logo}>AFC</div>

                <div>
                    <h1>Argentina FC</h1>
                    <p>Arma tu equipo</p>
                </div>
            </div>

            <div className={styles.estado}>
                Conectado
            </div>

            <nav className={styles.nav}>
                <Link href="/inicio">Inicio</Link>
                <span className={styles.activo}>
                    Mi equipo
                </span>

                <Link href="/partido">Partido</Link>
                <Link href="/ranking">Rankings</Link>
                <Link href="/perfil">Perfil</Link>
            </nav>
        </header>

        <section className={styles.contenido}>
            <span className={styles.etiqueta}>CENTRO TACTICO</span>

            <h2>Arma tu equipó</h2>

            <p className={styles.introduccion}>
                Desafío: {id_modo === "1" ? "Próceres argentinos" : "Profes del Pío IX"} - Elegí un personaje y luego elegí una posición.
            </p>

            <div className={styles.columnas}>
                <section className={styles.panelEquipo}>
                    <ConfiguracionEquipo 
                        formaciones={formacionesIniciales} 
                        id_formacion={id_formacion} 
                        setIdFormacion={setIdFormacion}
                        estrategia={estrategia}
                        setEstrategia={setEstrategia}
                        tipoPartida={tipoPartida}
                        setTipoPartida={setTipoPartida}
                    />

                    <Cancha 
                        posiciones={posicionesIniciales}
                        equipo={equipo}
                        ordenSeleccionado={ordenSeleccionado}
                        onSeleccionarPosicion={setOrdenSeleccionado}
                    />

                    <div className={styles.confirmacion}>
                        <button onClick={confirmarEquipo}>
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
)
}

export default function EquipoPage(){
    return (
        <div>
            <Suspense fallback={<p>Cargando equipo...</p>}>
                <EquipoContenido/>
            </Suspense>
        </div>
    )
}