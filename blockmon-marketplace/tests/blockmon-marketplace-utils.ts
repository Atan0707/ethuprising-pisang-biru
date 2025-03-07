import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  FeePercentageUpdated,
  ListingCancelled,
  ListingCreated,
  ListingPurchased,
  OwnershipTransferred
} from "../generated/BlockmonMarketplace/BlockmonMarketplace"

export function createFeePercentageUpdatedEvent(
  oldFeePercentage: BigInt,
  newFeePercentage: BigInt
): FeePercentageUpdated {
  let feePercentageUpdatedEvent =
    changetype<FeePercentageUpdated>(newMockEvent())

  feePercentageUpdatedEvent.parameters = new Array()

  feePercentageUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "oldFeePercentage",
      ethereum.Value.fromUnsignedBigInt(oldFeePercentage)
    )
  )
  feePercentageUpdatedEvent.parameters.push(
    new ethereum.EventParam(
      "newFeePercentage",
      ethereum.Value.fromUnsignedBigInt(newFeePercentage)
    )
  )

  return feePercentageUpdatedEvent
}

export function createListingCancelledEvent(
  tokenId: BigInt,
  seller: Address
): ListingCancelled {
  let listingCancelledEvent = changetype<ListingCancelled>(newMockEvent())

  listingCancelledEvent.parameters = new Array()

  listingCancelledEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  listingCancelledEvent.parameters.push(
    new ethereum.EventParam("seller", ethereum.Value.fromAddress(seller))
  )

  return listingCancelledEvent
}

export function createListingCreatedEvent(
  tokenId: BigInt,
  seller: Address,
  price: BigInt
): ListingCreated {
  let listingCreatedEvent = changetype<ListingCreated>(newMockEvent())

  listingCreatedEvent.parameters = new Array()

  listingCreatedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  listingCreatedEvent.parameters.push(
    new ethereum.EventParam("seller", ethereum.Value.fromAddress(seller))
  )
  listingCreatedEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )

  return listingCreatedEvent
}

export function createListingPurchasedEvent(
  tokenId: BigInt,
  seller: Address,
  buyer: Address,
  price: BigInt
): ListingPurchased {
  let listingPurchasedEvent = changetype<ListingPurchased>(newMockEvent())

  listingPurchasedEvent.parameters = new Array()

  listingPurchasedEvent.parameters.push(
    new ethereum.EventParam(
      "tokenId",
      ethereum.Value.fromUnsignedBigInt(tokenId)
    )
  )
  listingPurchasedEvent.parameters.push(
    new ethereum.EventParam("seller", ethereum.Value.fromAddress(seller))
  )
  listingPurchasedEvent.parameters.push(
    new ethereum.EventParam("buyer", ethereum.Value.fromAddress(buyer))
  )
  listingPurchasedEvent.parameters.push(
    new ethereum.EventParam("price", ethereum.Value.fromUnsignedBigInt(price))
  )

  return listingPurchasedEvent
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
