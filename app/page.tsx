import {
  BadgeCheck,
  BarChart3,
  BookOpen,
  Github,
  Globe,
  Lock,
  PlusCircle,
  Send,
  ShieldCheck,
  UserPlus,
  Vote,
} from "lucide-react";
import Link from "next/link";

const steps = [
  {
    number: 1,
    icon: UserPlus,
    role: "Each Voter",
    title: "Register to Vote",
    description:
      "Each voter connects their wallet and generates a unique voter key. They share their key link with the organizer.",
  },
  {
    number: 2,
    icon: PlusCircle,
    role: "Organizer",
    title: "Create an Election",
    description:
      "The organizer collects voter keys, sets a title, adds candidates, and picks a voting method — single choice, approval, ranked, or score.",
  },
  {
    number: 3,
    icon: Send,
    role: "Organizer",
    title: "Share the Voting Link",
    description: "The organizer sends each voter a link to cast their ballot.",
  },
  {
    number: 4,
    icon: Vote,
    role: "Each Voter",
    title: "Cast a Private Vote",
    description:
      "Voters open the link, make their choice, and sign it with their wallet. The vote is cryptographically masked before sharing.",
  },
  {
    number: 5,
    icon: BarChart3,
    role: "Organizer",
    title: "Tally the Results",
    description:
      "The organizer collects all masked ballots and aggregates them. The masks cancel out, revealing only the final totals.",
  },
  {
    number: 6,
    icon: Send,
    role: "Organizer",
    title: "Share the Results",
    description:
      "The organizer shares a results link with all participants so everyone can see the final outcome.",
  },
  {
    number: 7,
    icon: ShieldCheck,
    role: "Anyone",
    title: "Verify the Results",
    description:
      "Anyone can verify their vote was counted and that the final tally matches the submitted ballots. No trust required.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center px-6 py-24">
      <main className="flex max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="text-5xl font-bold tracking-tight">BallotZero</h1>
        <p className="text-lg text-zinc-400 leading-relaxed">
          Run elections and polls where every vote is private and every result
          is provably fair. No one — not even the person running the election —
          can see how you voted.
        </p>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href="/create"
            className="flex items-center justify-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            <PlusCircle size={16} />
            Create Election
          </Link>
          <Link
            href="/join"
            className="flex items-center justify-center gap-2 rounded-full border border-zinc-700 px-8 py-3 text-sm font-semibold transition-colors hover:border-zinc-500 hover:bg-zinc-900"
          >
            <UserPlus size={16} />
            Join an Election
          </Link>
          <Link
            href="/tally"
            className="flex items-center justify-center gap-2 rounded-full border border-zinc-700 px-8 py-3 text-sm font-semibold transition-colors hover:border-zinc-500 hover:bg-zinc-900"
          >
            <BarChart3 size={16} />
            Tally Results
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3 text-left">
          <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-amber-500/30">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/20">
              <Lock size={20} className="text-amber-400" />
            </div>
            <h3 className="mb-2 font-semibold">Private Ballots</h3>
            <p className="text-sm leading-relaxed text-zinc-400">
              Your vote is kept secret using math — no one, not even the person
              running the election, can see how you voted.
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-emerald-500/30">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent" />
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20">
              <BadgeCheck size={20} className="text-emerald-400" />
            </div>
            <h3 className="mb-2 font-semibold">Verifiable</h3>
            <p className="text-sm leading-relaxed text-zinc-400">
              You can confirm your vote was counted, and anyone can double-check
              the final results.
            </p>
          </div>

          <div className="group relative overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition-colors hover:border-sky-500/30">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-500/60 to-transparent" />
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/10 ring-1 ring-sky-500/20">
              <Globe size={20} className="text-sky-400" />
            </div>
            <h3 className="mb-2 font-semibold">No Central Authority</h3>
            <p className="text-sm leading-relaxed text-zinc-400">
              There's no central server or authority that could rig the results.
              The math guarantees a fair count.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-16 w-full max-w-xl">
          <h2 className="mb-10 text-2xl font-bold tracking-tight">
            How It Works
          </h2>
          <div className="relative flex flex-col gap-0">
            {/* Vertical line */}
            <div className="absolute left-5 top-6 bottom-6 w-px bg-zinc-800" />

            {steps.map((step) => (
              <div key={step.number} className="relative flex gap-5 py-5">
                {/* Icon circle */}
                <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900">
                  <step.icon size={18} className="text-zinc-300" />
                </div>

                {/* Content */}
                <div className="text-left">
                  <span className="text-[11px] font-medium uppercase tracking-widest text-zinc-500">
                    {step.role}
                  </span>
                  <h3 className="mt-0.5 font-semibold leading-snug">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-400">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex gap-6">
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
