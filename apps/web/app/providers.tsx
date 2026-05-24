'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import dynamic from 'next/dynamic'
import { useState } from 'react'
import { Toaster } from 'sonner'

const OfflineIndicator = dynamic(
  () => import('@/components/OfflineIndicator').then((m) => ({ default: m.OfflineIndicator })),
  { ssr: false }
)
const ServiceWorkerRegistrar = dynamic(
  () => import('@/components/ServiceWorkerRegistrar').then((m) => ({ default: m.ServiceWorkerRegistrar })),
  { ssr: false }
)

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,   // 5 min — prevents constant refetches
            gcTime: 10 * 60 * 1000,     // 10 min cache retention
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#171923',
            color: '#fff',
            border: '1px solid #1f2937',
          },
        }}
      />
      <OfflineIndicator />
      <ServiceWorkerRegistrar />
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
