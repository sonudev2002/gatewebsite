import { Link } from "react-router-dom";
import "../styles/home.css";

export default function Home() {
  return (
    <main className="login-container">
      <h1>GATE preparation</h1>
      <p>Choose a practice bank, build your own questions, or revisit a worked solution.</p>
      <a href="https://gate-cs-study-desk.gallantmyrrh5.chatgpt.site">Open GATE Study Desk</a>
      <Link to="/dashboard">Open the original dashboard</Link>
    </main>
  );
}
