import { Navigate } from 'react-router-dom'

import {
  getAuthorityUser,
  isAuthorityAuthenticated,
} from '../../services/authService'

function ProtectedRoute({ children, allowedRoles = null }) {
  if (!isAuthorityAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  const user = getAuthorityUser()
  if (Array.isArray(allowedRoles) && allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default ProtectedRoute
