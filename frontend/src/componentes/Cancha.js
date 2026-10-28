import PosicionJugador from "./PosicionJugador"


export default function Cancha({posiciones, equipo, ordenSeleccionado, onSeleccionarPosicion}){
    return(
        <div className={styles.cancha}>
            <div className={styles.lineaAreaSuperior}/>       
            <div className={styles.lineaAreaInferior}/>       
            <div className={styles.circuloCentral}/>       
            <div className={styles.lineaCentral}/>       

            {posiciones.map((puesto) => (
                <div key={puesto.orden} className={styles.ubicacion} style={{ left: `${puesto.x}%`, top: `${puesto.y}%` }}>
                    <PosicionJugador posicion={puesto.posicion} personaje={equipo[puesto.orden]?.personaje} seleccionada={ordenSeleccionado === puesto.orden} onClick={()=>onSeleccionarPosicion(puesto.orden)}/>
                </div>
            ))}
        </div>
    )
}