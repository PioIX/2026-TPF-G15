
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./form.module.css";
import { API } from "@/app/page";

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
    const [mostrarToast, setMostrarToast] = useState(false);

    const handleClick = () => {
        if (register) {
            onButtonRegister(username, email, contrasena);
        } else {
            handleLogin();
        }
    };


    const handleLogin = async () => {
        try {
            const response = await fetch(`${API}/login`, {
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
                setMostrarToast(true);

                localStorage.setItem(
                    "usuario",
                    JSON.stringify(data.usuario)
                );
                setTimeout(() => {
                    router.push("/inicio");
                }, 1500);
                
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

            {mostrarToast && (
                <div className={styles.toast}>
                    <div className={styles.toastIcon}>✔️</div>
                    <div className={styles.toastTexto}>
                        <h4>¡Inicio de sesión exitoso!!</h4>
                        <p>Bienvenido a Argentina FC</p>
                    </div>
                </div>
            )}

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
