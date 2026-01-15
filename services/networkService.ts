import { EmergencyRequest } from './types';

const CHANNEL_NAME = 'red_connect_sync_bus';
const networkChannel = new BroadcastChannel(CHANNEL_NAME);

export type NetworkEvent = 
  | { type: 'GLOBAL_SOS'; payload: { hospitalName: string; request: EmergencyRequest } }
  | { type: 'DATA_CHANGE'; payload: { entity: string } }
  | { type: 'PING'; payload: { from: string } };

export const broadcastToNetwork = (event: NetworkEvent) => {
  networkChannel.postMessage(event);
  console.log(`[Network Bus] Broadcast: ${event.type}`, event.payload);
};

export const subscribeToNetwork = (callback: (event: NetworkEvent) => void) => {
  const handler = (msg: MessageEvent) => {
    callback(msg.data as NetworkEvent);
  };
  networkChannel.addEventListener('message', handler);
  return () => networkChannel.removeEventListener('message', handler);
};