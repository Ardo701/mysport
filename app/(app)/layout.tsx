import type { ReactNode } from "react";
import { Coquille } from "@/composants/coquille";

export default function LayoutApplication({ children }: { children: ReactNode }) {
  return <Coquille>{children}</Coquille>;
}
