import styles from "./EstadisticasTemporada.module.css";

export default function EstadisticasTemporada({estadisticas}){
    if (
        !estadisticas || 
        !Number.isInteger(estadisticas.partidasJugadas) ||
        estadisticas.partidasJugadas <= 0
    ) {
        return null; 
    }

    const datos = [
        {titulo: "Puntos", valor: estadisticas.puntos}, 
        {titulo: "Victorias", valor: estadisticas.victorias}, 
        {titulo: "Partidas Jugadas", valor: estadisticas.partidasJugadas}, 
        {titulo: "Ranking", valor: estadisticas.ranking, ranking: true}, 
    ]; 
    return(
        <div className={styles.contenedor}>
            {datos.map((dato) => (
                <article className={styles.rectangulo} key={dato.titulo}>
                    <p className={styles.titulo}>{dato.titulo}</p>

                    <p className={styles.valor}>
                        {dato.ranking ? `#${dato.valor}` : dato.valor}
                    </p>
                </article>
            ))}
        </div>
    )
}