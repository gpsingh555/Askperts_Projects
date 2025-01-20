var { mongoose, conn } = require('../configs/db');

const applySubscriptionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref:'user'
    },
   
    purchaseDate: {
        type: Number,
        default: Date.now()
    },
    duration: {
        type: Number,
        default: 1
    },
    planName: {
        type: String,
        default: ''
    },
    planNameArabic: {
        type: String,
        default: ''
    },
    numberOfCalls: {
        type: Number,
        default: 1
    },
    leftCalls:{
        type: Number,
        default:0
    },
    amount: {
        type: Number,
        default: 1
    },
    created_on: {
        type: Number,
        default: new Date().getTime()
    }
},
    {
        strict: true,
        timestamps: true,
        collection: 'applySubscription',
        versionKey: false
    }
);

exports.applySubscriptionModel = mongoose.model('applySubscription', applySubscriptionSchema);