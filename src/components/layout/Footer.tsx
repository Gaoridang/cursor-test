import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">© {new Date().getFullYear()} essos. All rights reserved.</div>
    </footer>
  );
}
