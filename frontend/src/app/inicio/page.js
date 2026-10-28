"use client";

import { useEffect, useState } from "react";
import styles from "./inicio.module.css";
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
        <main className={styles.inicio}>
            <header className={styles["inicio-encabezado"]}>
                <span className={styles["inicio-etiqueta"]}>
                    PROTOTIPO · DATOS FICTICIOS
                </span>

                <h2>Elegí tu desafío</h2>

                <p>
                    Dos universos para armar tu once ideal.
                    Elegí un modo y salí a la cancha.
                </p>
            </header>

            {esAdmin && (
                <div className={styles["inicio-admin"]}>
                    <button
                        type="button"
                        onClick={() => setPanelAbierto(true)}
                    >
                        Panel de administración
                    </button>
                </div>
            )}

            <section className={styles["inicio-modos"]}>
                <div className={`${styles["inicio-modo"]} ${styles["inicio-modo-historia"]}`}>
                    <Modo
                        titulo="Modo historia"
                        subtitulo="Próceres argentinos"
                        descripcion="Un equipo de figuras históricas imaginadas en la cancha."
                    />
                </div>

                <div className={`${styles["inicio-modo"]} ${styles["inicio-modo-escuela"]}`}>
                    <Modo
                        titulo="Modo escuela"
                        subtitulo="Profes del Pío IX"
                        descripcion="Un plantel ficticio inspirado en el espíritu del fútbol salesiano."
                    />
                </div>
            </section>

            <section className={styles["inicio-estadisticas"]}>
                <div className={styles["inicio-estadisticas-encabezado"]}>
                    <h3>Tu temporada · ejemplo</h3>
                    <span>Estadísticas de demostración</span>
                </div>

                <EstadisticasTemporada
                    estadisticas={{
                        puntos: 100,
                        victorias: 3,
                        partidasJugadas: 5,
                        ranking: 2
                    }}
                />
            </section>

            <section className={styles["inicio-descripcion"]}>
                <h3>La visión del juego</h3>

                <p>
                    Este prototipo representa acceso de jugadores, juego
                    individual y multijugador, partidos en tiempo real mediante
                    WebSockets, puntaje, ranking, historial, catálogo de
                    personajes y administración. Las funciones conectadas se
                    muestran como demostración visual.
                </p>
            </section>

            <PanelAdmin
                abierto={panelAbierto}
                cerrar={() => setPanelAbierto(false)}
            />
        </main>
    );
}