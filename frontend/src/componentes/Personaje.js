export default function Personaje ({personaje, onClick}) {
    return (
        <div>
            <button type="button" className={styles.personaje} onClick={onClick}>
                <h4>{personaje.nombre}</h4>
                <p>
                    Ataque {personaje.ataque} - Defensa {personaje.defensa} - Energia {personaje.energia}
                </p>
            </button>
        </div>
    )
}