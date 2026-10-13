# -2026-TPF-G15.
# Presupuesto y Documento de Alcance – G15

## 1. Información General del Proyecto

* **Nombre del proyecto:** Argentina FC – Armá tu equipo

### Descripción General
El proyecto a desarrollar es **Argentina FC**, un juego web basado en la creación y gestión de equipos formados por diferentes personajes.

El sistema contará con dos modalidades principales:
1. **Próceres y personajes históricos argentinos.**
2. **Profesores de fútbol del Colegio Pío IX.**

En ambos modos, el usuario deberá seleccionar diferentes personajes para formar su propio equipo. Cada personaje contará con distintas características y estadísticas que influyen en el rendimiento general. El usuario decidirá qué personajes utilizar, qué posición ocupará cada uno y qué estrategia aplicará durante la partida. Una vez armado el equipo, el usuario se enfrentará contra otro equipo controlado por la IA o por otro usuario.

El juego dispondrá de:
* **Modo Individual:** Creación de equipo y enfrentamiento contra rivales del sistema.
* **Modo Multijugador:** Dos usuarios participan en una misma partida y compiten entre sí en tiempo real mediante **WebSockets** (actualización de marcador, acciones y resultados sin recargar la página).

La plataforma también dispondrá de un sistema de usuarios, estadísticas, historial de partidas, ranking y un panel de administración para la gestión de personajes y datos del juego.

---

## 2. Problemática que Aborda

El proyecto busca ofrecer una propuesta de entretenimiento que combine estrategia, conocimiento y competencia:
* **Modo Próceres Argentinos:** Permite a los usuarios interactuar con figuras históricas de manera didáctica y entretenida.
* **Modo Profes del Pío IX:** Genera una experiencia personalizada y representativa para la comunidad educativa del colegio.
* **Competitividad:** Fomenta el juego estratégico y la comparación de rendimiento mediante rankings, puntuaciones y estadísticas detalladas.

---

## 3. Público Objetivo

Orientado principalmente a **estudiantes y personas interesadas en videojuegos, historia argentina y la comunidad del Colegio Pío IX**, que deseen poner a prueba su capacidad de estrategia y competir con otros usuarios.

---

## 4. Objetivo General

Desarrollar una aplicación web de estrategia donde los usuarios puedan formar equipos con diferentes personajes, seleccionar formaciones y estrategias, y competir en dos modos principales (*Próceres Argentinos* y *Profes del Pío IX*), buscando acumular victorias para alcanzar las posiciones más altas del ranking.

---

## 5. Funcionalidades del Proyecto

* Registro e inicio de sesión.
* Selección del modo de juego (*Próceres* / *Profes Pío IX*).
* Selección de personajes, formaciones y estrategias.
* Creación y configuración de equipos.
* Sistema de posiciones y estadísticas de personajes.
* Modo de juego individual (vs. Sistema).
* Modo de juego multijugador en tiempo real (WebSockets).
* Sistema de partidos, marcadores y resultados.
* Sistema de puntuación y ranking general.
* Historial y estadísticas de partidas por usuario.
* Base de datos de personajes.
* Perfil de usuario.
* Panel de administración (Gestión CRUD de personajes y usuarios mediante HTTP).

---

## 6. Alcance del Proyecto (Scope)

### Autenticación y Usuarios
* Crear cuenta de usuario.
* Iniciar y cerrar sesión.
* Diferenciación de roles (*Usuario común* y *Administrador*).
* Control de acceso a funciones según el rol.
* Persistencia de usuarios en base de datos.

### Selección de Modo de Juego
* Pantalla de selección entre *Próceres Argentinos* y *Profes del Pío IX*.
* Carga de personajes específicos según el modo seleccionado.
* Conservación de las mecánicas principales en ambos modos.

### Selección y Gestión de Personajes
* Catálogo de personajes disponibles por modo.
* Muestra de fichas técnicas: información básica y estadísticas.
* Selección de personajes para el armado de alineaciones.

### Creación y Configuración del Equipo
* Asignación de personajes a posiciones específicas dentro del campo.
* Selección de formación táctica y estilo de estrategia.
* Resumen de características generales del equipo antes del partido.
* Confirmación de alineación.

### Juego Individual (vs. IA)
* Inicio de partida individual contra el sistema.
* Simulación del enfrentamiento según estadísticas, formación y estrategia.
* Visualización del estado del partido y resultado final.
* Registro del resultado en el historial del usuario.

### Sistema de Partidos y Estrategia
* Pantalla de enfrentamiento con detalles de ambos equipos (personajes, formación, estrategia).
* Marcador en vivo y estadísticas del partido.
* Determinación automática del ganador.
* Persistencia del resultado.

### Modo Multijugador e Interacción en Tiempo Real
* Creación y unión a salas de partidas multijugador.
* Enfrentamiento entre dos usuarios con alineaciones personalizadas.
* Sincronización mediante **WebSockets**:
  * Notificación de ingreso de jugadores.
  * Inicio de partida coordinado.
  * Actualización en tiempo real del marcador y eventos clave sin recargar la página.
  * Emisión del resultado final simultáneo.

### Sistema de Puntaje, Ranking e Historial
* Asignación de puntos por victorias y desempeño.
* Acumulación de puntaje general por usuario.
* **Ranking público:** Tabla de posiciones ordenada por puntos, victorias y partidas jugadas.
* **Historial personal:** Consulta de partidas pasadas (ganadas, perdidas, totales) y estadísticas generales en el perfil.

### Panel de Administración
* Gestión de usuarios registrados.
* CRUD completo de personajes (Agregar, Consultar, Modificar, Eliminar).
* Edición de estadísticas y atributos de los personajes.
* Mantenimiento general de la base de datos del juego.

---

## 7. Características Técnicas del Producto Final

* **Arquitectura Full Stack:**
  * **Frontend:** Desarrollado en React / Next.js con interfaz clara, responsiva e identidad visual coherente.
  * **Backend:** Desarrollado en Node.js.
  * **Base de Datos:** Persistencia de usuarios, personajes, partidas, puntajes y rankings.
* **Comunicación:**
  * **HTTP / Fetch API:** Para operaciones CRUD, autenticación y gestión de datos.
  * **WebSockets:** Para la sincronización en tiempo real del modo multijugador.
* **Seguridad:** Control de acceso mediante roles (Middleware de autorización para administradores).
* **Entrega:** Aplicación funcional e integrada, con documentaciones, base de datos poblada y usuario administrador activo.
