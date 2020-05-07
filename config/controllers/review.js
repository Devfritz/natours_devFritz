const Review = require('../model/reviewSchema');
const catchAsync = require('../utils/catchAsync')
const factory = require('./handlerFactory');



      exports.setTourUserIds = (req,res,next) => {
                //  Allow nested routes
            req.body.tour = req.params.tourId
            req.body.user = req.user.id
            next();
      }

exports.getReviews =  factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview =  factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
