'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Search, UserPlus, UserCheck, Users, Flame } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'
import { toast } from 'sonner'

export default function SocialPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')

  const { data: friends } = useQuery({
    queryKey: ['social', 'friends'],
    queryFn: () => api.get('/social/friends').then((r) => r.data),
  })

  const { data: requests } = useQuery({
    queryKey: ['social', 'requests'],
    queryFn: () => api.get('/social/friends/requests').then((r) => r.data),
  })

  const { data: searchResults } = useQuery({
    queryKey: ['social', 'search', searchQuery],
    queryFn: () =>
      searchQuery.length >= 2
        ? api.get(`/social/users/search?q=${encodeURIComponent(searchQuery)}`).then((r) => r.data)
        : [],
    enabled: searchQuery.length >= 2,
  })

  const sendRequest = useMutation({
    mutationFn: (friendId: string) => api.post('/social/friends/request', { friendId }),
    onSuccess: () => {
      toast.success('Friend request sent!')
      queryClient.invalidateQueries({ queryKey: ['social'] })
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Failed to send request'),
  })

  const acceptRequest = useMutation({
    mutationFn: (id: string) => api.put(`/social/friends/request/${id}/accept`),
    onSuccess: () => {
      toast.success('Friend request accepted! 🎉')
      queryClient.invalidateQueries({ queryKey: ['social'] })
    },
  })

  const UserCard = ({ u, action }: { u: any; action?: React.ReactNode }) => (
    <div className="flex items-center gap-3 p-4 hover:bg-nt-card-hover/50 transition-colors rounded-xl">
      {u.avatarUrl ? (
        <img src={u.avatarUrl} alt={u.username} className="w-10 h-10 rounded-full object-cover" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-nt-accent to-purple-500 flex items-center justify-center font-bold text-sm">
          {u.username[0].toUpperCase()}
        </div>
      )}
      <div className="flex-1">
        <div className="font-medium text-sm">{u.username}</div>
        <div className="flex items-center gap-3 text-xs text-nt-text-secondary mt-0.5">
          <span>Level {u.level}</span>
          {u.streak > 0 && (
            <span className="flex items-center gap-0.5 text-orange-400">
              <Flame className="w-3 h-3" /> {u.streak} day streak
            </span>
          )}
        </div>
      </div>
      {action}
    </div>
  )

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Social</h1>
        <p className="text-nt-text-secondary text-sm">Connect with friends and compare progress</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Friends', value: friends?.length || 0, icon: Users },
          { label: 'Your Streak', value: `${user?.streak || 0}d`, icon: Flame },
          { label: 'Level', value: `Lv.${user?.level || 1}`, icon: null },
        ].map((stat) => (
          <div key={stat.label} className="glass-card p-4 text-center">
            <div className="text-2xl font-bold mb-1">{stat.value}</div>
            <div className="text-xs text-nt-text-secondary">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Pending Requests */}
      {requests && requests.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-nt-border">
            <h2 className="font-semibold flex items-center gap-2">
              Friend Requests
              <span className="text-xs bg-nt-accent text-white rounded-full w-5 h-5 flex items-center justify-center">{requests.length}</span>
            </h2>
          </div>
          <div className="divide-y divide-nt-border/50">
            {requests.map((req: any) => (
              <UserCard
                key={req.id}
                u={req.user}
                action={
                  <button
                    onClick={() => acceptRequest.mutate(req.id)}
                    className="flex items-center gap-1.5 text-xs bg-nt-accent hover:bg-nt-accent-hover text-white px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Accept
                  </button>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Find Friends */}
      <div className="glass-card p-5">
        <h2 className="font-semibold mb-4">Find Friends</h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-nt-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by username or email..."
            className="w-full bg-nt-bg border border-nt-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-nt-text-muted focus:outline-none focus:border-nt-accent transition-colors"
          />
        </div>

        {searchResults && searchResults.length > 0 && (
          <div className="divide-y divide-nt-border/50">
            {searchResults.map((u: any) => (
              <UserCard
                key={u.id}
                u={u}
                action={
                  <button
                    onClick={() => sendRequest.mutate(u.id)}
                    disabled={sendRequest.isPending}
                    className="flex items-center gap-1.5 text-xs border border-nt-accent text-nt-accent hover:bg-nt-accent/10 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add
                  </button>
                }
              />
            ))}
          </div>
        )}

        {searchQuery.length >= 2 && (!searchResults || searchResults.length === 0) && (
          <div className="text-center py-6 text-nt-text-muted text-sm">No users found</div>
        )}
      </div>

      {/* Friends List */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-nt-border">
          <h2 className="font-semibold">Your Friends ({friends?.length || 0})</h2>
        </div>
        {(!friends || friends.length === 0) ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-3 text-nt-text-muted opacity-30" />
            <p className="text-nt-text-secondary text-sm">No friends yet</p>
            <p className="text-xs text-nt-text-muted mt-1">Search for users to add them as friends</p>
          </div>
        ) : (
          <div className="divide-y divide-nt-border/50">
            {friends.map((friend: any) => <UserCard key={friend.id} u={friend} />)}
          </div>
        )}
      </div>
    </div>
  )
}
