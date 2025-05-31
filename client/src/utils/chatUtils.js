// src/utils/chatUtils.js

/**
 * Helper to get specific conversation details from the cached list of conversations.
 * @param {import('@tanstack/react-query').QueryClient} queryClient
 * @param {string} currentUserId - ID of the current user, part of the conversations query key.
 * @param {string} conversationId - ID of the conversation to find.
 * @returns {object | undefined} The conversation object or undefined.
 */
export const getConversationByIdFromCache = (queryClient, currentUserId, conversationId) => {
  if (!currentUserId || !conversationId) return undefined;
  
  const conversationsData = queryClient.getQueryData(['conversations', currentUserId]);
  return conversationsData?.conversations?.find(c => c._id === conversationId);
};