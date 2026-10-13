const mysql = require("mysql2");
require("dotenv").config({ path: ".pio.env" });

const conexion = mysql.createConnection({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
});

conexion.connect((error) => {

    if (error) {
        console.log("Error al conectar a MYSQL:");
        console.log(error);
    } else {
        console.log("Conectado a MYSQL");
    }

});

function realizarQuery(query, valores = []) {

    return new Promise((resolve, reject) => {

        conexion.query(query, valores, (error, resultado) => {

            if (error) {
                reject(error);
            } else {
                resolve(resultado);
            }

        });

    });

}

module.exports = {
    realizarQuery
};