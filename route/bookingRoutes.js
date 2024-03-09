const express = require("express");
const {
  getCheckoutSession,
  getAllBooking,
  getBooking,
  createBooking,
  updateBooking,
  deleteBooking,
} = require("../config/controllers/bookingController");

const {
  protect,
  restrictTo,
} = require("../config/controllers/authControllers");

const router = express.Router();
router.use(protect);

router.get("/checkout-session/:tourId", getCheckoutSession);

router.use(restrictTo("admin", "lead-guide"));

router.route("/").get(getAllBooking).post(createBooking);

router.route("/:id").get(getBooking).patch(updateBooking).delete(deleteBooking);

module.exports = router;
