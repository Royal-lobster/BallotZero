import { useState } from "react";
import { compressForUrl, decompressFromUrl } from "../../lib/compression";
import {
  type AggregatedResult,
  aggregateMaskedVotes,
  type BallotData,
  canonicalJson,
  computeAggregationHash,
  computeElectionId,
  type ElectionConfig,
} from "../../lib/crypto";

interface RejectedBallot {
  index: number;
  reason: string;
  voterAddress?: string;
}

export function useAggregation() {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState("");
  const [resultsLink, setResultsLink] = useState("");
  const [validCount, setValidCount] = useState(0);

  async function handleAggregate(configBase64: string, ballots: BallotData[]) {
    setProcessing(true);
    setStatus("");
    setResultsLink("");
    setValidCount(0);

    try {
      setStatus("Decoding election config...");
      const electionConfig: ElectionConfig = JSON.parse(
        decompressFromUrl(configBase64),
      );

      if (!electionConfig.voters || electionConfig.voters.length === 0) {
        setStatus("Error: Config must include voters with their public keys.");
        setProcessing(false);
        return;
      }

      const electionId = computeElectionId(electionConfig);

      if (ballots.length === 0) {
        setStatus("Error: No ballots have been added.");
        setProcessing(false);
        return;
      }

      setStatus("Validating ballots...");
      const validBallots: BallotData[] = [];
      const rejectedBallots: RejectedBallot[] = [];
      const seenAddresses = new Set<string>();

      for (let i = 0; i < ballots.length; i++) {
        const ballot = ballots[i];

        if (ballot.election_id !== electionId) {
          rejectedBallots.push({
            index: i + 1,
            reason: "Election ID mismatch",
            voterAddress: ballot.voter_address,
          });
          continue;
        }

        const addrLower = ballot.voter_address.toLowerCase();
        const voterAddresses = electionConfig.voters.map((v) =>
          v.address.toLowerCase(),
        );
        if (!voterAddresses.includes(addrLower)) {
          rejectedBallots.push({
            index: i + 1,
            reason: "Voter not in allowlist",
            voterAddress: ballot.voter_address,
          });
          continue;
        }

        if (ballot.masked_vote.length !== electionConfig.candidates.length) {
          rejectedBallots.push({
            index: i + 1,
            reason: `Masked vote length ${ballot.masked_vote.length} does not match candidate count ${electionConfig.candidates.length}`,
            voterAddress: ballot.voter_address,
          });
          continue;
        }

        if (seenAddresses.has(addrLower)) {
          rejectedBallots.push({
            index: i + 1,
            reason: "Duplicate voter (keeping first occurrence)",
            voterAddress: ballot.voter_address,
          });
          continue;
        }

        seenAddresses.add(addrLower);
        validBallots.push(ballot);
      }

      if (validBallots.length === 0) {
        setStatus("Error: No valid ballots after validation.");
        setProcessing(false);
        return;
      }

      setStatus(
        `Validated ${validBallots.length} ballots. Aggregating masked votes...`,
      );

      const numCandidates = electionConfig.candidates.length;
      const tallyResult = aggregateMaskedVotes(validBallots, numCandidates);

      setStatus("Computing aggregation hash...");
      const aggHash = computeAggregationHash(validBallots);

      const result: AggregatedResult = {
        election_id: electionId,
        tally: tallyResult,
        included_ballots: validBallots,
        aggregation_hash: aggHash,
      };

      // Strip redundant election_id for URL (derivable from config)
      const compactBallots = validBallots.map(
        ({ election_id: _eid, ...rest }) => rest,
      );
      const compactResult = {
        tally: tallyResult,
        included_ballots: compactBallots,
        aggregation_hash: aggHash,
      };
      const resultEncoded = compressForUrl(canonicalJson(compactResult));

      const link = `/results?data=${resultEncoded}&config=${configBase64}`;

      setResultsLink(link);
      setValidCount(validBallots.length);
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setProcessing(false);
    }
  }

  return { processing, status, resultsLink, validCount, handleAggregate };
}
