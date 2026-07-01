import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container" style={{ padding: "120px 24px", textAlign: "center" }}>
      <h1 style={{ fontSize: "48px", fontWeight: 700, marginBottom: "16px" }}>404</h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "24px" }}>
        This page could not be found.
      </p>
      <Link href="/" style={{ color: "var(--color-brown)", textDecoration: "underline" }}>
        Back to home
      </Link>
    </div>
  );
}
