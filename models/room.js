const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const RoomSchema = new Schema({
    host:{
        type:String,
        required:true
    },
    users_allowed:[{
        type:String,
        requried:true
    }],
    roomId: {
        type:String,
        required:true
    }
});

module.exports = mongoose.model('Room',RoomSchema);