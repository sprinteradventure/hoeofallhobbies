import { getSiteType } from '@/lib/site-context-server'
import LoginForm from './LoginForm'

export default async function LoginPage() {
  const siteType = await getSiteType()
  return <LoginForm isHolidays={siteType === 'holidays'} />
}
