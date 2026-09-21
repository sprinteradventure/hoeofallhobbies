import { getSiteType } from '@/lib/site-context-server'
import VerifyEmailForm from './VerifyEmailForm'

export default async function VerifyEmailPage() {
  const siteType = await getSiteType()
  return <VerifyEmailForm isHolidays={siteType === 'holidays'} />
}
