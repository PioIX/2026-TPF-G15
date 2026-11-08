
import Personaje from "./Personaje";
import styles from "@/app/equipo/equipo.module.css";

export default function BandejaPersonajes({
    personajes,
    onSeleccionarPersonaje,
    cargando,
    error
}) {
    return (
        <div className={styles.bandeja}>
            <h2>Bandeja de personajes</h2>

            <p>Seleccioná un personaje para asignarlo a la posición elegida.</p>

            {cargando ? (
                <p>Cargando personajes...</p>
            ) : error ? (
                <p>{error}</p>
            ) : personajes.length === 0 ? (
                <p>No hay personajes disponibles.</p>
            ) : (
                <div className={styles.listaPersonajes}>
                    {personajes.map((personaje) => (
                        <Personaje
                            key={personaje.id_personaje}
                            personaje={personaje}
                            onClick={() => onSeleccionarPersonaje(personaje)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
