import { useState } from "react";
import {
  applyMask,
  type BallotData,
  ballotSignMessage,
  computeMaskVector,
  deriveKeypair,
  type ElectionConfig,
  encodeVoteVector,
  serializeBallot,
} from "../../lib/crypto";

interface UseVoteSubmissionParams {
  config: ElectionConfig | null;
  electionId: string | null;
  address: string | undefined;
  signMessageAsync: (args: { message: string }) => Promise<string>;
}

export function useVoteSubmission({
  config,
  electionId,
  address,
  signMessageAsync,
}: UseVoteSubmissionParams) {
  const [status, setStatus] = useState<string | null>(null);
  const [resultString, setResultString] = useState<string | null>(null);

  async function handleSubmitVote(selection: number | number[]) {
    if (!config || !address || !electionId) return;

    try {
      setStatus("Encoding vote...");
      const voteVector = encodeVoteVector(
        config.votingMethod,
        config.candidates.length,
        selection,
        config.rankedWeights,
      );

      setStatus("Sign the first message to generate your voter identity...");
      const regSig = await signMessageAsync({ message: "BallotZero:onboard" });

      setStatus("Preparing your vote...");
      const { esk } = deriveKeypair(regSig);

      const maskVector = computeMaskVector(
        address,
        esk,
        config.voters,
        config.candidates.length,
        electionId,
      );

      const maskedVote = applyMask(voteVector, maskVector);

      setStatus("Sign the second message to finalize your ballot...");
      const ballotMsg = ballotSignMessage(electionId, maskedVote);
      const ballotSig = await signMessageAsync({ message: ballotMsg });

      const ballot: BallotData = {
        election_id: electionId,
        voter_address: address,
        masked_vote: maskedVote,
        signature: ballotSig,
      };

      const serialized = serializeBallot(ballot);
      const link = `${window.location.origin}/tally#ballot=${serialized}`;
      setResultString(link);
      setStatus(null);
      navigator.clipboard.writeText(link).catch(() => {});
    } catch (err) {
      setStatus(
        `Error: ${err instanceof Error ? err.message : "Signing rejected or failed."}`,
      );
    }
  }

  return { status, resultString, handleSubmitVote };
}
