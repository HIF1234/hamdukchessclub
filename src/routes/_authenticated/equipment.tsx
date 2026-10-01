import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import {
  listEquipment,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  listCheckouts,
  checkOutEquipment,
  returnEquipment,
  listOrgMembersForEquipment,
} from "@/lib/equipment/equipment.functions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Package } from "lucide-react";

export const Route = createFileRoute("/_authenticated/equipment")({
  head: () => ({ meta: [{ title: "Equipment — Hamduk Chess Club" }] }),
  component: EquipmentPage,
});

const CATEGORY_LABEL: Record<string, string> = { board: "Board", clock: "Clock", pieces: "Pieces", books: "Books", other: "Other" };

function EquipmentPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [checkoutOpenFor, setCheckoutOpenFor] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", category: "board" as const, condition: "good" as const, quantity_total: 1, location: "", notes: "" });
  const [checkoutTo, setCheckoutTo] = useState("");
  const [checkoutQty, setCheckoutQty] = useState(1);

  const fetchEquipment = useServerFn(listEquipment);
  const { data, isLoading, error } = useQuery({ queryKey: ["equipment"], queryFn: () => fetchEquipment() });
  const fetchCheckouts = useServerFn(listCheckouts);
  const { data: checkouts } = useQuery({ queryKey: ["equipment-checkouts"], queryFn: () => fetchCheckouts() });
  const fetchMembers = useServerFn(listOrgMembersForEquipment);
  const { data: members } = useQuery({ queryKey: ["equipment-members"], queryFn: () => fetchMembers() });

  const create = useServerFn(createEquipment);
  const createMut = useMutation({
    mutationFn: () => create({ data: form }),
    onSuccess: () => {
      toast.success("Added");
      setOpen(false);
      setForm({ name: "", category: "board", condition: "good", quantity_total: 1, location: "", notes: "" });
      void qc.invalidateQueries({ queryKey: ["equipment"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useServerFn(deleteEquipment);
  const removeMut = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: () => {
      toast.success("Removed");
      void qc.invalidateQueries({ queryKey: ["equipment"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const checkOut = useServerFn(checkOutEquipment);
  const checkOutMut = useMutation({
    mutationFn: (equipment_id: string) => checkOut({ data: { equipment_id, checked_out_to: checkoutTo, quantity: checkoutQty } }),
    onSuccess: () => {
      toast.success("Checked out");
      setCheckoutOpenFor(null);
      setCheckoutTo("");
      setCheckoutQty(1);
      void qc.invalidateQueries({ queryKey: ["equipment"] });
      void qc.invalidateQueries({ queryKey: ["equipment-checkouts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const returnFn = useServerFn(returnEquipment);
  const returnMut = useMutation({
    mutationFn: (checkout_id: string) => returnFn({ data: { checkout_id } }),
    onSuccess: () => {
      toast.success("Returned");
      void qc.invalidateQueries({ queryKey: ["equipment"] });
      void qc.invalidateQueries({ queryKey: ["equipment-checkouts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardShell>
      <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-primary">Equipment</p>
          <h1 className="mt-2 font-display text-4xl">Inventory</h1>
          <p className="mt-2 text-muted-foreground">Boards, clocks, sets, and books your organization owns.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> Add item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add equipment</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Tournament board set" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v as typeof form.category })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORY_LABEL).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Condition</Label>
                  <Select value={form.condition} onValueChange={(v) => setForm({ ...form, condition: v as typeof form.condition })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="good">Good</SelectItem>
                      <SelectItem value="fair">Fair</SelectItem>
                      <SelectItem value="poor">Poor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" min={0} value={form.quantity_total} onChange={(e) => setForm({ ...form, quantity_total: Number(e.target.value) || 0 })} />
              </div>
              <div>
                <Label>Location (optional)</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Storage cupboard A" />
              </div>
              <div>
                <Label>Notes (optional)</Label>
                <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
              </div>
              <Button className="w-full" disabled={createMut.isPending || !form.name.trim()} onClick={() => createMut.mutate()}>
                Add
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Item</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Condition</th>
                <th className="text-left px-4 py-3">Available</th>
                <th className="text-left px-4 py-3">Location</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Loading…</td></tr>}
              {error && <tr><td colSpan={6} className="px-4 py-8 text-center text-destructive">{(error as Error).message}</td></tr>}
              {data?.map((item) => (
                <tr key={item.id} className="border-t border-border/40 hover:bg-secondary/20">
                  <td className="px-4 py-3 font-medium">{item.name}</td>
                  <td className="px-4 py-3">{CATEGORY_LABEL[item.category] ?? item.category}</td>
                  <td className="px-4 py-3 capitalize">{item.condition}</td>
                  <td className="px-4 py-3">{item.quantity_available} / {item.quantity_total}</td>
                  <td className="px-4 py-3 text-muted-foreground">{item.location ?? "—"}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <Dialog open={checkoutOpenFor === item.id} onOpenChange={(o) => setCheckoutOpenFor(o ? item.id : null)}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" disabled={item.quantity_available === 0}>Check out</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader><DialogTitle>Check out {item.name}</DialogTitle></DialogHeader>
                        <div className="space-y-3">
                          <div>
                            <Label>To</Label>
                            <Select value={checkoutTo} onValueChange={setCheckoutTo}>
                              <SelectTrigger><SelectValue placeholder="Select member…" /></SelectTrigger>
                              <SelectContent>
                                {(members ?? []).map((m) => <SelectItem key={m.id} value={m.id}>{m.full_name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Quantity</Label>
                            <Input type="number" min={1} max={item.quantity_available} value={checkoutQty} onChange={(e) => setCheckoutQty(Number(e.target.value) || 1)} />
                          </div>
                          <Button className="w-full" disabled={checkOutMut.isPending || !checkoutTo} onClick={() => checkOutMut.mutate(item.id)}>
                            Check out
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button size="sm" variant="ghost" disabled={removeMut.isPending} onClick={() => removeMut.mutate(item.id)}>
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
              {data?.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">No equipment yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="overflow-hidden mt-6">
        <div className="p-6 pb-0 flex items-center gap-2">
          <Package className="h-4 w-4 text-primary/70" />
          <h2 className="font-medium">Currently checked out</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm mt-4">
            <thead className="bg-secondary/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3">Item</th>
                <th className="text-left px-4 py-3">With</th>
                <th className="text-left px-4 py-3">Qty</th>
                <th className="text-left px-4 py-3">Since</th>
                <th className="text-left px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {(checkouts ?? []).length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Nothing checked out.</td></tr>}
              {checkouts?.map((c) => (
                <tr key={c.id} className="border-t border-border/40">
                  <td className="px-4 py-3 font-medium">{c.equipment_name}</td>
                  <td className="px-4 py-3">{c.checked_out_to_name}</td>
                  <td className="px-4 py-3">{c.quantity}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(c.checked_out_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" disabled={returnMut.isPending} onClick={() => returnMut.mutate(c.id)}>
                      Mark returned
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardShell>
  );
}
