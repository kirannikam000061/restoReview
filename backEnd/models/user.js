var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcrypt');

var Schema = new Schema({
    email : {type:String, required:true},
    username : {type:String, required:true},
    password : {type:String, required:true},
    creation_dt : {type:Date, required:true}
});

Schema.statics.hashPassword = function hashPassword(password){
    return bcrypt.hashSync(password,10);
}

Schema.methods.isValid = function (hashedpassword){
    return bcrypt.compareSync(hashedpassword,this.password);
}

module.exports = mongoose.model('User' ,Schema);