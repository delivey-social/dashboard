export type Restaurant = {
  id: string
  name: string
  subtitle: string
}

export type Order = {
  id: string
  restaurant: string
  status: string
  createdAt: string | null
  itemCount: number | null
}
