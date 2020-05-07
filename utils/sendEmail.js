const nodemailer = require('nodemailer');
const pug = require('pug');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user,url){
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Fritz Gerlin <${process.env.FROM_EMAIL}>`

  }
  newTransport(){
    if(process.env.NODE_ENV === 'production'){
      return 1;
    }


    return nodemailer.createTransport({
        host:process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth:{
          user:process.env.SMTP_USERNAME,
          pass:process.env.SMTP_PASSWORD
   }
   
});
  }
    //  send the actual email
   async send(template,subject){
    // 1) Render HTML based on a pug template
     const html =  pug.renderFile(`${__dirname}/../views/email/${template}.pug`,{
       firstName:this.firstName,
       url:this.url, 
       subject
     })
    // 2) Define email options
    const mailOptions = {
   from:this.form,
   to:this.to,
   subject,
   html,
   text:htmlToText.fromString(html)
 };
// 3) create a transport and send email
     
    await this.newTransport().sendMail(mailOptions);

   }

  async sendWelcome() {
    await this.send('welcome', 'welcome to the Natours Family');   }

  async sendPasswordReset(){
    await this.send('passwordReset',
    'Your password reset token (valid for only 10 minutes)'
    );
  }  
  };


 

  
