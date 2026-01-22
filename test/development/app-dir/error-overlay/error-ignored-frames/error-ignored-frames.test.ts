import { nextTestSetup } from 'e2e-utils'
import {
  waitForRedbox,
  getStackFramesContent,
  toggleCollapseCallStackFrames,
  getRedboxSource,
} from 'next-test-utils'

describe('error-ignored-frames', () => {
  const { isTurbopack, next } = nextTestSetup({
    files: __dirname,
  })

  it('should hide codeframe when selected ignored frame is collapsed', async () => {
    const browser = await next.browser('/client')
    await waitForRedbox(browser)

    // Initially, a non-ignored frame should be selected and codeframe shown
    const initialSource = await getRedboxSource(browser)
    expect(initialSource).toContain('app/client/page.tsx')

    // Expand the ignore list to show ignored frames
    await toggleCollapseCallStackFrames(browser)

    // Click on an ignored frame to select it
    const ignoredFrame = await browser.elementByCss(
      '[data-nextjs-call-stack-frame-ignored="true"] .call-stack-frame-select-button'
    )
    await ignoredFrame.click()

    // The codeframe should now show the ignored frame's source
    const ignoredSource = await getRedboxSource(browser)
    expect(ignoredSource).toBeTruthy()

    // Collapse the ignore list
    await toggleCollapseCallStackFrames(browser)

    // The codeframe should be hidden since the selected frame is no longer visible
    const collapsedSource = await getRedboxSource(browser)
    // When the selected ignored frame is collapsed, no codeframe should be shown
    // because the first non-ignored frame becomes the visible selection
    expect(collapsedSource).toContain('app/client/page.tsx')
  })

  it('should be able to collapse ignored frames in server component', async () => {
    const browser = await next.browser('/')
    await waitForRedbox(browser)

    const defaultStack = await getStackFramesContent(browser)
    expect(defaultStack).toMatchInlineSnapshot(`"at Page (app/page.tsx (2:9))"`)

    await toggleCollapseCallStackFrames(browser)

    const expandedStack = await getStackFramesContent(browser)
    const ignoreListedStack = expandedStack.replace(defaultStack, '')
    // We don't care about the exact stack trace that was ignore-listed.
    // It'll contain implementation details that may change and
    // shouldn't break this test.
    expect(ignoreListedStack.trim()).toMatch(/at .*/)
  })

  it('should be able to collapse ignored frames in client component', async () => {
    const browser = await next.browser('/client')
    await waitForRedbox(browser)

    const defaultStack = await getStackFramesContent(browser)
    expect(defaultStack).toMatchInlineSnapshot(
      `"at Page (app/client/page.tsx (4:9))"`
    )

    await toggleCollapseCallStackFrames(browser)

    const expandedStack = await getStackFramesContent(browser)
    const ignoreListedStack = expandedStack.replace(defaultStack, '')
    // We don't care about the exact stack trace that was ignore-listed.
    // It'll contain implementation details that may change and
    // shouldn't break this test.
    expect(ignoreListedStack.trim()).toMatch(/at .*/)
  })

  it('should be able to collapse ignored frames in interleaved call stack', async () => {
    const browser = await next.browser('/interleaved')
    await waitForRedbox(browser)

    const defaultStack = await getStackFramesContent(browser)
    if (isTurbopack) {
      expect(defaultStack).toMatchInlineSnapshot(`
       "at <unknown> (app/interleaved/page.tsx (7:11))
       at Page (app/interleaved/page.tsx (6:36))"
      `)
    } else {
      expect(defaultStack).toMatchInlineSnapshot(`
       "at eval (app/interleaved/page.tsx (7:11))
       at Page (app/interleaved/page.tsx (6:36))"
      `)
    }

    await toggleCollapseCallStackFrames(browser)

    const expandedStack = await getStackFramesContent(browser)
    const ignoreListedStack = expandedStack.replace(defaultStack, '')
    // We don't care about the exact stack trace that was ignore-listed.
    // It'll contain implementation details that may change and
    // shouldn't break this test.
    expect(ignoreListedStack.trim()).toMatch(/at .*/)
  })

  it('should be able to collapse pages router ignored frames', async () => {
    const browser = await next.browser('/pages')
    await waitForRedbox(browser)

    const defaultStack = await getStackFramesContent(browser)
    expect(defaultStack).toMatchInlineSnapshot(
      `"at Page (pages/pages.tsx (2:9))"`
    )

    await toggleCollapseCallStackFrames(browser)

    const expandedStack = await getStackFramesContent(browser)
    const ignoreListedStack = expandedStack.replace(defaultStack, '')
    // We don't care about the exact stack trace that was ignore-listed.
    // It'll contain implementation details that may change and
    // shouldn't break this test.
    expect(ignoreListedStack.trim()).toMatch(/at .*/)
  })
})
