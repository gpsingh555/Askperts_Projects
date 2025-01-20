var { mongoose, conn } = require('../configs/db');

const subscriptionSchema = new mongoose.Schema({
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
    
    amount: {
        type: Number,
        default: 1
    },
    position: {
        type: Number,
        default: 1
    },
    is_deleted:{
        type: Boolean,
        default: false
    }
},
    {
        strict: true,
        timestamps: true,
        collection: 'subscription',
        versionKey: false
    }
);

exports.subscriptionModel = mongoose.model('subscription', subscriptionSchema);