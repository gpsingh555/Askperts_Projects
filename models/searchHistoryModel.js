var { mongoose, conn } = require('../configs/db');

const searchHistorySchema = new mongoose.Schema({
    searchData: {
        type: String,
        required: true
    },
    user:{
        type: mongoose.Types.ObjectId,
        ref:'user'
    }
},
    {
        strict: true,
        timestamps: true,
        collection: 'searchHistory',
        versionKey: false
    }
);

exports.searchHistoryModel = mongoose.model('searchHistory', searchHistorySchema);