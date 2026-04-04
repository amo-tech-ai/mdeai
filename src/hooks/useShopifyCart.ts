import { useState, useCallback, useEffect } from "react";

const STORE_DOMAIN = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN || "";
const STOREFRONT_TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN || "";
const API_VERSION = "2026-01";

const CART_STORAGE_KEY = "mdeai-shopify-cart-id";

interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: { title: string; handle: string };
    price: { amount: string; currencyCode: string };
    image?: { url: string; altText: string | null };
  };
}

interface Cart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  lines: CartLine[];
  cost: {
    totalAmount: { amount: string; currencyCode: string };
  };
}

async function shopifyStorefrontFetch<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T> {
  if (!STORE_DOMAIN || !STOREFRONT_TOKEN) {
    throw new Error("Shopify Storefront API credentials not configured");
  }

  const response = await fetch(
    `https://${STORE_DOMAIN}/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": STOREFRONT_TOKEN,
      },
      body: JSON.stringify({ query, variables }),
    }
  );

  if (!response.ok) {
    throw new Error(`Storefront API error: ${response.status}`);
  }

  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
}

const CART_CREATE = `
  mutation cartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost { totalAmount { amount currencyCode } }
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product { title handle }
                  price { amount currencyCode }
                  image { url altText }
                }
              }
            }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

const CART_LINES_ADD = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        id
        checkoutUrl
        totalQuantity
        cost { totalAmount { amount currencyCode } }
        lines(first: 50) {
          edges {
            node {
              id
              quantity
              merchandise {
                ... on ProductVariant {
                  id
                  title
                  product { title handle }
                  price { amount currencyCode }
                  image { url altText }
                }
              }
            }
          }
        }
      }
      userErrors { field message }
    }
  }
`;

const CART_QUERY = `
  query cart($id: ID!) {
    cart(id: $id) {
      id
      checkoutUrl
      totalQuantity
      cost { totalAmount { amount currencyCode } }
      lines(first: 50) {
        edges {
          node {
            id
            quantity
            merchandise {
              ... on ProductVariant {
                id
                title
                product { title handle }
                price { amount currencyCode }
                image { url altText }
              }
            }
          }
        }
      }
    }
  }
`;

function parseCart(raw: Record<string, unknown> | null): Cart | null {
  if (!raw) return null;
  const r = raw as {
    id: string;
    checkoutUrl: string;
    totalQuantity: number;
    cost: Cart["cost"];
    lines: { edges: Array<{ node: CartLine }> };
  };
  return {
    id: r.id,
    checkoutUrl: r.checkoutUrl,
    totalQuantity: r.totalQuantity,
    cost: r.cost,
    lines: r.lines.edges.map((e) => e.node),
  };
}

export function useShopifyCart() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Restore cart from localStorage on mount
  useEffect(() => {
    const cartId = localStorage.getItem(CART_STORAGE_KEY);
    if (cartId) {
      shopifyStorefrontFetch<{ cart: Record<string, unknown> | null }>(CART_QUERY, { id: cartId })
        .then((data) => setCart(parseCart(data.cart)))
        .catch(() => localStorage.removeItem(CART_STORAGE_KEY));
    }
  }, []);

  const addToCart = useCallback(
    async (variantId: string, quantity = 1) => {
      setLoading(true);
      setError(null);

      try {
        if (cart?.id) {
          // Add to existing cart
          const data = await shopifyStorefrontFetch<{
            cartLinesAdd: { cart: Record<string, unknown>; userErrors: Array<{ field: string; message: string }> };
          }>(CART_LINES_ADD, {
            cartId: cart.id,
            lines: [{ merchandiseId: variantId, quantity }],
          });

          if (data.cartLinesAdd.userErrors.length) {
            throw new Error(data.cartLinesAdd.userErrors[0].message);
          }
          setCart(parseCart(data.cartLinesAdd.cart));
        } else {
          // Create new cart
          const data = await shopifyStorefrontFetch<{
            cartCreate: { cart: Record<string, unknown>; userErrors: Array<{ field: string; message: string }> };
          }>(CART_CREATE, {
            input: { lines: [{ merchandiseId: variantId, quantity }] },
          });

          if (data.cartCreate.userErrors.length) {
            throw new Error(data.cartCreate.userErrors[0].message);
          }

          const newCart = parseCart(data.cartCreate.cart);
          if (newCart) {
            localStorage.setItem(CART_STORAGE_KEY, newCart.id);
            setCart(newCart);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to add to cart");
      } finally {
        setLoading(false);
      }
    },
    [cart]
  );

  const goToCheckout = useCallback(() => {
    if (cart?.checkoutUrl) {
      window.open(cart.checkoutUrl, "_blank");
    }
  }, [cart]);

  return {
    cart,
    loading,
    error,
    addToCart,
    goToCheckout,
    itemCount: cart?.totalQuantity ?? 0,
  };
}
