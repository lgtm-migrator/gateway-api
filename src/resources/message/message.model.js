import { model, Schema } from 'mongoose'

const MessageSchema = new Schema({
  messageID: Number,
  messageTo: Number,
  messageObjectID: Number,
  messageDescription: String,
  messageType: {
    type: String,
    enum: ['message', 
           'notification', 
           'add', 
           'approved', 
           'author'
          ],
    default: 'notification'
  },
  createdBy:{
    type: Schema.Types.ObjectId, 
    ref: 'User'
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type:  String,
    enum : ['true','false'],
    default: 'false'
  },
  topic: { 
    type: Schema.Types.ObjectId, 
    ref: 'Topic'
  },
  readBy: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdByName: {
    type: Object
  }
},{
  toJSON: { virtuals: true},
  toObject: { virtuals: true}
});


export const MessagesModel = model('Messages', MessageSchema);