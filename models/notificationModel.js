var { mongoose, conn } = require('../configs/db');

const notificationSchema = new mongoose.Schema({
    userId: [{
        type: mongoose.Schema.ObjectId,
        ref: 'user',
        default: null
    }],
    consultantId: [{
        type: mongoose.Schema.ObjectId,
        ref: 'consult',
        default: null
    }],

    admin: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "admin",
        default: null,

    }],

    notification: {
        title: { type: String, default: "" },
        body: { type: String, default: "" }
    },
    status: {
        type: Number,            // for showing notification list
        default: 0           //  0 user  , 1 consulatant , 2 Admin , 3 for all
    },
    notificationSendBy: {
        type: Number,            // Notification Sebd By
        default: 0           //  0 user  , 1 consulatant , 2 Admin , 
    },
    isRead: {
        type: Number,
        default: 0                    //  0 for unread , 1 for read , 2 for clear
    },
    createdAt: {
        type: Number,
        default: 0                    //  0 for unread , 1 for read , 2 for clear
    },
},
    {
        strict: true,
        collection: 'notification',
        versionKey: false
    }
);

exports.notificationModel = mongoose.model('notification', notificationSchema);