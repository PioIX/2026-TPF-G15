import styles from "@/app/equipo/equipo.module.css";

export default function PosicionJugador ({posicion, personaje, seleccionada, onClick}){
    return (
        <div>
            <button type="button" className={styles.posicion} onClick={onClick} aria-pressed={seleccionada}>
                <strong>{personaje ? personaje.nombre : posicion}</strong>
                <span>{personaje ? "Asignado" : "Asignar"}</span>
            </button>
        </div>
    )
}