interface Props {
  message: string;
}

export default function CompanionCard({ message }: Props) {
  return (
    <div className="companion-card">
      <div className="companion-label">陪伴</div>
      <p className="companion-text">{message}</p>
    </div>
  );
}
