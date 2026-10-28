export default function PosicionJugador ({posicion, personaje, seleccionada, onClick}){
    return (
        <div>
            <button type="button" className={styles.posicion} onClick={onClick} aria-pressed={seleccionada}>
                <strong>{jugador ? jugador.nombre : posicion}</strong>
                <span>{jugador ? "Asignado" : "Asignar"}</span>
            </button>
        </div>
    )
}