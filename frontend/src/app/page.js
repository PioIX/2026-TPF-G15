import styles from "./page.module.css";
import Link from "next/link";

export const API = "http://10.1.5.135:4000";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>
            Argentina FC
          </h1>
          <h2>
            Armá tu equipo.
            <br />
            <span className={styles.destacado}>
              Jugá tu historia.
            </span>
          </h2>
          <p>
            Elegí tus figuras, definí la estrategia y salí a la cancha en una experiencia futbolera hecha para imaginar grandes partidos.
          </p>
        </div>
        <div className={styles.ctas}>
          <Link className={styles.primary} href="/login">Entrar al juego →</Link>
        </div>
      </main>
    </div>
  );
}
