export default function KPICard({ label, value, subtitle, accentColor = '#137991', valueColor }) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #CECECE',
        borderRadius: 8,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <div
        style={{
          fontFamily: 'Nunito Sans',
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: '#4D5D6C',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'Rubik',
          fontWeight: 700,
          fontSize: 28,
          color: valueColor ?? '#252525',
        }}
      >
        {value}
      </div>
      {subtitle && (
        <div
          style={{
            fontFamily: 'Nunito Sans',
            fontSize: 13,
            color: '#666666',
            marginTop: 4,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
}
