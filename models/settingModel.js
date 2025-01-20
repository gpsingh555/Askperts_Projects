var { mongoose, conn } = require('../configs/db');

const settingSchema = new mongoose.Schema({
    termsAndCondtion:{         // 0 
        type: String ,
        default: 'null'
    },
    privacyPolicy:{            // 1
        type:String,
        default: 'null'
    },
    aboutUs:{
        email:{type:String,default:""},
        mobile:{type:String,default:""},
        country_code:{type:String,default:""}
    },
    legal:{                    // 2
        type: String ,
        default: 'null'
    },
    
    help:{                     //  3
        type: String ,
        default: 'null'
    },
    type:{
        type:Number,
        default:0   //  0 for user, 1 for consultant
    }
},
    {
        strict: true,
        collection: 'setting',
        versionKey: false
    }
);

exports.settingModel = mongoose.model('setting', settingSchema);