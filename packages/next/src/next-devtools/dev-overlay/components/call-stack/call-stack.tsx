import type { OriginalStackFrame } from '../../../shared/stack-frame'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { CallStackFrame } from '../call-stack-frame/call-stack-frame'
import { ChevronUpDownIcon } from '../../icons/chevron-up-down'
import { css } from '../../utils/css'
import { getActiveElement } from '../errors/dev-tools-indicator/utils'

function isFocusedOnInteractiveElement(
  containerRef: React.RefObject<HTMLElement | null>
) {
  const el = getActiveElement(containerRef.current)

  if (!el) return false

  if (
    el.contentEditable === 'true' ||
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT'
  ) {
    return true
  }

  return false
}

export function CallStack({
  frames,
  isIgnoreListOpen,
  ignoredFramesTally,
  onToggleIgnoreList,
  selectedFrameIndex,
  onFrameSelect,
}: {
  frames: readonly OriginalStackFrame[]
  isIgnoreListOpen: boolean
  ignoredFramesTally: number
  onToggleIgnoreList: () => void
  selectedFrameIndex: number | null
  onFrameSelect: (index: number) => void
}) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Build list of selectable frame indices (frames with code frames)
  const selectableFrameIndices = useMemo(() => {
    return frames
      .map((frame, index) => ({ frame, index }))
      .filter(
        ({ frame }) =>
          (!frame.ignored || isIgnoreListOpen) &&
          Boolean(frame.originalCodeFrame) &&
          Boolean(frame.originalStackFrame)
      )
      .map(({ index }) => index)
  }, [frames, isIgnoreListOpen])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't handle keyboard navigation when focused on interactive elements
      if (isFocusedOnInteractiveElement(containerRef)) return

      // Only handle keyboard navigation if there are selectable frames
      if (selectableFrameIndices.length === 0) return

      const currentPosition =
        selectedFrameIndex !== null
          ? selectableFrameIndices.indexOf(selectedFrameIndex)
          : -1

      let newPosition = currentPosition

      if (e.key === 'ArrowDown' || e.key === 'j') {
        e.preventDefault()
        if (currentPosition < selectableFrameIndices.length - 1) {
          newPosition = currentPosition + 1
        } else {
          // Wrap to first
          newPosition = 0
        }
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        e.preventDefault()
        if (currentPosition > 0) {
          newPosition = currentPosition - 1
        } else {
          // Wrap to last
          newPosition = selectableFrameIndices.length - 1
        }
      }

      if (newPosition !== currentPosition && newPosition >= 0) {
        onFrameSelect(selectableFrameIndices[newPosition])
      }
    },
    [selectableFrameIndices, selectedFrameIndex, onFrameSelect]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Scroll selected frame into view
  useEffect(() => {
    if (selectedFrameIndex !== null && containerRef.current) {
      const selectedElement = containerRef.current.querySelector(
        `[data-nextjs-call-stack-frame-index="${selectedFrameIndex}"]`
      )
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
      }
    }
  }, [selectedFrameIndex])

  return (
    <div data-nextjs-call-stack-container ref={containerRef}>
      <div data-nextjs-call-stack-header>
        <p data-nextjs-call-stack-title>
          Call Stack <span data-nextjs-call-stack-count>{frames.length}</span>
        </p>
        {ignoredFramesTally > 0 && (
          <button
            // The isIgnoreListOpen value is used by tests to confirm whether it is open or not.
            data-nextjs-call-stack-ignored-list-toggle-button={isIgnoreListOpen}
            onClick={onToggleIgnoreList}
          >
            {`${isIgnoreListOpen ? 'Hide' : 'Show'} ${ignoredFramesTally} ignore-listed frame(s)`}
            <ChevronUpDownIcon />
          </button>
        )}
      </div>
      {frames.map((frame, frameIndex) => {
        const hasCodeFrame =
          Boolean(frame.originalCodeFrame) && Boolean(frame.originalStackFrame)
        return !frame.ignored || isIgnoreListOpen ? (
          <CallStackFrame
            key={frameIndex}
            frame={frame}
            index={frameIndex}
            isSelected={selectedFrameIndex === frameIndex}
            onSelect={hasCodeFrame ? onFrameSelect : undefined}
          />
        ) : null
      })}
    </div>
  )
}

export const CALL_STACK_STYLES = css`
  [data-nextjs-call-stack-container] {
    position: relative;
    margin-top: 8px;
  }

  [data-nextjs-call-stack-header] {
    display: flex;
    justify-content: space-between;
    align-items: center;
    min-height: var(--size-28);
    padding: 8px 8px 12px 4px;
    width: 100%;
  }

  [data-nextjs-call-stack-title] {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;

    margin: 0;

    color: var(--color-gray-1000);
    font-size: var(--size-16);
    font-weight: 500;
  }

  [data-nextjs-call-stack-count] {
    display: flex;
    justify-content: center;
    align-items: center;

    width: var(--size-20);
    height: var(--size-20);
    gap: 4px;

    color: var(--color-gray-1000);
    text-align: center;
    font-size: var(--size-11);
    font-weight: 500;
    line-height: var(--size-16);

    border-radius: var(--rounded-full);
    background: var(--color-gray-300);
  }

  [data-nextjs-call-stack-ignored-list-toggle-button] {
    all: unset;
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--color-gray-900);
    font-size: var(--size-14);
    line-height: var(--size-20);
    border-radius: 6px;
    padding: 4px 6px;
    margin-right: -6px;
    transition: background 150ms ease;

    &:hover {
      background: var(--color-gray-100);
    }

    &:focus {
      outline: var(--focus-ring);
    }

    svg {
      width: var(--size-16);
      height: var(--size-16);
    }
  }
`
