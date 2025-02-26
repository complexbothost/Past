import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// Define the type for a notification
interface Notification {
  id: string;
  type: 'admin_paste' | 'system';
  message: string;
  pasteId?: number;
  authorName?: string;
  timestamp: Date;
}

// Context for notifications
type NotificationContextType = {
  notifications: Notification[];
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
};

const NotificationContext = createContext<NotificationContextType>({
  notifications: [],
  clearNotification: () => {},
  clearAllNotifications: () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [_, navigate] = useLocation();

  // Initialize WebSocket connection
  useEffect(() => {
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const newSocket = new WebSocket(wsUrl);
    
    newSocket.onopen = () => {
      console.log('WebSocket connection established');
      
      // If user is logged in, send authentication
      if (user) {
        newSocket.send(JSON.stringify({
          type: 'auth',
          userId: user.id
        }));
      }
    };
    
    newSocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle admin paste notifications
        if (data.type === 'admin_paste') {
          // Create notification
          const notification: Notification = {
            id: `admin-paste-${Date.now()}`,
            type: 'admin_paste',
            message: data.message,
            pasteId: data.pasteId,
            authorName: data.authorName,
            timestamp: new Date()
          };
          
          // Add to notifications
          setNotifications(prev => [notification, ...prev]);
          
          // Show toast
          toast({
            title: "Admin Paste",
            description: (
              <div>
                {data.message}
                <div className="mt-2">
                  <button 
                    className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded text-sm"
                    onClick={() => {
                      navigate(`/paste/${data.pasteId}`);
                    }}
                  >
                    View Paste
                  </button>
                </div>
              </div>
            ),
            duration: 10000, // 10 seconds
          });
        }
      } catch (err) {
        console.error('Error processing WebSocket message:', err);
      }
    };
    
    newSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    newSocket.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    setSocket(newSocket);
    
    // Clean up on unmount
    return () => {
      newSocket.close();
    };
  }, []);
  
  // Re-authenticate when user changes
  useEffect(() => {
    if (socket && socket.readyState === WebSocket.OPEN && user) {
      socket.send(JSON.stringify({
        type: 'auth',
        userId: user.id
      }));
    }
  }, [user, socket]);

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        clearNotification,
        clearAllNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
