export interface FeatureItem {
  name: string
  description: string
}

export interface FeatureListProps {
  items: ReadonlyArray<FeatureItem>
}

export function FeatureList({ items }: FeatureListProps) {
  return (
    <ul className="list-disc list-inside space-y-2 text-muted-foreground">
      {items.map((item, index) => (
        <li key={index}>
          <span className="font-medium text-foreground">{item.name}</span> - {item.description}
        </li>
      ))}
    </ul>
  )
}
