import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { FileQuestion } from 'lucide-react'

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <EmptyState
        icon={FileQuestion}
        title="Page not found"
        description="This page doesn't exist or you don't have access to it."
        action={
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
        }
      />
    </div>
  )
}
