export interface Diorama {
  id: number;
  sku: string;
  description: string;
  photo_url: string | null;
  walls_qty: number;
  open_door_qty: number;
  lift_qty: number;
  one_off_qty: number;
  one_off_lift_qty: number;
  one_off_od_qty: number;
  carry_stock: boolean;
  created_at: string;
}

export interface Transaction {
  id: number;
  sku: string;
  component: string;
  delta: number;
  user_email: string | null;
  created_at: string;
}

export interface Lift {
  id: number;
  size: string;
  variation: string;
  color: string;
  qty: number;
}

export interface LiftColor {
  id: number;
  name: string;
  has_2high: boolean;
  has_3high: boolean;
  color_hex: string;
  photo_url: string | null;
  sort_order: number;
}
