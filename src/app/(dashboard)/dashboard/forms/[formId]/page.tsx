// @ts-nocheck
'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useSimpleAuth } from '@/contexts/SimpleAuthContext'
import { usePageActions } from '@/contexts/PageActionsContext'
import { logger } from '@/utils/logger'
import { getErrorMessage } from '@/utils/errorHandling'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/empty-state'
import { DeleteConfirmDialog } from '@/components/shared/DeleteConfirmDialog'
import {
  ArrowLeft, Save, Plus, Trash2, ChevronUp, ChevronDown,
  Type, AlignLeft, CheckSquare, Circle, Calendar, FileText, MessageSquare, Link, MoreHorizontal
} from 'lucide-react'
import { toast } from 'sonner'

interface FormQuestion {
  id: string
  label: string
  type: 'short_text' | 'long_text' | 'multiple_choice' | 'checkboxes' | 'date' | 'content' | 'agreement' | 'signature'
  required: boolean
  options?: string[]
  placeholder?: string
  content?: string
  text?: string
}

interface FormData {
  id: string
  trainer_id: string | null
  title: string
  type: string
  questions: FormQuestion[]
  created_at: string
  updated_at: string
}

interface FormResponse {
  id: string
  form_id: string
  client_id?: string
  responses: Record<string, unknown>
  submitted_at: string
  client_name?: string
}

const QUESTION_TYPE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  short_text: Type,
  long_text: AlignLeft,
  multiple_choice: Circle,
  checkboxes: CheckSquare,
  date: Calendar,
  content: FileText,
  agreement: CheckSquare,
  signature: FileText,
}

const QUESTION_TYPE_LABELS: Record<string, string> = {
  short_text: 'Short Text',
  long_text: 'Long Text',
  multiple_choice: 'Multiple Choice',
  checkboxes: 'Checkboxes',
  date: 'Date',
  content: 'Content Block',
  agreement: 'Agreement',
  signature: 'Signature',
}

const generateId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)

