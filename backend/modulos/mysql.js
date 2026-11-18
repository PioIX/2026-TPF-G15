const mysql = require("mysql2/promise");
require("dotenv").config({ path: ".pio.env" });

const conexion = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Ejecutar consultas normales
async function realizarQuery(query, valores = []) {
    const [resultado] = await conexion.query(query, valores);
    return resultado;
}

// Ejecutar varias consultas dentro de una transacción
async function realizarTransaccion(callback) {
    const connection = await conexion.getConnection();

    try {
        await connection.beginTransaction();

        const resultado = await callback(connection);

        await connection.commit();

        return resultado;

    } catch (error) {
        await connection.rollback();
        throw error;

    } finally {
        connection.release();
    }
}

module.exports = {
    realizarQuery,
    realizarTransaccion
};