'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle, Upload, Instagram, User, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Player } from '@/types';

type PageState = 'loading' | 'error' | 'form' | 'success';

export default function CompletarPerfilPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>('loading');
  const [player, setPlayer] = useState<Partial<Player>>({});
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/players/complete/${token}`)
      .then(async (res) => {
        if (!res.ok) { setState('error'); return; }
        const data = await res.json();
        setPlayer(data);
        if (data.photo_url) setPhotoPreview(data.photo_url);
        setState('form');
      })
      .catch(() => setState('error'));
  }, [token]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let photo_url = player.photo_url || null;

      if (photoFile) {
        const formData = new FormData();
        formData.append('file', photoFile);
        const uploadRes = await fetch(`/api/players/complete/${token}/upload`, {
          method: 'POST',
          body: formData,
        });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          photo_url = url;
        }
      }

      const res = await fetch(`/api/players/complete/${token}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: player.nickname || null,
          birth_date: player.birth_date || null,
          dominant_foot: player.dominant_foot || null,
          height: player.height ? Number(player.height) : null,
          weight: player.weight ? Number(player.weight) : null,
          city: player.city || null,
          state: player.state || null,
          bio: player.bio || null,
          instagram: player.instagram || null,
          photo_url,
        }),
      });

      if (res.ok) {
        setState('success');
      } else {
        alert('Erro ao salvar. Tente novamente.');
      }
    } catch {
      alert('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  if (state === 'loading') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-muted-foreground mt-3">Carregando...</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <Alert variant="destructive" className="justify-center">
          <AlertDescription>
            Link invalido ou expirado. Solicite um novo link ao administrador.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold mb-1">Perfil atualizado!</h2>
        <p className="text-muted-foreground">
          Seus dados foram salvos com sucesso. Obrigado por completar seu perfil.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-4 sm:p-6">
          {/* Header */}
          <div className="text-center mb-4">
            <User className="h-10 w-10 text-blue-600 mx-auto mb-2" />
            <h1 className="text-xl font-bold">Completar Perfil</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {player.full_name || player.name} &mdash; {player.position}
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Photo */}
            <div className="text-center mb-4">
              <Avatar className="h-[100px] w-[100px] mx-auto mb-2 text-4xl">
                <AvatarImage src={photoPreview || ''} />
                <AvatarFallback>{player.name?.[0]}</AvatarFallback>
              </Avatar>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                hidden
                onChange={handlePhotoChange}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1" />
                {photoPreview ? 'Trocar foto' : 'Enviar foto'}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label htmlFor="nickname">Apelido</Label>
                <Input
                  id="nickname"
                  value={player.nickname || ''}
                  onChange={(e) => setPlayer({ ...player, nickname: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="birth_date">Data de Nascimento</Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={player.birth_date ? String(player.birth_date).substring(0, 10) : ''}
                  onChange={(e) => setPlayer({ ...player, birth_date: e.target.value })}
                />
              </div>

              <div>
                <Label>Pe Dominante</Label>
                <Select
                  value={player.dominant_foot || '__none__'}
                  onValueChange={(val) => setPlayer({ ...player, dominant_foot: val === '__none__' ? '' : val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nao informado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nao informado</SelectItem>
                    <SelectItem value="Direito">Direito</SelectItem>
                    <SelectItem value="Esquerdo">Esquerdo</SelectItem>
                    <SelectItem value="Ambidestro">Ambidestro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="height">Altura (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={player.height || ''}
                  onChange={(e) => setPlayer({ ...player, height: e.target.value ? Number(e.target.value) : null })}
                />
              </div>

              <div>
                <Label htmlFor="weight">Peso (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={player.weight || ''}
                  onChange={(e) => setPlayer({ ...player, weight: e.target.value ? Number(e.target.value) : null })}
                />
              </div>

              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={player.city || ''}
                  onChange={(e) => setPlayer({ ...player, city: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="state">Estado</Label>
                <Input
                  id="state"
                  value={player.state || ''}
                  onChange={(e) => setPlayer({ ...player, state: e.target.value })}
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="instagram">Instagram</Label>
                <div className="relative">
                  <Instagram className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="instagram"
                    className="pl-9"
                    placeholder="@seuusuario"
                    value={player.instagram || ''}
                    onChange={(e) => setPlayer({ ...player, instagram: e.target.value })}
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  rows={3}
                  placeholder="Conte um pouco sobre voce..."
                  value={player.bio || ''}
                  onChange={(e) => setPlayer({ ...player, bio: e.target.value })}
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full mt-4"
              size="lg"
              disabled={saving}
            >
              {saving ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
              {saving ? 'Salvando...' : 'Salvar Perfil'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
