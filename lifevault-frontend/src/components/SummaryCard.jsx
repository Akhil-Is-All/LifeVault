function SummaryCard({ title, count }) {
    return (
      <div className="card">
        <h3>{title}</h3>
        <p>{count}</p>
      </div>
    );
  }
  
  export default SummaryCard;