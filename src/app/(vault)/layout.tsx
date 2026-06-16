export default function VaultLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div>
      {/* Sidebar and nav will go here in Phase 4 */}
      <main>{children}</main>
    </div>
  )
}