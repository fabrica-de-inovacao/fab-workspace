import { createAuthClient } from 'better-auth/react'
import { emailOTPClient } from 'better-auth/client/plugins'
import { API_ORIGIN } from './api.js'

export const authClient = createAuthClient({
  baseURL: API_ORIGIN || window.location.origin,
  basePath: '/api/v1/auth',
  plugins: [emailOTPClient()],
})
