"use client"
import Form from "@/componentes/Form";
import { useState } from "react";
import styles from "./login.module.css";


export default function LoginPage() {
    
    const [register, setRegister] = useState(false)

    

const handleRegister = async (usuario, email, contrasena) => {
    try {
        const response = await fetch("http://localhost:4000/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nombre_usuario: usuario,
                email: email,
                contrasena: contrasena
            })
        });

        const data = await response.json();

        if (response.ok) {
            alert(data.mensaje);
            setRegister(false);
        } else {
            alert(data.mensaje);
        }

    } catch (error) {
        console.log("Error al registrar usuario:", error);
        alert("No se pudo conectar con el servidor. Revisá que el backend esté funcionando.");
    }
};




return (
    <div className={styles.contenedor}>
        {!register ? (
            <>
                <Form
                    title="Argentina FC"
                    buttonText="Iniciar sesión"
                    register={false}
                />

                <button
                    className={styles.cambiar}
                    onClick={() => setRegister(true)}
                >
                    ¿No tenés cuenta? Registrate
                </button>
            </>
        ) : (
            <>
                <Form
                    title="Crear cuenta"
                    buttonText="Registrarse"
                    onButtonRegister={handleRegister}
                    register={true}
                />

                <button
                    className={styles.cambiar}
                    onClick={() => setRegister(false)}
                >
                    ¿Ya tenés cuenta? Iniciá sesión
                </button>
            </>
        )}
    </div>
);
}