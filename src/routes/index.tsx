import { createFileRoute } from "@tanstack/react-router";
import { redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    // App is auth-first — always send to /dashboard, the _authenticated guard handles login redirect.
    throw redirect({ to: "/dashboard" });
  },
});
