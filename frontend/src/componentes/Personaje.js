export default function Personaje ({personaje, onClick}) {
    return (
        <div>
            <button type="button" className={styles.personaje} onClick={onClick}>
                <h4>{personaje.nombre}</h4>

                <p>{personaje.descripcion}</p>
                <p>
                    Ataque {personaje.ataque} - Defensa {personaje.defensa} - Velocidad {personaje.velocidad} - Habilidad {personaje.habilidad}
                </p>
            </button>
        </div>
    )
}