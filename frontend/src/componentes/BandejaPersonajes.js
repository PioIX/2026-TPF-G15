
import Personaje from "./Personaje";
import styles from "@/app/equipo/equipo.module.css";

export default function BandejaPersonajes({
    personajes,
    onSeleccionarPersonaje,
    personajeSeleccionado,
    cargando,
    error
}) {
    return (
        <div className={styles.bandeja}>
            <h2>Bandeja de personajes</h2>

            <p>
                Seleccioná un personaje y después elegí dónde ubicarlo en la cancha.
            </p>

            {cargando ? (
                <p>Cargando personajes...</p>
            ) : error ? (
                <p>{error}</p>
            ) : personajes.length === 0 ? (
                <p>No hay personajes disponibles.</p>
            ) : (
                <div className={styles.listaPersonajes}>
                    {personajes.map((personaje) => {
                        const seleccionado =
                            personajeSeleccionado?.id_personaje ===
                            personaje.id_personaje;

                        return (
                            <div
                                key={personaje.id_personaje}
                                className={
                                    seleccionado
                                        ? styles.personajeSeleccionado
                                        : styles.personajeDisponible
                                }
                            >
                                <Personaje
                                    personaje={personaje}
                                    onClick={() =>
                                        onSeleccionarPersonaje(personaje)
                                    }
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
