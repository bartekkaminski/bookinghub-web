import { Outlet, useParams } from '@tanstack/react-router'
import { BottomNav } from './bottom-nav'

export function OrgLayout() {
  const { orgId } = useParams({ strict: false }) as { orgId: string }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <BottomNav orgId={orgId} />
    </div>
  )
}