export default function FormDetailPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.formId as string
  const { user } = useSimpleAuth()
  const { setActions } = usePageActions()

  const [form, setForm] = useState<FormData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('builder')

  // Builder state
  const [formTitle, setFormTitle] = useState('')
  const [questions, setQuestions] = useState<FormQuestion[]>([])
  const [waiverContent, setWaiverContent] = useState('')
  const [agreementText, setAgreementText] = useState('I have read and agree to the above terms')
  const [requiresSignature, setRequiresSignature] = useState(true)

  // Settings state
  const [settingsTitle, setSettingsTitle] = useState('')
  const [settingsType, setSettingsType] = useState('')

  // Responses
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [responsesLoading, setResponsesLoading] = useState(false)

  // Delete question dialog
  const [deleteQuestionIdx, setDeleteQuestionIdx] = useState<number | null>(null)

  // Inject top bar actions
  useEffect(() => {
    setActions(
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={() => router.push('/dashboard/forms')}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
          Back
        </Button>
        <Button variant="outline" className="bg-card" onClick={handleSave} disabled={saving}>
          <Save className="h-3.5 w-3.5 mr-1.5" />
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    )
    return () => setActions(null)
  }, [setActions, saving, formTitle, questions, waiverContent, agreementText, requiresSignature, settingsTitle, settingsType])

  // Fetch form
  useEffect(() => {
    if (!user || !formId) return
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .single()

        if (error) throw error
        setForm(data as FormData)
        setFormTitle(data.title || '')
        setSettingsTitle(data.title || '')
        setSettingsType(data.type || 'custom')

        const isLegal = data.type?.toLowerCase() === 'waiver' || data.type?.toLowerCase() === 'legal'
        if (isLegal) {
          const contentQ = data.questions?.find((q: FormQuestion) => q.type === 'content')
          const agreementQ = data.questions?.find((q: FormQuestion) => q.type === 'agreement')
          const signatureQ = data.questions?.find((q: FormQuestion) => q.type === 'signature')
          setWaiverContent(contentQ?.content || '')
          setAgreementText(agreementQ?.text || 'I have read and agree to the above terms')
          setRequiresSignature(!!signatureQ)
        } else {
          setQuestions(Array.isArray(data.questions) ? data.questions : [])
        }
      } catch (err) {
        logger.error('Error fetching form:', err)
        setError(getErrorMessage(err) || 'Failed to load form')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [user, formId])

  // Load responses when tab switches
  useEffect(() => {
    if (activeTab !== 'responses' || !formId) return
    const loadResponses = async () => {
      setResponsesLoading(true)
      try {
        const { data } = await supabase
          .from('form_responses')
          .select('*')
          .eq('form_id', formId)
          .order('submitted_at', { ascending: false })
        setResponses(data || [])
      } catch (err) {
        logger.error('Error loading responses:', err)
      } finally {
        setResponsesLoading(false)
      }
    }
    loadResponses()
  }, [activeTab, formId])

  const isLegalForm = form?.type?.toLowerCase() === 'waiver' || form?.type?.toLowerCase() === 'legal'

  const handleSave = async () => {
    if (!user || !formId) return
    setSaving(true)
    try {
      let questionsToSave: unknown[]

      if (isLegalForm) {
        questionsToSave = [
          { id: 'waiver-content', type: 'content', content: waiverContent },
          { id: 'waiver-agreement', type: 'agreement', text: agreementText, required: true },
          ...(requiresSignature ? [{ id: 'waiver-signature', type: 'signature', label: 'Full Name (Signature)', required: true }] : []),
        ]
      } else {
        questionsToSave = questions.map(q => {
          if ((q.type === 'multiple_choice' || q.type === 'checkboxes') && q.options) {
            return { ...q, options: q.options.filter(opt => opt.trim() !== '') }
          }
          return q
        })
      }

      const titleToSave = settingsTitle || formTitle
      const { error } = await supabase
        .from('forms')
        .update({
          title: titleToSave,
          type: settingsType || form?.type,
          questions: questionsToSave,
          updated_at: new Date().toISOString(),
        })
        .eq('id', formId)

      if (error) throw error
      setFormTitle(titleToSave)
      setForm(prev => prev ? { ...prev, title: titleToSave, type: settingsType || prev.type } : prev)
      toast.success('Form saved')
    } catch (err) {
      logger.error('Error saving form:', err)
      toast.error(getErrorMessage(err) || 'Failed to save form')
    } finally {
      setSaving(false)
    }
  }

  const addQuestion = () => {
    setQuestions(prev => [...prev, { id: generateId(), label: '', type: 'short_text', required: false }])
  }

  const removeQuestion = (idx: number) => {
    setQuestions(prev => prev.filter((_, i) => i !== idx))
    setDeleteQuestionIdx(null)
  }

  const moveQuestion = (idx: number, dir: 'up' | 'down') => {
    setQuestions(prev => {
      const arr = [...prev]
      const next = dir === 'up' ? idx - 1 : idx + 1
      if (next < 0 || next >= arr.length) return arr
      ;[arr[idx], arr[next]] = [arr[next], arr[idx]]
      return arr
    })
  }

  const updateQuestion = (idx: number, field: keyof FormQuestion, value: unknown) => {
    setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q))
  }

  const addOption = (qIdx: number) => {
    setQuestions(prev => prev.map((q, i) => i === qIdx ? { ...q, options: [...(q.options || []), ''] } : q))
  }

  const updateOption = (qIdx: number, oIdx: number, val: string) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q
      const opts = [...(q.options || [])]
      opts[oIdx] = val
      return { ...q, options: opts }
    }))
  }

  const removeOption = (qIdx: number, oIdx: number) => {
    setQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q
      return { ...q, options: (q.options || []).filter((_, j) => j !== oIdx) }
    }))
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !form) notFound()

  return (
    <div className="flex flex-col gap-6 p-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-8">
          <TabsTrigger value="builder" className="text-xs h-7">Builder</TabsTrigger>
          <TabsTrigger value="responses" className="text-xs h-7">Responses</TabsTrigger>
          <TabsTrigger value="settings" className="text-xs h-7">Settings</TabsTrigger>
        </TabsList>

        {/* Builder Tab */}
        <TabsContent value="builder" className="mt-4">
          <div className="flex flex-col gap-3">
            {/* Form title inline edit */}
            <div className="flex items-center gap-2">
              <Input
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                className="text-sm font-medium h-8 max-w-sm"
                placeholder="Form title"
              />
              <Badge variant="outline" className="text-xs capitalize">{form.type}</Badge>
            </div>

            {isLegalForm ? (
              /* Legal/Waiver document editor */
              <div className="flex flex-col gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Document Content</CardTitle>
                    <CardDescription className="text-xs">The main body of your legal document. Markdown is supported.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={waiverContent}
                      onChange={e => setWaiverContent(e.target.value)}
                      placeholder="Enter your document content here..."
                      className="min-h-64 text-sm font-mono resize-y"
                      rows={12}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Agreement Text</CardTitle>
                    <CardDescription className="text-xs">Text shown next to the acceptance checkbox.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Input
                      value={agreementText}
                      onChange={e => setAgreementText(e.target.value)}
                      className="h-8 text-sm"
                      placeholder="I have read and agree to the above terms"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Signature</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="requires-signature"
                        checked={requiresSignature}
                        onCheckedChange={setRequiresSignature}
                      />
                      <Label htmlFor="requires-signature" className="text-sm">Require full name signature</Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Regular form builder */
              <div className="flex flex-col gap-2">
                {questions.length === 0 ? (
                  <EmptyState
                    icon={Plus}
                    title="No fields yet"
                    description="Add your first question to get started."
                    action={
                      <Button variant="outline" onClick={addQuestion}>
                        <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
                        Add Field
                      </Button>
                    }
                  />
                ) : (
                  <>
                    {questions.map((q, idx) => {
                      const Icon = QUESTION_TYPE_ICONS[q.type] || Type
                      return (
                        <div key={q.id} className="rounded-lg border border-border bg-card p-3 flex flex-col gap-3">
                          <div className="flex items-start gap-2">
                            {/* Reorder buttons */}
                            <div className="flex flex-col gap-0.5 shrink-0 mt-0.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => moveQuestion(idx, 'up')}
                                disabled={idx === 0}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => moveQuestion(idx, 'down')}
                                disabled={idx === questions.length - 1}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>

                            {/* Question number + type icon */}
                            <div className="flex items-center gap-1.5 shrink-0 mt-1">
                              <span className="text-xs text-muted-foreground w-4 text-right">{idx + 1}.</span>
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>

                            {/* Label input */}
                            <Input
                              value={q.label}
                              onChange={e => updateQuestion(idx, 'label', e.target.value)}
                              placeholder="Question text"
                              className="h-7 text-sm flex-1"
                            />

                            {/* Type selector */}
                            <Select
                              value={q.type}
                              onValueChange={val => updateQuestion(idx, 'type', val)}
                            >
                              <SelectTrigger className="h-7 text-xs w-36 shrink-0">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="short_text">Short Text</SelectItem>
                                <SelectItem value="long_text">Long Text</SelectItem>
                                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                                <SelectItem value="checkboxes">Checkboxes</SelectItem>
                                <SelectItem value="date">Date</SelectItem>
                              </SelectContent>
                            </Select>

                            {/* Required badge */}
                            <div className="flex items-center gap-1 shrink-0">
                              <input
                                type="checkbox"
                                id={`req-${q.id}`}
                                checked={q.required}
                                onChange={e => updateQuestion(idx, 'required', e.target.checked)}
                                className="accent-primary"
                              />
                              <Label htmlFor={`req-${q.id}`} className="text-xs cursor-pointer">Required</Label>
                            </div>

                            {/* Delete */}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                              onClick={() => setDeleteQuestionIdx(idx)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>

                          {/* Placeholder for text fields */}
                          {(q.type === 'short_text' || q.type === 'long_text') && (
                            <div className="ml-12 flex items-center gap-2">
                              <Label className="text-xs text-muted-foreground w-24 shrink-0">Placeholder</Label>
                              <Input
                                value={q.placeholder || ''}
                                onChange={e => updateQuestion(idx, 'placeholder', e.target.value)}
                                placeholder="Optional placeholder text"
                                className="h-7 text-xs"
                              />
                            </div>
                          )}

                          {/* Options for multiple choice / checkboxes */}
                          {(q.type === 'multiple_choice' || q.type === 'checkboxes') && (
                            <div className="ml-12 flex flex-col gap-1.5 border-l-2 border-border pl-3">
                              <Label className="text-xs text-muted-foreground">Options</Label>
                              {(q.options || []).map((opt, oIdx) => (
                                <div key={oIdx} className="flex items-center gap-1.5">
                                  <Input
                                    value={opt}
                                    onChange={e => updateOption(idx, oIdx, e.target.value)}
                                    placeholder={`Option ${oIdx + 1}`}
                                    className="h-7 text-xs flex-1"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 shrink-0"
                                    onClick={() => removeOption(idx, oIdx)}
                                    disabled={(q.options || []).length <= 1}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              ))}
                              <Button variant="ghost" className="h-6 text-xs w-fit" onClick={() => addOption(idx)}>
                                <Plus className="h-3 w-3 mr-1" />
                                Add option
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })}

                    <Button variant="outline" className="mt-2 w-fit" onClick={addQuestion}>
                      <Plus className="h-3.5 w-3.5 -ml-0.5 mr-0.5" />
                      Add Field
                    </Button>
                  </>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Responses Tab */}
        <TabsContent value="responses" className="mt-4">
          {responsesLoading ? (
            <div className="flex flex-col gap-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : responses.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No responses yet"
              description="Responses will appear here when clients submit this form."
            />
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs font-medium">Client</TableHead>
                    <TableHead className="text-xs font-medium">Submitted</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map(r => (
                    <TableRow key={r.id} className="hover:bg-muted/30">
                      <TableCell className="py-3">
                        <span className="text-sm">{r.client_name || r.client_id || 'Unknown client'}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <span className="text-xs text-muted-foreground">{formatDate(r.submitted_at)}</span>
                      </TableCell>
                      <TableCell className="py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreHorizontal className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>View response</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="mt-4">
          <div className="flex flex-col gap-4 max-w-lg">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Form Settings</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid gap-1.5">
                  <Label className="text-xs">Form Title</Label>
                  <Input
                    value={settingsTitle}
                    onChange={e => setSettingsTitle(e.target.value)}
                    className="h-8 text-sm"
                    placeholder="Form title"
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label className="text-xs">Form Type</Label>
                  <Select value={settingsType} onValueChange={setSettingsType}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="legal">Legal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="grid gap-1.5">
                  <Label className="text-xs">Share Link</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={`${typeof window !== 'undefined' ? window.location.origin : ''}/forms/${form.id}`}
                      readOnly
                      className="h-8 text-xs text-muted-foreground"
                    />
                    <Button
                      variant="outline"
                     
                      className="h-8 shrink-0"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/forms/${form.id}`)
                        toast.success('Link copied')
                      }}
                    >
                      <Link className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">Share this link with clients to collect responses.</p>
                </div>

                <Separator />

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Created: {formatDate(form.created_at)}</p>
                  <p>Last updated: {formatDate(form.updated_at)}</p>
                  <p>Questions: {form.questions?.length || 0}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Delete question confirmation */}
      <DeleteConfirmDialog
        open={deleteQuestionIdx !== null}
        onOpenChange={open => { if (!open) setDeleteQuestionIdx(null) }}
        itemName={deleteQuestionIdx !== null ? (questions[deleteQuestionIdx]?.label || `Question ${deleteQuestionIdx + 1}`) : ''}
        itemKind="question"
        onConfirm={() => deleteQuestionIdx !== null && removeQuestion(deleteQuestionIdx)}
        loading={false}
      />
    </div>
  )
}

