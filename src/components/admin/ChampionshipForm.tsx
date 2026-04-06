'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Save, Info } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Championship } from '@/types';
import { CHAMPIONSHIP_STATUS } from '@/lib/utils';
import PageHeader from '@/components/admin/PageHeader';

interface Props { championship?: Championship; }

export default function ChampionshipForm({ championship }: Props) {
  const router = useRouter();
  const isEditing = !!championship;
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: championship?.name || '',
    short_name: championship?.short_name || '',
    year: championship?.year?.toString() || new Date().getFullYear().toString(),
    season: championship?.season || '1',
    category: championship?.category || 'Principal',
    format: championship?.format || 'Pontos Corridos',
    description: championship?.description || '',
    start_date: championship?.start_date ? new Date(championship.start_date).toISOString().split('T')[0] : '',
    end_date: championship?.end_date ? new Date(championship.end_date).toISOString().split('T')[0] : '',
    status: championship?.status || 'Planejado',
    banner_url: championship?.banner_url || '',
    prize: championship?.prize || '',
    location: championship?.location || '',
    sponsor: championship?.sponsor || '',
    yellow_card_suspension_limit: championship?.yellow_card_suspension_limit?.toString() || '3',
    yellow_card_suspension_matches: championship?.yellow_card_suspension_matches?.toString() || '1',
    red_card_suspension_matches: championship?.red_card_suspension_matches?.toString() || '1',
    second_yellow_is_red: championship?.second_yellow_is_red !== false,
    league_rounds: championship?.league_rounds || 'turno',
    num_groups: championship?.num_groups?.toString() || '1',
    knockout_qualified: championship?.knockout_qualified?.toString() || '4',
    knockout_format: championship?.knockout_format || 'ida_volta',
    knockout_away_goals: championship?.knockout_away_goals !== false,
    knockout_seeding: championship?.knockout_seeding || 'cruzado',
    has_third_place: championship?.has_third_place === true,
    knockout_phases: championship?.knockout_phases || 'semi,final',
  });

  const showLeagueConfig = form.format !== 'Mata-Mata';
  const showKnockoutConfig = form.format !== 'Pontos Corridos' && form.format !== 'Triangular' && form.format !== 'Quadrangular';

  const formatDescriptions: Record<string, { title: string; desc: string; phases: string; example: string }> = {
    'Pontos Corridos': {
      title: 'Pontos Corridos (Liga)',
      desc: 'Todos os times jogam contra todos. O campeao e definido pela classificacao final. Nao ha eliminacao.',
      phases: 'Fase unica: todos x todos (turno unico ou turno e returno).',
      example: 'Ex: 6 times, turno unico = 5 rodadas. Turno e returno = 10 rodadas.',
    },
    'Pontos Corridos + Mata-Mata': {
      title: 'Pontos Corridos + Mata-Mata (Misto)',
      desc: 'Primeira fase em pontos corridos para classificar os melhores. Depois, fase eliminatoria (mata-mata) entre os classificados ate definir o campeao.',
      phases: '1a fase: todos x todos → 2a fase: semifinais e final (ida e volta ou jogo unico).',
      example: 'Ex: 6 times jogam todos x todos, top 4 vao para semifinal cruzada (1o x 4o, 2o x 3o), depois final.',
    },
    'Mata-Mata': {
      title: 'Mata-Mata (Eliminacao Direta)',
      desc: 'Todos os jogos sao eliminatorios. Perdeu, esta fora. O chaveamento pode ser por sorteio ou ranking.',
      phases: 'Fase unica: eliminatorias diretas (oitavas, quartas, semi, final).',
      example: 'Ex: 8 times, quartas de final → semi → final. Pode ser jogo unico ou ida e volta.',
    },
    'Grupos + Mata-Mata': {
      title: 'Grupos + Mata-Mata',
      desc: 'Os times sao divididos em grupos. Dentro de cada grupo, jogam todos x todos. Os melhores de cada grupo avancam para a fase eliminatoria.',
      phases: '1a fase: fase de grupos → 2a fase: mata-mata entre classificados dos grupos.',
      example: 'Ex: 12 times em 3 grupos de 4. Top 2 de cada grupo + 2 melhores 3os vao para quartas.',
    },
    'Triangular': {
      title: 'Triangular',
      desc: 'Disputa entre 3 times em turno unico (todos jogam contra todos uma vez). O de mais pontos e o campeao.',
      phases: 'Fase unica: 3 jogos no total (A x B, A x C, B x C).',
      example: 'Ex: Final em formato triangular entre os 3 primeiros colocados.',
    },
    'Quadrangular': {
      title: 'Quadrangular',
      desc: 'Disputa entre 4 times em turno unico. Todos jogam contra todos. O de mais pontos e o campeao.',
      phases: 'Fase unica: 6 jogos no total.',
      example: 'Ex: Fase final com os 4 classificados jogando entre si.',
    },
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      const body = {
        ...form,
        year: parseInt(form.year),
        short_name: form.short_name || null,
        description: form.description || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        banner_url: form.banner_url || null,
        prize: form.prize || null,
        location: form.location || null,
        sponsor: form.sponsor || null,
        yellow_card_suspension_limit: parseInt(form.yellow_card_suspension_limit) || 3,
        yellow_card_suspension_matches: parseInt(form.yellow_card_suspension_matches) || 1,
        red_card_suspension_matches: parseInt(form.red_card_suspension_matches) || 1,
        second_yellow_is_red: form.second_yellow_is_red,
        num_groups: parseInt(form.num_groups) || 1,
        knockout_qualified: parseInt(form.knockout_qualified) || 4,
        knockout_away_goals: form.knockout_away_goals,
        has_third_place: form.has_third_place,
      };
      const url = isEditing ? `/api/championships/${championship.id}` : '/api/championships';
      const method = isEditing ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (res.ok) router.push('/admin/campeonatos');
      else { const data = await res.json(); setError(data.error || 'Erro ao salvar'); }
    } catch { setError('Erro ao salvar campeonato'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <PageHeader title={isEditing ? 'Editar Campeonato' : 'Novo Campeonato'} backHref="/admin/campeonatos" />
      {error && <Alert variant="destructive" className="mb-4"><AlertDescription>{error}</AlertDescription></Alert>}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div className="md:col-span-6"><Label>Nome *</Label><Input required value={form.name} onChange={handleChange('name')} /></div>
            <div className="md:col-span-3"><Label>Sigla</Label><Input value={form.short_name} onChange={handleChange('short_name')} /></div>
            <div className="md:col-span-3"><Label>Ano *</Label><Input required type="number" value={form.year} onChange={handleChange('year')} /></div>
            <div className="md:col-span-3">
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm(prev => ({ ...prev, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Principal', 'Sub-20', 'Sub-17', 'Veteranos', 'Feminino'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label>Formato</Label>
              <Select value={form.format} onValueChange={(v) => setForm(prev => ({ ...prev, format: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Pontos Corridos', 'Pontos Corridos + Mata-Mata', 'Mata-Mata', 'Grupos + Mata-Mata', 'Triangular', 'Quadrangular'].map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {/* Format explanation */}
            {formatDescriptions[form.format] && (
              <div className="md:col-span-12 rounded-lg border border-blue-200 bg-blue-50/60 p-3">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold text-blue-800">{formatDescriptions[form.format].title}</p>
                    <p className="text-blue-700">{formatDescriptions[form.format].desc}</p>
                    <p className="text-blue-600"><strong>Fases:</strong> {formatDescriptions[form.format].phases}</p>
                    <p className="text-blue-500 italic">{formatDescriptions[form.format].example}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="md:col-span-3">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm(prev => ({ ...prev, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CHAMPIONSHIP_STATUS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label>Semestre</Label>
              <Select value={form.season} onValueChange={(v) => setForm(prev => ({ ...prev, season: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Semestre</SelectItem>
                  <SelectItem value="2">2 Semestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-6"><Label>Data Inicio</Label><Input type="date" value={form.start_date} onChange={handleChange('start_date')} /></div>
            <div className="md:col-span-6"><Label>Data Fim</Label><Input type="date" value={form.end_date} onChange={handleChange('end_date')} /></div>
            <div className="md:col-span-6"><Label>Local</Label><Input value={form.location} onChange={handleChange('location')} placeholder="Ex: Estadio Municipal" /></div>
            <div className="md:col-span-6"><Label>Patrocinador</Label><Input value={form.sponsor} onChange={handleChange('sponsor')} /></div>
            <div className="md:col-span-6"><Label>Premiacao</Label><Input value={form.prize} onChange={handleChange('prize')} placeholder="Ex: R$ 5.000,00" /></div>
            <div className="md:col-span-6"><Label>URL do Banner</Label><Input value={form.banner_url} onChange={handleChange('banner_url')} placeholder="https://..." /></div>
            <div className="md:col-span-12"><Label>Descricao</Label><Textarea rows={3} value={form.description} onChange={handleChange('description')} /></div>

            {/* Regras de Cartões */}
            <div className="md:col-span-12 border-t pt-4 mt-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Regras de Cartoes</h3>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-3">
                  <Label>Amarelos p/ suspensao</Label>
                  <Input type="number" min="1" max="10" value={form.yellow_card_suspension_limit} onChange={handleChange('yellow_card_suspension_limit')} />
                  <p className="text-[11px] text-muted-foreground mt-1">Acumulados para suspensao (ex: 3)</p>
                </div>
                <div className="md:col-span-3">
                  <Label>Jogos suspenso (amarelo)</Label>
                  <Input type="number" min="1" max="5" value={form.yellow_card_suspension_matches} onChange={handleChange('yellow_card_suspension_matches')} />
                  <p className="text-[11px] text-muted-foreground mt-1">Jogos fora ao atingir limite</p>
                </div>
                <div className="md:col-span-3">
                  <Label>Jogos suspenso (vermelho)</Label>
                  <Input type="number" min="1" max="10" value={form.red_card_suspension_matches} onChange={handleChange('red_card_suspension_matches')} />
                  <p className="text-[11px] text-muted-foreground mt-1">Jogos fora por cartao vermelho</p>
                </div>
                <div className="md:col-span-3 flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    id="second_yellow_is_red"
                    checked={form.second_yellow_is_red}
                    onChange={(e) => setForm(prev => ({ ...prev, second_yellow_is_red: e.target.checked }))}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="second_yellow_is_red" className="cursor-pointer">2 amarelos = vermelho</Label>
                </div>
              </div>
            </div>

            {/* Configuracao do Formato */}
            <div className="md:col-span-12 border-t pt-4 mt-2">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Configuracao do Formato</h3>

              {showLeagueConfig && (
                <div className="mb-4">
                  <p className="text-xs font-semibold mb-2 text-[#1a237e]">Fase Classificatoria</p>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-4">
                      <Label>Rodadas</Label>
                      <Select value={form.league_rounds} onValueChange={(v) => setForm(prev => ({ ...prev, league_rounds: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="turno">Turno unico (todos x todos 1 vez)</SelectItem>
                          <SelectItem value="turno_returno">Turno e returno (ida e volta)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {form.league_rounds === 'turno'
                          ? 'Cada time enfrenta os demais uma unica vez. Menos jogos, campeonato mais rapido.'
                          : 'Cada time joga 2x contra cada adversario (casa e fora). Mais jogos, mais justo.'}
                      </p>
                    </div>
                    <div className="md:col-span-4">
                      <Label>Numero de grupos</Label>
                      <Select value={form.num_groups} onValueChange={(v) => setForm(prev => ({ ...prev, num_groups: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Grupo unico (todos juntos)</SelectItem>
                          <SelectItem value="2">2 grupos</SelectItem>
                          <SelectItem value="3">3 grupos</SelectItem>
                          <SelectItem value="4">4 grupos</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {form.num_groups === '1'
                          ? 'Todos os times em um unico grupo disputando entre si.'
                          : `Times divididos em ${form.num_groups} grupos. Os melhores de cada avancam.`}
                      </p>
                    </div>
                    {showKnockoutConfig && (
                      <div className="md:col-span-4">
                        <Label>Classificados p/ mata-mata</Label>
                        <Select value={form.knockout_qualified} onValueChange={(v) => setForm(prev => ({ ...prev, knockout_qualified: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">Top 2</SelectItem>
                            <SelectItem value="4">Top 4</SelectItem>
                            <SelectItem value="8">Top 8</SelectItem>
                            <SelectItem value="16">Top 16</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {showKnockoutConfig && (
                <div>
                  <p className="text-xs font-semibold mb-2 text-[#1a237e]">Fase Mata-Mata</p>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <div className="md:col-span-3">
                      <Label>Formato dos jogos</Label>
                      <Select value={form.knockout_format} onValueChange={(v) => setForm(prev => ({ ...prev, knockout_format: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ida_volta">Ida e volta</SelectItem>
                          <SelectItem value="jogo_unico">Jogo unico</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {form.knockout_format === 'ida_volta'
                          ? 'Cada confronto tem 2 jogos (mando alternado). Vence quem fizer mais gols no agregado.'
                          : 'Cada confronto em jogo unico. Empate vai para penaltis.'}
                      </p>
                    </div>
                    <div className="md:col-span-3">
                      <Label>Cruzamento</Label>
                      <Select value={form.knockout_seeding} onValueChange={(v) => setForm(prev => ({ ...prev, knockout_seeding: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cruzado">Cruzado (1o x ultimo)</SelectItem>
                          <SelectItem value="chave_fixa">Chave fixa (sorteio)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {form.knockout_seeding === 'cruzado'
                          ? 'O melhor classificado enfrenta o pior (1o x 4o, 2o x 3o). Melhor colocado tem mando no jogo de volta.'
                          : 'Chaveamento definido por sorteio ou manualmente.'}
                      </p>
                    </div>
                    <div className="md:col-span-3">
                      <Label>Fases</Label>
                      <Select value={form.knockout_phases} onValueChange={(v) => setForm(prev => ({ ...prev, knockout_phases: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="final">Apenas final</SelectItem>
                          <SelectItem value="semi,final">Semifinal + Final</SelectItem>
                          <SelectItem value="quartas,semi,final">Quartas + Semi + Final</SelectItem>
                          <SelectItem value="oitavas,quartas,semi,final">Oitavas + Quartas + Semi + Final</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-3 space-y-2 pt-5">
                      {form.knockout_format === 'ida_volta' && (
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="knockout_away_goals" checked={form.knockout_away_goals}
                            onChange={(e) => setForm(prev => ({ ...prev, knockout_away_goals: e.target.checked }))}
                            className="h-4 w-4 rounded border-gray-300" />
                          <Label htmlFor="knockout_away_goals" className="cursor-pointer text-xs">Gol fora de casa</Label>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="has_third_place" checked={form.has_third_place}
                          onChange={(e) => setForm(prev => ({ ...prev, has_third_place: e.target.checked }))}
                          className="h-4 w-4 rounded border-gray-300" />
                        <Label htmlFor="has_third_place" className="cursor-pointer text-xs">Disputa de 3o lugar</Label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-12 flex justify-end gap-2">
              <Link href="/admin/campeonatos"><Button variant="outline" type="button">Cancelar</Button></Link>
              <Button type="submit" disabled={saving}><Save className="h-4 w-4 mr-2" />{saving ? 'Salvando...' : 'Salvar'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
