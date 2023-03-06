import { BigInt, log } from '@graphprotocol/graph-ts';
import { getOrInitDelegate } from '../helpers/initializers';
import {
  VOTING_POWER,
  BIGINT_ZERO,
  ZERO_ADDRESS,
  VOTING_CONSTANT,
  PROPOSITION_CONSTANT,
} from '../utils/constants';
import { Delegate, Delegation } from '../../generated/schema';
import { toDecimal } from '../utils/converters';
import { DelegateChanged, Transfer } from '../../generated/stkLyra/stkLyra';

enum PowerType {
  Voting,
  Proposition,
  Both,
}

function retotal(
  delegate: Delegate,
  timestamp: BigInt,
  powerType: PowerType = PowerType.Both
): void {
  if (powerType === PowerType.Voting || powerType === PowerType.Both) {
    delegate.totalVotingPowerRaw = delegate.balanceRaw
      .plus(delegate.delegatedInVotingPowerRaw)
      .minus(delegate.delegatedOutVotingPowerRaw);
    delegate.totalVotingPower = toDecimal(delegate.totalVotingPowerRaw);
  }
  if (powerType === PowerType.Proposition || powerType === PowerType.Both) {
    delegate.totalPropositionPowerRaw = delegate.balanceRaw
      .plus(delegate.delegatedInPropositionPowerRaw)
      .minus(delegate.delegatedOutPropositionPowerRaw);
    delegate.totalPropositionPower = toDecimal(delegate.totalPropositionPowerRaw);
  }
  delegate.lastUpdateTimestamp = timestamp.toI32();
  delegate.save();
}

export function handleTransfer(event: Transfer): void {
  let fromAddress = event.params.from.toHexString();
  let toAddress = event.params.to.toHexString();

  // fromHolder
  if (fromAddress != ZERO_ADDRESS) {
    let fromHolder = getOrInitDelegate(fromAddress);
    fromHolder.balanceRaw = fromHolder.balanceRaw.minus(event.params.value);
    fromHolder.balance = toDecimal(fromHolder.balanceRaw);

    if (fromHolder.balanceRaw < BIGINT_ZERO) {
      log.error('Negative balance on holder {} with balance {}', [
        fromHolder.id,
        fromHolder.balanceRaw.toString(),
      ]);
    }

    if (fromHolder.votingDelegate != fromHolder.id) {
      let votingDelegate = getOrInitDelegate(fromHolder.votingDelegate);
      votingDelegate.delegatedInVotingPowerRaw = votingDelegate.delegatedInVotingPowerRaw.minus(
        event.params.value
      );
      votingDelegate.delegatedInVotingPower = toDecimal(
        votingDelegate.delegatedInVotingPowerRaw
      );
      retotal(votingDelegate, event.block.timestamp, PowerType.Voting);
      fromHolder.delegatedOutVotingPowerRaw = fromHolder.delegatedOutVotingPowerRaw.minus(
        event.params.value
      );
      fromHolder.delegatedOutVotingPower = toDecimal(
        fromHolder.delegatedOutVotingPowerRaw
      );
    }

    if (fromHolder.propositionDelegate != fromHolder.id) {
      let propositionDelegate = getOrInitDelegate(fromHolder.propositionDelegate);
      propositionDelegate.delegatedInPropositionPowerRaw = propositionDelegate.delegatedInPropositionPowerRaw.minus(
        event.params.value
      );
      propositionDelegate.delegatedInPropositionPower = toDecimal(
        propositionDelegate.delegatedInPropositionPowerRaw
      );
      retotal(propositionDelegate, event.block.timestamp, PowerType.Proposition);
      fromHolder.delegatedOutPropositionPowerRaw = fromHolder.delegatedOutPropositionPowerRaw.minus(
        event.params.value
      );
      fromHolder.delegatedOutPropositionPower = toDecimal(
        fromHolder.delegatedOutPropositionPowerRaw
      );
    }
    retotal(fromHolder, event.block.timestamp);
  }

  // toHolder
  if (toAddress != ZERO_ADDRESS) {
    let toHolder = getOrInitDelegate(toAddress);
    toHolder.balanceRaw = toHolder.balanceRaw.plus(event.params.value);
    toHolder.balance = toDecimal(toHolder.balanceRaw);

    if (toHolder.votingDelegate != toHolder.id) {
      let votingDelegate = getOrInitDelegate(toHolder.votingDelegate);
      votingDelegate.delegatedInVotingPowerRaw = votingDelegate.delegatedInVotingPowerRaw.plus(
        event.params.value
      );
      votingDelegate.delegatedInVotingPower = toDecimal(
        votingDelegate.delegatedInVotingPowerRaw
      );
      retotal(votingDelegate, event.block.timestamp, PowerType.Voting);
      toHolder.delegatedOutVotingPowerRaw = toHolder.delegatedOutVotingPowerRaw.plus(
        event.params.value
      );
      toHolder.delegatedOutVotingPower = toDecimal(
        toHolder.delegatedOutVotingPowerRaw
      );
    }

    if (toHolder.propositionDelegate != toHolder.id) {
      let propositionDelegate = getOrInitDelegate(toHolder.propositionDelegate);
      propositionDelegate.delegatedInPropositionPowerRaw = propositionDelegate.delegatedInPropositionPowerRaw.plus(
        event.params.value
      );
      propositionDelegate.delegatedInPropositionPower = toDecimal(
        propositionDelegate.delegatedInPropositionPowerRaw
      );
      retotal(propositionDelegate, event.block.timestamp, PowerType.Proposition);
      toHolder.delegatedOutPropositionPowerRaw = toHolder.delegatedOutPropositionPowerRaw.plus(
        event.params.value
      );
      toHolder.delegatedOutPropositionPower = toDecimal(
        toHolder.delegatedOutPropositionPowerRaw
      );
    }
    retotal(toHolder, event.block.timestamp);
  }
}

