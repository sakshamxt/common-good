import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.ObjectId,
      ref: 'Conversation',
      required: [true, 'Message must belong to a conversation.'],
    },
    sender: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Message must have a sender.'],
    },
    receiver: {
      // Though conversation has participants, explicitly naming receiver can simplify some queries
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Message must have a receiver.'],
    },
    content: {
      type: String,
      trim: true,
      required: [true, 'Message cannot be empty.'],
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    // attachments: [ // Future: for file/image attachments in messages
    //   {
    //     url: String,
    //     public_id: String,
    //     fileType: String
    //   }
    // ]
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Only createdAt for messages usually
  }
);

// Populate sender details when a message is fetched
messageSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'sender',
    select: 'name profilePictureUrl', // Select only necessary sender fields
  });
  next();
});

const Message = mongoose.model('Message', messageSchema);

export default Message;