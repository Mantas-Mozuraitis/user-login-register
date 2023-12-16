import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
    host:"localhost",
    port:5432,
    user:"postgres",
    password:"password",
    database:"login_register",
})

db.connect();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req,res) => {
    res.render("index.ejs");
})

app.post("/login", async (req,res) => {
    const e_username = req.body.username;
    const e_password = req.body.password;
    
    try {
        const user = await db.query("SELECT * FROM users WHERE username = $1 AND password = $2", [e_username, e_password]);
        if (user.rows.length != 0) {
            console.log(user.rows);
        }
        res.redirect("/");
    } catch (error) {
        console.log("user not found");
    }
})

app.listen(port, (req,res)=>{
    console.log(`Server is listening on port: ${port}`);
})