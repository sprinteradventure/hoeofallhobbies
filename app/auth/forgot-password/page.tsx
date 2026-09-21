import { getSiteType } from '@/lib/site-context-server'
import ForgotPasswordForm from './ForgotPasswordForm'

export default async function ForgotPasswordPage() {
  const siteType = await getSiteType()
  return <ForgotPasswordForm isHolidays={siteType === 'holidays'} />
}
