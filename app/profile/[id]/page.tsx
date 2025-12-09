import { mockUsers } from "@/lib/mock-data"
import { ProfileClient } from "./profile-client"

export function generateStaticParams() {
  return mockUsers.map((user) => ({
    id: user.id,
  }))
}

export default async function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ProfileClient id={id} />
}
