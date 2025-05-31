// src/components/messaging/MessageInput.jsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendMessageInConversation, startConversation } from '@/api/messageService'; // Assuming startConversation is also needed here for the /new flow
import { useAuth } from '@/hooks/useAuth';
import toast from 'react-hot-toast';

import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Send } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';

const messageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty.").max(2000, "Message too long."),
});

const MessageInput = ({ conversationId, receiverIdForNew, listingIdForNew, onMessageSent }) => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
    },
  });

  const { mutate: sendExisting, isLoading: isSendingExisting } = useMutation({
    mutationFn: (data) => sendMessageInConversation(conversationId, data),
    onSuccess: (newMessageData) => { // newMessageData is { message: { ... } } from backend
      form.reset();
      // Invalidation will make sure data is consistent eventually
      queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?._id] });
      
      // Call the callback for optimistic update in MessageArea
      if (onMessageSent && newMessageData.message) {
        onMessageSent(newMessageData.message); 
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to send message.");
    },
  });

  const { mutate: sendNew, isLoading: isSendingNew } = useMutation({
    mutationFn: (data) => startConversation({ 
      receiverId: receiverIdForNew, 
      listingId: listingIdForNew, 
      content: data.content 
    }),
    onSuccess: (newConversationData) => { // newConversationData is { conversation: {}, message: {} }
      form.reset();
      toast.success("Conversation started!");
      queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?._id] });
      // Call onMessageSent with the new message and the NEW conversation ID
      // The parent (ConversationsPage) will handle navigation to this new conversation
      if (onMessageSent && newConversationData.message && newConversationData.conversation) {
        onMessageSent(newConversationData.message, newConversationData.conversation._id);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to start conversation.");
    },
  });

  const isLoading = isSendingExisting || isSendingNew;

  const onSubmit = (data) => {
    if (!currentUser) {
      toast.error("You must be logged in to send messages.");
      return;
    }
    if (conversationId) { // Sending to existing conversation
      sendExisting(data);
    } else if (receiverIdForNew) { // Starting a new conversation
      sendNew(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start space-x-2 p-3 border-t bg-slate-50 dark:bg-slate-800">
        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormControl>
                <Textarea
                  placeholder="Type your message..."
                  className="min-h-[50px] max-h-[150px] resize-none dark:bg-slate-700 dark:text-slate-50 dark:border-slate-600"
                  rows={1} // Start with 1 row, auto-expands with content
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (form.formState.isValid && !isLoading) {
                        form.handleSubmit(onSubmit)();
                      }
                    }
                  }}
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <Button type="submit" size="icon" disabled={isLoading || !form.formState.isValid} className="h-[50px] w-[50px]">
          {isLoading ? <LoadingSpinner size={20} /> : <Send className="h-5 w-5" />}
          <span className="sr-only">Send Message</span>
        </Button>
      </form>
    </Form>
  );
};

export default MessageInput;