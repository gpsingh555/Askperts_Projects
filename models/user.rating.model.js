var { mongoose, conn } = require('../configs/db');

const userRatingSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        ref:'user'
    },
    user_rating_message: {
        type: String,
        default:''
    },
    user_rating_number: {
        type: String,
        default: ''
    },
    service_id: {
        type: mongoose.Types.ObjectId,
        ref: 'consult'
    },
    
    sub_category_id:{
        type: mongoose.Types.ObjectId,
        ref: 'subCategory'
    },
    call_id:{
        type: mongoose.Types.ObjectId,
        ref: 'calling'
    },
    is_deleted:{
        type: Boolean,
        default: false
    },
    created_at:{
        type: Number,
        default: new Date().getTime(),
    },
    modified_at:{
        type: Number,
        default: new Date().getTime(),
    }
},
    {
        strict: true,
        collection: 'user_rating',
        versionKey: false
    }
);

exports.UserRatingModel = mongoose.model('user_rating', userRatingSchema);

