import { Bytes } from '@graphprotocol/graph-ts';
import { Proposal, Delegate } from '../../generated/schema';
import { zeroAddress, zeroBI } from '../utils/converters';
import { BIGINT_ZERO, BIGDECIMAL_ZERO, NA, STATUS_PENDING } from '../utils/constants';

export function getOrInitDelegate(id: string, createIfNotFound: boolean = true): Delegate {
  let delegate = Delegate.load(id);

  if (delegate == null && createIfNotFound) {
    delegate = new Delegate(id);

    delegate.balanceRaw = BIGINT_ZERO;
    delegate.balance = BIGDECIMAL_ZERO;

    delegate.totalVotingPowerRaw = BIGINT_ZERO;
    delegate.totalVotingPower = BIGDECIMAL_ZERO;

    delegate.totalPropositionPowerRaw = BIGINT_ZERO;
    delegate.totalPropositionPower = BIGDECIMAL_ZERO;

    delegate.delegatedInVotingPowerRaw = BIGINT_ZERO;
    delegate.delegatedInVotingPower = BIGDECIMAL_ZERO;

    delegate.delegatedOutVotingPowerRaw = BIGINT_ZERO;
    delegate.delegatedOutVotingPower = BIGDECIMAL_ZERO;

    delegate.delegatedInPropositionPowerRaw = BIGINT_ZERO;
    delegate.delegatedInPropositionPower = BIGDECIMAL_ZERO;

    delegate.delegatedOutPropositionPowerRaw = BIGINT_ZERO;
    delegate.delegatedOutPropositionPower = BIGDECIMAL_ZERO;

    delegate.usersVotingRepresentedAmount = 1;
    delegate.usersPropositionRepresentedAmount = 1;

    delegate.votingDelegate = id;
    delegate.propositionDelegate = id;

    delegate.numVotes = zeroBI().toI32();
    delegate.numProposals = zeroBI().toI32();

    delegate.lastUpdateTimestamp = zeroBI().toI32();

    delegate.save();
  }

  return delegate as Delegate;
}

export function getOrInitProposal(proposalId: string): Proposal {
  let proposal = Proposal.load(proposalId);

  if (proposal == null) {
    proposal = new Proposal(proposalId);
    proposal.state = STATUS_PENDING;
    proposal.ipfsHash = NA;
    proposal.user = zeroAddress().toString();
    proposal.executor = NA;
    proposal.targets = [Bytes.fromI32(0) as Bytes];
    proposal.values = [zeroBI()];
    proposal.signatures = [NA];
    proposal.calldatas = [Bytes.fromI32(0) as Bytes];
    proposal.withDelegatecalls = [false];
    proposal.startBlock = zeroBI();
    proposal.endBlock = zeroBI();
    proposal.governanceStrategy = Bytes.fromI32(0) as Bytes;
    proposal.currentYesVote = zeroBI();
    proposal.currentNoVote = zeroBI();
    proposal.timestamp = zeroBI().toI32();
    proposal.lastUpdateTimestamp = zeroBI().toI32();
    proposal.lastUpdateBlock = zeroBI();
    proposal.title = NA;
    proposal.simpleSummary = NA;
    proposal.abstract = NA;
    proposal.motivation = NA;
    proposal.specification = NA;
    proposal.rationale = NA;
    proposal.testCases = NA;
    proposal.copyrightWaiver = NA;
    proposal.govContract = zeroAddress();
    proposal.totalPropositionSupply = zeroBI();
    proposal.totalVotingSupply = zeroBI();
    proposal.createdBlockNumber = zeroBI();
    proposal.totalCurrentVoters = 0;
    proposal.author = NA;
    proposal.discussions = NA;
    proposal.txHash = NA;
    proposal.save();
  }

  return proposal as Proposal;
}
