const express = require('express');
require('./utils')
require('dotenv').config();
// MySQL
const db_utils = include("/database/db_utils");
const success = db_utils.printMySQLVersion();
//MySQL user 
const db_users = include('database/users')
//MySQL todo
const db_todo = include('database/todo')
// var users = [];
const bcrypt = require("bcrypt");
const saltRounds = 12;
const port = process.env.PORT || 3000;

const database = include("databaseConnection");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const {Store} = require('express-session');
const { json } = require('body-parser');
const { response } = require('express');
const app = express();
const expireTime = 60 * 60 * 1000;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const node_session_secret = process.env.NODE_SESSION_SECRET;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
var todo_global = "";
var user_id_global = 0;
var user_type_global = ""
app.use(express.urlencoded({extended: false}));

app.set('view engine', 'ejs')

//Store session in an ecvrypted MongoDB
var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://`+mongodb_user+ `:`+ mongodb_password+ `@cluster0.h59cv.mongodb.net/?retryWrites=true&w=majority`,
    crypto: {
        secret: mongodb_session_secret
    }
});
// Encrypt session on the client with a session key
app.use(session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true
}
));

app.use(express.static(__dirname+"/public"));

app.get('/', (req,res) => {
    // res.send("<h1>Hello World!</h1>");
    if (req.session.authenticated) {
        res.redirect('/loggedin')
    }
    else {
        res.render('index')   
    }
});

app.listen(port, () => {
	console.log("Node application listening on port "+port);
}); 

app.get('/about', (req,res) => {
    var color = req.query.color;

    // res.send("<h1 style='color:"+color+";'>Changwhi Oh</h1>")
    res.render("about", {color: color});
});

// MySQL
app.get('/createTables', async (req, res) =>{
    const create_table = include('database/create_table');

    var success = create_table.createTables();
    if (success) {
        res.render("successMessage", {message: "Create table."})
    }
    else {
        res.render("errorMessage", {error: "Failed to create table."})
    }
})


app.get('/cat/:id', (req,res) => {
    var cat = req.params.id

    // if (cat == 1){
    //     res.send("Socks: <img src='/socks.gif' style='width:250px;'>");
    // }
    // else if (cat == 2){
    //     res.send("Fluffy: <img src='/cat.gif' style='width:250px;'>");
    // }
    // else{
    //     res.send("Invaild cat id: "+cat);
   // };
   res.render("cat", {cat: cat});
});

app.get("/contact", (req,res) =>{
    var missingEmail = req.query.missing;
    // var html = `
    // email address:<form action='/submitEmail' method='post'>
    //     <input name = 'email' type='text' placeholder='email'>
    //     </input><button>Submit</button>
    // </form>
    // `;
    // if (missingEmail) {
    //     html += "<br>email is requred"
    // }
    // res.send(html);
    res.render("contact", {missing: missingEmail})
});

app.post('/submitEmail', (req,res)=>{
    var email = req.body.email;
    if (!email) {
        res.redirect('/contact?missing=1')
    }
    else {
        // res.send("Thanks for subscribing with your email: " + email);
        res.render("submitEmail", {email: email});
    }
});

app.get('/createUser', (req,res)=>{
    // // create user
    // // <form action='/submitUser' method='post'>
    // // <input name = 'username' type='text' placeholder='user name'>
    // // <input name = 'password' type='text' placeholder='password'>
    // // <button>Submit</button>
    // // </form>
    // // `;
    // res.send(html);
    var missing = req.query.missing
    res.render("createUser", {missing: missing});
});

app.get('/login', (req,res)=>{
    var missing = req.query.missing;
    var error = req.query.error;
    res.render("login", {missing: missing, error: error})
});

app.post('/logout', (req, res) => {
    req.session.destroy()
    res.redirect('/')
})

app.post('/loggingin', async (req,res)=>{
    var email=req.body.email;
    var password=req.body.password;
    
    if (!email) {
        res.redirect('/login?missing=email')
        return
    }
    if (!password) {
        res.redirect('/login?missing=password')
        return
    }

    var results = await db_users.getUser({email:email, hashedPassword: password});
    if (results) {
        if (results.length == 1) {
            if (bcrypt.compareSync(password, results[0].password)) {
                req.session.authenticated = true;
                req.session.user_type = results[0].type;
                req.session.username = results[0].username;
                req.session.user_id = results[0].user_id;
                req.session.cookie.maxAge = expireTime;
                res.redirect('/loggedIn');
                return;
            } 
            else {
                console.log("Invalid password")
                res.redirect('/login?error=1');
            }
        }
        else {
            console.log("Invalid number of users matched: " +results.length+" (expected 1).")
               res.redirect('/login?error=1');

            return
        }
    }else{
    console.log('user not found');           
    // user and password combination not found
            res.redirect('/login', {error:1});
    }
        });

