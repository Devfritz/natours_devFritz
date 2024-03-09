const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../../config/db');

const Tour = require('../../model/tourSchema');
const User = require('../../model/userSchema');
const Review = require('../../model/reviewSchema');


dotenv.config({ path: './config/config.env' });

connectDB();

// Read json file
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`,'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));



// import DATA into DB
const importData = async () => {
    try{

await Tour.create(tours)
await User.create(users,{validateBeforeSave:false})
await Review.create(reviews);

console.log('data successfully loaded');
       
    }catch(err){
       console.log(err); 
    }
     process.exit();
};

// delete All DATA FROM database
const deleteData = async() => {
  try{
      await Tour.deleteMany();
      await User.deleteMany();
      await Review.deleteMany();

      console.log('delete all data successfully');
    
  }catch(err){
      console.log(err);
  } 
   process.exit()
};



 if(process.argv[2] === '--import'){
     importData();
 }else if (process.argv[2] === '--delete') {
     deleteData();
 }







