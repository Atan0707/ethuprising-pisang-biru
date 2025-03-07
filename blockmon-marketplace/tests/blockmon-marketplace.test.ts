import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { FeePercentageUpdated } from "../generated/schema"
import { FeePercentageUpdated as FeePercentageUpdatedEvent } from "../generated/BlockmonMarketplace/BlockmonMarketplace"
import { handleFeePercentageUpdated } from "../src/blockmon-marketplace"
import { createFeePercentageUpdatedEvent } from "./blockmon-marketplace-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let oldFeePercentage = BigInt.fromI32(234)
    let newFeePercentage = BigInt.fromI32(234)
    let newFeePercentageUpdatedEvent = createFeePercentageUpdatedEvent(
      oldFeePercentage,
      newFeePercentage
    )
    handleFeePercentageUpdated(newFeePercentageUpdatedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("FeePercentageUpdated created and stored", () => {
    assert.entityCount("FeePercentageUpdated", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "FeePercentageUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "oldFeePercentage",
      "234"
    )
    assert.fieldEquals(
      "FeePercentageUpdated",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "newFeePercentage",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
