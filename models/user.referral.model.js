var { mongoose, conn } = require('../configs/db');

const userReferralSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        ref:'user'
    },
    referral_user_id: {
        type: mongoose.Types.ObjectId,
        ref:'user'
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
        collection: 'user_referral',
        versionKey: false
    }
);

exports.UserReferralModel = mongoose.model('user_referral', userReferralSchema);

