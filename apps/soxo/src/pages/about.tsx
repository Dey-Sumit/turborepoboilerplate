import { Link } from 'react-router-dom';

export function About() {
  return (
    <div>
      <h1>About Page</h1>
      <nav>
        <Link to="/">Go to Home</Link>
      </nav>
    </div>
  );
}
