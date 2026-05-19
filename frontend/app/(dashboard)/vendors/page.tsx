"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { Vendor } from "@/types/api";
import { Users, Building2 } from "lucide-react";

export default function VendorsPage() {
  const { data: vendors = [], isLoading } = useQuery<Vendor[]>({
    queryKey: ["vendors"],
    queryFn: () => api.get("/vendors/").then((r) => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold text-white">Vendors</h1>
        <p className="text-white/40 text-sm mt-1">{vendors.length} active vendors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card p-5 h-28 shimmer" />)
          : vendors.map((v) => (
              <div key={v.id} className="glass-card p-5 hover:bg-white/8 transition-all cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{v.name}</p>
                    {v.email && <p className="text-xs text-white/40 mt-0.5 truncate">{v.email}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      {v.gst_number && (
                        <span className="text-xs text-white/30 font-mono">GST: {v.gst_number}</span>
                      )}
                      {v.payment_terms_days && (
                        <span className="text-xs badge-muted px-2 py-0.5 rounded-full border">
                          Net {v.payment_terms_days}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        {!isLoading && vendors.length === 0 && (
          <div className="col-span-3 glass-card p-12 text-center text-white/30 text-sm">
            No vendors found. They will be auto-created from Gmail invoice extraction.
          </div>
        )}
      </div>
    </div>
  );
}
