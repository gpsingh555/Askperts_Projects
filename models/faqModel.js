var { mongoose, conn } = require('../configs/db');

const faqSchema = new mongoose.Schema({
    question:{
        type:String,
        default: true
    },
    answer:{
        type:String,
        default: true
    },
 
    type:{
        type:Number,
        default:0   //  0 for user, 1 for consultant
    }
},
    {
        strict: true,
        collection: 'faq',
        versionKey: false
    }
);

exports.faqModel = mongoose.model('faq', faqSchema);