"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Vendor } from "@/types/api";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Building2, Users } from "lucide-react";

export default function VendorsPage() {
  const { data, isLoading } = useQuery<{ items: Vendor[] }>({
    queryKey: ["vendors"],
    queryFn: () => api.get("/vendors/").then((r) => r.data),
  });

  const vendors = data?.items || (Array.isArray(data) ? data : []);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-[hsl(var(--text-primary))]">Vendors</h1>
        <p className="text-sm text-[hsl(var(--text-muted))] mt-0.5">{vendors.length} vendors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="card p-5 h-28 shimmer" />)
          : vendors.length === 0 ? (
            <div className="col-span-3 card">
              <EmptyState
                icon={<Users className="w-6 h-6" />}
                title="No vendors yet"
                description="Vendors are auto-created when invoice emails are processed by n8n."
              />
            </div>
          ) : vendors.map((v) => (
            <div key={v.id} className="card p-5 hover:shadow-md transition-all cursor-pointer">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--accent-muted))] border border-[hsl(var(--accent)/0.2)] flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-[hsl(var(--accent))]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[hsl(var(--text-primary))] truncate">{v.name}</p>
                  {v.email && <p className="text-xs text-[hsl(var(--text-muted))] mt-0.5 truncate">{v.email}</p>}
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {v.category && <Badge variant="muted">{v.category}</Badge>}
                    {v.payment_terms_days && (
                      <Badge variant="info">Net {v.payment_terms_days}</Badge>
                    )}
                    {v.gst_number && (
                      <span className="text-[0.65rem] text-[hsl(var(--text-muted))] font-mono">GST: {v.gst_number}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
