export interface Order {
  id: string;
  customer: string;
  email: string;
  items: { name: string; size: string; quantity: number; price: number }[];
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  date: string;
  address: string;
}

export const orders: Order[] = [
  {
    id: "TDS-001",
    customer: "Marc Dupont",
    email: "marc.dupont@email.com",
    items: [
      { name: "Air Jordan 1 Retro High", size: "10", quantity: 1, price: 220 },
    ],
    total: 220,
    status: "delivered",
    date: "2024-12-15",
    address: "123 Rue Sainte-Catherine, Montréal, QC",
  },
  {
    id: "TDS-002",
    customer: "Sophie Martin",
    email: "sophie.m@email.com",
    items: [
      { name: "Nike Tech Fleece Hoodie", size: "M", quantity: 1, price: 120 },
      { name: "Essentials Hoodie", size: "M", quantity: 1, price: 110 },
    ],
    total: 230,
    status: "shipped",
    date: "2024-12-18",
    address: "456 Boulevard Saint-Laurent, Montréal, QC",
  },
  {
    id: "TDS-003",
    customer: "Lucas Tremblay",
    email: "lucas.t@email.com",
    items: [
      { name: "Nike Dunk Low", size: "9", quantity: 1, price: 170 },
    ],
    total: 170,
    status: "processing",
    date: "2024-12-20",
    address: "789 Avenue du Parc, Montréal, QC",
  },
  {
    id: "TDS-004",
    customer: "Emma Lavoie",
    email: "emma.l@email.com",
    items: [
      { name: "Yeezy Slide", size: "8", quantity: 2, price: 90 },
    ],
    total: 180,
    status: "pending",
    date: "2024-12-21",
    address: "321 Rue Notre-Dame, Québec, QC",
  },
  {
    id: "TDS-005",
    customer: "Alexandre Roy",
    email: "alex.roy@email.com",
    items: [
      { name: "Air Jordan 4 Retro", size: "11", quantity: 1, price: 280 },
      { name: "Carhartt WIP Hoodie", size: "L", quantity: 1, price: 100 },
    ],
    total: 380,
    status: "delivered",
    date: "2024-12-10",
    address: "654 Rue King, Sherbrooke, QC",
  },
  {
    id: "TDS-006",
    customer: "Camille Gagné",
    email: "camille.g@email.com",
    items: [
      { name: "New Balance 550", size: "8", quantity: 1, price: 160 },
    ],
    total: 160,
    status: "cancelled",
    date: "2024-12-19",
    address: "987 Avenue Cartier, Québec, QC",
  },
  {
    id: "TDS-007",
    customer: "Olivier Bélanger",
    email: "olivier.b@email.com",
    items: [
      { name: "Air Jordan 1 Low", size: "10", quantity: 1, price: 240 },
    ],
    total: 240,
    status: "shipped",
    date: "2024-12-17",
    address: "147 Rue Principale, Laval, QC",
  },
  {
    id: "TDS-008",
    customer: "Jade Bouchard",
    email: "jade.b@email.com",
    items: [
      { name: "Nike Air Max 90", size: "7", quantity: 1, price: 150 },
      { name: "Nike Tech Fleece", size: "S", quantity: 1, price: 110 },
    ],
    total: 260,
    status: "processing",
    date: "2024-12-21",
    address: "258 Boulevard des Laurentides, Laval, QC",
  },
];
