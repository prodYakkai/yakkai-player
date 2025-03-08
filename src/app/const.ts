import { IngestMethod } from '@prisma/client';
import { StreamWithKeyParams } from './types/Stream';

export const DemoStreamParams:StreamWithKeyParams = {
    categoryId: 'demo',
    category: {
      id: 'demo',
      name: 'demo',
    },
    eventId: 'demo',
    event: {
      id: 'demo',
      name: 'demo',
    },
    srsIngestClientId: 'demo',
    srsIngestStreamId: 'demo',
    ingestKey: 'demo',
    ingestProtected: false,
    viewLocked: false,
    viewProtected: false,
    ingestMethod: 'whep' as IngestMethod,
    createdAt: new Date(),
    updatedAt: new Date(),
    name: 'demo',
    start: Date.now(),
    expire: Date.now() + 1000 * 60 * 60,
    sign: '',
    id : 'demo',
    viewKey: 'demo',
    embed: false,
    description: 'demo stream description',
};

export const generateLocalStreamParams = (streamName: string, url: string): StreamWithKeyParams => {
  return {
    ...DemoStreamParams,
    name: streamName,
    id: streamName,
    category: {
      ...DemoStreamParams.category,
      name: streamName,
    },
    event: {
      ...DemoStreamParams.event,
      name: streamName,
    },
    directLink: url
  };
}