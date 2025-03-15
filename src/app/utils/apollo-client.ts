import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// Create an Apollo Client instance
export const blockmonGraphClient = new ApolloClient({
  link: new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPH_BLOCKNOGOTCHI_URL || 'https://api.studio.thegraph.com/query/105196/ethuprising/version/latest',
  }),
  cache: new InMemoryCache(),
});

export const marketplaceGraphClient = new ApolloClient({
  link: new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPH_MARKETPLACE_URL || 'https://api.studio.thegraph.com/query/105196/ethuprising/version/latest',
  }),
  cache: new InMemoryCache(),
});