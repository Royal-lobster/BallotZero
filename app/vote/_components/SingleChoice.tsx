interface SingleChoiceProps {
  candidates: string[];
  selected: number | null;
  onChange: (idx: number) => void;
}

export function SingleChoice({
  candidates,
  selected,
  onChange,
}: SingleChoiceProps) {
  return (
    <div className="space-y-3">
      {candidates.map((candidate, idx) => (
        <label
          key={candidate}
          className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition-colors ${
            selected === idx
              ? "border-white bg-zinc-800/50"
              : "border-zinc-800 hover:border-zinc-600"
          }`}
        >
          <input
            type="radio"
            name="single-choice"
            checked={selected === idx}
            onChange={() => onChange(idx)}
            className="accent-white"
          />
          <span>{candidate}</span>
        </label>
      ))}
    </div>
  );
}
