import styles from './PasswordStrengthIndicator.module.css'

export const PasswordStrengthIndicator = ({ strength = 0 }) => {
    const levels = [
        { width: "0%", color: "#e9ecef", text: "" },
        { width: "25%", color: "#dc3545", text: "Débil" },
        { width: "50%", color: "#ffc107", text: "Regular" },
        { width: "75%", color: "#28a745", text: "Fuerte" },
        { width: "100%", color: "#28a745", text: "Muy Fuerte" },
    ];

    const safeStrength = Number.isFinite(strength)
        ? Math.min(Math.max(Math.trunc(strength), 0), levels.length - 1)
        : 0;
    const level = levels[safeStrength];

    return (
        <div>
            <div className={styles.strengthMeter}>
                <div className={styles.strengthMeterFill} style={{ width: level.width, backgroundColor: level.color }} />
            </div>
            <div style={{ textAlign: 'right' }}>
                <small style={{ color: level.color }}>{level.text}</small>
            </div>
        </div>
    );
};