import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useAuthStore } from '../stores/authStore'
import { setTokenGetter } from '../lib/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
    },
  },
})

export default function RootLayout() {
  const { hydrate, accessToken } = useAuthStore()

  useEffect(() => {
    hydrate()
    setTokenGetter(() => useAuthStore.getState().accessToken)
  }, [])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" backgroundColor="#0f1115" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#0f1115' } }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  )
}
