import PosicionJugador from "./PosicionJugador"

const posiciones = [
  { id: 1, nombre: "ARQ", x: 50, y: 90 },
  { id: 2, nombre: "DEF", x: 17, y: 76 },
  { id: 3, nombre: "DEF", x: 39, y: 79 },
  { id: 4, nombre: "DEF", x: 61, y: 79 },
  { id: 5, nombre: "DEF", x: 83, y: 76 },
  { id: 6, nombre: "MED", x: 26, y: 57 },
  { id: 7, nombre: "MED", x: 50, y: 62 },
  { id: 8, nombre: "MED", x: 74, y: 57 },
  { id: 9, nombre: "DEL", x: 21, y: 30 },
  { id: 10, nombre: "DEL", x: 50, y: 24 },
  { id: 11, nombre: "DEL", x: 79, y: 30 },
];


export default function Cancha({equipo, posicionSeleccionada,setPosicionSeleccionada }){
    return(
        <div className={styles.cancha}>
            <div className={styles.lineaAreaSuperior}/>       
            <div className={styles.lineaAreaInferior}/>       
            <div className={styles.circuloCentral}/>       
            <div className={styles.lineaCentral}/>       

            {posiciones.map((p) => (
                <div key={p.id} className={styles.ubicacion} style={{ left: `${posicion.x}%`, top: `${posicion.y}%` }}>
                    <PosicionJugador posicion={posicion.jugador}/>
                </div>
            ))}
        </div>
    )
}