import Personaje from "./Personaje"
import styles from "@/app/equipo/equipo.module.css";

export default function BandejaPersonajes ({personajes, onSeleccionarPersonaje}){
    return(
        <div className={styles.bandeja}>
            <h2>Bandeja de personajes</h2>

            <p>Selecciona un personaje y luego elegi su posicion</p>

            <div className={styles.listaPersonajes}>
                {personajes.map((personaje) => (
                    <Personaje key={personaje.id_personaje} personaje={personaje} onClick={()=> onSeleccionarPersonaje(personaje)}/>
                ))}
            </div>
        </div>
    )
}