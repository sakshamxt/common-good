import axiosInstance from './axiosInstance'; // Make sure this path is correct for your project

/**
 * Fetches all conversations for the currently authenticated user.
 * @param {object} params - Query parameters for pagination, sorting (e.g., { limit: 20, page: 1 }).
 * @returns {Promise<object>} The API response data (expects { conversations: [] }).
 */
export const getConversations = async (params = {}) => {
  const response = await axiosInstance.get('/conversations', { params });
  // Backend (Section 9) returns: { status: 'success', results: number, data: { conversations: [] } }
  return response.data.data;
};

/**
 * Starts a new conversation or sends the first message.
 * @param {object} data - { receiverId, listingId (optional), content }
 * @returns {Promise<object>} The API response data (expects { conversation: {}, message: {} }).
 */
export const startConversation = async (data) => {
  const response = await axiosInstance.post('/conversations', data);
  // Backend (Section 8) returns: { status: 'success', data: { conversation, message } }
  return response.data.data;
};

/**
 * Fetches messages for a specific conversation.
 * @param {string} conversationId - The ID of the conversation.
 * @param {object} params - Query parameters for pagination (e.g., { limit: 30, page: 1, sort: '-createdAt' }).
 * @returns {Promise<object>} The API response data (expects { messages: [] }).
 */
export const getMessagesForConversation = async (conversationId, params = {}) => {
  if (!conversationId) throw new Error("Conversation ID is required.");
  const response = await axiosInstance.get(`/conversations/${conversationId}/messages`, { params });
  // Backend (Section 9) returns: { status: 'success', results: number, data: { messages: [] } }
  return response.data.data;
};

/**
 * Sends a message in an existing conversation.
 * @param {string} conversationId - The ID of the conversation.
 * @param {object} data - { content: "String" }
 * @returns {Promise<object>} The API response data (expects { message: {} }).
 */
export const sendMessageInConversation = async (conversationId, data) => {
  if (!conversationId) throw new Error("Conversation ID is required.");
  const response = await axiosInstance.post(`/conversations/${conversationId}/messages`, data);
  // Backend (Section 9) returns: { status: 'success', data: { message: {} } }
  return response.data.data;
};