var { mongoose, conn } = require('../configs/db');

const userRatingSchema = new mongoose.Schema({
    
    consultant_per_call_fee: {
        type: Number,
        default:0
    },
    currency: {
        type: String,
        enum : ['INR','AED'],
        default: 'AED'      
    },
 
    created_at:{
        type: Number,
        default: Date.now()
    },
    modified_at:{
        type: Number,
        default: Date.now()
    }
},
    {
        strict: true,
        collection: 'admin_charge',
        versionKey: false
    }
);

exports.AdminChargeModel = mongoose.model('admin_charge', userRatingSchema);

