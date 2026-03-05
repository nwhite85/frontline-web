'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { logger } from '@/utils/logger'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  MessageSquare, Users, Search, Send, Plus, ChevronRight, MoreHorizontal,
  Trash2, UserPlus,
} from 'lucide-react'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
import { cn } from '@/lib/utils'
import { EmptyState } from '@/components/ui/empty-state'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Conversation {
  id: string
  client_id: string
  trainer_id: string
  client_name: string
  last_message?: string
  last_message_type?: string
  last_message_at?: string
  unread_count?: number
}

interface Group {
  id: string
  name: string
  description?: string
  trainer_id: string
  created_at: string
  member_count?: number
  last_message?: string
  last_message_at?: string
  unread_count?: number
}

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  sender_name?: string
  is_trainer?: boolean
  message_type: 'text' | 'image' | 'video' | 'file'
  conversation_id?: string
  group_id?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMessageTime(ts: string) {
  const d = new Date(ts)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'dd MMM')
}

function formatTimestamp(ts: string) {
  const d = new Date(ts)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return `Yesterday ${format(d, 'HH:mm')}`
  return format(d, 'dd MMM, HH:mm')
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyThread() {
  return (
    <div className="flex items-center justify-center h-full">
      <EmptyState
        icon={MessageSquare}
        title="Select a conversation"
        description="Choose a conversation from the list to start chatting."
      />
    </div>
  )
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: Message }) {
  const isOwn = message.is_trainer

  return (
    <div className={cn('flex gap-2 mb-1', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn && (
        <Avatar className="h-6 w-6 shrink-0 mt-1 [&::after]:hidden">
          <AvatarFallback className="text-[10px] bg-accent text-primary">
            {message.sender_name?.charAt(0).toUpperCase() ?? '?'}
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn('flex flex-col gap-0.5 max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-3 py-2 text-sm leading-relaxed',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-sm'
              : 'bg-muted text-foreground rounded-bl-sm'
          )}
        >
          {message.content}
        </div>
        <span className="text-[10px] text-muted-foreground px-1">
          {formatTimestamp(message.created_at)}
        </span>
      </div>
    </div>
  )
}

// ─── Conversation Row ─────────────────────────────────────────────────────────

function ConversationRow({
  conv,
  isActive,
  onClick,
  onDelete,
}: {
  conv: Conversation
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg transition-colors relative group',
        isActive ? 'bg-card' : 'hover:bg-muted/50'
      )}
    >
      <Avatar className="h-8 w-8 shrink-0 [&::after]:hidden">
        <AvatarFallback className="text-xs bg-accent text-primary font-medium">
          {conv.client_name?.charAt(0).toUpperCase() ?? '?'}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">{conv.client_name}</span>
          {conv.last_message_at && (
            <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
              {formatMessageTime(conv.last_message_at)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {conv.last_message || 'No messages yet'}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {(conv.unread_count ?? 0) > 0 && (
          <Badge className="h-4 min-w-4 text-[10px] px-1 rounded-full">{conv.unread_count}</Badge>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

// ─── Group Row ────────────────────────────────────────────────────────────────

function GroupRow({
  group,
  isActive,
  onClick,
}: {
  group: Group
  isActive: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-lg transition-colors',
        isActive ? 'bg-card' : 'hover:bg-muted/50'
      )}
    >
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Users className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">{group.name}</span>
          {group.last_message_at && (
            <span className="text-[10px] text-muted-foreground shrink-0 ml-1">
              {formatMessageTime(group.last_message_at)}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {group.last_message || `${group.member_count ?? 0} members`}
        </p>
      </div>
      {(group.unread_count ?? 0) > 0 && (
        <Badge className="h-4 min-w-4 text-[10px] px-1 rounded-full shrink-0">{group.unread_count}</Badge>
      )}
    </div>
  )
}

// ─── Thread ───────────────────────────────────────────────────────────────────

function Thread({
  conversationId,
  groupId,
  userId,
  headerName,
}: {
  conversationId?: string
  groupId?: string
  userId: string
  headerName: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior })
  }, [])

  const loadMessages = useCallback(async () => {
    setLoading(true)
    try {
      if (conversationId) {
        const { data } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true })
        setMessages(((data as unknown as Message[]) || []).map(m => ({ ...m, is_trainer: m.sender_id === userId })))
      } else if (groupId) {
        const { data } = await supabase
          .from('group_messages')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true })
        setMessages(((data as unknown as Message[]) || []).map(m => ({ ...m, is_trainer: m.sender_id === userId })))
      }
    } catch (err) {
      logger.error('Error loading messages', err)
    } finally {
      setLoading(false)
    }
  }, [conversationId, groupId, userId])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  useEffect(() => {
    if (!loading) scrollToBottom('instant')
  }, [loading])

  // Real-time subscription
  useEffect(() => {
    const table = conversationId ? 'messages' : 'group_messages'
    const filter = conversationId
      ? `conversation_id=eq.${conversationId}`
      : `group_id=eq.${groupId}`

    const channel = supabase
      .channel(`thread-${conversationId ?? groupId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table, filter }, payload => {
        const msg = { ...payload.new, is_trainer: payload.new.sender_id === userId } as Message
        setMessages(prev => [...prev, msg])
        setTimeout(() => scrollToBottom(), 50)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [conversationId, groupId, userId, scrollToBottom])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content || sending) return
    setSending(true)
    setNewMessage('')
    try {
      if (conversationId) {
        // @ts-ignore — messages table not in generated types
        await supabase.from('messages').insert({
          conversation_id: conversationId,
          content,
          sender_id: userId,
          is_trainer: true,
          message_type: 'text',
        })
        // Update conversation last message
        // @ts-ignore — conversations table not in generated types
        await supabase.from('conversations').update({
          last_message: content,
          last_message_type: 'text',
          last_message_at: new Date().toISOString(),
        }).eq('id', conversationId)
      } else if (groupId) {
        // @ts-ignore — group_messages table not in generated types
        await supabase.from('group_messages').insert({
          group_id: groupId,
          content,
          sender_id: userId,
          is_trainer: true,
          message_type: 'text',
        })
      }
    } catch (err) {
      logger.error('Error sending message', err)
      setNewMessage(content) // restore on error
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        <Avatar className="h-8 w-8 [&::after]:hidden">
          <AvatarFallback className="text-xs bg-accent text-primary font-medium">
            {headerName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold leading-none">{headerName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{conversationId ? 'Direct message' : 'Group'}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1,2,3,4].map(i => (
              <div key={i} className={cn('flex gap-2', i % 2 === 0 ? 'justify-end' : 'justify-start')}>
                <Skeleton className={cn('h-8 rounded-2xl', i % 2 === 0 ? 'w-48' : 'w-36')} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <EmptyState
              icon={MessageSquare}
              title="No messages yet"
              description="Say hello to start the conversation!"
            />
          </div>
        ) : (
          <>
            {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 py-3 border-t border-border">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
            placeholder="Type a message…"
            className="flex-1 rounded-full bg-muted border-transparent focus:bg-background focus:border-input"
            disabled={sending}
            autoComplete="off"
          />
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 rounded-full shrink-0"
            disabled={!newMessage.trim() || sending}
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}

// ─── New Conversation Dialog ──────────────────────────────────────────────────

function NewConversationPicker({
  userId,
  existingClientIds,
  onCreated,
}: {
  userId: string
  existingClientIds: string[]
  onCreated: (conv: Conversation) => void
}) {
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    supabase
      .from('trainer_client')
      .select('client_id, client:user_profiles!trainer_client_client_id_fkey(id, name)')
      .eq('trainer_id', userId)
      .then(({ data }) => {
        const all = (data || []).map((r: any) => r.client).filter(Boolean)
        setClients(all.filter((c: any) => !existingClientIds.includes(c.id)))
      })
  }, [userId, existingClientIds])

  const startChat = async (client: { id: string; name: string }) => {
    // Check if conversation already exists
    // @ts-ignore — conversations table not in generated types
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .eq('trainer_id', userId)
      .eq('client_id', client.id)
      .maybeSingle()

    if (existing) {
      onCreated({ ...(existing as unknown as Conversation), client_name: client.name })
      return
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: created } = await (supabase as any)
      .from('conversations')
      .insert({ trainer_id: userId, client_id: client.id })
      .select()
      .single()

    if (created) onCreated({ ...(created as unknown as Conversation), client_name: client.name })
  }

  if (!clients.length) return (
    <DropdownMenuItem disabled className="text-xs text-muted-foreground">No more clients to add</DropdownMenuItem>
  )

  return (
    <>
      {clients.map(c => (
        <DropdownMenuItem key={c.id} onClick={() => startChat(c)} className="text-sm">
          <Avatar className="h-5 w-5 mr-2 [&::after]:hidden">
            <AvatarFallback className="text-[10px] bg-accent text-primary">{c.name.charAt(0)}</AvatarFallback>
          </Avatar>
          {c.name}
        </DropdownMenuItem>
      ))}
    </>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { user } = useSimpleAuth()
  const { setActions } = usePageActions()
  const userId = user?.id ?? ''

  const [activeTab, setActiveTab] = useState<'messages' | 'groups'>('messages')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingGroups, setLoadingGroups] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)

  // Clear header actions (no add button needed — it's in the sidebar)
  useEffect(() => {
    setActions(null)
    return () => setActions(null)
  }, [setActions])

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!userId) return
    setLoadingConvs(true)
    try {
      // Get all clients for this trainer
      const { data: tc } = await supabase
        .from('trainer_client')
        .select('client_id')
        .eq('trainer_id', userId)
      const clientIds = (tc || []).map((r: any) => r.client_id)

      if (!clientIds.length) { setConversations([]); return }

      // Get client profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name')
        .in('id', clientIds)

      // Get existing conversations
      const { data: convs } = await supabase
        .from('conversations')
        .select('*')
        .eq('trainer_id', userId)
        .order('last_message_at', { ascending: false, nullsFirst: false })

      const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.name]))

      const list: Conversation[] = (convs || []).map((c: any) => ({
        ...c,
        client_name: profileMap[c.client_id] ?? 'Unknown',
      }))

      setConversations(list)
    } catch (err) {
      logger.error('Error loading conversations', err)
    } finally {
      setLoadingConvs(false)
    }
  }, [userId])

  // Load groups
  const loadGroups = useCallback(async () => {
    if (!userId) return
    setLoadingGroups(true)
    try {
      const { data } = await supabase
        .from('groups')
        .select('*, group_members(count)')
        .eq('trainer_id', userId)
        .order('created_at', { ascending: false })

      setGroups((data || []).map((g: any) => ({
        ...g,
        member_count: g.group_members?.[0]?.count ?? 0,
      })))
    } catch (err) {
      logger.error('Error loading groups', err)
    } finally {
      setLoadingGroups(false)
    }
  }, [userId])

  useEffect(() => { loadConversations() }, [loadConversations])
  useEffect(() => { loadGroups() }, [loadGroups])

  // Real-time: refresh conv list on new messages
  useEffect(() => {
    if (!userId) return
    const channel = supabase
      .channel('chat-list-refresh')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        loadConversations()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, loadConversations])

  const deleteConversation = async (convId: string) => {
    await supabase.from('conversations').delete().eq('id', convId)
    setConversations(prev => prev.filter(c => c.id !== convId))
    if (selectedConv?.id === convId) setSelectedConv(null)
  }

  const filteredConvs = conversations.filter(c =>
    c.client_name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredGroups = groups.filter(g =>
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const existingClientIds = conversations.map(c => c.client_id)

  return (
    <div className="flex overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>

      {/* ── Left sidebar ─────────────────────────────────── */}
      <div className="w-72 shrink-0 flex flex-col border-r border-border bg-card">

        {/* Tabs */}
        <div className="flex border-b border-border">
          {(['messages', 'groups'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-3 text-xs font-medium transition-colors border-b-2 capitalize',
                activeTab === tab
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab === 'messages' ? 'Messages' : 'Groups'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'messages' ? 'Search conversations…' : 'Search groups…'}
              className="pl-8 h-8 text-xs bg-card border-transparent focus:border-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* List header with add button */}
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {activeTab === 'messages' ? 'Direct Messages' : 'Groups'}
          </span>
          {activeTab === 'messages' ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Plus className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <NewConversationPicker
                  userId={userId}
                  existingClientIds={existingClientIds}
                  onCreated={conv => {
                    setConversations(prev => {
                      const exists = prev.find(c => c.id === conv.id)
                      return exists ? prev : [conv, ...prev]
                    })
                    setSelectedConv(conv)
                    setSelectedGroup(null)
                  }}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="ghost" size="icon" className="h-6 w-6" disabled>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        {/* Conversation / Group list */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {activeTab === 'messages' ? (
            loadingConvs ? (
              <div className="flex flex-col gap-1 px-1">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 py-2.5 px-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex flex-col gap-1 flex-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2.5 w-36" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConvs.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                <MessageSquare className="h-6 w-6 opacity-30" />
                <p className="text-xs">{searchQuery ? 'No results' : 'No conversations yet'}</p>
              </div>
            ) : filteredConvs.map(conv => (
              <ConversationRow
                key={conv.id}
                conv={conv}
                isActive={selectedConv?.id === conv.id}
                onClick={() => { setSelectedConv(conv); setSelectedGroup(null) }}
                onDelete={() => deleteConversation(conv.id)}
              />
            ))
          ) : (
            loadingGroups ? (
              <div className="flex flex-col gap-1 px-1">
                {[1,2].map(i => (
                  <div key={i} className="flex items-center gap-3 py-2.5 px-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="flex flex-col gap-1 flex-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-2.5 w-28" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                <Users className="h-6 w-6 opacity-30" />
                <p className="text-xs">{searchQuery ? 'No results' : 'No groups yet'}</p>
              </div>
            ) : filteredGroups.map(group => (
              <GroupRow
                key={group.id}
                group={group}
                isActive={selectedGroup?.id === group.id}
                onClick={() => { setSelectedGroup(group); setSelectedConv(null) }}
              />
            ))
          )}
        </div>
      </div>

      {/* ── Right panel ───────────────────────────────────── */}
      <div className="flex-1 min-w-0 bg-background">
        {selectedConv ? (
          <Thread
            key={`conv-${selectedConv.id}`}
            conversationId={selectedConv.id}
            userId={userId}
            headerName={selectedConv.client_name}
          />
        ) : selectedGroup ? (
          <Thread
            key={`group-${selectedGroup.id}`}
            groupId={selectedGroup.id}
            userId={userId}
            headerName={selectedGroup.name}
          />
        ) : (
          <EmptyThread />
        )}
      </div>

    </div>
  )
}
