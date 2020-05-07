const multer = require('multer');
const sharp = require('sharp');
const Tour = require('../model/tourSchema');
const APIFeatures = require('../utils/Apifeatures');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');
const errorResponse = require('../utils/error');



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


exports.uploadTourImage = upload.fields([
  { name:'imageCover',maxCount:1 },
  {name:'images',maxCount:3}
]);
   
// upload.array('images',5)
    
exports.resizeTourPhoto = catchAsync(async(req,res,next) => {
// console.log(req.files);
   if(!req.files.imageCover || !req.files.images) return next();
   
   req.body.imageCover =`tour-${req.params.id}-${Date.now()}.jpeg`;

   await sharp(req.files.imageCover[0].buffer)
   .resize(500,500)
   .toFormat('jpeg')
   .jpeg({quality:90})
   .toFile(`public/img/tours/${req.body.imageCover}`);
 
//    2) images
   req.body.images = [];
   await Promise.all(
       req.files.images.map(async (file,i) => {
           const fileName = `tour-${req.params.id}-${Date.now()}-${i +1}.jpeg`;
            await sharp(file.buffer)
            .resize(2000,1333)
            .toFormat('jpeg')
            .jpeg({quality:90})
            .toFile(`public/img/tours/${fileName}`);
            req.body.images.push(fileName);
                })
        );

   next();
 });

/***
 * @desc get all tours
 * @route GET api/v1/tours
 * @access public
 */
 exports.aliasTopTours = (req,res,next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.select = 'name,price,ratingsAverage,summary,difficulty';
    next();
 };

exports.getTourStats = catchAsync(async (req, res) => {
  
        const stats = await Tour.aggregate([
            {
                $match: { ratingAverage: { $gte: 4.5 } }
            },
            {
                $group: {
                    _id: null,
                    numTours: { $sum: 1 },
                    numRatings: { $sum: '$ratingsQuantity' },
                    avgRating: { $avg: '$ratingAverage' },
                    avgPrice: { $avg: '$price' },
                    minPrice: { $min: '$price' },
                    maxPrice: { $max: '$price' }

                }
             },
            {
                $sort: { avgPrice:1}
            }

                  ]);

           res.status(200).json({
                 success: true,
                data: stats
            })

    });




exports.getAllTours = factory.getAll(Tour)
  

  
     
   

  


/***
 * @desc get one tour
 * @route GET api/v1/tours/:id
 * @access public
 */

 exports.getTour = factory.getOne(Tour,{path:'reviews'});
 
   
            
   


/***
 * @desc create one tour
 * @route POST api/v1/tours/:id
 * @access public
 */

 exports.createTour = factory.createOne(Tour)

/***
* @desc  update one tour
* @route GET api/v1/tours/:id
* @access private
*/
   exports.updateTour =  factory.updateOne(Tour)



/***
 * @desc delete one tour
 * @route POST api/v1/tours/:id
 * @access private
 */

   exports.deleteTour = factory.deleteOne(Tour);

exports.getMonthlyPlan = async (req,res) => {
    try{
       
        const year = req.params.year * 1;
        const plan = await Tour.aggregate([
            {
                $unwind:'$startDates'
            },
            {
                $match:{
                    startDates:{
                        $gte:new Date(`${year}-01-01`),
                        $lte: new Date(`${year}-12-31`),
                    }
                }
            },{
                $group:{
                   _id:{ $month : '$startDates' } ,
                 numTourStarts : { $sum: 1},
                 tours:{ $push : '$name'}
                }
            }
        ]);
         res.status(200).json({
             status:true,
             count:plan.length,
             data:plan
         });

    }catch(err){
        res.status(400).json({
             success: true,
            mesage: err
        });
    }
}

//  /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/-40,45/unit/mi


  exports.getToursWithin = catchAsync(async(req,res,next) => {
    
    const { distance , latlng , unit } = req.params;

    const [lat , lng ] = latlng.split(',');
  
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

     if(!lng || !lat) {
         next (new errorResponse(`please provide latitude and longitude in the format lat, lng`,400))
     }
       
   const tours = await Tour.find({
       startLocation:{$geoWithin: { $centerSphere: [[lng,lat],radius]}}
   });

     res.status(200).json({
          success:true,
         results:tours.length,
         data:tours
     })

    });

function waitForIndex() {

    return new Promise((resolve, reject) => {

        Tour.on('index', error => error ? reject(error) : resolve())

    })

}



exports.getDistance = catchAsync(async(req,res,next) => {
   const { latlng, unit} = req.params;

const [lat, lng] = latlng.split(',');

const multiplier = unit === 'mi' ? 0.000621371 : 0.001;

if (!lng || !lat) {
next(new errorResponse(`please provide latitude and longitude in the format lat, lng`,400))
}

const distances = await Tour.aggregate([
 {
     $geoNear:{

        near:{
             type:'Point',
             coordinates: [lng * 1 , lat * 1]
         },
         distanceField:'distance',
         distanceMultiply:multiplier,
         spherical:true
     }
 },
 {
     $project:{
         distance:1,
         name:1
     }
 }
  
 

]);


      res.status(200).json({
          success:true,
         data:distances
     })
 
});


















