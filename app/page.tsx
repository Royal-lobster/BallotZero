import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <main className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight">BallotZero</h1>
        <p className="text-lg text-zinc-400 leading-relaxed">
          Trustless, verifiable elections powered by DC-net pairwise masking.
          No backend. No decryption keys. No trust required.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/create"
            className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Create Election
          </Link>
          <Link
            href="/onboard"
            className="rounded-full border border-zinc-700 px-8 py-3 text-sm font-semibold transition-colors hover:border-zinc-500 hover:bg-zinc-900"
          >
            Get Voter Key
          </Link>
          <Link
            href="/aggregate"
            className="rounded-full border border-zinc-700 px-8 py-3 text-sm font-semibold transition-colors hover:border-zinc-500 hover:bg-zinc-900"
          >
            Aggregate Ballots
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 text-left">
          <div className="rounded-xl border border-zinc-800 p-6">
            <h3 className="mb-2 font-semibold">🔒 Private Ballots</h3>
            <p className="text-sm text-zinc-400">
              Votes are masked using pairwise cryptographic secrets between voters. No one — not even the organizer — can see individual votes.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-6">
            <h3 className="mb-2 font-semibold">✅ Verifiable</h3>
            <p className="text-sm text-zinc-400">
              Anyone can verify their ballot was included and re-compute the tally from the published ballots.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-6">
            <h3 className="mb-2 font-semibold">🌐 Zero Trust</h3>
            <p className="text-sm text-zinc-400">
              No decryption keys exist. No backend. No trusted parties. Results emerge automatically from the math.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
