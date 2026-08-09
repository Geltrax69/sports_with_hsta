import { ChangeEmailCard } from '../../components/common/ChangeEmailCard'

export function PlayerSettings() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account details.</p>
      </div>
      <ChangeEmailCard />
    </div>
  )
}
