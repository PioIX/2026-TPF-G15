import Image from "next/image";
import styles from "./page.module.css";

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
          <a
            className={styles.primary}
            href="/login"
            target="_blank"
            rel="noopener noreferrer"
          >

            Entrar al juego →
          </a>

        </div>
      </main>
    </div>
  );
}
