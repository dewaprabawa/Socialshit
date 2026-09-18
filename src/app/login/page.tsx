import { metaConfigured } from "@/lib/meta";
import { LoginFormBoundary } from "./LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return <LoginFormBoundary metaReady={metaConfigured()} />;
}
