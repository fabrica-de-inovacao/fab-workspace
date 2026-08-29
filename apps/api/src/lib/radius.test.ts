import { createHash, createHmac } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { buildDisconnectRequest } from './radius.js'

describe('RADIUS Disconnect-Request', () => {
  it('builds an authenticated request with session identifiers', () => {
    const secret = 'radius-test-secret'
    const { packet, identifier, requestAuthenticator } = buildDisconnectRequest({
      nasIpAddress: '192.168.10.1',
      username: 'member@example.com',
      acctSessionId: 'hotspot-123',
      callingStationId: 'AA:BB:CC:DD:EE:FF',
      framedIpAddress: '10.0.0.42',
      secret,
    })

    expect(packet[0]).toBe(40)
    expect(packet[1]).toBe(identifier)
    expect(packet.readUInt16BE(2)).toBe(packet.length)
    expect(packet.subarray(4, 20)).toEqual(requestAuthenticator)

    const attributes = packet.subarray(20)
    const messageAuthenticatorOffset = attributes.indexOf(Buffer.from([80, 18]))
    expect(messageAuthenticatorOffset).toBeGreaterThanOrEqual(0)
    const messageAuthenticator = attributes.subarray(messageAuthenticatorOffset + 2, messageAuthenticatorOffset + 18)
    const packetWithZeroMessageAuthenticator = Buffer.from(packet)
    packetWithZeroMessageAuthenticator.fill(0, 4, 20)
    packetWithZeroMessageAuthenticator.fill(0, 20 + messageAuthenticatorOffset + 2, 20 + messageAuthenticatorOffset + 18)
    expect(messageAuthenticator).toEqual(
      createHmac('md5', secret).update(packetWithZeroMessageAuthenticator).digest(),
    )

    const headerWithZeroAuthenticator = Buffer.from(packet.subarray(0, 20))
    headerWithZeroAuthenticator.fill(0, 4, 20)
    const expectedRequestAuthenticator = createHash('md5')
      .update(Buffer.concat([headerWithZeroAuthenticator, packet.subarray(20), Buffer.from(secret)]))
      .digest()
    expect(requestAuthenticator).toEqual(expectedRequestAuthenticator)
  })
})
