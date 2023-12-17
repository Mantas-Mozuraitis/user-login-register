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
    res.render("index.ejs", {route:"login"});
})

// GET USER ACCOUNT PAGE
app.get("/myaccount/:id",async (req,res)=>{
    res.render("index.ejs", {user: await getUser(req.params.id)});
})

// USER LOGIN POST
app.post("/login", async (req,res) => {
    try {
        const user = await existingUser(req.body.username, req.body.password);
        if (user.isValidUser) {
            res.redirect(`/myaccount/${user.userData.id}`);
        }else{
            res.render("index.ejs", {message: "User does not exist", route:"login"});
        }
    } catch (error) {
        console.error("Error:", error.message);
        res.render("index.ejs", {message: "An error occurred during login", route:"login"});
    }
})
// USER LOGIN GET 
app.get("/login", (req,res)=>{
    res.render("index.ejs", {route:"login"});
})



// USER REGISTER POST 
app.post("/register", async (req,res)=>{
    try {
        const user = await registerUser(req.body.username, req.body.password);
        user.userRegistered
        ?res.render("index.ejs", {route:"login", message:user.message})
        :res.render("index.ejs", {route:"register", message:user.message}); 
    } catch (error) {
        console.error("Error:", error.message);
        res.render("index.ejs", {message: "Register error", route:"register"});
    }
})
// USER REGISTER GET 
app.get("/register", (req,res)=>{
    res.render("index.ejs", {route:"register"});
})




app.listen(port, (req,res)=>{
    console.log(`Server is listening on port: ${port}`);
})


// FUNCTIONS 

async function existingUser(username, password) {
    try {
        const res = await db.query("SELECT * FROM users WHERE username = $1 AND password = $2",[username, password]);
        return res.rowCount>0?{isValidUser:true,userData:res.rows[0]}:{isValidUser:false};
    } catch (error) {
        console.error("Error:", error.message);
        return false;
    }
}

async function getUser(id){
    try {
        const res = await db.query("SELECT * FROM users WHERE id = $1",[id]);
        return res.rows[0];
    } catch (error) {
        console.error("Error:", error.message);
    }
}

async function registerUser(username, password){
    const existing_username = await existingUsername(username);
    if (!existing_username) {
        try {
            const res = await db.query("INSERT INTO users (username, password) VALUES ($1,$2)",[username, password]);
            console.log("New user has been registered:");
            console.log(res);
            return {userRegistered:true};
        } catch (error) {
            console.error(error.message);
            return {userRegistered:false};
        }
    }else{
        console.log("username already exists");
        return {userRegistered:false,message:"username alraedy exists"};
    }
}

async function existingUsername(username){
    try {
        const res = await db.query("SELECT * FROM users WHERE username = $1", [username])
        return res.rowCount>0?true:false;
    } catch (error) {
        console.error("Error:", error.message);
        return false;
    }
}
