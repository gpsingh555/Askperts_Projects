var { mongoose, conn } = require('../configs/db');

const callingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Types.ObjectId,
        ref:'user'
    },
    serviceId:{
        type: String,
        default: ''
    },
    uid:{
        type: String,
        default: ''
    },
    channel:{
        type: String,
        default: ''
    },
    agoraToken:{
        type: String,
        default: ''
    },
    status: {
        type: Number,
        default: 1   // 1 for apply, 2 for accepted, 3 for completed
    },
    category:{
        type: mongoose.Types.ObjectId,
        ref:'category'
    },
    category_sub:{
        type: mongoose.Types.ObjectId,
        ref:'subCategory',
        default : null
    },
    category_sub_sub:{
        type: mongoose.Types.ObjectId,
        ref:'subSubCategory',
        default : null
    },
    consultant:{
        type:mongoose.Types.ObjectId,
        ref:'consult'
    },
    subscriptionId:{
        type:mongoose.Types.ObjectId,
        ref:'applySubscription'
    },
    call_rating: {
        type: Number,
        default: 0
    },
    call_review: {
        type: String,
        default: null
    },
    time_duration:{
        type: String,
        default: 0
    },
    
    calId:{
        type: String,
        default: 0
    },
    call_start_at:{
        type: Number,
        default: Date.now()
    },
    call_mode:{
        type: Number,
        default: 1
    },
    commission:{
        type: Number,
        default: 0
    },
    paymentStatus:{
        type: Number,
        default: 0      // 0 for unpaid 1 for paid
    },
    created_on: {
        type: Number,
        default: new Date().getTime()
    }

},
    {
        strict: true,
        timestamps: true,
        collection: 'calling',
        versionKey: false
    }
);

exports.callingModel = mongoose.model('calling', callingSchema);