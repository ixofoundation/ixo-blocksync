export interface IEvent {
  type: string;
  attributes: [IKVPair];
  context: {
    blockHeight: number;
    eventSource: string;
    eventIndex: [number, number];
  }
}

interface IKVPair {
  key: string;
  value: string;
}
