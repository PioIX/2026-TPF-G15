"use client";

import {useState} from 'react'; 
import Modo from '@/componentes/Modo';
import EstadisticasTemporada from '@/componentes/EstadisticasTemporada';

export default function InicioPage(){
    const estadisticasUsuario = null; 
    const [modo, setModo] = useState("")
    return (
        <div>
            <h2>Elegi tu desafio</h2>
            <p>Dos universos para armar tu once ideal. Elegi un modo y sali a la cancha.</p>

            <Modo titulo="Modo historia" subtitulo="Proceres Argentinos" descripcion="Un equipo de figuras historicas imaginadas en la cancha"/>
            <Modo titulo="Modo escuela" subtitulo="Profes del Pio IX" descripcion="Un plantel ficticio inspirado en el espiritu del futbol salesiano"/>

            <EstadisticasTemporada estadisticas={{
                puntos: 100, 
                victorias: 3,
                partidasJugadas: 5, 
                ranking: 2,
            }}/> 
        </div>
    )
}

// Las estadisticas del componente EstadisticasTemporada son inventadas. Una vez que el back este terminado crear la variable estadisticasUsuario con su setter y la utilizacion del useState empieza en null. Luego a la hora de utilizar el componente EstadisticasTemporada debera pasar la variable estadisticasUsuario en las llaves. 