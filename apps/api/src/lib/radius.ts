import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { createSocket } from 'node:dgram'
import { isIP } from 'node:net'

export const ACCT_INTERIM_INTERVAL_SECONDS = '300'

const DISCONNECT_REQUEST = 40
const DISCONNECT_ACK = 41
const DISCONNECT_NAK = 42
const MESSAGE_AUTHENTICATOR = 80
const ERROR_CAUSE = 101

type RadiusAttribute = { type: number; value: Buffer }

export type DisconnectRequest = {
  nasIpAddress: string
  username: string
  acctSessionId: string
  callingStationId?: string | null
  framedIpAddress?: string | null
  secret: string
  port?: number
  timeoutMs?: number
}

export class RadiusDisconnectError extends Error {
  constructor(public readonly reason: 'invalid' | 'timeout' | 'network' | 'rejected', public readonly errorCause?: number) {
    super(`RADIUS_DISCONNECT_${reason.toUpperCase()}`)
  }
}

function attribute(type: number, value: Buffer | string) {
  const encoded = Buffer.isBuffer(value) ? value : Buffer.from(value, 'utf8')
  if (encoded.length > 253) throw new RadiusDisconnectError('invalid')
  return Buffer.concat([Buffer.from([type, encoded.length + 2]), encoded])
}

function ipv4(value: string) {
  return Buffer.from(value.split('.').map(Number))
}

function encodeAttributes(attributes: RadiusAttribute[]) {
  return Buffer.concat(attributes.map(({ type, value }) => attribute(type, value)))
}

export function buildDisconnectRequest(input: DisconnectRequest) {
  if (isIP(input.nasIpAddress) !== 4 || !input.username || !input.acctSessionId) throw new RadiusDisconnectError('invalid')

  const attributes: RadiusAttribute[] = [
    { type: 1, value: Buffer.from(input.username) },
    { type: 44, value: Buffer.from(input.acctSessionId) },
    { type: 4, value: ipv4(input.nasIpAddress) },
  ]
  if (input.callingStationId) attributes.push({ type: 31, value: Buffer.from(input.callingStationId) })
  if (input.framedIpAddress && isIP(input.framedIpAddress) === 4) attributes.push({ type: 8, value: ipv4(input.framedIpAddress) })

  const identifier = randomBytes(1)[0] ?? 0
  const unsignedAttributes = encodeAttributes(attributes)
  const messageAuthenticator = attribute(MESSAGE_AUTHENTICATOR, Buffer.alloc(16))
  const length = 20 + unsignedAttributes.length + messageAuthenticator.length
  const header = Buffer.alloc(20)
  header[0] = DISCONNECT_REQUEST
  header[1] = identifier
  header.writeUInt16BE(length, 2)

  const messageAuth = createHmac('md5', input.secret)
    .update(Buffer.concat([header, unsignedAttributes, messageAuthenticator]))
    .digest()
  const attributesWithAuth = Buffer.concat([unsignedAttributes, attribute(MESSAGE_AUTHENTICATOR, messageAuth)])
  const requestAuth = createHash('md5')
    .update(Buffer.concat([header, attributesWithAuth, Buffer.from(input.secret)]))
    .digest()
  header.set(requestAuth, 4)

  return { packet: Buffer.concat([header, attributesWithAuth]), identifier, requestAuthenticator: requestAuth }
}

function parseResponse(message: Buffer, request: ReturnType<typeof buildDisconnectRequest>, secret: string) {
  if (message.length < 20 || message[1] !== request.identifier) throw new RadiusDisconnectError('invalid')
  const length = message.readUInt16BE(2)
  if (length < 20 || length > message.length) throw new RadiusDisconnectError('invalid')
  const expected = createHash('md5')
    .update(Buffer.concat([message.subarray(0, 4), request.requestAuthenticator, message.subarray(20, length), Buffer.from(secret)]))
    .digest()
  if (!timingSafeEqual(message.subarray(4, 20), expected)) throw new RadiusDisconnectError('invalid')

  let errorCause: number | undefined
  for (let offset = 20; offset < length;) {
    const attributeLength = message[offset + 1]
    if (!attributeLength || attributeLength < 2 || offset + attributeLength > length) throw new RadiusDisconnectError('invalid')
    if (message[offset] === ERROR_CAUSE && attributeLength === 6) errorCause = message.readUInt32BE(offset + 2)
    offset += attributeLength
  }

  if (message[0] === DISCONNECT_NAK) throw new RadiusDisconnectError('rejected', errorCause)
  if (message[0] !== DISCONNECT_ACK) throw new RadiusDisconnectError('invalid')
  return errorCause === undefined ? { acknowledged: true as const } : { acknowledged: true as const, errorCause }
}

export async function disconnectRadius(input: DisconnectRequest) {
  const request = buildDisconnectRequest(input)
  if (isIP(input.nasIpAddress) !== 4) throw new RadiusDisconnectError('invalid')
  const socket = createSocket('udp4')
  const timeoutMs = input.timeoutMs ?? 2_000
  const port = input.port ?? 3799

  return new Promise<{ acknowledged: true; errorCause?: number }>((resolve, reject) => {
    let attempts = 0
    let timer: NodeJS.Timeout | undefined
    let settled = false

    const finish = (error?: Error, result?: { acknowledged: true; errorCause?: number }) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      socket.close()
      if (error) reject(error)
      else if (result) resolve(result)
    }

    const send = () => {
      attempts += 1
      socket.send(request.packet, port, input.nasIpAddress, (error) => {
        if (error) finish(new RadiusDisconnectError('network'))
      })
      timer = setTimeout(() => {
        if (attempts < 2) send()
        else finish(new RadiusDisconnectError('timeout'))
      }, timeoutMs)
    }

    socket.on('message', (message) => {
      try {
        finish(undefined, parseResponse(message, request, input.secret))
      } catch (error) {
        finish(error instanceof Error ? error : new RadiusDisconnectError('invalid'))
      }
    })
    socket.on('error', () => finish(new RadiusDisconnectError('network')))
    send()
  })
}
