INSERT INTO Modos (nombre)
VALUES
('Próceres argentinos'),
('Profes del Pío IX');

INSERT INTO Personajes
(id_modo, nombre, descripcion, posicion_natural, ataque, defensa, velocidad, habilidad)
VALUES

-- ARQUEROS (5)
(1, 'Manuel Belgrano', 'Creador de la bandera argentina', 'Arquero', 76, 88, 72, 92),
(1, 'Juan Manuel de Rosas', 'Gobernador de Buenos Aires', 'Arquero', 62, 92, 55, 80),
(1, 'Cornelio Saavedra', 'Presidente de la Primera Junta', 'Arquero', 65, 86, 58, 79),
(1, 'Justo José de Urquiza', 'Líder político y militar entrerriano', 'Arquero', 70, 87, 67, 83),
(1, 'Carlos Pellegrini', 'Presidente e impulsor industrial', 'Arquero', 68, 82, 62, 86),

-- DEFENSORES (15)
(1, 'Manuel Savio', 'Ingeniero militar e impulsor de la industria siderúrgica', 'Defensor', 76, 80, 75, 83),
(1, 'Martín Miguel de Güemes', 'Líder de la guerra gaucha', 'Defensor', 80, 94, 98, 88),
(1, 'Juana Azurduy', 'Combatiente de las guerras de independencia', 'Defensor', 86, 92, 93, 94),
(1, 'Guillermo Brown', 'Figura fundamental de la independencia naval', 'Defensor', 78, 93, 72, 91),
(1, 'Mariano Moreno', 'Secretario de la Primera Junta', 'Defensor', 81, 84, 76, 95),
(1, 'Juan Bautista Alberdi', 'Pensador de las bases constitucionales', 'Defensor', 68, 85, 60, 97),
(1, 'Manuel Dorrego', 'Militar y gobernador de Buenos Aires', 'Defensor', 79, 85, 78, 86),
(1, 'Juan José Castelli', 'Dirigente de la Revolución de Mayo', 'Defensor', 82, 83, 80, 91),
(1, 'Gregoria Pérez', 'Colaboradora de la causa independentista', 'Defensor', 70, 84, 73, 88),
(1, 'María Remedios del Valle', 'Heroína de las guerras de independencia', 'Defensor', 84, 91, 89, 91),
(1, 'Andrés Guacurarí', 'Líder militar guaraní y federal', 'Defensor', 82, 89, 90, 87),
(1, 'Juan Martín de Pueyrredón', 'Director Supremo de las Provincias Unidas', 'Defensor', 72, 85, 68, 88),
(1, 'Guillermo Rawson', 'Médico y político argentino', 'Defensor', 67, 82, 64, 91),
(1, 'Bartolomé Mitre', 'Presidente, militar e historiador', 'Defensor', 80, 87, 75, 90),
(1, 'Leandro N. Alem', 'Fundador de la Unión Cívica Radical', 'Defensor', 82, 84, 81, 89),

-- MEDIOCAMPISTAS (15)
(1, 'Domingo Faustino Sarmiento', 'Presidente e impulsor de la educación', 'Mediocampista', 82, 76, 68, 96),
(1, 'Eva Perón', 'Referente política y social argentina', 'Mediocampista', 91, 78, 84, 99),
(1, 'Juan Domingo Perón', 'Presidente argentino y líder político', 'Mediocampista', 91, 84, 75, 96),
(1, 'Hipólito Yrigoyen', 'Presidente y referente del radicalismo', 'Mediocampista', 80, 84, 68, 91),
(1, 'Raúl Alfonsín', 'Presidente durante el retorno democrático', 'Mediocampista', 79, 87, 70, 95),
(1, 'Arturo Frondizi', 'Presidente e impulsor del desarrollismo', 'Mediocampista', 86, 79, 73, 94),
(1, 'Arturo Illia', 'Presidente argentino entre 1963 y 1966', 'Mediocampista', 75, 88, 64, 91),
(1, 'Juan José Paso', 'Abogado y miembro de la Primera Junta', 'Mediocampista', 72, 81, 66, 92),
(1, 'Bernardino Rivadavia', 'Primer presidente de las Provincias Unidas', 'Mediocampista', 83, 76, 72, 93),
(1, 'Nicolás Avellaneda', 'Presidente y promotor de la educación', 'Mediocampista', 77, 82, 69, 90),
(1, 'Julio Argentino Roca', 'Presidente y figura de la organización nacional', 'Mediocampista', 87, 86, 79, 88),
(1, 'Roque Sáenz Peña', 'Presidente e impulsor del voto secreto', 'Mediocampista', 78, 82, 66, 92),
(1, 'Lisandro de la Torre', 'Político y defensor de la transparencia pública', 'Mediocampista', 80, 83, 72, 94),
(1, 'Alicia Moreau de Justo', 'Médica y referente de los derechos de las mujeres', 'Mediocampista', 79, 82, 75, 96),
(1, 'René Favaloro', 'Médico reconocido por desarrollar el bypass coronario', 'Mediocampista', 86, 88, 72, 98),

-- DELANTEROS (15)
(1, 'José Gervasio Artigas', 'Líder federal rioplatense', 'Delantero', 93, 87, 91, 93),
(1, 'Facundo Quiroga', 'Caudillo riojano del siglo XIX', 'Delantero', 91, 82, 92, 85),
(1, 'José Hernández', 'Autor del Martín Fierro', 'Delantero', 82, 75, 78, 94),
(1, 'Victoria Ocampo', 'Escritora y promotora cultural', 'Delantero', 81, 69, 75, 97),
(1, 'Julieta Lanteri', 'Médica y pionera de los derechos políticos', 'Delantero', 85, 75, 82, 94),
(1, 'Cecilia Grierson', 'Primera médica argentina', 'Delantero', 78, 78, 74, 96),
(1, 'Florentino Ameghino', 'Naturalista y paleontólogo', 'Delantero', 83, 72, 77, 97),
(1, 'Luis Federico Leloir', 'Bioquímico y ganador del Nobel', 'Delantero', 84, 74, 73, 99),
(1, 'Bernardo Houssay', 'Médico y ganador del Nobel de Medicina', 'Delantero', 85, 76, 74, 98),
(1, 'Julio Cortázar', 'Escritor argentino', 'Delantero', 88, 68, 80, 99),
(1, 'Jorge Luis Borges', 'Escritor argentino reconocido internacionalmente', 'Delantero', 86, 70, 72, 100),
(1, 'María Elena Walsh', 'Escritora, compositora y cantante', 'Delantero', 87, 73, 83, 97),
(1, 'Atahualpa Yupanqui', 'Cantautor y referente del folclore argentino', 'Delantero', 85, 76, 81, 96),
(1, 'Mercedes Sosa', 'Cantante fundamental de la música latinoamericana', 'Delantero', 91, 74, 79, 99),
(1, 'José de San Martín', 'Libertador y estratega militar', 'Delantero', 96, 92, 94, 98);


INSERT INTO Formaciones
(nombre, cant_defensores, cant_mediocampistas, cant_delanteros)
VALUES
('4-3-3', 4, 3, 3),
('4-4-2', 4, 4, 2),
('3-5-2', 3, 5, 2),
('3-4-3', 3, 4, 3),
('5-3-2', 5, 3, 2),
('4-5-1', 4, 5, 1),
('5-4-1', 5, 4, 1),
('4-2-4', 4, 2, 4);


