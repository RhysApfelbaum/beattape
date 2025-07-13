export type RemoteFMODStatus =
    | {
          status: 'unloaded' | 'fetched' | 'loaded';
          error: null;
      }
    | {
          status: 'error';
          error: Error;
      };
