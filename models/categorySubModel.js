var { mongoose, conn } = require('../configs/db');

const categorySchema = new mongoose.Schema({
    image: {
        type: String,
        default: ''
    },
    category_sub_name: {
        type: String,
        default: ''
    },
    is_deleted:{
        type: Boolean,
        default: false
    }
},
    {
        strict: true,
        timestamps: true,
        collection: 'category_sub',
        versionKey: false
    }
);

exports.categoryModel = mongoose.model('category_sub', categorySchema);