
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Modo({ id_modo, titulo, subtitulo, descripcion }) {
    const router = useRouter();
    const [cargando, setCargando] = useState(false);

    async function jugar() {
        if (cargando) return;

        setCargando(true);

        try {
            const respuesta = await fetch(
                `http://localhost:4000/torneo/pendiente/${id_modo}`,
                {
                    credentials: "include"
                }
            );

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.mensaje || "No se pudo consultar el torneo.");
            }

            // Si tiene una partida en curso, volver directamente.
            if (datos.pendiente && datos.accion === "partido") {
                router.push(`/partido?id_partida=${datos.id_partida}`);
                return;
            }

            // Si ganó la instancia anterior, preparar la siguiente.
            if (datos.pendiente && datos.accion === "prepartido") {
                router.push(
                    `/prepartido?tipo=individual&modo=${datos.id_modo}&instancia=${datos.instancia}&id_equipo=${datos.id_equipo}`
                );
                return;
            }

            // Si completó el torneo.
            if (datos.completado) {
                alert("¡Felicitaciones! Completaste el torneo.");
            }

            // Si no tiene un torneo pendiente, elegir equipo.
            router.push(`/equipo?id_modo=${id_modo}`);

        } catch (error) {
            console.error("Error al ingresar al modo:", error);
            alert(error.message || "No se pudo ingresar al modo.");
        } finally {
            setCargando(false);
        }
    }

    return (
        <div>
            <h3>{titulo}</h3>
            <h5>{subtitulo}</h5>
            <p>{descripcion}</p>

            <button onClick={jugar} disabled={cargando}>
                {cargando ? "Cargando..." : "Jugar ahora"}
            </button>
        </div>
    );
}
