'use client'

import type { ReactNode } from 'react'
import AdminLoginForm from '@/components/admin/AdminLoginForm'
import { useAdminAuth } from '@/hooks/useAdminAuth'

interface Props {
  children: (logout: () => void) => ReactNode
}

export default function AdminGuard({ children }: Props) {
  const { isAuthenticated, login, logout } = useAdminAuth()

  if (!isAuthenticated) {
    return (
      <div className="px-6 py-12">
        <AdminLoginForm onSuccess={login} />
      </div>
    )
  }

  return <>{children(logout)}</>
}
