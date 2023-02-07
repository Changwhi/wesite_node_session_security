const express = require('express');
//to hash the pasword with bcrypt
require('dotenv').config();
const bcrypt = require("bcrypt");
const saltRounds = 12;
const port = process.env.PORT || 3000;
const session = require('express-session');
const MongoStore = require('connect-mongo');
const {Store} = require('express-session');
const app = express();
//in-memory database
var users = [];
const expireTime = 1 * 60 * 60 * 1000; // expires after an hour (hour *min *second* millis)
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const node_session_secret = process.env.NODE_SESSION_SECRET;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

app.use(express.urlencoded({extended: false}));

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://`+mongodb_user+ `:`+ mongodb_password+ `@cluster0.h59cv.mongodb.net/?retryWrites=true&w=majority`,
    crypto: {
        secret: mongodb_session_secret
    }
});

app.use(session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true
}
));


//This is for the source?
app.use(express.static(__dirname+"/public"));

app.get('/', (req,res) => {
    res.send("<h1>Hello World!</h1>");
});

app.listen(port, () => {
	console.log("Node application listening on port "+port);
}); 

app.get('/about', (req,res) => {
    var color = req.query.color;

    res.send("<h1 style='color:"+color+";'>Changwhi Oh</h1>")
});

app.get('/cat/:id', (req,res) => {
    var cat = req.params.id

    if (cat == 1){
        res.send("Socks: <img src='/socks.gif' style='width:250px;'>");
    }
    else if (cat == 2){
        res.send("Fluffy: <img src='/cat.gif' style='width:250px;'>");
    }
    else{
        res.send("Invaild cat id: "+cat);
    };
});

app.get("/contact", (req,res) =>{
    var missingEmail = req.query.missing;
    var html = `
    email address:<form action='/submitEmail' method='post'>
        <input name = 'email' type='text' placeholder='email'>
        </input><button>Submit</button>
    </form>
    `;
    // script form, ajax call
    if (missingEmail) {
        //br = line breaker 
        html += "<br>email is requred"
    }
    res.send(html);
});

app.post('/submitEmail', (req,res)=>{
    var email = req.body.email;
    if (!email) {
        res.redirect('/contact?missing=1')
    }
    else {
        res.send("Thanks for subscribing with your email: " + email);
    }
});

app.get('/createUser', (req,res)=>{
    // var missingName = req.query.missingName;
    // var missingPassword = req.query.missingPassword;
    var html = `
    create user
    <form action='/submitUser' method='post'>
    <input name = 'username' type='text' placeholder='user name'>
    <input name = 'password' type='text' placeholder='password'>
    <button>Submit</button>
    </form>
    `;
    // if (missingName) {
    //     //br = line breaker 
    //     html += "<br>email is required"
    // };
    // if (missingPassword){
    //     html += "<br>password is required"
    // };
    res.send(html);
});

app.get('/login', (req,res)=>{
    var html = `
    log in
    <form action='/loggingin' method='post'>
        <input name='username' type='text' placeholder='username'></input>
        <input name='password' type='text'placeholder='password'></input>
        <button>Submit</button> 
    </form>
    `;
    res.send(html);
});

app.post('/loggingin', (req,res)=>{
    var username=req.body.username;
    var password=req.body.password;

    var usershtml = "";
    for (i=0; i < users.length; i++){
        if (users[i].username == username){
            if (bcrypt.compareSync(password, users[i].password)){
                req.session.authenticated = true;
                req.session.username = username;
                req.session.cookie.maxAge = expireTime;
                res.redirect('/loggedIn');
                return;
            }
        }
    }
    res.redirect("/login");
});

app.get('/loggedIn', (req,res)=>{
    if (!req.session.authenticated) {
        res.redirect('/login');
    }
    var name=req.session.username;
    var html = `Hello` + name +`
     You are logged in!
    
    `;
    res.send(html);
});

app.post('/submitUser', (req, res) => {
    var username = req.body.username;
    var password = req.body.password;

    var hashedPassword = bcrypt.hashSync(password, saltRounds);

    users.push({username: username, password: hashedPassword});
    
    console.log(users);

    var usershtml = "";
    for (i = 0; i < users.length; i++)
    {
        usershtml += "<li>"+ users[i].username + ":" + users[i].password + "</li>";
    }

    var html = "<ul>" + usershtml + "</ul>";

    res.send(html);
});



//should be at the bottom to avoid interrupting other pages
app.get("*", (req,res) => {
    res.status(404);
    res.send("Page not found - 404");
});
