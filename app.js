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
const Room = require('./models/room');
const mongoSanitize = require('express-mongo-sanitize');
const MongoDBStore = require("connect-mongo");
const server = require('http').Server(app) //allows us to create a server to use with socket.io
const {isLoggedIn} = require('./public/middleware');


if(process.env.NODE_ENV!=="production"){
    require("dotenv").config();
}
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/Teams-Clone'; //database
const port = parseInt(process.env.PORT) || 3000;


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
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname,'public')))
app.use(mongoSanitize({
    replaceWith:'_'
}));
const users = {};

io.on('connection', socket => {
    socket.on('join-room-kag', (roomId, userId) => { // join room event
      socket.join(roomId, userId)
      console.log("unique room id- " + roomId);
      console.log("unique user id- "+ userId);
      socket.to(roomId).emit('user-joined-kag-video', userId)
    });

    socket.on('new-user-joined-kag',(roomId,name) =>{// join chat event
        socket.join(roomId);
        users[socket.id] = name;
        socket.to(roomId).emit('user-joined-kag',name);
    });

    socket.on('send-msg-kag',(roomId, msg)=>{// send message event
        socket.to(roomId).emit('receive-msg-kag',{msg: msg, name: users[socket.id]});
    });

    socket.on('leave-room-kag',(roomId)=>{ // leave room event
        // socket.leave(roomId,userId);
        socket.in(roomId).emit('user-left-kag',users[socket.id]);
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
    res.render('home');
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
            req.flash('success', 'You have Registered successfully'); // successfully registered
            const prevUrl = req.session.returnTo || '/';
            delete req.session.returnTo;
            res.redirect(prevUrl); 
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
    req.flash('success', 'You have logged in successfully');
    const prevUrl = req.session.returnTo || '/';
    delete req.session.returnTo;
    res.redirect(prevUrl);
})

app.get('/logout',(req,res)=>{
    req.logout();
    req.flash('success',"You have logged out successfully");
    res.redirect('/');
})

app.get('/room',isLoggedIn,(req,res)=>{
    res.render('room_config');
});

app.post('/room',isLoggedIn,async(req,res)=>{
    try{
        var user_list = req.body;
        const room = await Room.create({host: user_list[0], users_allowed: user_list, roomId: uuidv4()});
        res.json({roomId:room.roomId});
    }catch(e){
        
    }
})
app.get('/favicon.ico',(req,res)=>{ // so that the user is not directed to favicon.ico route
    res.status(204);
    res.end(); 
})

app.get('/search',isLoggedIn,async(req,res)=>{
    var key = await User.find({email:{$regex:req.query.search_key,$options:"i"}});
    console.log(req.query.search_key);
    console.log(key);
    res.json({val:key});
})

app.get("/:rid",isLoggedIn, async(req,res)=>{
    var room = await Room.findOne({roomId:req.params.rid}).exec(); // search for matching emails using regex in mongoose
    if(!(room)){
        res.render('room_not_found');
    }
    else{
        var user_arr = room.users_allowed;
        if(user_arr.includes(req.user.email)){
            res.render("video-room", { roomId: req.params.rid}); // create a room
        }
        else{
            res.render('not_authorised');
        }
    }
})


server.listen(port,(req,res)=>{
    console.log(`Server is listening on ${port}!`);
})


