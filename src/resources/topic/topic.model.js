import { model, Schema } from 'mongoose'
import { stringify } from 'query-string';

const TopicSchema = new Schema({
    title: {
        type: String,
        default: '',
        trim: true
    },
    subTitle: {
        type: String,
        default: '',
        trim: true
    },
    recipients: [{
        type: Schema.Types.ObjectId,
        ref: 'User'
    }],
    status:  {
        type: String,
        enum : ['active','closed'],
        default: 'active'
    },
    createdDate: {
        type: Date,
        default: Date.now
    },
    exiryDate: {
        type: Date
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    relatedObjectIds: [{
        type: Schema.Types.ObjectId,
        ref: 'Data'
    }],
    isDeleted: {
        type: Boolean,
        default: false
    },
    unreadMessages: {
        type: Number,
        default: 0
    },
    lastUnreadMessage: {
        type: Date
    },
    dataSetIds: [{
        type: String
    }],
    tags: [{
        type: String
    }]
}, {
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true }
});

// Virtual Populate  - Topic to bring back messages if topics querried messages without persisting it to the db, it doesnt slow down the query - populate in route
TopicSchema.virtual('topicMessages', {
    ref: 'Messages',
    foreignField: 'topic',
    localField: '_id'
});

TopicSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'createdBy',
        select: 'firstname lastname',
        path:  'topicMessages',
        select: 'messageDescription createdDate isRead _id readBy',
        options: { sort: '-createdDate' },
            populate: { 
                path:  'createdBy',
                model: 'User',
                select: '-_id firstname lastname'
            }
    });

    next();
});





export const TopicModel = model('Topics', TopicSchema);