import Link from "next/link"

export default function Modo({titulo, subtitulo, descripcion}){
    return(
        <div>
            <h3>{titulo}</h3>
            <h5>{subtitulo}</h5>
            <p>{descripcion}</p>

            <Link href="/equipo">
                <button>Jugar ahora</button>
            </Link>
        </div>
    )
}