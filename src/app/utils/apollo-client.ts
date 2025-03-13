import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// Create an Apollo Client instance
const client = new ApolloClient({
  link: new HttpLink({
    uri: 'https://api.studio.thegraph.com/query/105196/ethuprising/version/latest',
  }),
  cache: new InMemoryCache(),
});

export default client;