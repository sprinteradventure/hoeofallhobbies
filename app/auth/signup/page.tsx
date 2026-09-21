import { getSiteType } from '@/lib/site-context-server'
import SignupForm from './SignupForm'

export default async function SignupPage() {
  const siteType = await getSiteType()
  return <SignupForm isHolidays={siteType === 'holidays'} />
}
