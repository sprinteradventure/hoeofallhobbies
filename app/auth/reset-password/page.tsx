import { getSiteType } from '@/lib/site-context-server'
import ResetPasswordForm from './ResetPasswordForm'

export default async function ResetPasswordPage() {
  const siteType = await getSiteType()
  return <ResetPasswordForm isHolidays={siteType === 'holidays'} />
}
