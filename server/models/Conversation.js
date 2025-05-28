import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    listing: {
      // A conversation can be initiated regarding a specific listing
      type: mongoose.Schema.ObjectId,
      ref: 'Listing',
      // required: true // Make this optional if conversations can exist without a listing context
    },
    lastMessage: {
      type: mongoose.Schema.ObjectId,
      ref: 'Message',
    },
    // lastMessageAt: { // Alternative or addition to lastMessage ref, stores the timestamp directly
    //   type: Date,
    //   default: Date.now,
    //   index: true // Good for sorting conversations
    // }
  },
  {
    timestamps: true, // createdAt, updatedAt for the conversation itself
  }
);

// Ensure a unique conversation between the same set of participants regarding the same listing
// Note: MongoDB compound index on array fields can be tricky if order matters or for exact set match.
// A simpler approach might be to ensure this uniqueness at the application level during creation.
// However, if a listing is optional, the uniqueness constraint needs to be more complex.
// For participants, the order doesn't matter.
// A common way to handle this is to always store participant IDs in a sorted order in the array
// then create a unique compound index. Or handle in application logic.

// Pre-save hook to sort participants array to ensure uniqueness regardless of order
conversationSchema.pre('save', function (next) {
  if (this.isModified('participants')) {
    this.participants.sort(); // Sorts participant IDs alphabetically/numerically
  }
  next();
});

// Index to help find conversations by participants efficiently
// This index works best if participants are always sorted before saving.
conversationSchema.index({ participants: 1 });
// If listing is often part of the query to find unique conversations:
// conversationSchema.index({ participants: 1, listing: 1 }, { unique: true });
// ^ This unique index could be too strict if listing can be null, or if multiple convos about same listing are allowed.
// For now, we'll rely on application logic to find/create conversations.

// Populate participants and lastMessage details
conversationSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'participants',
    select: 'name profilePictureUrl', // Select necessary fields
  });
  // this.populate({ // Populating lastMessage can be done here or on demand
  //   path: 'lastMessage',
  //   select: 'content sender createdAt isRead',
  //   populate: { path: 'sender', select: 'name profilePictureUrl' }
  // });
  next();
});


const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;