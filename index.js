import { config } from 'dotenv';
if (process.env.NODE_ENV !== "production"){
    config();
}

import express from "express";
import bodyParser from "body-parser";
import pg from "pg";
import bcrypt from "bcrypt";
import passport from "passport";
import flash from "express-flash";
import session from "express-session";
import {initialize} from "./passport-config.js";

initialize(passport,username => getUserByUsername(username), id => getUser(id));

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
app.use(flash());
app.use(session({
    secret:process.env.SESSION_SECRET,
    resave:false,
    saveUninitialized: false,
}))
app.use(passport.initialize());
app.use(passport.session());

// Display current session and user when authenticated
app.use((req, res, next) => {
    console.log("req.session", req.session);
    console.log("req.user", req.user);
    next();
});

// STARTING PAGE
app.get("/", (req,res) => {
    res.render("index.ejs", {route:"login"});
})

// GET USER ACCOUNT PAGE
app.get("/myaccount", async (req,res)=>{
    if (req.user) {
        try {
            const player = await getPlayer(req.user.id);
            res.render("account.ejs", player?{user:req.user, player:player}:{user:req.user});
        } catch (error) {
            console.error("Error:", error.message);
            res.render("/");
        }
    }else{
        res.render("/");
    }
})
 
// USER LOGIN POST
app.post("/login", passport.authenticate("local", {
    successRedirect:"/myaccount",
    failureRedirect:"/login",
    failureFlash:true,
}))

// USER LOGIN GET 
app.get("/login", (req,res)=>{
    res.render("index.ejs", {route:"login"});
})

// USER REGISTER POST 
app.post("/register", async (req,res)=>{
    const username_input = req.body.username;
    try {
        const user = await registerUser(username_input, req.body.password, req.body.re_password);
        user.userRegistered
        ?res.render("index.ejs", {route:"login", message:user.message})
        :res.render("index.ejs", {route:"register", message:user.message,reg_username:username_input}); 
    } catch (error) {
        console.error("Error:", error.message);
        res.render("index.ejs", {message: "Register error", route:"register",reg_username:username_input});
    }
})
// USER REGISTER GET 
app.get("/register", (req,res)=>{
    res.render("index.ejs", {route:"register"});
})

// USER LOGOUT
app.get('/logout', function(req, res) {
    req.logout(function(err) {
        if (err) {
          return res.status(500).json({ message: 'Logout failed' });
        }
        res.redirect('/');
      });
});

// CREATE PLAYER
app.post("/create-player", async(req,res)=>{
    try {
        await createPlayer(req.user.id);
        res.redirect("/myaccount");
    } catch (error) {
        console.error("Error:", error.message);
    }
})



app.listen(port, (req,res)=>{
    console.log(`Server is listening on port: ${port}`);
})




// USER FUNCTIONS 
async function getUser(id){
    try {
        const res = await db.query("SELECT * FROM users WHERE id = $1",[id]);
        return res.rows[0];
    } catch (error) {
        console.error("Error:", error.message);
        return null;
    }
}

async function registerUser(username, password, re_password){
    const existing_username = await existingUsername(username);
    if (!existing_username) {
        if (password === re_password) {
            try {
                const hashedPassword = await bcrypt.hash(password, Math.random()*(10-5)+5);
                await db.query("INSERT INTO users (username, password) VALUES ($1,$2)",[username, hashedPassword]);
                console.log("New user has been registered");
                return {userRegistered:true};
            } catch (error) {
                console.error(error.message);
                return {userRegistered:false};
            }
        }else{
            console.log("passwords do not match");
            return {userRegistered:false,message:"passwords do not match"};
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

async function getUserByUsername(username){
    try {
        const user = await db.query("SELECT * FROM users WHERE username = $1", [username]);
        return user.rows[0];
    } catch (error) {
        console.error("Error:", error.message);
        return null;
    }
}


// PLAYER FUNCTIONS

async function createPlayer(id){
    try {
        await db.query("INSERT INTO player (user_id, power, defense, level, xp) VALUES ($1, 0, 0, 0, 0)", [id]);
        console.log("new player has been created");
    } catch (error) {
        console.error("Error:", error.message);
    }
}

async function getPlayer(user_id){
    try {
        const player = await db.query("SELECT * FROM player WHERE user_id = $1", [user_id])
        return player.rows[0];
    } catch (error) {
        console.error("Error:", error.message);
        return null;
    }
}