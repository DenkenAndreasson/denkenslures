import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// En "pool" håller flera databasanslutningar öppna samtidigt, så att
// servern kan hantera flera requests parallellt utan att vänta på
// att en och samma anslutning blir ledig.
export const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: parseInt(process.env.MYSQL_PORT || "3306"),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});
