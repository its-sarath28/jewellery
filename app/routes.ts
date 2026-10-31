import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("shop", "routes/shop.tsx"),
  route("new-arrivals", "routes/new-arrivals.tsx"),
  route("product/:slug", "routes/product.tsx"),
  route("category/:slug", "routes/category.tsx"),
  route("admin/login", "routes/admin/login.tsx"),
  route("admin", "routes/admin/layout.tsx", [
    index("routes/admin/index.tsx"),
  ]),
] satisfies RouteConfig;
