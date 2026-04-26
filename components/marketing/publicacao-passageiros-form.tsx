"use client";

type Props = {
  inicio: string;
  fim: string;
  adultos: string;
  criancas: string;
  idadesCriancas: number[];
  pets: string;
  onInicioChange: (value: string) => void;
  onFimChange: (value: string) => void;
  onAdultosChange: (value: string) => void;
  onCriancasChange: (value: string) => void;
  onIdadeCriancaChange: (index: number, value: number) => void;
  onPetsChange: (value: string) => void;
};

export function PublicacaoPassageirosForm({
  inicio,
  fim,
  adultos,
  criancas,
  idadesCriancas,
  pets,
  onInicioChange,
  onFimChange,
  onAdultosChange,
  onCriancasChange,
  onIdadeCriancaChange,
  onPetsChange,
}: Props) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <label className="text-sm text-ocean-700">
        Data de partida
        <input
          type="date"
          value={inicio}
          onChange={(e) => onInicioChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2"
        />
      </label>
      <label className="text-sm text-ocean-700">
        Data de regresso
        <input
          type="date"
          value={fim}
          onChange={(e) => onFimChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2"
        />
      </label>
      <label className="text-sm text-ocean-700">
        Adultos
        <input
          type="number"
          min={1}
          max={20}
          value={adultos}
          onChange={(e) => onAdultosChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2"
        />
      </label>
      <label className="text-sm text-ocean-700">
        Crianças
        <input
          type="number"
          min={0}
          max={10}
          value={criancas}
          onChange={(e) => onCriancasChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2"
        />
      </label>
      <label className="text-sm text-ocean-700">
        Animais de estimação
        <select
          value={pets}
          onChange={(e) => onPetsChange(e.target.value)}
          className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2"
        >
          <option value="">Sem preferência</option>
          <option value="sim">Com animais</option>
          <option value="nao">Sem animais</option>
        </select>
      </label>
      {idadesCriancas.length > 0 ? (
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-ocean-700">Idade de cada criança (0 a 17 anos)</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {idadesCriancas.map((idade, idx) => (
              <label key={idx} className="text-sm text-ocean-700">
                Criança {idx + 1}
                <select
                  value={idade}
                  onChange={(e) =>
                    onIdadeCriancaChange(idx, Number.parseInt(e.target.value, 10))
                  }
                  className="mt-1 w-full rounded-xl border border-ocean-200 px-3 py-2"
                >
                  {Array.from({ length: 18 }, (_, n) => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? "ano" : "anos"}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
