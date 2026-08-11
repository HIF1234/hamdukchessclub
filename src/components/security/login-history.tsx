import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { listLoginHistory } from "@/lib/account/account.functions";

export function LoginHistory() {
  const load = useServerFn(listLoginHistory);
  const { data, isLoading } = useQuery({ queryKey: ["login-history"], queryFn: () => load() });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!data?.length) return <p className="text-sm text-muted-foreground">No sign-ins recorded yet.</p>;

  return (
    <ul className="divide-y divide-border/60">
      {data.map((e) => (
        <li key={e.id} className="py-2.5 flex items-start justify-between gap-3 text-sm">
          <div>
            <p>
              {e.device ?? "Unknown device"} · {e.browser ?? "Unknown browser"}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(e.created_at).toLocaleString()}
              {e.location ? ` · ${e.location}` : ""}
              {e.ip_address ? ` · ${e.ip_address}` : ""}
            </p>
          </div>
          <Badge variant={e.success ? "secondary" : "destructive"} className="capitalize shrink-0">
            {e.method}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
