import { useRouter } from '@tanstack/react-router'
import { NewMemberDrawer } from '../components/new-member-drawer.js'
import { MembersPage } from './members.js'

export function NewMemberPage() {
  const router = useRouter()
  return (
    <>
      <MembersPage />
      <NewMemberDrawer open={true} onOpenChange={(open) => { if (!open) void router.navigate({ to: '/members' }) }} />
    </>
  )
}
