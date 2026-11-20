"use client";

import { useEffect, useState } from "react";
import styles from "./inicio.module.css";
import Modo from "@/componentes/Modo";
import EstadisticasTemporada from "@/componentes/EstadisticasTemporada";
import PanelAdmin from "@/componentes/PanelAdmin";
import Link from "next/link";
import Image from "next/image";


export default function InicioPage() {
    const [modo, setModo] = useState("");
    const [panelAbierto, setPanelAbierto] = useState(false);
    const [esAdmin, setEsAdmin] = useState(false);
    const [estadisticas, setEstadisticas] = useState(null);
    const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);

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

    useEffect(() => {
        async function obtenerEstadisticas() {
            console.log("Ejecutando obtenerEstadisticas...");

            try {
                const respuesta = await fetch("http://localhost:4000/estadisticas", {
                    credentials: "include"
                });

                // Si no hay sesión iniciada, simplemente no mostramos estadísticas.
                if (respuesta.status === 401) {
                    setEstadisticas(null);
                    return;
                }

                if (!respuesta.ok) {
                    throw new Error(
                        `El servidor respondió con el estado ${respuesta.status}`
                    );
                }

                const datos = await respuesta.json();

                setEstadisticas(datos);

            } catch (error) {
                console.error("Error al obtener las estadísticas:", error);
            } finally {
                setCargandoEstadisticas(false);
            }
        }

        obtenerEstadisticas();
    }, []);

    return (
        <main className={styles.inicio}>
            <header className={styles["inicio-encabezado-superior"]}>
                <div className={styles["inicio-barra-superior"]}>
                    <div className={styles.marca}>
                        <div className={styles.logo}>
                            <Image
                                src="/logo_argentina_fc.png"
                                alt="Logo de Argentina FC"
                                width={67}
                                height={67}
                                priority
                            />
                        </div>

                        <div>
                            <h1>Argentina FC</h1>
                            <p>Armá tu equipo</p>
                        </div>
                    </div>

                    <div className={styles.estado}>Conectado</div>
                </div>

                <nav className={styles.navbar} aria-label="Navegación principal">
                    <Link href="/inicio" className={`${styles.enlaceNav} ${styles.activo}`}>
                        Inicio
                    </Link>

                    <Link href="/ranking" className={styles.enlaceNav}>
                        Ranking
                    </Link>

                    <Link href="/perfil" className={styles.enlaceNav}>
                        Perfil
                    </Link>
                </nav>
            </header>
            <header className={styles["inicio-encabezado"]}>
                <br />

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
                        id_modo={1}
                        titulo="Modo historia"
                        subtitulo="Próceres argentinos"
                        descripcion="Un equipo de figuras históricas imaginadas en la cancha."
                    />
                </div>

                <div className={`${styles["inicio-modo"]} ${styles["inicio-modo-escuela"]}`}>
                    <Modo
                        id_modo={2}
                        titulo="Modo escuela"
                        subtitulo="Profes del Pío IX"
                        descripcion="Un plantel ficticio inspirado en el espíritu del fútbol salesiano."
                    />
                </div>
            </section>

            <section className={styles["inicio-estadisticas"]}>
                <div className={styles["inicio-estadisticas-encabezado"]}>
                    <h3>Tu temporada </h3>
                </div>
                {cargandoEstadisticas ? (
                    <p>Cargando estadísticas...</p>
                ) : estadisticas ? (
                    <EstadisticasTemporada estadisticas={estadisticas} />
                ) : (
                    <p>No se pudieron cargar las estadísticas.</p>
                )}
            </section>

            <PanelAdmin
                abierto={panelAbierto}
                cerrar={() => setPanelAbierto(false)}
            />
        </main>
    );
}