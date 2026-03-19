import { HubConnectionBuilder, HubConnection } from '@microsoft/signalr';

export function createHubConnection(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(process.env.NEXT_PUBLIC_HUB_URL!)
    .withAutomaticReconnect([0, 2000, 5000, 10000])
    .build();
}
