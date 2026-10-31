type FrameSequence = {
    section: HTMLElement;
    containerTop: number;
    effectiveHeight: number;
    total: number;
    measure: () => void;
};

/** One optional scroll loop for all home frame sections; no React work per tick. */
export function setupFrameAutoScroll(sequences: FrameSequence[]): () => void {
    const abort = new AbortController();
    let active: FrameSequence | null = null;
    let direction = 0;
    let raf = 0;
    let previousTime = 0;
    let position = 0;
    let expectedScroll = 0;
    let start = 0;
    let end = 0;
    let speed = 0;
    const controls = sequences.map(sequence => ({
        sequence,
        root: sequence.section.querySelector<HTMLElement>('[data-frame-auto-controls]'),
    }));

    function updateControls() {
        for (const { sequence, root } of controls) {
            if (!root) continue;
            const running = active === sequence;
            const status = root.querySelector<HTMLElement>('[data-frame-auto-status]');
            root.dataset.state = running ? 'on' : 'off';
            if (status) status.textContent = running ? (direction > 0 ? 'Playing' : 'Rewinding') : 'Paused';
            root.querySelectorAll<HTMLButtonElement>('button[data-frame-auto-direction]').forEach(button => {
                const selected = running && Number(button.dataset.frameAutoDirection) === direction;
                button.setAttribute('aria-pressed', String(selected));
                button.setAttribute('aria-label', selected ? 'Stop auto scroll' : `Auto scroll ${Number(button.dataset.frameAutoDirection) > 0 ? 'forward' : 'backward'}`);
            });
        }
    }

    function updateProgress() {
        const root = controls.find(control => control.sequence === active)?.root;
        root?.style.setProperty('--frame-progress', ((position - start) / Math.max(1, end - start)).toFixed(4));
    }

    function stop() {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        if (!active) return;
        active = null;
        direction = 0;
        updateControls();
    }

    function tick(now: number) {
        raf = 0;
        if (!active || document.hidden || abort.signal.aborted) { stop(); return; }
        // Also catch scrollbar dragging or another page control moving the viewport.
        if (Math.abs(window.scrollY - expectedScroll) > 4) { stop(); return; }
        const elapsed = Math.min(now - previousTime, 32) / 1000;
        previousTime = now;
        position = Math.max(start, Math.min(end, position + direction * speed * elapsed));
        // Explicit instant steps avoid stacking CSS smooth-scroll animations.
        window.scrollTo({ top: position, behavior: 'instant' });
        expectedScroll = window.scrollY;
        updateProgress();
        if ((direction > 0 && position >= end) || (direction < 0 && position <= start)) { stop(); return; }
        raf = requestAnimationFrame(tick);
    }

    for (const { sequence, root } of controls) {
        root?.querySelectorAll<HTMLButtonElement>('button[data-frame-auto-direction]').forEach(button => {
            button.addEventListener('click', () => {
                const nextDirection = Number(button.dataset.frameAutoDirection);
                if (active === sequence && direction === nextDirection) { stop(); return; }
                stop();
                sequence.measure();
                start = Math.max(0, sequence.containerTop);
                end = start + Math.max(0, sequence.effectiveHeight);
                position = window.scrollY;
                if (document.hidden || end <= start || (nextDirection > 0 && position >= end) || (nextDirection < 0 && position <= start)) return;
                active = sequence;
                direction = nextDirection;
                // 24 source frames per second, independent of screen refresh rate.
                speed = (end - start) * 24 / Math.max(1, sequence.total - 1);
                expectedScroll = position;
                previousTime = performance.now();
                updateControls();
                updateProgress();
                raf = requestAnimationFrame(tick);
            }, { signal: abort.signal });
        });
    }

    window.addEventListener('wheel', stop, { passive: true, signal: abort.signal });
    window.addEventListener('touchstart', event => {
        if (!(event.target instanceof Element && event.target.closest('[data-frame-auto-controls]'))) stop();
    }, { passive: true, signal: abort.signal });
    document.addEventListener('pointerdown', event => {
        if (!(event.target instanceof Element && event.target.closest('[data-frame-auto-controls]'))) stop();
    }, { passive: true, signal: abort.signal });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') stop();
        else if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)
            && !(event.target instanceof Element && event.target.closest('[data-frame-auto-controls]'))) stop();
    }, { signal: abort.signal });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); }, { signal: abort.signal });
    window.addEventListener('resize', stop, { signal: abort.signal });
    window.addEventListener('pagehide', stop, { signal: abort.signal });
    return () => { stop(); abort.abort(); };
}
