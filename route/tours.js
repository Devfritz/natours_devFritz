const express = require("express");
const {
  getAllTours,
  getTour,
  createTour,
  updateTour,
  deleteTour,
  aliasTopTours,
  getTourStats,
  getMonthlyPlan,
  getToursWithin,
  getDistance,
  resizeTourPhoto,
  uploadTourImage,
} = require("../controllers/tours");

const { getReviews } = require("../controllers/review");

const { protect, restrictTo } = require("../controllers/authControllers");

const router = express.Router();

const reviewRouter = require("./review");

//  router.param('id',chekId)
router.route("/top-5-cheap").get(aliasTopTours, getAllTours);

router.route("/tour-stats").get(getTourStats);

router.route("/monthly-plan/:year").get(getMonthlyPlan);

router
  .route("/tours-within/:distance/center/:latlng/unit/:unit")
  .get(getToursWithin);

router.route("/distances/:latlng/unit/:unit").get(getDistance);

router.route("/").get(getAllTours).post(createTour);

router
  .route("/:id")
  .get(getTour)
  .patch(
    protect,
    restrictTo("admin", "lead-guide"),
    uploadTourImage,
    resizeTourPhoto,
    updateTour
  )

  .delete(protect, restrictTo("admin", "lead-guide"), deleteTour);

router
  .route("/:tourId/reviews")
  .get(protect, restrictTo("user", "admin"), getReviews);

router.use("/:tourId/reviews", reviewRouter);

module.exports = router;
