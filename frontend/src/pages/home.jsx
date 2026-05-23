import "../styles/home.css";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // Later you will connect backend API here
    navigate("/dashboard");
  };

  return (
    <div className="login-container">
      <h2>Login</h2>
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Password" />
      <button onClick={handleLogin}>Login</button>

      <h1>Welcome to home page </h1>

    </div>
  );
}

export default Login;