const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    name:{
       type: String,
       required:[true,'please tell us your name']
    },
     email:{
       type: String,
       required:[true,'you must have an email for connection'],
       unique:true,
       lowercase:true,
      match : [/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,'please add an email valid']

    },
     photo:{
       type:String,
       default:'default.jpg'
     },
     role:{
       type:String,
       enum:['user','guide','lead-guide','admin'],
       default:'user'
     },
     password:{
       type: 'String',
       required:[true,'please enter your password'],
       minlength:8,
       select:false
  
     },
     passwordConfirm:{
       type: String,
       required:[true,'please confirm your password'],
       validate:{
        //  this only works create and save
         validator:function(el) {
           return el === this.password;
         },
         message:'password not is the same'
       }
     },
    passwordChangedAt:Date,
    resetPasswordToken:String,
    resetPasswordExpire:Date,
    active:{
      type:Boolean,
      default:true,
      select:false
    }
  
});

 userSchema.pre('save',async function(next){
  //  only run this function if password was actually modified
    if(!this.isModified('password')) return next();


    // Hash the password with cost of 12
     this.password = await bcrypt.hash(this.password,10);

      // Delete passwordConfirm field
      this.passwordConfirm = undefined;
      next();
 });

     userSchema.pre('save',function(next){
     if(!this.isModified('password') || this.isNew) return next();

      this.passwordChangedAt = Date.now() - 1000  ;
      next();
     });

  
    userSchema.methods.matchPassword = async function(correctPassword){
      return await bcrypt.compare(correctPassword,this.password);
    };

   userSchema.pre(/^find/,function(next) {
// this points to the current query
   this.find({active:{$ne:false}});
   next();
   });

 

    userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
      if(this.passwordChangedAt){
      const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000,10);
     console.log(changedTimestamp,JWTTimestamp);
     return JWTTimestamp < changedTimestamp;
      }
      // false means not changed
      return false;
    }

    userSchema.methods.getResetPasswordToken = function (){
      // generate token
      const resetToken = crypto.randomBytes(32).toString('hex');

      // hash token and reset password field
      this.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

      // set expire
      this.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
      
      return resetToken;
    }

const User = mongoose.model('user',userSchema);

module.exports = User;