import { createAuthClient } from 'better-auth/react'
import { API_ORIGIN } from './api.js'

export const authClient = createAuthClient({
  baseURL: API_ORIGIN || window.location.origin,
  basePath: '/api/v1/auth',
})
