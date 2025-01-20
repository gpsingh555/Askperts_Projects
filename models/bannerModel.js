var { mongoose, conn } = require('../configs/db');

const bannerSchema = new mongoose.Schema({
    image: {
        type: String,
        default: ''
    },
    bannerName: {
        type: String,
        default: ''
    },
    bannerNameArabic: {
        type: String,
        default: ''
    },
    urlLink:{
        type:String,
        default:''
    },
    is_deleted:{
        type: Boolean,
        default: false
    },
    is_active:{
        type: Boolean,
        default: true
    },

},
    {
        strict: true,
        timestamps: true,
        collection: 'banner',
        versionKey: false
    }
);

exports.bannerModel = mongoose.model('banner', bannerSchema);