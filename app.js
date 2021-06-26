const express = require('express');
const app = express();
const path = require('path');
const mongoose = require('mongoose');
const {v4: uuidv4} = require('uuid');
// const ExpressError = require('./utils/ExpressError');
const methodOverride = require("method-override");
const ejsMate = require('ejs-mate');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const User = require('./models/user');
const mongoSanitize = require('express-mongo-sanitize');
//const helmet = require('helmet');
const MongoDBStore = require("connect-mongo");
const server = require('http').Server(app) //allows us to create a server to use with socket.io
// const { ExpressPeerServer } = require('peer');
// const peerServer = ExpressPeerServer(server, {
//   debug: true
// });


if(process.env.NODE_ENV!=="production"){
    require("dotenv").config();
}
const uri = process.env.MONGODB_URI;
const port = parseInt(process.env.PORT);


const io = require('socket.io')(server);



mongoose.connect(uri,{
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

// app.use('/peerjs', peerServer);
app.use(express.urlencoded({extended:true}))
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname,'public')))
app.use(mongoSanitize({
    replaceWith:'_'
}));

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
      socket.join(roomId)
      console.log("room id: " + roomId);
      console.log("user id: "+ userId);
      socket.to(roomId).emit('user_joined', userId)
    })
    socket.on('disconnect',(roomId, userId)=>{
        socket.broadcast.emit('user_left',userId)
        socket.leave(roomId)  
      })
  })

const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

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


app.get("/",(req,res)=>{
    res.redirect(`/${uuidv4()}`);
})

app.get("/:rid",(req,res)=>{
    res.render("videocall.ejs", { roomId: req.params.rid });
})
app.post('/register',async(req,res,next)=>{
    try {
        const { email, username, password } = req.body;
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', ' Hey! You can now connect with your peers!');
            res.redirect('/register');
        })
    }catch (e) {
        req.flash('error', e.message);
        res.redirect('register');
    }
})

server.listen(port,(req,res)=>{
    console.log(`Server is listening on ${port}!`);
})


