export const PRODUCTS_QUERY = /* GraphQL */ `
  query GetProducts($channel: String!, $first: Int!) {
    products(first: $first, channel: $channel) {
      edges {
        node {
          id
          name
          slug
          category {
            name
            slug
          }
          thumbnail(size: 512) {
            url
            alt
          }
          media {
            url
            alt
          }
          variants {
            id
            name
          }
          attributes {
            attribute {
              name
              slug
            }
            values {
              name
            }
          }
          pricing {
            priceRange {
              start {
                gross {
                  amount
                  currency
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const SHOP_QUERY = /* GraphQL */ `
  query GetShop {
    shop {
      name
    }
  }
`;
