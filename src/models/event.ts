export interface IEvent {
  type: string;
  attributes: [IKVPair];
  context: {
    blockHeight: number;
    eventSource: string;
    eventIndex: string;
  }
}

interface IKVPair {
  key: string;
  value: string;
}
