var { mongoose, conn } = require('../configs/db');

const commissionSchema = new mongoose.Schema({
    category: {
        type: mongoose.Types.ObjectId,
        ref: 'category'
    },
    subCategory: {
      type: mongoose.Types.ObjectId,
      ref: 'subCategory'
    },
    subSubCategory: {
      type: mongoose.Types.ObjectId,
      ref: 'subSubCategory'
    },
    commission: {
      type: Number,
      default: 0 // in percent
    },
    isBlocked:{
      type: Boolean,
      default: false
    },
    isDeleted:{
        type: Boolean,
        default: false
    }
},
    {
        strict: true,
        timestamps: true,
        collection: 'commission',
        versionKey: false
    }
);

exports.CommissionModel = mongoose.model('commission', commissionSchema);