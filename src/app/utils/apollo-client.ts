import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// Create an Apollo Client instance
const client = new ApolloClient({
  link: new HttpLink({
    uri: process.env.NEXT_PUBLIC_GRAPH_BLOCKNOGOTCHI_URL,
  }),
  cache: new InMemoryCache(),
});

export default client;