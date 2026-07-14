import { ProductShell } from "@/components/shell/product-shell";

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <ProductShell>{children}</ProductShell>;
}
