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
]


export default function EquipoPage(){
    
}