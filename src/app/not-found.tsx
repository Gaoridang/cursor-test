import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container" style={{ padding: "120px 24px", textAlign: "center" }}>
      <h1 style={{ fontSize: "48px", fontWeight: 700, marginBottom: "16px" }}>404</h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "24px" }}>
        요청하신 페이지를 찾을 수 없습니다.
      </p>
      <Link href="/" style={{ color: "var(--color-brown)", textDecoration: "underline" }}>
        홈으로 돌아가기
      </Link>
    </div>
  );
}
