// src/components/messaging/ConversationListItem.jsx
import React from 'react';
import { Link } from 'react-router-dom'; // Import Link
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNowStrict } from 'date-fns';
import { Package } from 'lucide-react'; // Icon for listing context

const ConversationListItem = ({ conversation, currentUserId, isSelected, onClick }) => {
  if (!conversation || !conversation.participants) return null;

  const otherParticipants = conversation.participants.filter(p => p._id !== currentUserId);
  const displayParticipant = otherParticipants[0] || conversation.participants[0];

  const getAvatarFallback = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    return parts.length > 1 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  const lastMessage = conversation.lastMessage;
  // Backend 'getConversations' populates listing with title and photos
  const listingContext = conversation.listing; 

  // Determine if the last message is unread by the current user
  const isUnread = lastMessage && lastMessage.sender !== currentUserId && !lastMessage.isRead;
  // Note: `unreadMessagesCount` was a placeholder; actual unread status depends on `lastMessage.isRead`
  // or more complex backend logic for counts. For now, just bolding last message if unread.

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left p-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors rounded-lg flex items-start space-x-3",
        isSelected && "bg-slate-100 dark:bg-slate-700"
      )}
    >
      <Avatar className="h-10 w-10 border">
        <AvatarImage src={displayParticipant?.profilePictureUrl} alt={displayParticipant?.name} />
        <AvatarFallback>{getAvatarFallback(displayParticipant?.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <p className={cn(
            "text-sm font-medium text-slate-800 dark:text-slate-100 truncate",
            isSelected && "font-bold"
          )}>
            {displayParticipant?.name || "Unknown User"}
          </p>
          {lastMessage?.createdAt && (
            <p className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
              {formatDistanceToNowStrict(new Date(lastMessage.createdAt), { addSuffix: true })}
            </p>
          )}
        </div>
        
        {/* Listing Context Line */}
        {listingContext && listingContext.title && (
          <Link 
            to={`/listings/${listingContext._id}`} 
            onClick={(e) => e.stopPropagation()} // Prevent conversation selection when clicking listing link
            className="text-xs text-primary dark:text-primary/80 hover:underline truncate flex items-center mt-0.5"
            title={listingContext.title}
          >
            <Package size={14} className="mr-1 flex-shrink-0" /> 
            {listingContext.title}
          </Link>
        )}

        <div className="flex justify-between items-center mt-0.5"> {/* Adjusted margin */}
          <p className={cn(
            "text-xs text-slate-500 dark:text-slate-400 truncate",
            isUnread && "font-bold text-slate-700 dark:text-slate-200"
          )}>
            {lastMessage ? 
              ((lastMessage.sender === currentUserId ? "You: " : "") + (lastMessage.content || "...")).substring(0, 50) + (lastMessage.content?.length > 50 ? "..." : "")
              : 
              "No messages yet"}
          </p>
          {isUnread && !isSelected && (
            <span className="h-2.5 w-2.5 bg-primary rounded-full ml-auto flex-shrink-0"></span> // unread dot indicator
          )}
        </div>
      </div>
    </button>
  );
};

export default ConversationListItem;