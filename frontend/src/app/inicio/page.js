"use client";

import {useState} from 'react'; 
import Modo from '@/componentes/Modo';

export default function InicioPage(){
    const [modo, setModo] = useState("")
    return (
        <div>
            <h2>Elegi tu desafio</h2>
            <p>Dos universos para armar tu once ideal. Elegi un modo y sali a la cancha.</p>

            <Modo titulo="Modo historia" subtitulo="Proceres Argentinos" descripcion="Un equipo de figuras historicas imaginadas en la cancha"/>
            <Modo titulo="Modo escuela" subtitulo="Profes del Pio IX" descripcion="Un plantel ficticio inspirado en el espiritu del futbol salesiano"/>
        </div>
    )
}