const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/Apifeatures');
const errorResponse = require('../utils/error');

exports.deleteOne = Model => catchAsync(async (req, res, next) => {

    const doc = await Model.findByIdAndDelete(req.params.id);
  
    if(!doc) {
        return next(new errorResponse(`no document found with that ID`,404))
    }

res.status(204).json({success: true, data: {}});





});


exports.updateOne = Model => catchAsync(async (req, res, next) => {

  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true

    });
       if (!doc) {
     return next(new errorResponse(`no document found with that ID`,404))
      }
res.status(200).json({success: true, data: doc});


});

exports.createOne = (Model) => catchAsync(async (req, res, next) => {
    let filter , query;

    if(req.params.tourId) filter = req.params.tourId;

     query = Model.findById(filter)

 
     query =  await Model.create(req.body);

     const doc = await query;
     
res.status(201).json({success: true, results: doc});

});

exports.getOne = (Model, popOptions) => catchAsync(async (req,res,next) => {
let query = await Model.findById(req.params.id);

if (popOptions)  query = await Model.findById(req.params.id).populate(popOptions);

 const doc  = await query;

res.status(200).json({success: true, result: doc.length, data: doc});



});

exports.getAll = Model => catchAsync(async (req, res, next) => {
 let filter;
    if(req.params.tourId) filter = {tour:req.params.tourId};

// executing query
const features = new APIFeatures(Model.find(filter), req.query).filter().sort().select().pagination();

// const doc = await features.query.explain();
const doc = await features.query

res.status(200).json({success: true, result: doc.length, data: doc})



});


