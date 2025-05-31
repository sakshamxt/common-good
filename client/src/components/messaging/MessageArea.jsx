// src/components/messaging/MessageArea.jsx
import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Added Link
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getMessagesForConversation } from '@/api/messageService';
import { useAuth } from '@/hooks/useAuth';
import MessageInput from './MessageInput';
import LoadingSpinner from '../common/LoadingSpinner';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ArrowLeft, Info, Package, ChevronUp } from 'lucide-react'; // Added Package icon
import { getConversationByIdFromCache } from '@/utils/chatUtils';

const MESSAGES_PER_PAGE = 20;

const MessageArea = () => {
  const { conversationId } = useParams();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const topMessageRef = useRef(null);
  // const scrollAreaRef = useRef(null); // scrollAreaRef was defined but not strictly necessary for the current scroll logic

  // Fetch conversation details (includes participants and potentially listing if populated)
  const conversationData = getConversationByIdFromCache(queryClient, currentUser?._id, conversationId);
  const otherParticipant = conversationData?.participants?.find(p => p._id !== currentUser?._id);
  const listingContext = conversationData?.listing; // Get listing from conversation details

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getMessagesForConversation(conversationId, {
        page: pageParam,
        limit: MESSAGES_PER_PAGE,
        sort: '-createdAt',
      });
      return {
        messages: result.messages.reverse(), // To display oldest first in this batch
        nextPageCursor: result.messages.length === MESSAGES_PER_PAGE ? pageParam + 1 : undefined,
        currentPage: pageParam,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPageCursor,
    enabled: !!conversationId && !!currentUser,
  });

  const messages = data ? data.pages.flatMap(page => page.messages) : [];

  useEffect(() => {
    if (messages.length > 0 && !isFetchingNextPage) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages.length, conversationId, isFetchingNextPage]);

  const handleMessageSentOptimistically = (newMessage) => {
    // ... (optimistic update logic from previous step)
     if (newMessage && conversationId) {
      queryClient.setQueryData(['messages', conversationId], (oldData) => {
        if (!oldData || !oldData.pages || oldData.pages.length === 0) {
          return {
            pages: [{ messages: [newMessage], nextPageCursor: undefined, currentPage: 1 }],
            pageParams: [1],
          };
        }
        const newPagesArray = oldData.pages.map(page => ({ ...page, messages: [...page.messages] }));
        newPagesArray[0].messages.unshift(newMessage); // Add to newest page, which is at index 0
        return { ...oldData, pages: newPagesArray };
      });
    }
  };
  
  const handleLoadOlderMessages = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  if (!conversationId) return null;
  if (isLoading && messages.length === 0) return <div className="flex-1 flex items-center justify-center"><LoadingSpinner size={40} /></div>;
  if (isError) return <div className="flex-1 p-4 text-red-500">Error loading messages: {error.message}</div>;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900">
      <header className="p-3 border-b dark:border-slate-700 flex items-center space-x-3 bg-white dark:bg-slate-800 sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => navigate('/messages')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        {otherParticipant && (
          <Avatar className="h-9 w-9">
            <AvatarImage src={otherParticipant.profilePictureUrl} alt={otherParticipant.name} />
            <AvatarFallback>{otherParticipant.name?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0"> {/* Added min-w-0 for truncation to work */}
          {otherParticipant && (
            <p className="text-sm font-semibold truncate dark:text-slate-50">{otherParticipant.name}</p>
          )}
          {/* Display Listing Context */}
          {listingContext && listingContext.title && (
            <Link 
              to={`/listings/${listingContext._id}`} 
              className="text-xs text-primary dark:text-primary/80 hover:underline truncate flex items-center"
              title={listingContext.title}
            >
              <Package size={12} className="mr-1 flex-shrink-0" />
              {listingContext.title}
            </Link>
          )}
        </div>
        <div className="flex-shrink-0"> {/* Prevent info button from causing overflow */}
          {/* <Button variant="ghost" size="icon"><Info className="h-5 w-5"/></Button> Placeholder */}
        </div>
      </header>

      <ScrollArea className="flex-1 p-3 space-y-3"> {/* Removed ref={scrollAreaRef} as it wasn't actively used for scroll restoration yet */}
        {hasNextPage && (
          <div className="text-center mb-4" ref={topMessageRef}>
            <Button variant="outline" size="sm" onClick={handleLoadOlderMessages} disabled={isFetchingNextPage}>
              {isFetchingNextPage ? <LoadingSpinner size={16} /> : <ChevronUp className="mr-2 h-4 w-4" />}
              Load Older Messages
            </Button>
          </div>
        )}
        {messages.length === 0 && !isLoading && <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-10">No messages yet. Send one below!</p>}
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={cn("flex items-end space-x-2 max-w-[75%]", msg.sender._id === currentUser?._id ? "ml-auto flex-row-reverse space-x-reverse" : "mr-auto")}
          >
            {msg.sender._id !== currentUser?._id && (
                 <Link to={`/profile/${msg.sender._id}`} className="flex-shrink-0">
                    <Avatar className="h-7 w-7 self-end mb-1">
                        <AvatarImage src={msg.sender.profilePictureUrl} />
                        <AvatarFallback>{msg.sender.name?.[0]?.toUpperCase()}</AvatarFallback>
                    </Avatar>
                 </Link>
            )}
            <div
              className={cn("p-2.5 rounded-lg text-sm shadow-sm min-w-[60px]", msg.sender._id === currentUser?._id ? "bg-primary text-primary-foreground rounded-br-none" : "bg-white dark:bg-slate-700 dark:text-slate-50 rounded-bl-none")}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              <p className={cn("text-xs mt-1 opacity-80", msg.sender._id === currentUser?._id ? "text-right" : "")}>
                {format(new Date(msg.createdAt), "p")}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollArea>

      <MessageInput 
        conversationId={conversationId} 
        onMessageSent={handleMessageSentOptimistically} 
      />
    </div>
  );
};

export default MessageArea;