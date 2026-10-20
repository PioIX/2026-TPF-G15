CREATE TABLE Usuarios_TPF (
    id_usuario INT AUTO_INCREMENT PRIMARY KEY,
    nombre_usuario  VARCHAR(50)  NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,            
    administrador BOOLEAN NOT NULL DEFAULT FALSE,
    partidas_jugadas INT NOT NULL DEFAULT 0,
    partidas_ganadas INT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE Formaciones(
	id_formacion int auto_increment primary key,
    nombre varchar(20) not null,
    cant_defensores int not null,
    cant_mediocampistas int not null,
    cant_delanteros int not null
)ENGINE=InnoDB;

CREATE TABLE Modos(
	id_modo int auto_increment primary key,
    nombre varchar(50) not null
)ENGINE=InnoDB;

CREATE TABLE Personajes (
    id_personaje  INT AUTO_INCREMENT PRIMARY KEY,
    id_modo  INT NOT NULL,
    nombre  VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255),
    posicion_natural VARCHAR(30),
    ataque  INT NOT NULL DEFAULT 0,
    defensa INT NOT NULL DEFAULT 0,
    velocidad INT NOT NULL DEFAULT 0,
    habilidad INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_personaje_modo
        FOREIGN KEY (id_modo) REFERENCES Modo (id_modo)           
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE Equipos (
    id_equipo INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario INT NOT NULL,
    id_modo INT NOT NULL,
    id_formacion INT NOT NULL,
    estrategia VARCHAR(100),
    nombre  VARCHAR(100) NOT NULL,
    CONSTRAINT fk_equipo_usuario
        FOREIGN KEY (id_usuario) REFERENCES Usuario (id_usuario)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_equipo_modo
        FOREIGN KEY (id_modo) REFERENCES Modo (id_modo)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_equipo_formacion
        FOREIGN KEY (id_formacion) REFERENCES Formacion (id_formacion)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;
 

CREATE TABLE EquiposPersonajes (
    equipo_id INT NOT NULL,
    personaje_id INT NOT NULL,
    posicion  VARCHAR(30),
    orden   INT,
    PRIMARY KEY (equipo_id, personaje_id),
    CONSTRAINT fk_eqpers_equipo
        FOREIGN KEY (equipo_id) REFERENCES Equipo (id_equipo)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_eqpers_personaje
        FOREIGN KEY (personaje_id) REFERENCES Personaje (id_personaje)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;
 

CREATE TABLE Partidas (
    id_partida  INT AUTO_INCREMENT PRIMARY KEY,
    equipo_local_id INT NOT NULL,
    equipo_visitante_id INT NOT NULL,
    tipo  BOOLEAN NOT NULL DEFAULT FALSE,  -- FALSE = individual, TRUE = multijugador
    estado   VARCHAR(30) NOT NULL,
    goles_local INT NOT NULL DEFAULT 0,
    goles_visitante  INT NOT NULL DEFAULT 0,
    instancia  VARCHAR(50),
    CONSTRAINT fk_partida_local
        FOREIGN KEY (equipo_local_id) REFERENCES Equipo (id_equipo)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_partida_visitante
        FOREIGN KEY (equipo_visitante_id) REFERENCES Equipo (id_equipo)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;
 
CREATE TABLE EventosPartida (
    id_evento INT AUTO_INCREMENT PRIMARY KEY,
    id_partida INT NOT NULL,
    minuto INT NOT NULL,
    tipo_evento VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255),
    CONSTRAINT fk_evento_partida
        FOREIGN KEY (id_partida) REFERENCES Partida (id_partida)
        ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;
 