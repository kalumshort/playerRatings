export default function Spinner({ text }) {
  return (
    <div className="spinner-container">
      <div className="spinner"></div>
      {text && <p>{text}</p>}
    </div>
  );
}
