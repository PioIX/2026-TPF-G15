
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./form.module.css";

export default function Form({
    title,
    register,
    buttonText,
    onButtonRegister
}) {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [contrasena, setContrasena] = useState("");

    const handleClick = () => {
        if (register) {
            onButtonRegister(username, email, contrasena);
        } else {
            handleLogin();
        }
    };


    const handleLogin = async () => {
        try {
            const response = await fetch("http://localhost:4000/login", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email: email,
                    password: contrasena
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert("¡Inicio de sesión correcto!");

                localStorage.setItem(
                    "usuario",
                    JSON.stringify(data.usuario)
                );

                router.push("/inicio");
            } else {
                alert(data.mensaje);
            }

        } catch (error) {
            console.log("Error al iniciar sesión:", error);
            alert("No se pudo conectar con el servidor. Revisá que el backend esté funcionando.");
        }
    };


    return (
        <div className={styles.formulario}>
            <h2 className={styles.titulo}>{title}</h2>

            {register && (
                <input
                    className={styles.campo}
                    type="text"
                    placeholder="Nombre de usuario"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
            )}

            <input
                className={styles.campo}
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                className={styles.campo}
                type="password"
                placeholder="Contraseña"
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
            />

            <button
                className={styles.boton}
                onClick={handleClick}
            >
                {buttonText}
            </button>
        </div>
    );
}
