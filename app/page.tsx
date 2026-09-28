export default function Home() {
  return (
    <ul>
      <li>
        <a href="/brands/apple">/brands/apple (known, should be 200)</a>
      </li>
      <li>
        <a href="/brands/does-not-exist">
          /brands/does-not-exist (unknown, should be 404 — BUG: comes back 200)
        </a>
      </li>
      <li>
        <a href="/laptops">/laptops (known, should be 200)</a>
      </li>
      <li>
        <a href="/does-not-exist">
          /does-not-exist (unknown, correctly 404 — this single-top-level-segment shape works)
        </a>
      </li>
    </ul>
  );
}
