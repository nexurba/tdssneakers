export interface Product {
  id: number;
  name: string;
  variant: string;
  price: number;
  image: string;
  images?: string[];
  sizes: string[];
  category: "sneakers" | "vetements" | "accessoires";
  color: string;
  isNew?: boolean;
  isBestSeller?: boolean;
}

const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=800&h=800&fit=crop`;

export const products: Product[] = [
  {
    id: 1,
    name: "Air Jordan 1 Retro High",
    variant: "Black Toe",
    price: 220,
    image: img("1556906781-9a412961c28c"),
    images: [
      img("1556906781-9a412961c28c"),
      img("1595950653106-6c9ebd614d3a"),
      img("1600185365483-26d7a4cc7519"),
    ],
    sizes: ["7", "8", "9", "10", "11"],
    category: "sneakers",
    color: "Noir",
    isNew: true,
  },
  {
    id: 2,
    name: "New Balance 550",
    variant: "Grey White",
    price: 160,
    image: img("1539185441755-769473a23570"),
    images: [
      img("1539185441755-769473a23570"),
      img("1606107557195-0e29a4b5b4aa"),
      img("1514989940723-e8e51635b782"),
    ],
    sizes: ["7", "8", "9", "10", "11"],
    category: "sneakers",
    color: "Gris",
    isNew: true,
  },
  {
    id: 3,
    name: "Nike Tech Fleece Hoodie",
    variant: "Black",
    price: 120,
    image: img("1556821840-3a63f95609a7"),
    images: [
      img("1556821840-3a63f95609a7"),
      img("1618354691373-d851c5c3a990"),
      img("1434389677669-e08b4cac3105"),
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "vetements",
    color: "Noir",
    isNew: true,
  },
  {
    id: 4,
    name: "Essentials Hoodie",
    variant: "Light Oatmeal",
    price: 110,
    image: img("1620799140408-edc6dcb6d633"),
    images: [
      img("1620799140408-edc6dcb6d633"),
      img("1521572163474-6864f9cf17ab"),
      img("1618354691373-d851c5c3a990"),
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "vetements",
    color: "Beige",
    isNew: true,
  },
  {
    id: 5,
    name: "Air Jordan 4 Retro",
    variant: "Military Black",
    price: 280,
    image: img("1597045566677-8cf032ed6634"),
    images: [
      img("1597045566677-8cf032ed6634"),
      img("1491553895911-0055eca6402d"),
      img("1552346154-21d32810aba3"),
    ],
    sizes: ["7", "8", "9", "10", "11"],
    category: "sneakers",
    color: "Noir",
    isBestSeller: true,
  },
  {
    id: 6,
    name: "Nike Dunk Low",
    variant: "Panda",
    price: 170,
    image: img("1612015670817-0127d21628d4"),
    images: [
      img("1612015670817-0127d21628d4"),
      img("1600185365483-26d7a4cc7519"),
      img("1606107557195-0e29a4b5b4aa"),
    ],
    sizes: ["7", "8", "9", "10", "11"],
    category: "sneakers",
    color: "Blanc",
    isBestSeller: true,
  },
  {
    id: 7,
    name: "Air Jordan 1 Low",
    variant: "Travis Scott Mocha",
    price: 240,
    image: img("1600269452121-4f2416e55c28"),
    images: [
      img("1600269452121-4f2416e55c28"),
      img("1514989940723-e8e51635b782"),
      img("1595950653106-6c9ebd614d3a"),
    ],
    sizes: ["7", "8", "9", "10", "11"],
    category: "sneakers",
    color: "Marron",
    isBestSeller: true,
  },
  {
    id: 8,
    name: "Nike Tech Fleece",
    variant: "Jogger Black",
    price: 110,
    image: img("1515886657613-9f3515b0c78f"),
    images: [
      img("1515886657613-9f3515b0c78f"),
      img("1521572163474-6864f9cf17ab"),
      img("1434389677669-e08b4cac3105"),
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "vetements",
    color: "Noir",
    isBestSeller: true,
  },
  {
    id: 9,
    name: "Carhartt WIP Hoodie",
    variant: "Black",
    price: 100,
    image: img("1578768079052-aa76e52ff62e"),
    images: [
      img("1578768079052-aa76e52ff62e"),
      img("1618354691373-d851c5c3a990"),
      img("1556821840-3a63f95609a7"),
    ],
    sizes: ["S", "M", "L", "XL", "XXL"],
    category: "vetements",
    color: "Noir",
    isBestSeller: true,
  },
  {
    id: 10,
    name: "Yeezy Slide",
    variant: "Onyx",
    price: 90,
    image: img("1595950653106-6c9ebd614d3a"),
    images: [
      img("1595950653106-6c9ebd614d3a"),
      img("1600185365483-26d7a4cc7519"),
      img("1552346154-21d32810aba3"),
    ],
    sizes: ["7", "8", "9", "10", "11"],
    category: "sneakers",
    color: "Noir",
    isBestSeller: true,
  },
  {
    id: 11,
    name: "Nike Air Max 90",
    variant: "White",
    price: 150,
    image: img("1543508282-6319a3e2621f"),
    images: [
      img("1543508282-6319a3e2621f"),
      img("1606107557195-0e29a4b5b4aa"),
      img("1491553895911-0055eca6402d"),
    ],
    sizes: ["7", "8", "9", "10", "11"],
    category: "sneakers",
    color: "Blanc",
  },
  {
    id: 12,
    name: "Adidas Samba OG",
    variant: "Black White",
    price: 130,
    image: img("1608231387042-66d1773070a5"),
    images: [
      img("1608231387042-66d1773070a5"),
      img("1514989940723-e8e51635b782"),
      img("1600185365483-26d7a4cc7519"),
    ],
    sizes: ["7", "8", "9", "10", "11"],
    category: "sneakers",
    color: "Noir",
  },
];
