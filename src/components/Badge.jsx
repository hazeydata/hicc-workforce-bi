export default function Badge({ children, variant = 'default', style = {} }) {
  const variants = {
    occupied: { bg: '#92CC6F', color: '#252525' },
    vacant: { bg: '#AF3C43', color: '#FFFFFF' },
    acting: { bg: '#FEC04F', color: '#252525' },
    aBase: { bg: '#137991', color: '#FFFFFF' },
    bBase: { bg: '#4285A6', color: '#FFFFFF' },
    program: { bg: '#15A3A6', color: '#FFFFFF' },
    sunset: { bg: '#AF3C43', color: '#FFFFFF' },
    aligned: { bg: '#92CC6F', color: '#252525' },
    misaligned: { bg: '#AF3C43', color: '#FFFFFF' },
    default: { bg: '#4D5D6C', color: '#FFFFFF' },
  };
  const s = variants[variant] ?? variants.default;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 12,
        fontSize: 11,
        fontWeight: 700,
        fontFamily: 'Nunito Sans',
        backgroundColor: s.bg,
        color: s.color,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
