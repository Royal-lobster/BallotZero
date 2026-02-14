import { useState } from "react";
import { deriveKeypair, serializeVoter, type Voter } from "../../lib/crypto";

interface UseVoterIdentityParams {
  address: string | undefined;
  signMessageAsync: (args: { message: string }) => Promise<string>;
}

export function useVoterIdentity({
  address,
  signMessageAsync,
}: UseVoterIdentityParams) {
  const [status, setStatus] = useState<string | null>(null);
  const [voterKey, setVoterKey] = useState<string | null>(null);
  const [voterLink, setVoterLink] = useState<string | null>(null);

  async function handleGenerate() {
    if (!address) return;

    try {
      setStatus("Waiting for wallet signature...");
      const sig = await signMessageAsync({ message: "BallotZero:onboard" });

      setStatus("Deriving keypair...");
      const { epk } = deriveKeypair(sig);

      const voter: Voter = { address: address.toLowerCase(), epk };
      const serialized = serializeVoter(voter);

      const link = `${window.location.origin}/create#voterkey=${serialized}`;
      setVoterKey(serialized);
      setVoterLink(link);
      setStatus(null);
      navigator.clipboard.writeText(link).catch(() => {});
    } catch (err) {
      setStatus(
        `Error: ${err instanceof Error ? err.message : "Signing rejected or failed."}`,
      );
    }
  }

  return { status, voterKey, voterLink, handleGenerate };
}
