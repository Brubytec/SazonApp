/**
 * Logo oficial de Sazón y Sabor (frontend/public/logo.png).
 * Se usa en el login, el menú lateral y las facturas.
 * `alto` en píxeles; el ancho se calcula solo para no deformar la imagen.
 */
export default function LogoMarca({ alto = 52, style = {} }) {
  return (
    <img
      src="/logo.png"
      alt="Sazón y Sabor — Los Robles"
      style={{ height: alto, width: 'auto', objectFit: 'contain', flexShrink: 0, ...style }}
    />
  )
}
