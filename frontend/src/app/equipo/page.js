"use client"

import { useState } from "react";
import Link from "next/link";

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
const personajesIniciales=[
    {   
        id_personaje: 1,
        modo_id: 1,
        nombre: "Capitán del Río",
        descripcion: "Arquero del equipo",
        posicion_natural: "ARQ",
        ataque: 30,
        defensa: 91,
        velocidad: 65,
        habilidad: 84,
    },
    {
        id_personaje: 2,
        modo_id: 1,
        nombre: "Defensor Feroz",
        descripcion: "Defensor imbatible",
        posicion_natural: "DEF",
        ataque: 40,
        defensa: 85,
        velocidad: 60,
        habilidad: 75,
    },
    {
        id_personaje: 3,
        modo_id: 1,
        nombre: "Delantero Letal",
        descripcion: "Goleador nato",
        posicion_natural: "DEL",
        ataque: 90,
        defensa: 50,
        velocidad: 80,
        habilidad: 70,
    },
    {
        id_personaje: 4,
        modo_id: 1,
        nombre: "General del Sur",
        descripcion: "Delantero del equipo",
        posicion_natural: "DEL",
        ataque: 92,
        defensa: 46,
        velocidad: 85,
        habilidad: 83,
    }
];

export default function EquipoPage(){
    const [id_formacion, setIdFormacion] = useState(1);
    const [estrategia, setEstrategia] = useState("Equilibrada");
    const [tipoPartida, setTipoPartida] = useState("Individual"); 
    const [equipo, setEquipo] = useState({});
    const [personajes, setPersonajes] = useState(personajesIniciales);
    const [ordenSeleccionado, setOrdenSeleccionado] = useState(null);

    const formacion_seleccionada = formacionesIniciales.find(
        (formacion) =>formacion.id_formacion === id_formacion  
    )

    function seleccionarPersonaje(personaje) {
        if (ordenSeleccionado === null){
            alert("Primero seleccioná una posición en la cancha.");
            return;
        }
    

    const puesto = posicionesIniciales.find(
        (posicion) => posicion.orden=== ordenSeleccionado
    )

    if(puesto.posicion !== personaje.posicion_natural){
        alert(
            'Este personaje juega como ${personaje.posicion_natural}.'
        );
        return;
    }   
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
    <div>
        
    </div>
)

}