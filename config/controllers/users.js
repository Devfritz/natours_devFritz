const multer = require('multer');
const sharp = require('sharp');
const User = require('../model/userSchema');
const errorResponse = require('../utils/error');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

// const multerStorage = multer.diskStorage({
//     destination:(req,file,cb) => {
//         cb(null,'public/img/users');
//     },
//     filename:(req,file,cb)=> {
//         // user-15df15f4fefea-photo.jpg
//         const ext = file.mimetype.split("/")[1];
//         cb(null,`user-${req.user.id}-${Date.now()}.${ext}`);
//     }
// }); 

const multerStorage = multer.memoryStorage();

const multerFilter = (req,file,cb) => {
    if(file.mimetype.startsWith('image')) {
        cb(null,true);
    } else {
        cb(new errorResponse('Not an image! Please upload only images',400),false);
    }
};

const upload = multer({
    storage:multerStorage,
    fileFilter:multerFilter
});

exports.uploadUserPhoto = upload.single('photo');
  
 exports.resizeUserPhoto = catchAsync(async(req,res,next) => {

   if(!req.file) return next();
   
    req.file.filename =`user-${req.user.id}-${Date.now()}.jpeg`;

   sharp(req.file.buffer)
   .resize(500,500)
   .toFormat('jpeg')
   .jpeg({quality:90})
   .toFile(`public/img/users/${req.file.filename}`);

   next();
 });

 const filterObj = (obj, ...allowFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowFields.includes(el)) newObj[el] = obj[el];
    })
    return newObj;
};


 exports.getMe = (req,res,next) => {
     req.params.id = req.user.id;
     next();
 }



exports.updateMe = catchAsync(async(req,res,next) => {

  // 1) create error if user posts password data
  if(req.body.password || req.body.passwordConfirm) {
    return next(
      new errorResponse('this route is not for password updates. Please use /updatemypassword.',
      400)
    );
  }
  // update user document
  const filteredBody = filterObj(req.body,'name','email');
  if(req.file)  filteredBody.photo = req.file.filename;

     
    const updatedUser = await User.findByIdAndUpdate(req.user.id,filteredBody,{
        new : true,
        runValidators:true
    });

    res.status(200).json({
      success:true,
      user:updatedUser
    })
});

/***
 * @desc get all tours
 * @route GET api/v1/tours
 * @access public
 */


exports.getAllUsers = factory.getAll(User);

/***
 * @desc get one tour
 * @route GET api/v1/tours/:id
 * @access public
 */

exports.getUser = factory.getOne(User);



exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User);


exports.createUser = (req,res,next) => {
    res.status(500).json({
        status:false,
        message:`this route not define for create User please connect to /signup`
    })
}

