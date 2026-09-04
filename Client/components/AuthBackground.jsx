 
function AuthBackground({ children }) {
    return (
        <div
            style={{
                minHeight: "100vh",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 16,
                background: "#FAFAF9",
                overflow: "hidden",
            }}
        >
            {/* soft radial glow, off-center — quiet, not decorative-heavy */}
            <div
                style={{
                    position: "absolute",
                    top: "-20%",
                    right: "-10%",
                    width: 560,
                    height: 560,
                    borderRadius: "50%",
                    background:
                        "radial-gradient(circle, rgba(91,107,140,0.14) 0%, rgba(91,107,140,0) 70%)",
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    bottom: "-15%",
                    left: "-8%",
                    width: 420,
                    height: 420,
                    borderRadius: "50%",
                    background:
                        "radial-gradient(circle, rgba(15,17,21,0.05) 0%, rgba(15,17,21,0) 70%)",
                    pointerEvents: "none",
                }}
            />

            {/* faint grid texture — nods to the "ops tool" identity without being loud */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                        "linear-gradient(rgba(15,17,21,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15,17,21,0.03) 1px, transparent 1px)",
                    backgroundSize: "48px 48px",
                    pointerEvents: "none",
                }}
            />

            <div style={{ position: "relative", zIndex: 1, width: "100%", display: "flex", justifyContent: "center" }}>
                {children}
            </div>
        </div>
    );
}

export default AuthBackground;