if (process.env.NODE_ENV != "production") {
  //only access env when in development
  require("dotenv").config(); // require dot env to access .env file
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate"); //require EJS Mate
const ExpressError = require("./utils/ExpressError.js"); //require ExpressError class
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport"); //require passport for auth.
const LocalStrategy = require("passport-local"); //require passport-local
const User = require("./models/user.js"); //require user schema

//require routes ->
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate); //define engine for ejs-mate
app.use(express.static(path.join(__dirname, "/public")));

//connection to database->
// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

const dbURL = process.env.ATLASDB_URL;

async function main() {
  await mongoose.connect(dbURL);
}

main()
  .then((res) => {
    console.log("Connection to MongoDB established Successfully!");
  })
  .catch((err) => {
    console.log(err);
  });

// creating mongoStore
const store = MongoStore.create({
  mongoUrl: dbURL,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("ERROR in MONGO SESSION STORE", err);
});

//using session
const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

app.use(session(sessionOptions)); //session middleware
app.use(flash()); // flash middleware

app.use(passport.initialize()); //passport.initialize middleware
app.use(passport.session());
//use static authenticate method of User model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

//serialize and deserialize methods
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//middleware for success and error message
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currUser = req.user; // save user info to res.locals
  next();
});

//express router for listing routes ->
app.use("/listings", listingRouter);

//express router for reviews routes ->
app.use("/listings/:id/reviews", reviewRouter);

//express router for reviews routes ->
app.use("/", userRouter);

//standard responce for all req that are not defined
app.all("*", (req, res, next) => {
  next(new ExpressError(404, "404 Page Not Found!"));
});

//to handle async errors ->
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { message });
  //res.status(statusCode).send(message);
});

//start server on 8080 ->
app.listen(8080, "0.0.0.0", () => {
  console.log("server is listening on 8080");
});
