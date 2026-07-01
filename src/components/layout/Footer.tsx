import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">© {new Date().getFullYear()} essos. 무단 전재 금지.</div>
    </footer>
  );
}
