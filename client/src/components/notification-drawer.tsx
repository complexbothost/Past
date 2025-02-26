import { useNotifications } from './notification-provider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BellRing, Check, ExternalLink, TrashIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useLocation } from 'wouter';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';

export default function NotificationDrawer() {
  const { notifications, clearNotification, clearAllNotifications } = useNotifications();
  const [_, navigate] = useLocation();

  const formatTimestamp = (date: Date) => {
    return format(date, 'MMM d, h:mm a');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <BellRing className="h-5 w-5 text-zinc-300" />
          {notifications.length > 0 && (
            <Badge variant="destructive" className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 text-xs">
              {notifications.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[380px] sm:w-[440px] bg-zinc-900 border-zinc-800">
        <SheetHeader className="pb-4 border-b border-zinc-800">
          <SheetTitle className="flex justify-between items-center">
            <span>Notifications</span>
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => clearAllNotifications()}
                className="text-xs"
              >
                <Check className="h-3 w-3 mr-1" /> Clear All
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            Stay updated with new admin pastes and system announcements
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-10rem)] mt-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-zinc-400">
              <BellRing className="h-10 w-10 mb-3 opacity-20" />
              <p>No new notifications</p>
              <p className="text-sm mt-1">Notifications about admin pastes will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="relative bg-zinc-800/70 rounded-lg p-4 border border-zinc-700"
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={notification.type === 'admin_paste' ? 'default' : 'secondary'} className="mb-2">
                      {notification.type === 'admin_paste' ? 'Admin Paste' : 'System'}
                    </Badge>
                    <span className="text-xs text-zinc-400">{formatTimestamp(notification.timestamp)}</span>
                  </div>
                  
                  <p className="text-white mb-3">{notification.message}</p>
                  
                  <div className="flex justify-between mt-2">
                    {notification.pasteId && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => {
                          navigate(`/paste/${notification.pasteId}`);
                        }}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" /> View Paste
                      </Button>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs ml-auto"
                      onClick={() => clearNotification(notification.id)}
                    >
                      <TrashIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
