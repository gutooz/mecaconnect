import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSessionData } from "@/lib/auth";
import { formatCurrency, formatDateTime, formatDocument, formatPhone } from "@/lib/utils";
import { OS_STATUS_LABEL } from "@/components/ui/status-badge";

export default async function OSImprimirPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization } = await getSessionData();
  const supabase = await createClient();

  const [{ data: os }, { data: items }] = await Promise.all([
    supabase
      .from("service_orders")
      .select("*, customer:customers(*), vehicle:vehicles(*)")
      .eq("id", id)
      .eq("organization_id", organization.id)
      .single(),
    supabase.from("service_order_items").select("*").eq("service_order_id", id).order("created_at"),
  ]);
  if (!os) return notFound();

  const c = (os.customer as any);
  const v = (os.vehicle as any);

  return (
    <div className="bg-white text-black p-8 max-w-3xl mx-auto print:p-4 print:max-w-none">
      <style>{`@media print { @page { size: A4; margin: 12mm; } body { background: white; } }`}</style>

      <header className="flex items-center justify-between border-b-2 border-black pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{organization.name}</h1>
          {organization.cnpj && <p className="text-sm">CNPJ: {organization.cnpj}</p>}
          {organization.phone && <p className="text-sm">{organization.phone}</p>}
          {organization.address && <p className="text-sm">{organization.address}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wider">Ordem de Serviço</p>
          <p className="text-3xl font-bold font-mono">#{String(os.number).padStart(4, "0")}</p>
          <p className="text-sm mt-1">{formatDateTime(os.created_at)}</p>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 mb-6">
        <div className="border p-3 rounded">
          <p className="text-xs font-bold uppercase mb-1">Cliente</p>
          <p className="font-semibold">{c.full_name}</p>
          <p className="text-sm">{formatPhone(c.phone)}</p>
          {c.document && <p className="text-sm">{formatDocument(c.document)}</p>}
        </div>
        <div className="border p-3 rounded">
          <p className="text-xs font-bold uppercase mb-1">Veículo</p>
          <p className="font-semibold">{v.brand} {v.model} {v.year}</p>
          <p className="text-sm font-mono">{v.plate}</p>
          <p className="text-sm">{v.color}{os.current_km ? ` · ${os.current_km} km` : ""}</p>
        </div>
      </section>

      {os.reported_problem && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase mb-1">Problema relatado</h2>
          <p className="text-sm whitespace-pre-wrap">{os.reported_problem}</p>
        </section>
      )}

      {os.diagnosis && (
        <section className="mb-4">
          <h2 className="text-sm font-bold uppercase mb-1">Diagnóstico</h2>
          <p className="text-sm whitespace-pre-wrap">{os.diagnosis}</p>
        </section>
      )}

      <section className="mb-4">
        <h2 className="text-sm font-bold uppercase mb-2">Itens</h2>
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2 border">Descrição</th>
              <th className="text-right p-2 border w-20">Qtd</th>
              <th className="text-right p-2 border w-28">Unit.</th>
              <th className="text-right p-2 border w-28">Total</th>
            </tr>
          </thead>
          <tbody>
            {(items ?? []).map((it: any) => (
              <tr key={it.id}>
                <td className="p-2 border">{it.description}</td>
                <td className="p-2 border text-right">{it.quantity}</td>
                <td className="p-2 border text-right">{formatCurrency(it.unit_price)}</td>
                <td className="p-2 border text-right">{formatCurrency(it.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="flex justify-end mb-8">
        <table className="text-sm">
          <tbody>
            <tr><td className="pr-4">Serviços:</td><td className="text-right">{formatCurrency(os.services_total)}</td></tr>
            <tr><td className="pr-4">Peças:</td><td className="text-right">{formatCurrency(os.parts_total)}</td></tr>
            <tr><td className="pr-4">Mão de obra:</td><td className="text-right">{formatCurrency(os.labor_total)}</td></tr>
            {os.discount > 0 && <tr><td className="pr-4">Desconto:</td><td className="text-right">− {formatCurrency(os.discount)}</td></tr>}
            <tr className="border-t-2 border-black"><td className="pr-4 pt-2 font-bold">TOTAL:</td><td className="pt-2 text-right font-bold text-lg">{formatCurrency(os.total)}</td></tr>
          </tbody>
        </table>
      </section>

      <section className="grid grid-cols-2 gap-8 mt-12">
        <div>
          <div className="border-t-2 border-black pt-2 text-center text-sm">Assinatura do Cliente</div>
        </div>
        <div>
          <div className="border-t-2 border-black pt-2 text-center text-sm">Assinatura da Oficina</div>
        </div>
      </section>

      <footer className="mt-8 text-center text-xs text-gray-500 border-t pt-3">
        Status: {OS_STATUS_LABEL[os.status as keyof typeof OS_STATUS_LABEL]} ·
        Gerado em {formatDateTime(new Date())} · Documento via MecaConnect
      </footer>
    </div>
  );
}
