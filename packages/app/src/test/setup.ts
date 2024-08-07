import { jest, mock } from 'bun:test'

import { GlobalRegistrator } from '@happy-dom/global-registrator'

GlobalRegistrator.register()

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Response } = require('whatwg-fetch')

const mockCanvas = {
  getContext: jest.fn(() => ({
    fillRect: jest.fn(),
    clearRect: jest.fn(),
    getImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(1024),
      height: 0,
      width: 0,
    })),
    putImageData: jest.fn(),
    createImageData: jest.fn(() => ({
      data: new Uint8ClampedArray(1024),
      height: 0,
      width: 0,
    })),
    setTransform: jest.fn(),
    drawImage: jest.fn(),
    save: jest.fn(),
    fillText: jest.fn(),
    restore: jest.fn(),
    beginPath: jest.fn(),
    moveTo: jest.fn(),
    lineTo: jest.fn(),
    closePath: jest.fn(),
    stroke: jest.fn(),
    translate: jest.fn(),
    scale: jest.fn(),
    rotate: jest.fn(),
    arc: jest.fn(),
    fill: jest.fn(),
    measureText: jest.fn(() => ({ width: 0 })),
    transform: jest.fn(),
    rect: jest.fn(),
    clip: jest.fn(),
  })),
  toDataURL: jest.fn(() => 'data:image/png;base64,'),
}

const globalAny = global as any
globalAny.fetch = () => ({
  text: () => Promise.resolve(''),
})
globalAny.Response = Response
globalAny.HTMLCanvasElement.prototype.getContext = mockCanvas.getContext
globalAny.HTMLCanvasElement.prototype.toDataURL = mockCanvas.toDataURL

const mockOpenAI = jest.fn().mockImplementation(() => ({
  organization: 'mocked_organization',
  apiKey: 'mocked_api_key',
  dangerouslyAllowBrowser: true,
  beta: {
    assistants: {
      retrieve: jest.fn().mockResolvedValue({
        id: 'mocked_assistant_id',
      }),
    },
  },
}))

mock.module('openai', () => {
  return {
    default: mockOpenAI,
  }
})
