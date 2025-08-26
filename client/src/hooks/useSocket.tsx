import { useEffect, useRef, useState } from 'react';
import type { RealTimeUpdate } from '@/types';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  const connect = () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    try {
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        socketRef.current = null;
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      setIsConnected(false);
    }
  };

  const subscribe = (callback: (update: RealTimeUpdate) => void) => {
    if (!socketRef.current) return () => {};

    const handleMessage = (event: MessageEvent) => {
      try {
        const update = JSON.parse(event.data) as RealTimeUpdate;
        setLastUpdate(new Date());
        callback(update);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    socketRef.current.addEventListener('message', handleMessage);

    return () => {
      socketRef.current?.removeEventListener('message', handleMessage);
    };
  };

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return {
    isConnected,
    lastUpdate,
    subscribe,
    reconnect: connect
  };
}