// step1 : To check authentication using middleware (in this code, middleware is seesion?)
// * authentication vs authorization
function isValidSession(req) {
    if (req.session.authenticated) {

        return true;
    }
    return false;
}
// step 2
function sessionValidation(req, res, next) {
    if (!isValidSession(req)){
        req.session.destroy();
        res.redirect('/');
        return;
    }

    else {
        next();
    }
}
//add check addmin step 2.5
function isAdmin(req) {
    if (req.session.user_type == 'admin') {
        return true;
    }
    return false;
    
}
function adminAuthorization(req,res,next) {
    if (!isAdmin(req)) {
        res.status(403);
        res.render('errorMessage', {error: "Not Authorized"});
        return;
    }
    else {
        next();
    }
}

// step 3
// Ensure all member pages requre a valid session(redirect back to the root page if no session or invalid session is found)
app.use('/loggedin', sessionValidation);
app.use('/loggedin/admin', adminAuthorization);


app.get('/loggedIn', (req,res)=>{
    var name=req.session.username;
    var type = req.session.user_type;
    if (type == 'admin'){
        res.redirect('/loggedin/admin')
    }
    else{
    res.render("loggedin", {name: name})
    }
});

app.get('/loggedin/info', (req, res)=> {
    res.render("loggedin-info");
});

app.get('/loggedin/admin', (req,res) => {
    var name = req.session.username;
    res.render("admin", {name: name});
})

app.get('/loggedin/memberInfo/:email', async (req,res) => {
    var email = req.params.email;
    if (email === "1"){
    res.render("memberInfo", {username: req.session.username, user_type: req.session.user_type, email: req.session.email})
    }
    else {
        var results = await db_users.getUser({email:email})   
        console.log(results[0].email)
        user_id_global = results[0].user_id;
        user_type_global = results[0].user_type;
        res.render("memberInfo", {username: results[0].username, user_type: results[0].user_id, email: results[0].email})

    }
})


app.post('/submitUser', async (req, res) => {
    var user = req.body.username;
    var password = req.body.password;
    var email = req.body.email;

    var hashedPassword = bcrypt.hashSync(password, saltRounds);

    if(!user){
        res.redirect("/createUser/?missing=name")
    }
    else if (!password) {
        res.redirect("/createUser/?missing=password")
    }
    else if (!email) {
        res.redirect("/createUser/?missing=email")
    }
    else{
    var success = await db_users.createUser({user:user, hashedPassword: hashedPassword, email: email})
    if (success) {
        // to display list of users
        // var results = await db_users.getUsers();
        // res.render("memberInfo", {users:results})

        // create a session and redirect the user to the members page
        var result = await db_users.getUser({email:email, hashedPassword:password});
        req.session.authenticated = true;
        req.session.user_type = result[0].type;
        req.session.username = result[0].username;
        req.session.user_id = result[0].user_id;
        req.session.cookie.maxAge = expireTime;
        res.redirect('/loggedin/');
        return;
    }
    else{
        res.render('errorMessage', {error: "Failed to create user."});
    } 
}
});

app.get('/api', async (req,res) => {

    
    if (isAdmin(req)) {
        console.log("you here?")
        var user_id = user_id_global;
        var user_type = user_type_global;
    }else{
        console.log("or here?")
    var user_id = req.session.user_id;
    var user_type = req.session.user_type;
    }
    console.log('api hit')

    console.log(user_id);
    var result = await db_todo.getTodo({user_id: user_id});
    console.log(result);

    var jsonResponse = {
        success: false,
        data: null,
        date: new Date()
    };

    if (!isValidSession(req)){
        jsonResponse.success = false;
        res.status(401); // 401 == bad user (in valid session)
        res.json(jsonResponse)
        return
    }

    if (typeof id === 'undefined') {
        jsonResponse.success = true;
        if (user_type === 'admin') {
            jsonResponse.data=["A", "B", "C", "D"];
        }
        else {
            jsonResponse.data = result;
        }
    }
    else {
        if(!isAdmin(req)){
            jsonResponse.success = false;
            res.status(403); // valid user but not allowed to have access
            res.json(jsonResponse);
            return
        }
        jsonResponse.success = true;
        jsonResponse.data = [id + " - details"];
    }
    user_id_global = 0
    user_type_global = ""
    res.json(jsonResponse);

})

app.post('/loggedin/createtodo', async (req, res) => {
    // var content = req.body.atodo;

    // if (req.body.todo === undefined) {return}

    var todos = req.body.todos;
    var user_id = req.session.user_id;
    var success = await db_todo.createTodo({user_id:user_id, content: todos});
    if (success) {
        console.log("Todo sotred" + success[0]);
        user_id_global = 0;
        todo_global = ""
        res.redirect('/loggedin')
     }
    else{
        res.render("errorMessage", {error: "Failed to create New Todo"});
    }
    

   

})

app.get('/loggedin/admin/userlist', async (req, res) => {
    var result = await db_users.getUsers()
    res.render("submitUser", {users:result})


});


app.use(express.static(__dirname + "/public"));

app.get("*", (req,res) => {
    res.status(404);
    // res.send("Page not found - 404");
    var cat = Math.floor(Math.random() * 2) + 1;
    res.render("cat", {cat: cat});
});
