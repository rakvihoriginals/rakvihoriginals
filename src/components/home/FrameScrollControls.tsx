import styles from './FrameScrollControls.module.css';

const CHEVRON = 'M3 2.5 9 8.5l6-6';

/** Drawn pointing down; rotated for "up" so the same flow animation serves both buttons. */
function ArrowIcon({ up }: { up?: boolean }) {
    return (
        <span className={styles.glyph} aria-hidden="true" style={up ? { rotate: '180deg' } : undefined}>
            <svg className={styles.arrow} viewBox="0 0 18 22">
                <path d="M9 3v15.5M3.5 13 9 18.5l5.5-5.5" />
            </svg>
            <span className={styles.flow}>
                {[0, 1, 2].map(i => (
                    <svg key={i} className={styles.chevron} viewBox="0 0 18 11">
                        <path d={CHEVRON} />
                    </svg>
                ))}
            </span>
        </span>
    );
}

export function FrameScrollControls() {
    return (
        <div className={styles.controls} data-frame-auto-controls data-state="off" role="group" aria-label="Automatic frame scrolling">
            <button type="button" className={styles.button} data-frame-auto-direction="-1" aria-label="Auto scroll backward" aria-pressed="false">
                <ArrowIcon up />
                <span className={styles.tooltip} aria-hidden="true">Autoplay rewind</span>
            </button>
            <button type="button" className={styles.button} data-frame-auto-direction="1" aria-label="Auto scroll forward" aria-pressed="false">
                <ArrowIcon />
                <span className={styles.tooltip} aria-hidden="true">Autoplay down</span>
            </button>
            <span className={styles.progress} aria-hidden="true" />
        </div>
    );
}
