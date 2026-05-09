/*
    Middlewares =>
    In express are functions that come into play 
    after the server recieves the request and before the
    response is sent to the cilent.
    1)They can execute any code.  
    2)Make changes to the request and the response objects.
    3)End the req-res cycle.
    4)Call the next middleware function in the stack

    if the current middleware function does not end the request-response
    cycle,it must call next() to pass control to the next middleware function
    
*/

/*
    Server side Validation needs:
    1)joi schema
    2)schema validate function
    3)middleware

*/
if (process.env.NODE_ENV != "production"){
    require('dotenv').config();
}


const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const listings = require("./routes/listing.js");
const reviews = require("./routes/reviews.js");
const user = require("./routes/user.js");
const session = require("express-session");
const MongoStore = require('connect-mongo').default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const dbURL = process.env.ATLAS_URL; 

main()
    .then((res) =>
    {
        console.log("connected to database");
    })
    .catch(err => console.log(err));

async function main()
{
    await mongoose.connect(dbURL);
};

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const store = MongoStore.create({
    mongoUrl: dbURL,
    crypto: {
        secret: process.env.SECRET,
    },
    touchAfter: 24*60*60,
});

store.on("error", (err) =>
{
    console.log("Session Store Error!", err);
});

const sessionOptions = {
    store,
    secret : process.env.SECRET,
    resave : false,
    saveUninitialized : true,
    cookie : {
        expires: Date.now() + 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly: true,
    },
};

// app.get('/', (req, res) =>
// {
//     res.send("Hi, I am root");
// });          



app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
});

app.use("/listings", listings);
app.use("/listings/:id/reviews" , reviews);
app.use("/", user);

app.use((req, res, next) =>
{
    next(new ExpressError(404, "Page Not Found"));
});

app.use((err, req, res, next) =>
{
    let { statusCode = 500, message = "Something Went Wrong!" } = err;
    res.status(statusCode).render("error.ejs", { message });
    // res.status(statusCode).send(message);
});

app.listen(8080, () =>
{
    console.log("server is listening on port 8080");
});