/** Usage: pnpm auth:hash "your password"  ->  prints the value for ADMIN_PASSWORD_HASH in .env */
import { hashPassword } from '../src/lib/auth/password'

const password = process.argv[2]
if (!password || password.length < 8) {
  console.error('Usage: pnpm auth:hash "<password of at least 8 characters>"')
  process.exit(1)
}
hashPassword(password).then((hash) => {
  console.log(`ADMIN_PASSWORD_HASH='${hash}'`)
})
