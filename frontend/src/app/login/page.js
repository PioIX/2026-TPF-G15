"use client"
import Form from "@/componentes/Form";
import { useState } from "react";
import styles from "./login.module.css";


export default function LoginPage() {
    
    const [register, setRegister] = useState(false)

    const handleRegister = async (usuario, email, contrasena) => {
        const response = await fetch("http://localhost:4000/register", { //hay que actualizar el back
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: username,
                mail: mail,
                contrasena: contrasena,
            })
        })
        const data = await response.json()
        console.log(data)
};

return (
    <div>
        {!register ? (
            <>
                <Form
                    title="Iniciar sesión"
                    buttonText="Iniciar sesión"
                    register={false}
                />

                <button
                    className={styles.cambiar}
                    onClick={() => setRegister(true)}
                >
                    Quiero registrarme
                </button>
            </>
        ) : (
            <>
                <Form
                    title="Registrarse"
                    buttonText="Registrarse"
                    onButtonClick={handleRegister}
                    register={true}
                />

                <button
                    className={styles.cambiar}
                    onClick={() => setRegister(false)}
                >
                    Quiero iniciar sesión
                </button>
            </>
        )}
    </div>
)
}