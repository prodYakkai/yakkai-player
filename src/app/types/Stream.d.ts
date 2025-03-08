import {
  Stream,
  Viewer,
  Category,
  ReservedDestination,
  Event,
} from '@prisma/client';

interface StreamWithKeyParams extends Stream, StreamPlayParams {
  category: {
    name: string;
    id: string;
  },
  event: {
    name: string;
    id: string;
  }
}

interface StreamWithAll extends Stream {
  event: Event;
  destination: ReservedDestination;
  category: Category;
  viewers: Viewer[];
}

interface StreamPlayParams {
  start: number;
  expire: number;
  sign: string;
  embed?: boolean;
  directLink?: string;
}

interface StreamURLParams {
  category: string;
  name: string;
  key: string;
  publish?: boolean;

  // View only params
  playbackParams?: StreamPlayParams;
}
