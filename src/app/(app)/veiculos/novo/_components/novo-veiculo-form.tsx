"use client";

import { useRouter, useSearchParams } from "next/navigation";
import * as React from "react";
import Link from "next/link";
import { ArrowLeft, Camera, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createVehicle } from "@/lib/actions";

// O cliente Supabase é usado APENAS para upload de fotos ao Storage
// (operação que precisa rodar no browser por ser binária/streaming).
// A busca de dados (customers) vem como prop do Server Component pai.

const FUEL_TYPES = ["Gasolina", "Etanol", "Flex", "Diesel", "GNV", "Elétrico", "Híbrido"];

interface Customer { id: string; full_name: string }

interface Props {
  customers: Customer[];
}

export function NovoVeiculoForm({ customers }: Props) {
  const router = useRouter();
  const params = useSearchParams();
  const preselectedCustomer = params.get("customer");
  const [loading, setLoading] = React.useState(false);
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || !files.length) return;
    setUploadingPhoto(true);
    // O cliente browser é usado APENAS para upload binário de arquivo
    const supabase = createClient();
    const urls: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage
        .from("vehicle-photos")
        .upload(path, file, { upsert: true });
      if (error) {
        toast.error(`Erro ao enviar foto: ${error.message}`);
        continue;
      }
      const { data: pub } = supabase.storage.from("vehicle-photos").getPublicUrl(data.path);
      urls.push(pub.publicUrl);
    }

    setPhotos((prev) => [...prev, ...urls]);
    setUploadingPhoto(false);
    e.target.value = "";
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const vehicle = await createVehicle({
        customer_id: String(fd.get("customer_id")),
        brand: String(fd.get("brand")),
        model: String(fd.get("model")),
        year: Number(fd.get("year")) || undefined,
        plate: String(fd.get("plate")),
        color: (fd.get("color") as string) || undefined,
        current_km: Number(fd.get("current_km")) || undefined,
        chassis: (fd.get("chassis") as string) || undefined,
        renavam: (fd.get("renavam") as string) || undefined,
        engine: (fd.get("engine") as string) || undefined,
        fuel_type: (fd.get("fuel_type") as string) || undefined,
        last_oil_change: (fd.get("last_oil_change") as string) || undefined,
        next_revision_at: (fd.get("next_revision_at") as string) || undefined,
        tires: (fd.get("tires") as string) || undefined,
        notes: (fd.get("notes") as string) || undefined,
        photos: photos.length > 0 ? photos : undefined,
      });
      toast.success("Veículo cadastrado!");
      router.push(`/veiculos/${vehicle.id}`);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container py-6 max-w-2xl space-y-6">
      <Link href="/veiculos" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Voltar
      </Link>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Novo veículo</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        {/* Cliente */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Cliente</h2>
          <div className="space-y-2">
            <Label htmlFor="customer_id">Cliente *</Label>
            <select
              id="customer_id"
              name="customer_id"
              required
              defaultValue={preselectedCustomer ?? ""}
              className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">Selecione o cliente…</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Identificação */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Identificação</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plate">Placa *</Label>
              <Input id="plate" name="plate" required maxLength={8} placeholder="ABC1D23" style={{ textTransform: "uppercase" }} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="renavam">RENAVAM</Label>
              <Input id="renavam" name="renavam" maxLength={11} placeholder="00000000000" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="chassis">Chassi</Label>
              <Input id="chassis" name="chassis" maxLength={17} placeholder="9BWZZZ377VT004251" />
            </div>
          </div>
        </Card>

        {/* Dados do veículo */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Dados do veículo</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="brand">Marca *</Label>
              <Input id="brand" name="brand" required placeholder="Volkswagen" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Modelo *</Label>
              <Input id="model" name="model" required placeholder="Gol" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="year">Ano</Label>
              <Input id="year" name="year" type="number" min={1900} max={2100} placeholder="2024" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Input id="color" name="color" placeholder="Prata" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuel_type">Tipo de combustível</Label>
              <select
                id="fuel_type"
                name="fuel_type"
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Selecione…</option>
                {FUEL_TYPES.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="engine">Motor</Label>
              <Input id="engine" name="engine" placeholder="1.0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="current_km">KM atual</Label>
              <Input id="current_km" name="current_km" type="number" placeholder="50000" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tires">Pneus utilizados</Label>
              <Input id="tires" name="tires" placeholder="205/55 R16" />
            </div>
          </div>
        </Card>

        {/* Manutenção */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Manutenção</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="last_oil_change">Última troca de óleo</Label>
              <Input id="last_oil_change" name="last_oil_change" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="next_revision_at">Próxima revisão prevista</Label>
              <Input id="next_revision_at" name="next_revision_at" type="date" />
            </div>
          </div>
        </Card>

        {/* Fotos */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Fotos do veículo</h2>

          {photos.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((url) => (
                <div key={url} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="Foto do veículo" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(url)}
                    className="absolute top-1 right-1 size-6 rounded-full bg-black/60 text-white grid place-items-center hover:bg-black/80 transition-colors"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoChange}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingPhoto}
          >
            {uploadingPhoto ? (
              <><Loader2 className="size-4 animate-spin" /> Enviando fotos…</>
            ) : (
              <><Camera className="size-4" /> Adicionar fotos</>
            )}
          </Button>
        </Card>

        {/* Observações */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Observações</h2>
          <div className="space-y-2">
            <Textarea name="notes" rows={3} placeholder="Informações adicionais sobre o veículo…" />
          </div>
        </Card>

        <div className="flex gap-2 justify-end">
          <Link href="/veiculos"><Button type="button" variant="outline">Cancelar</Button></Link>
          <Button type="submit" variant="gradient" loading={loading}>Salvar veículo</Button>
        </div>
      </form>
    </div>
  );
}
