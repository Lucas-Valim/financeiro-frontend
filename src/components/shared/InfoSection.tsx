export interface InfoSectionProps {
  title: string
  children: React.ReactNode
}

export function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <div className="border-t pt-4">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      {typeof children === 'string' ? <p className="text-muted-foreground">{children}</p> : children}
    </div>
  )
}
