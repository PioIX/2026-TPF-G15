"use client"; 

import { useState } from "react";

export default function Form({title, register, buttonText, onButtonRegister}){
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [contrasena, setContrasena] = useState("");

    const handleClick = () => {
        if (register){
            onButtonRegister(username, email, contrasena)
        } 
        else {
            handleLogin()
        }
    }
    
    const handleLogin = async () => {

        const response = await fetch("http://localhost:4000/login", {
            method: "POST", 
            headers: {
                "Content-Type": "application/json"
            }, 
            body: JSON.stringify({
                email
            })
        })

    }

    return(
        <div>
            <h2>{title}</h2>

            {register && (
                <div>
                    <input 
                        type="text"
                        placeholder="Usuario"
                        value={username}
                        onChange={(e)=>setUsername(e.target.value)}>
                    </input>
                </div>
            )}

            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e)=>setEmail(e.target.value)}>
            </input>

            <input
                type="password"
                placeholder="Contraseña"
                value={contrasena}
                onChange={(e)=>setContrasena(e.target.value)}>
            </input>

            <button onClick={handleClick}>{buttonText}</button>
        </div>
    )
}