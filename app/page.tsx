import Link from "next/link";
import { BookOpen, Github } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6">
      <main className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight">BallotZero</h1>
        <p className="text-lg text-zinc-400 leading-relaxed">
          Run elections and polls where every vote is private and every result is provably fair. No one — not even the person running the election — can see how you voted.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/create"
            className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            Create Election
          </Link>
          <Link
            href="/join"
            className="rounded-full border border-zinc-700 px-8 py-3 text-sm font-semibold transition-colors hover:border-zinc-500 hover:bg-zinc-900"
          >
            Join an Election
          </Link>
          <Link
            href="/tally"
            className="rounded-full border border-zinc-700 px-8 py-3 text-sm font-semibold transition-colors hover:border-zinc-500 hover:bg-zinc-900"
          >
            Tally Results
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 text-left">
          <div className="rounded-xl border border-zinc-800 p-6">
            <h3 className="mb-2 font-semibold">🔒 Private Ballots</h3>
            <p className="text-sm text-zinc-400">
              Your vote is kept secret using math — no one, not even the person running the election, can see how you voted.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-6">
            <h3 className="mb-2 font-semibold">✅ Verifiable</h3>
            <p className="text-sm text-zinc-400">
              You can confirm your vote was counted, and anyone can double-check the final results.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 p-6">
            <h3 className="mb-2 font-semibold">🌐 No Central Authority</h3>
            <p className="text-sm text-zinc-400">
              There's no central server or authority that could rig the results. The math guarantees a fair count.
            </p>
          </div>
        </div>
        <div className="mt-4 flex gap-6">
          <a
            href="https://srujangurram.me/blog/anonymous-votes-with-math"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <BookOpen size={14} />
            How it works
          </a>
          <a
            href="https://github.com/Royal-lobster/BallotZero"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-300"
          >
            <Github size={14} />
            GitHub
          </a>
        </div>
      </main>
    </div>
  );
}
