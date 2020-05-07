const express = require('express');



const {setTourUserIds,getReviews,getReview,createReview,updateReview,deleteReview } = require('../controllers/review');
const {protect,restrictTo} = require('../controllers/authControllers')

const router = express.Router({mergeParams: true});


router
.route('/')
.get(getReviews)
.post(protect, restrictTo('user','admin'),setTourUserIds,createReview)

router.route('/:id')
.get(getReview)
.patch(updateReview)
.delete(deleteReview)

module.exports = router;