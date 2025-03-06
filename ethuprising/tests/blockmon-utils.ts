import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  Approval,
  ApprovalForAll,
  BatchMetadataUpdate,
  BattleCompleted,
  ExperienceGained,
  MetadataUpdate,
  OwnershipTransferred,
  PokemonClaimed,
  PokemonCreated,
  PokemonLeveledUp,
  Transfer
} from "../generated/Blockmon/Blockmon"

export function createApprovalEvent(
  owner: Address,
  approved: Address,
  tokenId: BigInt
): Approval {
  let approvalEvent = changetype<Approval>(newMockEvent())

  approvalEvent.parameters = new Array()

  approvalEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam("approved", ethereum.Value.fromAddress(approved))
  )
  approvalEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )

  return approvalEvent
}

export function createApprovalForAllEvent(
  owner: Address,
  operator: Address,
  approved: boolean
): ApprovalForAll {
  let approvalForAllEvent = changetype<ApprovalForAll>(newMockEvent())

  approvalForAllEvent.parameters = new Array()

  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("owner", ethereum.Value.fromAddress(owner))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("operator", ethereum.Value.fromAddress(operator))
  )
  approvalForAllEvent.parameters.push(
    new ethereum.EventParam("approved", ethereum.Value.fromBoolean(approved))
  )

  return approvalForAllEvent
}

export function createBatchMetadataUpdateEvent(
  _fromTokenId: BigInt,
  _toTokenId: BigInt
): BatchMetadataUpdate {
  let batchMetadataUpdateEvent = changetype<BatchMetadataUpdate>(newMockEvent())

  batchMetadataUpdateEvent.parameters = new Array()

  batchMetadataUpdateEvent.parameters.push(
    new ethereum.EventParam(
      "_fromTokenId",
      ethereum.Value.fromUnsignedBigInt(_fromTokenId)
    )
  )
  batchMetadataUpdateEvent.parameters.push(
    new ethereum.EventParam(
      "_toTokenId",
      ethereum.Value.fromUnsignedBigInt(_toTokenId)
    )
  )

  return batchMetadataUpdateEvent
}

export function createBattleCompletedEvent(
  tokenId: BigInt,
  opponentId: BigInt,
  won: boolean
): BattleCompleted {
  let battleCompletedEvent = changetype<BattleCompleted>(newMockEvent())

  battleCompletedEvent.parameters = new Array()

  battleCompletedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  battleCompletedEvent.parameters.push(
    new ethereum.EventParam(
      "opponentId",
      ethereum.Value.fromUnsignedBigInt(opponentId)
    )
  )
  battleCompletedEvent.parameters.push(
    new ethereum.EventParam("won", ethereum.Value.fromBoolean(won))
  )

  return battleCompletedEvent
}

export function createExperienceGainedEvent(
  tokenId: BigInt,
  amount: BigInt
): ExperienceGained {
  let experienceGainedEvent = changetype<ExperienceGained>(newMockEvent())

  experienceGainedEvent.parameters = new Array()

  experienceGainedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  experienceGainedEvent.parameters.push(
    new ethereum.EventParam("amount", ethereum.Value.fromUnsignedBigInt(amount))
  )

  return experienceGainedEvent
}

export function createMetadataUpdateEvent(_tokenId: BigInt): MetadataUpdate {
  let metadataUpdateEvent = changetype<MetadataUpdate>(newMockEvent())

  metadataUpdateEvent.parameters = new Array()

  metadataUpdateEvent.parameters.push(
    new ethereum.EventParam(
      "_tokenId",
      ethereum.Value.fromUnsignedBigInt(_tokenId)
    )
  )

  return metadataUpdateEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent =
    changetype<OwnershipTransferred>(newMockEvent())

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}

export function createPokemonClaimedEvent(
  tokenId: BigInt,
  claimer: Address
): PokemonClaimed {
  let pokemonClaimedEvent = changetype<PokemonClaimed>(newMockEvent())

  pokemonClaimedEvent.parameters = new Array()

  pokemonClaimedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  pokemonClaimedEvent.parameters.push(
    new ethereum.EventParam("claimer", ethereum.Value.fromAddress(claimer))
  )

  return pokemonClaimedEvent
}

export function createPokemonCreatedEvent(
  tokenId: BigInt,
  claimHash: Bytes
): PokemonCreated {
  let pokemonCreatedEvent = changetype<PokemonCreated>(newMockEvent())

  pokemonCreatedEvent.parameters = new Array()

  pokemonCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  pokemonCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "claimHash",
      ethereum.Value.fromFixedBytes(claimHash)
    )
  )

  return pokemonCreatedEvent
}

export function createPokemonLeveledUpEvent(
  tokenId: BigInt,
  newLevel: i32
): PokemonLeveledUp {
  let pokemonLeveledUpEvent = changetype<PokemonLeveledUp>(newMockEvent())

  pokemonLeveledUpEvent.parameters = new Array()

  pokemonLeveledUpEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  pokemonLeveledUpEvent.parameters.push(
    new ethereum.EventParam(
      "newLevel",
      ethereum.Value.fromUnsignedBigInt(BigInt.fromI32(newLevel))
    )
  )

  return pokemonLeveledUpEvent
}

export function createTransferEvent(
  from: Address,
  to: Address,
  tokenId: BigInt
): Transfer {
  let transferEvent = changetype<Transfer>(newMockEvent())

  transferEvent.parameters = new Array()

  transferEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  transferEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )

  return transferEvent
}
