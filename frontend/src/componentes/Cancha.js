
import PosicionJugador from "./PosicionJugador";
import styles from "@/app/equipo/equipo.module.css";

export default function Cancha({
    posiciones,
    equipo,
    ordenSeleccionado,
    onSeleccionarPosicion
}) {
    return (
        <div className={styles.cancha}>
            <div className={styles.lineaAreaSuperior} />
            <div className={styles.lineaAreaInferior} />
            <div className={styles.circuloCentral} />
            <div className={styles.lineaCentral} />

            {posiciones.map((puesto) => {
                const personaje = equipo[puesto.orden]?.personaje;
                const ocupado = Boolean(personaje);

                return (
                    <div
                        key={puesto.orden}
                        className={styles.ubicacion}
                        style={{
                            left: `${puesto.x}%`,
                            top: `${puesto.y}%`
                        }}
                    >
                        <PosicionJugador
                            posicion={puesto.posicion}
                            personaje={personaje}
                            ocupado={ocupado}
                            seleccionada={ordenSeleccionado === puesto.orden}
                            onClick={() => onSeleccionarPosicion(puesto.orden)}
                        />
                    </div>
                );
            })}
        </div>
    );
}
