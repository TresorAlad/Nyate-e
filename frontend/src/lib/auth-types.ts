export type UserRole = 'citizen' | 'cabinet' | 'admin'

export type PublicProfile = 'citizen' | 'student' | 'enterprise' | 'jurist'

export type AuthUser = {
  id: string
  email: string
  displayName: string
  role: UserRole
  publicProfile: PublicProfile
}

export type StoredUser = AuthUser & {
  passwordHash: string
}

export const PUBLIC_PROFILE_LABELS: Record<PublicProfile, string> = {
  citizen: 'Citoyen',
  student: 'Étudiant',
  enterprise: 'Entreprise',
  jurist: 'Juriste',
}
