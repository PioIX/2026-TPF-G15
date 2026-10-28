
"use client";

import { useEffect, useState } from "react";
import Modo from "@/componentes/Modo";
import EstadisticasTemporada from "@/componentes/EstadisticasTemporada";
import PanelAdmin from "@/componentes/PanelAdmin";

export default function InicioPage() {
    const [modo, setModo] = useState("");
    const [panelAbierto, setPanelAbierto] = useState(false);
    const [esAdmin, setEsAdmin] = useState(false);

    useEffect(() => {
        async function comprobarAdmin() {
            try {
                const respuesta = await fetch("http://localhost:4000/usuarios", {
                    credentials: "include"
                });

                setEsAdmin(respuesta.ok);
            } catch (error) {
                console.error("No se pudo comprobar el administrador:", error);
                setEsAdmin(false);
            }
        }

        comprobarAdmin();
    }, []);

    return (
        <div>
            <h2>Elegi tu desafio</h2>
            <p>
                Dos universos para armar tu once ideal.
                Elegi un modo y sali a la cancha.
            </p>

            {esAdmin && (
                <button
                    type="button"
                    onClick={() => setPanelAbierto(true)}
                >
                    Panel de administración
                </button>
            )}

            <Modo
                titulo="Modo historia"
                subtitulo="Proceres Argentinos"
                descripcion="Un equipo de figuras historicas imaginadas en la cancha"
            />

            <Modo
                titulo="Modo escuela"
                subtitulo="Profes del Pio IX"
                descripcion="Un plantel ficticio inspirado en el espiritu del futbol salesiano"
            />

            <EstadisticasTemporada
                estadisticas={{
                    puntos: 100,
                    victorias: 3,
                    partidasJugadas: 5,
                    ranking: 2,
                }}
            />

            <PanelAdmin
                abierto={panelAbierto}
                cerrar={() => setPanelAbierto(false)}
            />
        </div>
    );
}
