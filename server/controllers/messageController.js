// controllers/messageController.js
import mongoose from 'mongoose';
import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import Listing from '../models/Listing.js';
import AppError from '../utils/appError.js';
import catchAsync from '../utils/catchAsync.js';
import APIFeatures from '../utils/apiFeatures.js'; // For pagination in getMessagesForConversation

// Start a new conversation (from Section 8)
export const startConversation = catchAsync(async (req, res, next) => {
  const { receiverId, listingId, content } = req.body;
  const senderId = req.user.id;

  if (!receiverId || !content) {
    return next(new AppError('Receiver and message content are required.', 400));
  }
  if (receiverId === senderId) {
    return next(new AppError('You cannot start a conversation with yourself.', 400));
  }

  if (listingId) {
    const listing = await Listing.findById(listingId);
    if (!listing) return next(new AppError('Listing not found.', 404));
  }

  const participants = [
    new mongoose.Types.ObjectId(senderId),
    new mongoose.Types.ObjectId(receiverId),
  ].sort();

  let conversationQuery = { participants: { $all: participants, $size: 2 } };
  if (listingId) {
    conversationQuery.listing = new mongoose.Types.ObjectId(listingId);
  } else {
    // If no listingId is provided, ensure we only match conversations without a listing
    // or handle as per your specific design for general vs listing-tied conversations.
    // For now, if listingId is not provided, it will find a conversation that has listing as null/undefined.
     conversationQuery.listing = { $exists: false };
  }

  let conversation = await Conversation.findOne(conversationQuery);

  if (!conversation) {
    conversation = await Conversation.create({
      participants,
      listing: listingId ? new mongoose.Types.ObjectId(listingId) : undefined,
    });
  }

  if (!conversation) {
      return next(new AppError('Failed to create or find conversation.', 500));
  }

  const newMessage = await Message.create({
    conversation: conversation._id,
    sender: senderId,
    receiver: receiverId,
    content,
  });

   if (!newMessage) {
      return next(new AppError('Failed to send message.', 500));
  }

  conversation.lastMessage = newMessage._id;
  await conversation.save();

  // For response, populate fields
  await newMessage.populate([
      { path: 'sender', select: 'name profilePictureUrl' },
      { path: 'receiver', select: 'name profilePictureUrl' }
  ]);
  await conversation.populate([
      { path: 'participants', select: 'name profilePictureUrl email' }, // Added email for frontend to identify users
      { path: 'listing', select: 'title photos' }, // Added photos for listing preview
      {
          path: 'lastMessage',
          populate: { path: 'sender', select: 'name' } // Keep lastMessage population simple
      }
  ]);

  res.status(201).json({
    status: 'success',
    data: {
      conversation,
      message: newMessage,
    },
  });
});

// NEW: Get all conversations for the logged-in user
export const getConversationsForUser = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const conversations = await Conversation.find({ participants: userId })
    .populate({ // Populate last message details
      path: 'lastMessage',
      select: 'content sender createdAt isRead',
      populate: {
        path: 'sender',
        select: 'name profilePictureUrl',
      },
    })
    .populate({ // Populate listing title if available
        path: 'listing',
        select: 'title photos' // Send first photo as preview
    })
    // The participants are already populated by the pre-find hook in Conversation.js
    // We might want to filter out the current user from the participants list for display purposes on the client-side.
    .sort({ updatedAt: -1 }); // Sort by when the conversation was last updated (e.g., new message)

  res.status(200).json({
    status: 'success',
    results: conversations.length,
    data: {
      conversations,
    },
  });
});

// NEW: Get messages for a specific conversation
export const getMessagesForConversation = catchAsync(async (req, res, next) => {
  const { conversationId } = req.params;
  const userId = req.user.id;

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return next(new AppError('Conversation not found.', 404));
  }

  // Ensure the logged-in user is a participant in this conversation
  if (!conversation.participants.some(p => p._id.equals(userId))) {
    return next(new AppError('You are not authorized to view this conversation.', 403));
  }

  // Mark messages as read for the current user in this conversation
  // This updates messages where the current user is the receiver.
  await Message.updateMany(
    { conversation: conversationId, receiver: userId, isRead: false },
    { $set: { isRead: true } }
  );

  // Pagination for messages
  const features = new APIFeatures(
    Message.find({ conversation: conversationId }), // Base query
    req.query // req.query for page, limit, sort
  )
  .sort() // Default sort in APIFeatures is -createdAt, which is good for messages (newest first)
  .paginate();

  const messages = await features.query;
  // Sender is populated by pre-find hook in Message.js

  res.status(200).json({
    status: 'success',
    results: messages.length,
    data: {
      messages,
      // You might want to include pagination metadata here if needed by the client
    },
  });
});

// NEW: Send a message in an existing conversation
export const sendMessageInConversation = catchAsync(async (req, res, next) => {
  const { conversationId } = req.params;
  const { content } = req.body;
  const senderId = req.user.id;

  if (!content) {
    return next(new AppError('Message content cannot be empty.', 400));
  }

  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    return next(new AppError('Conversation not found.', 404));
  }

  // Ensure the logged-in user is a participant
  if (!conversation.participants.some(p => p._id.equals(senderId))) {
    return next(new AppError('You are not authorized to send messages in this conversation.', 403));
  }

  // Determine the receiver
  const receiver = conversation.participants.find(p => !p._id.equals(senderId));
  if (!receiver) {
    // This should ideally not happen if conversation has 2 participants
    return next(new AppError('Could not determine the receiver for this message.', 500));
  }
  const receiverId = receiver._id;


  const newMessage = await Message.create({
    conversation: conversationId,
    sender: senderId,
    receiver: receiverId,
    content,
  });

  if (!newMessage) {
    return next(new AppError('Failed to send message.', 500));
  }

  // Update conversation's lastMessage and timestamps
  conversation.lastMessage = newMessage._id;
  conversation.updatedAt = Date.now(); // Manually update updatedAt to trigger sorting
  await conversation.save();

  // Populate sender for the response
  await newMessage.populate({ path: 'sender', select: 'name profilePictureUrl' });

  res.status(201).json({
    status: 'success',
    data: {
      message: newMessage,
    },
  });
});