import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { GRAPH_BLOCKNOGOTCHI_URL, GRAPH_MARKETPLACE_URL, GRAPH_P2P_URL } from './config';
// Create an Apollo Client instance
export const blockmonGraphClient = new ApolloClient({
  link: new HttpLink({
    uri: GRAPH_BLOCKNOGOTCHI_URL,
  }),
  cache: new InMemoryCache(),
});

export const marketplaceGraphClient = new ApolloClient({
  link: new HttpLink({
    uri: GRAPH_MARKETPLACE_URL,
  }),
  cache: new InMemoryCache(),
});

export const p2pGraphClient = new ApolloClient({
  link: new HttpLink({
    uri: GRAPH_P2P_URL,
  }),
  cache: new InMemoryCache(),
});
