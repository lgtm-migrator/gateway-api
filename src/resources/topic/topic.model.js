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
    relatedEntity: {
        type: Schema.Types.ObjectId,
        ref: 'Data'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    toJSON:     { virtuals: true },
    toObject:   { virtuals: true }
});

// Virtual Populate  - Topic to bring back messages if topics querried messages without persisting it to the db, it doesnt slow down the query - populate in route
TopicSchema.virtual('messages', {
    ref: 'Messages',
    foreignField: 'topicId',
    localFied: '_id'
});

export const TopicModel = model('Topics', TopicSchema);