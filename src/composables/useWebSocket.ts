import { ref, onMounted, onUnmounted, type Ref } from 'vue'
import { io, type Socket } from 'socket.io-client'
import type { WebSocketMessage, SeatUpdateMessage, TicketUpdateMessage } from '@/types'

interface WebSocketState {
  connected: boolean
  error: string | null
  lastMessage: WebSocketMessage | null
}

type MessageHandler = (message: WebSocketMessage) => void

export function useWebSocket() {
  const state = ref<WebSocketState>({
    connected: false,
    error: null,
    lastMessage: null,
  })

  const socket: Ref<Socket | null> = ref(null)
  const handlers = new Map<string, Set<MessageHandler>>()
  const reconnectAttempts = ref(0)
  const maxReconnectAttempts = 10
  const reconnectDelay = 1000

  const connect = () => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8109'
    
    socket.value = io(wsUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: reconnectDelay,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: maxReconnectAttempts,
      autoConnect: true,
    })

    socket.value.on('connect', () => {
      state.value.connected = true
      state.value.error = null
      reconnectAttempts.value = 0
      console.log('[WebSocket] Connected')
    })

    socket.value.on('disconnect', (reason) => {
      state.value.connected = false
      console.log(`[WebSocket] Disconnected: ${reason}`)
    })

    socket.value.on('connect_error', (error) => {
      state.value.error = error.message
      state.value.connected = false
      console.error('[WebSocket] Connection error:', error)
    })

    // Subscribe to real-time events
    socket.value.on('seat_update', (data: SeatUpdateMessage) => {
      dispatchMessage({ type: 'seat_update', payload: data.payload, timestamp: new Date().toISOString() })
    })

    socket.value.on('ticket_update', (data: TicketUpdateMessage) => {
      dispatchMessage({ type: 'ticket_update', payload: data.payload, timestamp: new Date().toISOString() })
    })

    socket.value.on('transfer_update', (data: unknown) => {
      dispatchMessage({ type: 'transfer_update', payload: data, timestamp: new Date().toISOString() })
    })

    socket.value.on('purchase_update', (data: unknown) => {
      dispatchMessage({ type: 'purchase_update', payload: data, timestamp: new Date().toISOString() })
    })

    socket.value.on('user_update', (data: unknown) => {
      dispatchMessage({ type: 'user_update', payload: data, timestamp: new Date().toISOString() })
    })

    socket.value.on('event_update', (data: unknown) => {
      dispatchMessage({ type: 'event_update', payload: data, timestamp: new Date().toISOString() })
    })
  }

  const dispatchMessage = (message: WebSocketMessage) => {
    state.value.lastMessage = message
    const handlerSet = handlers.get(message.type)
    if (handlerSet) {
      handlerSet.forEach(handler => handler(message))
    }
  }

  const subscribe = (eventType: string, handler: MessageHandler) => {
    if (!handlers.has(eventType)) {
      handlers.set(eventType, new Set())
    }
    handlers.get(eventType)!.add(handler)

    // Subscribe to the server-side channel
    if (socket.value?.connected) {
      socket.value.emit('subscribe', { channel: eventType })
    }

    return () => unsubscribe(eventType, handler)
  }

  const unsubscribe = (eventType: string, handler: MessageHandler) => {
    const handlerSet = handlers.get(eventType)
    if (handlerSet) {
      handlerSet.delete(handler)
      if (handlerSet.size === 0) {
        handlers.delete(eventType)
        // Unsubscribe from the server-side channel
        if (socket.value?.connected) {
          socket.value.emit('unsubscribe', { channel: eventType })
        }
      }
    }
  }

  const disconnect = () => {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
      state.value.connected = false
    }
  }

  onMounted(() => {
    connect()
  })

  onUnmounted(() => {
    disconnect()
  })

  return {
    state: state.value,
    subscribe,
    unsubscribe,
    disconnect,
    socket: socket.value,
  }
}
