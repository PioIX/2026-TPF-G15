
import styles from "@/app/equipo/equipo.module.css";

const nombresPosicion = {
    Arquero: "ARQ",
    Defensor: "DEF",
    Mediocampista: "MED",
    Delantero: "DEL",
};

export default function Personaje ({personaje, onClick}) {
    const posicion = nombresPosicion[personaje.posicion_natural] || personaje.posicion_natural || "Sin posición";

    return (
        <div>
            <button type="button" className={styles.personaje} onClick={onClick}>
                <h4>{personaje.nombre}</h4>
                <span className={styles.posicionNatural}>{posicion}</span>

                <p>{personaje.descripcion}</p>
                <p>
                    Ataque {personaje.ataque} - Defensa {personaje.defensa} - Velocidad {personaje.velocidad} - Habilidad {personaje.habilidad}
                </p>
            </button>
        </div>
    )
}
