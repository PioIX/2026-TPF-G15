"use client";

import styles from "@/app/equipo/equipo.module.css";

export default function ConfiguracionEquipo ({formaciones, id_formacion, setIdFormacion, estrategia, setEstrategia, tipoPartida, setTipoPartida}){
    return (
        <div className={styles.configuracion}>
            <label>
                Formacion 
                <select value={id_formacion} onChange={(e) => setIdFormacion(Number(e.target.value))}>
                    {formaciones.map((formacion) => (
                        <option key={formacion.id_formacion} value={formacion.id_formacion}>
                            {formacion.nombre}
                        </option>
                    ))}
                </select>
            </label>

            <label>
                Estrategia
                <select value={estrategia} onChange={(e) => setEstrategia(e.target.value)}>
                    <option value="Equilibrada">Equilibrada</option>
                    <option value="Defensiva">Defensiva</option>
                    <option value="Ofensiva">Ofensiva</option>
                </select>
            </label>

            <label>
                Tipo de Partida
                <select value={tipoPartida} onChange={(e) => setTipoPartida(e.target.value)}>
                    <option value="individual">Individual</option>
                    <option value="multijugador">Multijugador</option>
                </select>
            </label>
        </div>
    )
}