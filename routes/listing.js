const express = require("express");
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js"); //require wrapAsync function
const { isLoggedIn, isOwner, validateListing } = require("../middleware.js"); // require middleware for isAuthenticate()

const multer = require("multer"); //require multer
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage }); //initialize multer

const listingController = require("../controllers/listings.js");

router
  .route("/")
  .get(wrapAsync(listingController.index)) //index route
  .post(
    isLoggedIn,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.createListing)
  ); //create route

//new route ->
router.get("/new", isLoggedIn, listingController.renderNewForm);

router
  .route("/:id")
  .get(wrapAsync(listingController.showListing)) //show route
  .put(
    isLoggedIn,
    isOwner,
    upload.single("listing[image]"),
    validateListing,
    wrapAsync(listingController.updateListing)
  ) //update route
  .delete(isLoggedIn, isOwner, wrapAsync(listingController.deleteListing)); //delete route

//edit route ->
router.get(
  "/:id/edit",
  isLoggedIn,
  isOwner,
  wrapAsync(listingController.renderEditForm)
);

module.exports = router;
