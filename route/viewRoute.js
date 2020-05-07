const express = require('express');

const {
getOverview,
getTour,
loginForm,
getAccount,
getMyTours

// updateUserData
} = require('../controllers/viewController');

const {protect,
    restrictTo,
    isLoggedIn 
} = require('../controllers/authControllers');

const {createBookingCheckout} = require('../controllers/bookingController')
const router = express.Router();



router.get('/',createBookingCheckout,isLoggedIn,getOverview);
router.get('/tour/:slug',isLoggedIn, getTour);
router.get('/login',isLoggedIn,loginForm)
router.get('/me',protect,getAccount);
router.get('/my-tours', protect, getMyTours);


// router.post('/submit-user-data',protect,updateUserData);



module.exports = router;