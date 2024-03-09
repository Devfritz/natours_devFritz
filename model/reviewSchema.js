const mongoose = require("mongoose");
const Tour = require("./tourSchema");
const reviewSchema = new mongoose.Schema(
  {
    reviews: {
      type: String,
    },
    ratting: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: "tour",
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
    },
  },

  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

reviewSchema.pre(/^find/, function (next) {
  //   this.populate({
  //             path:'user',
  //             select:'name photo'
  //         }).populate({
  //             path:'tour',
  //             select:'name'
  //         })

  this.populate({
    path: "user",
    select: "name photo",
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: "$tour",
        nRating: { $sum: 1 },
        avgRating: { $avg: "$ratting" },
      },
    },
  ]);
  console.log(tourId);
  console.log(stats);

  await this.model("tour").findByIdAndUpdate(tourId, {
    ratingQuantity: stats[0].nRating,
    ratingAverage: stats[0].avgRating,
  });
};

reviewSchema.post("save", function () {
  //   this points to current review
  this.constructor.calcAverageRatings(this.tour);
});

reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  console.log(r);
  next();
});

reviewSchema.post(/^findOneAnd/, async function (next) {
  await this.r.constructor.calcAverageRatings(this.r.tour);
});

module.exports = mongoose.model("Review", reviewSchema);
