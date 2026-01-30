// ===========================================
// Socket.io Client Service (Mobile)
// ===========================================

import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001';

export type SocketEventCallback<T = unknown> = (data: T) => void;

interface BoothUpdate {
  boothId: string;
  status: string;
  nextAvailable?: string;
}

interface LocationUpdate {
  locationId: string;
  availableBooths: number;
}

interface BookingUpdate {
  id: string;
  status: string;
  startTime?: string;
  endTime?: string;
}

interface DeviceStatus {
  id: string;
  status: string;
  batteryLevel?: number;
}

class SocketService {
  private static instance: SocketService;
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  // Connect to socket server
  async connect(): Promise<Socket | null> {
    const token = await SecureStore.getItemAsync('accessToken');

    if (!token) {
      console.log('No auth token, cannot connect to socket');
      return null;
    }

    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventHandlers();

    return this.socket;
  }

  // Disconnect from socket server
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.reconnectAttempts = 0;
    }
  }

  // Setup default event handlers
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.log('Max reconnection attempts reached');
        this.disconnect();
      }
    });
  }

  // Subscribe to booth updates
  subscribeToBooth(boothId: string): void {
    if (!this.socket) return;
    this.socket.emit('subscribe:booth', boothId);
  }

  // Unsubscribe from booth updates
  unsubscribeFromBooth(boothId: string): void {
    if (!this.socket) return;
    this.socket.emit('unsubscribe:booth', boothId);
  }

  // Subscribe to location updates
  subscribeToLocation(locationId: string): void {
    if (!this.socket) return;
    this.socket.emit('subscribe:location', locationId);
  }

  // Unsubscribe from location updates
  unsubscribeFromLocation(locationId: string): void {
    if (!this.socket) return;
    this.socket.emit('unsubscribe:location', locationId);
  }

  // Listen to booth updates
  onBoothUpdate(callback: SocketEventCallback<BoothUpdate>): () => void {
    if (!this.socket) return () => {};

    this.socket.on('booth:update', callback);
    return () => {
      this.socket?.off('booth:update', callback);
    };
  }

  // Listen to location updates
  onLocationUpdate(callback: SocketEventCallback<LocationUpdate>): () => void {
    if (!this.socket) return () => {};

    this.socket.on('location:update', callback);
    return () => {
      this.socket?.off('location:update', callback);
    };
  }

  // Listen to booking updates
  onBookingUpdate(callback: SocketEventCallback<BookingUpdate>): () => void {
    if (!this.socket) return () => {};

    this.socket.on('booking:update', callback);
    return () => {
      this.socket?.off('booking:update', callback);
    };
  }

  // Listen to device status updates (for operators)
  onDeviceStatus(callback: SocketEventCallback<DeviceStatus>): () => void {
    if (!this.socket) return () => {};

    this.socket.on('device:status', callback);
    return () => {
      this.socket?.off('device:status', callback);
    };
  }

  // Check if connected
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Get socket instance
  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = SocketService.getInstance();
