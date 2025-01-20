var { mongoose, conn } = require('../configs/db');

const userSchema = new mongoose.Schema({
    profileImage: {
        type: String,
        default: ''
    },
    email: {
        type: String,
        default: ''
    },
    firstName: {
        type: String,
        default: ''
    },
    lastName: {
        type: String,
        default: ''
    },
    gender: {
        type: Number,      //1 for male, 2 for female
        default: null
    },
    dateOfBirth: {
        type: Number,
        default: null
    },
    country: {
        type: String,
        default: null
    },
    nationality: {
        type: String,
        default: null
    },
    mobileNumber: {
        type: String,
        default: null
    },
    countryCode: {
        type: String,
        default: null
    },
    isProfileCompleted: {
        type: Boolean,
        default: false,
    },
    deviceType: {
        type: Number,
        default: 0
    },              // 1 for Android, 2 for IOS,3 for web
    deviceToken: {
        type: String,
        default: null
    },
    isBlocked: {
        type: Number,  //0 for unBlock and 1 for blocked
        default: 0,
    },
    active: {
        type: Boolean,
        default: false    // true means online and false means ofline
    },
    otpInfo: {
        otp: Number,
        expTime: Date  //otp expiry time
    },
    token: {
        type: String,
        default: ''
    },
    notify_me: {
        type: Boolean,
        default: true
    },
    is_deleted: {
        type: Boolean,
        default: false
    },
    created_at: {
        type: Number,
        default: Date.now()
    },
    modified_at: {
        type: Number,
        default: Date.now()
    },
    no_of_calls : {
        type: Number,
        default: 0
    },
    refered_key: {
        type: String,
        default: null
    },
  
},
    {
        strict: true,
        collection: 'user',
        versionKey: false
    }
);

exports.UserModel = mongoose.model('user', userSchema);

