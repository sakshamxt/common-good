// src/pages/messaging/ConversationsPage.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams, Outlet } from 'react-router-dom'; // Outlet
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getConversations } from '@/api/messageService';
import { useAuth } from '@/hooks/useAuth';
import ConversationListItem from '@/components/messaging/ConversationListItem';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import MessageInput from '@/components/messaging/MessageInput'; // Import MessageInput for new convos
import { MessageSquarePlus, Inbox, ArrowLeft } from 'lucide-react';


const ConversationsPage = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { conversationId: activeConversationId } = useParams(); // From nested route
  const queryClient = useQueryClient();

  const searchParams = new URLSearchParams(location.search);
  const newConvoReceiverId = searchParams.get('receiverId');
  const newConvoListingId = searchParams.get('listingId');
  
  // State to manage if we are in "new message" mode from URL params
  const [isComposingNew, setIsComposingNew] = useState(false);

  useEffect(() => {
    if (location.pathname === "/messages/new" && newConvoReceiverId) {
      setIsComposingNew(true);
      // Clear selected conversation if navigating to /new
      if (activeConversationId) navigate('/messages/new' + location.search, {replace: true});
    } else {
      setIsComposingNew(false);
    }
  }, [location.pathname, newConvoReceiverId, activeConversationId, navigate, location.search]);


  const { data: conversationsData, isLoading, isError, error } = useQuery({
    queryKey: ['conversations', currentUser?._id],
    queryFn: () => getConversations({ sort: '-updatedAt' }), // Sort by most recently updated
    enabled: !!currentUser?._id,
  });
  const conversations = conversationsData?.conversations || [];

  const handleSelectConversation = (convId) => {
    setIsComposingNew(false); // Exit new compose mode if any
    navigate(`/messages/${convId}`);
  };

  const handleNewMessageSent = (sentMessage, createdConversationId) => {
    // This callback is from MessageInput when a new conversation is started
    setIsComposingNew(false);
    queryClient.invalidateQueries({ queryKey: ['conversations', currentUser?._id]});
    if (createdConversationId) {
      navigate(`/messages/${createdConversationId}`, { replace: true });
    }
  };
  
  return (
    <div className="flex h-[calc(100vh-var(--header-height,4rem))] border-t">
      <aside className={`w-full md:w-1/3 lg:w-1/4 xl:w-1/5 border-r flex-col bg-slate-50 dark:bg-slate-800 ${activeConversationId && !isComposingNew ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Chats</h2>
           <Button variant="ghost" size="icon" onClick={() => { setIsComposingNew(true); navigate('/messages/new');}}>
              <MessageSquarePlus className="h-5 w-5" />
              <span className="sr-only">New Chat</span>
          </Button>
        </div>
        <ScrollArea className="flex-1">
          {isLoading && <div className="p-4 text-center"><LoadingSpinner /></div>}
          {isError && <p className="p-4 text-red-500 text-sm">Error: {error.message}</p>}
          {!isLoading && !isError && conversations.length === 0 && (
            <div className="p-6 text-center text-sm text-slate-500 h-full flex flex-col justify-center items-center">
              <Inbox className="w-16 h-16 text-slate-300 mb-4" />
              <p>No conversations yet.</p>
            </div>
          )}
          {conversations.map(conv => (
            <ConversationListItem
              key={conv._id}
              conversation={conv}
              currentUserId={currentUser?._id}
              isSelected={activeConversationId === conv._id && !isComposingNew}
              onClick={() => handleSelectConversation(conv._id)}
            />
          ))}
        </ScrollArea>
      </aside>

      <main className={`flex-1 flex flex-col ${!activeConversationId && !isComposingNew ? 'hidden md:flex' : 'flex'}`}>
        {isComposingNew && newConvoReceiverId ? (
          <div className="flex flex-col h-full">
            <header className="p-3 border-b flex items-center space-x-3 bg-white dark:bg-slate-900">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => {setIsComposingNew(false); navigate('/messages');}}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h3 className="text-md font-semibold">New Message to User ID: {newConvoReceiverId.substring(0,8)}...</h3>
                {newConvoListingId && <p className="text-xs text-slate-500">Re: Listing ID: {newConvoListingId.substring(0,8)}...</p>}
            </header>
            <div className="flex-1 p-4 text-center bg-slate-50 dark:bg-slate-800/50">
                <p className="text-sm text-slate-600">Compose your first message.</p>
            </div>
            <MessageInput 
              receiverIdForNew={newConvoReceiverId} 
              listingIdForNew={newConvoListingId}
              onMessageSent={handleNewMessageSent}
            />
          </div>
        ) : activeConversationId ? (
          <Outlet /> // This will render MessageArea for /messages/:conversationId
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-white dark:bg-slate-900">
            <MessageSquarePlus className="w-24 h-24 text-slate-300 dark:text-slate-600 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Select a conversation</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
                Or start a new one.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default ConversationsPage;