import { redirect } from 'next/navigation'

export default function AdminEntry() {
  redirect('/login?next=%2Fdashboard')
}