export function handleDelegateChanged(event: DelegateChanged): void {
  let delegator = getOrInitDelegate(event.params.delegator.toHexString());
  let newDelegate = getOrInitDelegate(event.params.delegatee.toHexString());
  let delegationId =
    delegator.id + ':' + newDelegate.id + ':stkLyra:' + event.transaction.hash.toHexString();
  let delegation = new Delegation(delegationId);
  delegation.user = delegator.id;
  delegation.timestamp = event.block.timestamp.toI32();
  delegation.delegate = newDelegate.id;
  delegation.amountRaw = delegator.balanceRaw;
  delegation.amount = delegator.balance;

  if (event.params.delegationType == VOTING_POWER) {
    delegation.powerType = VOTING_CONSTANT;
    let previousDelegate = getOrInitDelegate(delegator.votingDelegate);
    // Subtract from previous delegate if delegator was not self-delegating
    if (previousDelegate.id != delegator.id) {
      previousDelegate.delegatedInVotingPowerRaw = previousDelegate.delegatedInVotingPowerRaw.minus(
        delegator.balanceRaw
      );
      previousDelegate.delegatedInVotingPower = toDecimal(
        previousDelegate.delegatedInVotingPowerRaw
      );
    }

    // Add to new delegate if delegator is not delegating to themself, and set delegatedOutPower accordingly
    if (newDelegate.id === delegator.id) {
      delegator.delegatedOutVotingPowerRaw = BIGINT_ZERO;
      delegator.delegatedOutVotingPower = toDecimal(
        delegator.delegatedOutVotingPowerRaw
      );
    } else {
      delegator.delegatedOutVotingPowerRaw = delegator.balanceRaw;
      delegator.delegatedOutVotingPower = toDecimal(
        delegator.delegatedOutVotingPowerRaw
      );
      newDelegate.delegatedInVotingPowerRaw = newDelegate.delegatedInVotingPowerRaw.plus(
        delegator.balanceRaw
      );
      newDelegate.delegatedInVotingPower = toDecimal(
        newDelegate.delegatedInVotingPowerRaw
      );
    }

    retotal(previousDelegate, event.block.timestamp, PowerType.Voting);
    delegator.votingDelegate = newDelegate.id;
    retotal(delegator, event.block.timestamp, PowerType.Voting);
    retotal(newDelegate, event.block.timestamp, PowerType.Voting);
  } else {
    delegation.powerType = PROPOSITION_CONSTANT;
    let previousDelegate = getOrInitDelegate(delegator.propositionDelegate);
    // Subtract from previous delegate if delegator was not self-delegating
    if (previousDelegate.id != delegator.id) {
      previousDelegate.delegatedInPropositionPowerRaw = previousDelegate.delegatedInPropositionPowerRaw.minus(
        delegator.balanceRaw
      );
      previousDelegate.delegatedInPropositionPower = toDecimal(
        previousDelegate.delegatedInPropositionPowerRaw
      );
    }

    // Add to new delegate if delegator is not delegating to themself, and set delegatedOutPower accordingly
    if (newDelegate.id === delegator.id) {
      delegator.delegatedOutPropositionPowerRaw = BIGINT_ZERO;
      delegator.delegatedOutPropositionPower = toDecimal(
        delegator.delegatedOutPropositionPowerRaw
      );
    } else {
      delegator.delegatedOutPropositionPowerRaw = delegator.balanceRaw;
      delegator.delegatedOutPropositionPower = toDecimal(
        delegator.delegatedOutPropositionPowerRaw
      );
      newDelegate.delegatedInPropositionPowerRaw = newDelegate.delegatedInPropositionPowerRaw.plus(
        delegator.balanceRaw
      );
      newDelegate.delegatedInPropositionPower = toDecimal(
        newDelegate.delegatedInPropositionPowerRaw
      );
    }
    delegation.save();
    retotal(previousDelegate, event.block.timestamp, PowerType.Proposition);
    delegator.propositionDelegate = newDelegate.id;
    retotal(delegator, event.block.timestamp, PowerType.Proposition);
    retotal(newDelegate, event.block.timestamp, PowerType.Proposition);
  }
}
