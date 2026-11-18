"use client"; 

import {useEffect, useState} from "react"; 
import Link from "next/link";
import styles from "./perfil.module.css";



export default function PerfilPage(){

    const [usuario, setUsuario] = useState(null);
    const [cargando, setCargando] = useState(true); 

    //Obtener los datos del usuario que inicio sesion
    useEffect (()=> {
        const usuarioGuardado =  localStorage.getItem("usuario");

        if (usuarioGuardado) {
            try {
                const datos = JSON.parse(usuarioGuardado);
                setUsuario(datos);
            } catch (error){
                console.error("Error al obtener el usuario", error); 
            }
        }

        setCargando(false);
    }, []);

    if (cargando) {
        return <p>Cargando perfil...</p>
    }

    if (!usuario) {
        return (
            <div> 
                <h2>No hay una sesion iniciada</h2>
                <Link href="/login" className="btn btn-primary">
                    Iniciar sesion
                </Link>
            </div>
        )
    }

    // Obtener las estadisticas del usuario
    const estadisticas = usuario.estadisticas ? usuario.estadisticas : usuario;

    const rango = estadisticas.rango ? estadisticas.rango : "Sin rango"; 
    const puntos = Number(estadisticas.puntos) ? Number(estadisticas.puntos) : 0;
    const victorias = Number(estadisticas.victorias) ? Number(estadisticas.victorias) : 0;
    const derrotas = Number(estadisticas.derrotas) ? Number(estadisticas.derrotas) : 0;
    const empates = Number(estadisticas.empates) ? Number(estadisticas.empates) : 0;
    const posicion = estadisticas.posicion !== null && estadisticas.posicion !== undefined ? estadisticas.posicion : "Sin posicion"; 
    const siguienteRango = Number(estadisticas.puntosSiguienteRango) ? Number(estadisticas.puntosSiguienteRango) : 0;
    const historial = usuario.historialPartidas ? usuario.historialPartidas : [];
         

    return (
        <main className={styles.pagina}>
            <nav
                className={styles.navbar}
                aria-label="Navegación principal"
            >
                <Link href="/inicio" className={styles.enlaceNav}>
                    Inicio
                </Link>

                <Link href="/equipo" className={styles.enlaceNav}>
                    Mi equipo
                </Link>

                <Link href="/partido" className={styles.enlaceNav}>
                    Partidas
                </Link>

                <Link
                    href="/ranking"
                    className={`${styles.enlaceNav} ${styles.activo}`}
                >
                    Ranking
                </Link>

                <Link href="/perfil" className={styles.enlaceNav}>
                    Perfil
                </Link>
            </nav>

            <section className={styles.contenido}>
                <div className={styles.etiqueta}>
                        PERFIL
                </div>

                <header className={styles.encabezado}>
                    <div>
                        <h1>Tu perfil</h1>
                    </div>
                </header>
            </section>

            {/*Estadisticas principales*/}
            <div className="row g-3">
                <div className="cold md-6">
                    <div className={styles.tarjeta}>
                        <h5>Temporada actual</h5>
                    </div>
                </div>
            </div>
        </main>
    )
}