const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const {v4: uuidv4} = require('uuid');
const methodOverride = require("method-override");
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const mongoSanitize = require('express-mongo-sanitize');
const MongoDBStore = require("connect-mongo");
const server = require('http').Server(app) //allows us to create a server to use with socket.io
const {isLoggedIn} = require('./public/middleware');


if(process.env.NODE_ENV!=="production"){
    require("dotenv").config();
}
const uri = process.env.MONGODB_URI; //database
const port = parseInt(process.env.PORT);


const io = require('socket.io')(server);




mongoose.connect(uri,{   // connect db
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology:true,
    useFindAndModify:false 
});

const db = mongoose.connection;
db.on("error",console.error.bind(console,"connection error"));
db.once("open",()=>{
    console.log("Database Connected")
});


app.engine('ejs',ejsMate);
app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'))

app.use(express.urlencoded({extended:true}))
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname,'public')))
app.use(mongoSanitize({
    replaceWith:'_'
}));
const users = {};

io.on('connection', socket => {
    socket.on('join-room-kag', (roomId, userId) => {
      socket.join(roomId, userId)
      console.log("room id: " + roomId);
      console.log("user id: "+ userId);
      socket.to(roomId).emit('user-joined-kag-video', userId)
    });

    socket.on('new-user-joined-kag',(roomId,name) =>{
        socket.join(roomId);
        users[socket.id] = name;
        socket.to(roomId).emit('user-joined-kag',name);
    });

    socket.on('send-msg-kag',(roomId, msg)=>{
        socket.to(roomId).emit('receive-msg-kag',{msg: msg, name: users[socket.id]});
    });

    socket.on('leave-room-kag',(roomId,userId)=>{ 
        socket.leave(roomId,userId);
        socket.to(roomId).emit('user-left-kag',users[socket.id]);
        delete users[socket.id];
    });
  });

const secret = process.env.SECRET || 'secret';

const store = MongoDBStore.create({
    mongoUrl: uri,
    secret,
});

store.on("error",function(e){
    console.log("Session Store Error !",e)
});

const sessionConfig = {
    store,
    name:'session',
    secret,
    resave: false,
    saveUninitialized:true,
    cookie:{
        httpOnly:true,
        //secure:true,
        expires: Date.now() + 1000*60*15,
        maxAge:1000*60*15
    } 
}
app.use(session(sessionConfig))
app.use(flash());


app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    //console.log(req.session);
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    res.locals.currentUser = req.user;
    next(); 
})


app.get('/register',async(req,res)=>{
    res.render('reg');
})


app.get("/", (req,res)=>{
    // res.redirect(`/${uuidv4()}`);
    res.render('home',{idr: uuidv4()});
})

app.get("/endcall",isLoggedIn, (req,res)=>{
    res.render("leave.ejs");
})

app.post('/register', async(req,res,next)=>{
    try {
        // passport used
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', ' Hey! You can now connect with your peers!'); // successfully registered
            res.redirect('/');
        })
    }catch (e) {
        req.flash('error', e.message);
        res.redirect('register'); // error in register
    }
})

app.get('/login',(req,res)=>{
    res.render('login');
})

app.post('/login',passport.authenticate('local', { failureFlash: true, failureRedirect: '/login' }), (req,res)=>{
    req.flash('success', 'Successful Login...');
    const redirectUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(redirectUrl);
})

app.get("/:rid",isLoggedIn, (req,res)=>{
    res.render("video-room", { roomId: req.params.rid}); // create a room
})


server.listen(port,(req,res)=>{
    console.log(`Server is listening on ${port}!`); 
})


