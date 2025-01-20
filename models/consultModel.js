var { mongoose, conn } = require('../configs/db');

const consultSchema = new mongoose.Schema({
    profileImage: {
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
    email:{
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
        default: false
    },
    isDocumentUploaded:{
        type: Boolean,
        default: false
    },
    isBankDetailsUploaded:{
        type: Boolean,
        default: false
    },
    deviceType: {
        type: Number,
        default: 0
    },              // 0 for Android, 1 for IOS,2 for web
    deviceToken: {
        type: String,
        default: null
    },              
    isBlocked: {
        type: Number,
        default: 0,       // 0 not block, 1 means blocked
    },
    isVerified:{
        type:Boolean    // false means rejected , true means accepted
    },
    active:{
        type:Boolean,
        default:false    // true means online and false means ofline
    },              
    otpInfo: {
        otp: Number,
        expTime: Date  //otp expiry time
    }, token: {
        type: String,
        default: ''
    },
    address: {
        type: String,
        default: ''
    },
    consultantType: [{
        type: mongoose.Types.ObjectId,
        ref: 'category'
    }],
    consultantSubType: [{
        type: mongoose.Types.ObjectId,
        ref: 'subCategory',
        default : []
    }],
    consultantSubSubType: [{
        type: mongoose.Types.ObjectId,
        ref: 'subSubCategory',
        default : []
    }],
    documents:[{
        type:String
    }],
    otherDocuments:{
        type: String
    },
    experience:{
        type:Number
    },
    language:{
        type:String
    },
    accountName:{
        type:String
    },
    accountNumber:{
        type:String
    },
    ibanNumber:{
        type:String
    },
    on_duty:{
        type:Boolean,
        default:true
    },
    notify_me:{
        type:Boolean,
        default: true
    },
    is_deleted:{
        type:Boolean,
        default:false
    },
    created_at: {
        type: Number,
        default: Date.now()
    },
    modified_at: {
        type: Number,
        default: Date.now()
    }
},
    {
        strict: true,
        collection: 'consult',
        versionKey: false
    }
);

exports.ConsultModel = mongoose.model('consult', consultSchema);
