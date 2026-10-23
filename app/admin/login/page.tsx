import { redirect } from 'next/navigation'

type Props = {
  searchParams?: Record<string, string | string[] | undefined>
}

export default function AdminLoginRedirect({ searchParams }: Props) {
  const nextParamRaw = searchParams?.next
  const nextParam = typeof nextParamRaw === 'string' ? nextParamRaw : '/dashboard'

  const url = new URL('http://localhost')
  url.pathname = '/login'
  url.searchParams.set('next', nextParam)
  redirect(url.pathname + url.search)
}

