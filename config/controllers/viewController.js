const Tour = require('../model/tourSchema');
const Booking = require('../model/bookingSchema')
const User = require('../model/userSchema');
const catchAsync = require('../utils/catchAsync')
const errorResponse = require('../utils/error');
exports.getOverview = catchAsync(async(req,res,next) => {
    const tours = await Tour.find();

res.status(200).render('overview', {
    title:'All tours',
    tours
});

});

exports.getTour = catchAsync(async(req,res,next) => {

     const tour = await Tour.findOne({slug:req.params.slug})
     .populate({
         path:'reviews',
         select:'review rating user'
     });

     if(!tour){
         return next(new errorResponse('There is no tour with that name',404));
     }

res.status(200).render('tour', {
    title:'the king Dev',
    tour
});

});

exports.loginForm = catchAsync(async(req,res,next) => {
    // const user = res.user.is;
    //  if(!user){
    //     
    //  }
//    // 2) check if user exist
//     const user = await User.findOne({email}).select('+password');
//    const isMatchPassword = await user.matchPassword(password);

//     if(!user){
//    return next(new errorResponse('User not found please connect with  a another email or Register',401));

//     }

//     if(!isMatchPassword){
//    return next(new errorResponse(`user or email is incorrect `, 401));

//    }
 res.status(200).render('login',{
     title: 'login'
 })

});

exports.getAccount = catchAsync(async(req,res,next) => {

     res.status(200).render('account',{
         title:'My Account'
     })
})
exports.getMyTours = catchAsync(async(req,res,next) => {
    // 1) Find All bookings
    const bookings = await Booking.find({user:req.user.id});

    // 2) Find tours with the returned IDs
    const tourIds = bookings.map(el => el.tour);
    const tours  = await Tour.find({_id:{$in:tourIds}})

     res.status(200).render('overview',{
         title:'My tours',
         tours
     })
})


// exports.updateUserData = catchAsync(async(req,res,next) => {

//     const updatedUser = await  User.findByIdAndUpdate(req.user.id,{
//         name:req.body.name,
//         email:req.body.email
//     },{
//         new:true,
//         runValidators:true
//     });
//      res.status(200).render('account',{
//          title:'My Account',
//          user:updatedUser
//      })
// });
 