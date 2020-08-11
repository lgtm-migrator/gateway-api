import { model, Schema } from 'mongoose'

const MessageSchema = new Schema({
  messageID: Number,
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
    default: 'message'
  },
  createdBy:{
    type: Number,
    required: [true, 'User is required']
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
  topicId: { 
    type: Schema.Types.ObjectId, 
    ref: 'Topic'
  }
},{
  toJSON: { virtuals: true},
  toObject: { virtuals: true}
});

// MessageSchema.pre(/^find/, (next) => {
//   }).populate({
//     path: 'user',
//     select: 'firstname lastname'
//   });
//   next();
// })

export const MessagesModel = model('Messages', MessageSchema);