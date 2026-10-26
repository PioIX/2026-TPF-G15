export default function PosicionJugador ({posicion, jugador, onClick}){
    return (
        <div>
            <button type="button" className={styles.posicion} onClick={onClick}>
                <strong>{jugador ? jugador.nombre : posicion}</strong>
                <span>{jugador ? "Seleccionado" : "Asignar"}</span>
            </button>
        </div>
    )
}