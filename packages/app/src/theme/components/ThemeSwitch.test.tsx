import { describe, test, expect, jest, afterEach } from 'bun:test'
import userEvent from '@testing-library/user-event'

import { render, screen, act, cleanup } from '../../test/test-utils'

import { ThemeSwitch } from './ThemeSwitch'

describe('ThemeSwitch', () => {
  afterEach(() => {
    cleanup()
  })

  test('renders without crashing', async () => {
    const toggleMock = jest.fn()

    render(<ThemeSwitch theme={'light'} onToggleTheme={toggleMock} />)

    const toggler = screen.getByRole('checkbox')
    expect(toggler).toBeDefined()

    await act(async () => {
      await userEvent.click(toggler)
      expect(toggleMock).toHaveBeenCalled()
    })
  })
})
