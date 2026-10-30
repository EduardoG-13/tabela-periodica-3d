import { Text } from '@react-three/drei';
import arimo from '@fontsource/arimo/files/arimo-latin-700-normal.woff?url';
import { cellOrigin, NICHE_FRONT_Z, PITCH_X, PITCH_Y } from '../lib/layout';
import { elementAt } from '../lib/layout';
import { useStore } from '../state/store';

/** Etiquetas opcionais: números dos grupos (1–18) e dos períodos (1–7) */
export function Labels() {
  const show = useStore((s) => s.showLabels);
  if (!show) return null;
  const groups = Array.from({ length: 18 }, (_, i) => i + 1).map((g) => {
    // primeira linha ocupada naquela coluna
    let r = 1;
    while (!elementAt(g, r) && r < 7) r++;
    const o = cellOrigin(g, r);
    return { g, x: o.x, y: o.y + PITCH_Y + 0.025 };
  });
  const z = NICHE_FRONT_Z + 0.005;
  return (
    <group>
      {groups.map(({ g, x, y }) => (
        <Text key={g} font={arimo} position={[x, y, z]} fontSize={0.035} color="#ffe8a8" outlineWidth={0.002} outlineColor="#000">
          {String(g)}
        </Text>
      ))}
      {[1, 2, 3, 4, 5, 6, 7].map((p) => {
        const o = cellOrigin(1, p);
        return (
          <Text key={p} font={arimo} position={[o.x - PITCH_X / 2 - 0.04, o.y + PITCH_Y / 2, z]} fontSize={0.035} color="#ffe8a8" outlineWidth={0.002} outlineColor="#000">
            {String(p)}
          </Text>
        );
      })}
      {[['Lantanídeos', 8], ['Actinídeos', 9]].map(([t, r]) => {
        const o = cellOrigin(4, r as number);
        return (
          <Text key={t as string} font={arimo} anchorX="right" position={[o.x - PITCH_X / 2 - 0.03, o.y + PITCH_Y / 2, z]} fontSize={0.03} color="#ffe8a8" outlineWidth={0.002} outlineColor="#000">
            {t as string}
          </Text>
        );
      })}
    </group>
  );
}
