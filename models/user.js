const mongoose = require('mongoose');
const uuid = require('uuid');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');
const UserSchema = new Schema({
    email:{
        type:String,
        required:true,
        unique:true
    },
    user_id: {
        type:String,
        default:uuid.v4
    }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User',UserSchema);