'use client';

import { ApolloProvider as BaseApolloProvider } from '@apollo/client';
import { blockmonGraphClient } from '../utils/apollo-client';
import { ReactNode } from 'react';

interface ApolloProviderProps {
  children: ReactNode;
}

export default function ApolloProvider({ children }: ApolloProviderProps) {
  return (
    <BaseApolloProvider client={blockmonGraphClient}>
      {children}
    </BaseApolloProvider>
  );
} 