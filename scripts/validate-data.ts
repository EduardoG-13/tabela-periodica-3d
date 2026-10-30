import { validateElements } from '../src/data/validate';
import { ELEMENTS } from '../src/data/elements';
import { BUTTON_GROUPS, buttonGroupOf } from '../src/config/buttonGroups';
import { toBrailleUnicode } from '../src/lib/braille';

const errors = validateElements();
const counts = Object.fromEntries(BUTTON_GROUPS.map((g) => [g.label, ELEMENTS.filter((e) => buttonGroupOf(e.number) === g.id).length]));
console.log(`Elementos: ${ELEMENTS.length}  |  ${ELEMENTS[0].symbol} … ${ELEMENTS[117].symbol}`);
console.log('Elementos por botão:', counts);
console.log('Exemplo braile:', ELEMENTS[0].name, toBrailleUnicode(ELEMENTS[0].name), '|', ELEMENTS[12].name, toBrailleUnicode(ELEMENTS[12].name));
if (errors.length) {
  console.error(`\n${errors.length} problema(s):\n- ` + errors.join('\n- '));
  process.exit(1);
}
console.log('OK: base de dados consistente (contagem, ordem, símbolos, posições, grupos e elétrons).');
