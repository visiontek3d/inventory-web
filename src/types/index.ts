export interface Diorama {
  sku: string;
  description: string;
  photo_url: string | null;
  qty_walls: number;
  qty_open_door: number;
  qty_lift: number;
  carry_stock: boolean;
  is_one_off: boolean;
  one_off_qty: number;
}

export interface Transaction {
  id: number;
  sku: string;
  delta: number;
  type: string;
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
